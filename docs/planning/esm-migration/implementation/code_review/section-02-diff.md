diff --git a/Tools/build-dependency-graph.js b/Tools/build-dependency-graph.js
new file mode 100644
index 00000000..fff703e2
--- /dev/null
+++ b/Tools/build-dependency-graph.js
@@ -0,0 +1,208 @@
+#!/usr/bin/env node
+
+const fs = require('fs');
+const path = require('path');
+const { buildDependencyGraph, detectCycles, classifyLayers } = require('./lib/dependency-graph');
+
+function loadAnalysisResults(inputPath) {
+    const data = fs.readFileSync(inputPath, 'utf-8');
+    return JSON.parse(data);
+}
+
+function parseHtmlScripts(htmlDir) {
+    const htmlFiles = fs.readdirSync(htmlDir)
+        .filter(f => f.endsWith('.html'))
+        .sort();
+
+    const results = [];
+    for (const htmlFile of htmlFiles) {
+        const filePath = path.join(htmlDir, htmlFile);
+        const content = fs.readFileSync(filePath, 'utf-8');
+
+        // Extract loadScripts array or <script src="..."> tags
+        const scripts = [];
+
+        // Match loadScripts([...]) pattern
+        const loadScriptsMatch = content.match(/loadScripts\s*\(\s*\[([\s\S]*?)\]\s*\)/);
+        if (loadScriptsMatch) {
+            const arrayContent = loadScriptsMatch[1];
+            const scriptPaths = arrayContent.match(/"([^"]+\.js)"/g) || [];
+            for (const s of scriptPaths) {
+                scripts.push(s.replace(/"/g, ''));
+            }
+        }
+
+        // Also match inline <script src="..."> tags
+        const scriptTagRegex = /<script\s+src="([^"]+\.js)"/g;
+        let match;
+        while ((match = scriptTagRegex.exec(content)) !== null) {
+            scripts.push(match[1]);
+        }
+
+        results.push({ file: htmlFile, scripts });
+    }
+    return results;
+}
+
+function classifyHtmlFiles(htmlScripts, deployBatPath) {
+    let deployTargets = new Set();
+    if (fs.existsSync(deployBatPath)) {
+        const content = fs.readFileSync(deployBatPath, 'utf-8');
+        const htmlMatches = content.match(/\b(\w+\.html)\b/g) || [];
+        deployTargets = new Set(htmlMatches);
+    }
+
+    return htmlScripts.map(entry => ({
+        ...entry,
+        isProduction: deployTargets.has(entry.file),
+    }));
+}
+
+function generateMarkdown(graph, cycles, layers, analysisResults, htmlEntries) {
+    const lines = [];
+    lines.push('# ESM移行 — 依存グラフ分析結果');
+    lines.push('');
+    lines.push('> 自動生成: `node Tools/build-dependency-graph.js`');
+    lines.push('');
+
+    // 1. File dependency graph
+    lines.push('## 1. ファイル間依存グラフ');
+    lines.push('');
+    const sortedFiles = [...graph.keys()].sort();
+    for (const file of sortedFiles) {
+        const deps = [...graph.get(file)].sort();
+        if (deps.length === 0) {
+            lines.push(`- **${file}** → (依存なし)`);
+        } else {
+            lines.push(`- **${file}** → ${deps.join(', ')}`);
+        }
+    }
+    lines.push('');
+
+    // 2. Cycle report
+    lines.push('## 2. 循環依存一覧');
+    lines.push('');
+    if (cycles.length === 0) {
+        lines.push('循環依存は検出されませんでした。');
+    } else {
+        lines.push(`${cycles.length} 件の循環依存グループを検出:`);
+        lines.push('');
+        for (let i = 0; i < cycles.length; i++) {
+            const cycle = cycles[i].sort();
+            lines.push(`### 循環グループ ${i + 1}`);
+            lines.push('');
+            lines.push(cycle.map(f => `- ${f}`).join('\n'));
+            lines.push('');
+        }
+    }
+
+    // 3. Layer classification
+    lines.push('## 3. 依存レイヤー図');
+    lines.push('');
+    const sortedLayers = [...layers.keys()].sort((a, b) => a - b);
+    for (const layer of sortedLayers) {
+        const files = layers.get(layer).sort();
+        lines.push(`### Layer ${layer} (${files.length} files)`);
+        lines.push('');
+        for (const f of files) {
+            lines.push(`- ${f}`);
+        }
+        lines.push('');
+    }
+
+    // 4. Side-effect classification table
+    lines.push('## 4. 副作用分類表');
+    lines.push('');
+    lines.push('| ファイル | 分類 |');
+    lines.push('|---------|------|');
+    const sorted = [...analysisResults]
+        .filter(r => !r.error)
+        .sort((a, b) => a.file.localeCompare(b.file));
+    for (const r of sorted) {
+        lines.push(`| ${r.file} | ${r.sideEffectCategory} |`);
+    }
+    lines.push('');
+
+    // 5. HTML entry points
+    lines.push('## 5. HTMLエントリポイント分類');
+    lines.push('');
+    lines.push('| HTML | 分類 | JSファイル数 |');
+    lines.push('|------|------|------------|');
+    for (const entry of htmlEntries) {
+        const type = entry.isProduction ? '本番' : 'ローカル/要確認';
+        lines.push(`| ${entry.file} | ${type} | ${entry.scripts.length} |`);
+    }
+    lines.push('');
+
+    for (const entry of htmlEntries) {
+        lines.push(`### ${entry.file}`);
+        lines.push('');
+        if (entry.scripts.length === 0) {
+            lines.push('スクリプトなし（または動的ロード）');
+        } else {
+            for (const s of entry.scripts) {
+                lines.push(`- ${s}`);
+            }
+        }
+        lines.push('');
+    }
+
+    // 6. Summary stats
+    lines.push('## 6. サマリー');
+    lines.push('');
+    lines.push(`- 解析ファイル数: ${analysisResults.length}`);
+    lines.push(`- 依存エッジ数: ${[...graph.values()].reduce((sum, deps) => sum + deps.size, 0)}`);
+    lines.push(`- 循環依存グループ数: ${cycles.length}`);
+    lines.push(`- レイヤー数: ${sortedLayers.length}`);
+    lines.push(`- HTMLエントリポイント数: ${htmlEntries.length}`);
+    lines.push('');
+
+    return lines.join('\n');
+}
+
+function main() {
+    const args = process.argv.slice(2);
+    let inputPath = 'Tools/output/global-symbols.json';
+    let outputPath = 'docs/planning/esm-migration/dependency-graph.md';
+    let sourcesDir = 'Sources';
+
+    for (let i = 0; i < args.length; i++) {
+        if (args[i] === '--input' && i + 1 < args.length) {
+            inputPath = args[++i];
+        } else if (args[i] === '--output' && i + 1 < args.length) {
+            outputPath = args[++i];
+        } else if (args[i] === '--sources' && i + 1 < args.length) {
+            sourcesDir = args[++i];
+        }
+    }
+
+    console.log(`Reading analysis results from: ${inputPath}`);
+    const analysisResults = loadAnalysisResults(inputPath);
+
+    console.log(`Building dependency graph for ${analysisResults.length} files...`);
+    const graph = buildDependencyGraph(analysisResults);
+
+    console.log('Detecting cycles...');
+    const cycles = detectCycles(graph);
+    console.log(`Found ${cycles.length} cycle groups`);
+
+    console.log('Classifying layers...');
+    const layers = classifyLayers(graph, cycles);
+    console.log(`Classified into ${layers.size} layers`);
+
+    console.log(`Parsing HTML entry points from: ${sourcesDir}`);
+    const htmlScripts = parseHtmlScripts(sourcesDir);
+    const deployBatPath = path.join(sourcesDir, '..', 'Deploy.bat');
+    const htmlEntries = classifyHtmlFiles(htmlScripts, deployBatPath);
+
+    const markdown = generateMarkdown(graph, cycles, layers, analysisResults, htmlEntries);
+
+    const dir = path.dirname(outputPath);
+    if (!fs.existsSync(dir)) {
+        fs.mkdirSync(dir, { recursive: true });
+    }
+    fs.writeFileSync(outputPath, markdown, 'utf-8');
+    console.log(`Dependency graph written to: ${outputPath}`);
+}
+
+main();
diff --git a/Tools/lib/dependency-graph.js b/Tools/lib/dependency-graph.js
new file mode 100644
index 00000000..49009278
--- /dev/null
+++ b/Tools/lib/dependency-graph.js
@@ -0,0 +1,195 @@
+/**
+ * ファイル間依存グラフの構築・循環検出・レイヤー分類
+ *
+ * AST解析結果（defines/references）を入力として、ファイル間の依存関係を解析する。
+ */
+
+/**
+ * AST解析結果の配列からファイル間依存グラフを構築する。
+ * @param {Array<{file: string, defines: string[], references: string[], sideEffectCategory: string}>} analysisResults
+ * @returns {Map<string, Set<string>>} ファイル名→依存先ファイル名のSet
+ */
+function buildDependencyGraph(analysisResults) {
+    // Build symbol → defining files index
+    const symbolToFiles = new Map();
+    for (const result of analysisResults) {
+        for (const sym of result.defines) {
+            if (!symbolToFiles.has(sym)) {
+                symbolToFiles.set(sym, []);
+            }
+            symbolToFiles.get(sym).push(result.file);
+        }
+    }
+
+    // Build dependency graph
+    const graph = new Map();
+    for (const result of analysisResults) {
+        const deps = new Set();
+        for (const ref of result.references) {
+            const definingFiles = symbolToFiles.get(ref);
+            if (!definingFiles) continue;
+            for (const defFile of definingFiles) {
+                if (defFile !== result.file) {
+                    deps.add(defFile);
+                }
+            }
+        }
+        graph.set(result.file, deps);
+    }
+
+    return graph;
+}
+
+/**
+ * 依存グラフから循環依存を検出する（Tarjanの強連結成分アルゴリズム）。
+ * サイズ2以上のSCC、または自己参照を持つサイズ1のSCCを循環として返す。
+ * @param {Map<string, Set<string>>} graph
+ * @returns {Array<string[]>} 循環に関与するファイルのグループ配列
+ */
+function detectCycles(graph) {
+    let index = 0;
+    const indices = new Map();
+    const lowlinks = new Map();
+    const onStack = new Set();
+    const stack = [];
+    const sccs = [];
+
+    function strongconnect(node) {
+        indices.set(node, index);
+        lowlinks.set(node, index);
+        index++;
+        stack.push(node);
+        onStack.add(node);
+
+        const neighbors = graph.get(node) || new Set();
+        for (const neighbor of neighbors) {
+            if (!indices.has(neighbor)) {
+                strongconnect(neighbor);
+                lowlinks.set(node, Math.min(lowlinks.get(node), lowlinks.get(neighbor)));
+            } else if (onStack.has(neighbor)) {
+                lowlinks.set(node, Math.min(lowlinks.get(node), indices.get(neighbor)));
+            }
+        }
+
+        if (lowlinks.get(node) === indices.get(node)) {
+            const scc = [];
+            let w;
+            do {
+                w = stack.pop();
+                onStack.delete(w);
+                scc.push(w);
+            } while (w !== node);
+
+            // Only report SCCs that represent actual cycles
+            if (scc.length > 1) {
+                sccs.push(scc);
+            } else if (scc.length === 1) {
+                // Self-reference check
+                const self = scc[0];
+                const deps = graph.get(self) || new Set();
+                if (deps.has(self)) {
+                    sccs.push(scc);
+                }
+            }
+        }
+    }
+
+    for (const node of graph.keys()) {
+        if (!indices.has(node)) {
+            strongconnect(node);
+        }
+    }
+
+    return sccs;
+}
+
+/**
+ * 依存グラフからレイヤー分類を生成する。
+ * 循環依存のファイルは同一レイヤーとして扱う。
+ * @param {Map<string, Set<string>>} graph
+ * @param {Array<string[]>} cycles
+ * @returns {Map<number, string[]>} レイヤー番号→ファイル名配列
+ */
+function classifyLayers(graph, cycles) {
+    // Map each file to its cycle group (or itself if not in a cycle)
+    const fileToGroup = new Map();
+    for (const [i, cycle] of cycles.entries()) {
+        const groupId = `__cycle_${i}`;
+        for (const file of cycle) {
+            fileToGroup.set(file, groupId);
+        }
+    }
+    for (const file of graph.keys()) {
+        if (!fileToGroup.has(file)) {
+            fileToGroup.set(file, file);
+        }
+    }
+
+    // Build condensed DAG (group → Set<group>)
+    const condensed = new Map();
+    const groupMembers = new Map();
+    for (const [file, group] of fileToGroup.entries()) {
+        if (!groupMembers.has(group)) {
+            groupMembers.set(group, []);
+        }
+        groupMembers.get(group).push(file);
+        if (!condensed.has(group)) {
+            condensed.set(group, new Set());
+        }
+    }
+
+    for (const [file, deps] of graph.entries()) {
+        const srcGroup = fileToGroup.get(file);
+        for (const dep of deps) {
+            const depGroup = fileToGroup.get(dep);
+            if (depGroup && depGroup !== srcGroup) {
+                condensed.get(srcGroup).add(depGroup);
+            }
+        }
+    }
+
+    // Compute layer for each group via BFS/topological approach
+    const groupLayer = new Map();
+    const allGroups = [...condensed.keys()];
+
+    // Iteratively compute layers: layer of a group = max(layer of deps) + 1
+    // Initialize all to 0
+    for (const g of allGroups) {
+        groupLayer.set(g, 0);
+    }
+
+    // Repeat until stable
+    let changed = true;
+    while (changed) {
+        changed = false;
+        for (const g of allGroups) {
+            const deps = condensed.get(g) || new Set();
+            let maxDepLayer = -1;
+            for (const dep of deps) {
+                const depLayer = groupLayer.get(dep);
+                if (depLayer !== undefined && depLayer > maxDepLayer) {
+                    maxDepLayer = depLayer;
+                }
+            }
+            const newLayer = deps.size === 0 ? 0 : maxDepLayer + 1;
+            if (newLayer !== groupLayer.get(g)) {
+                groupLayer.set(g, newLayer);
+                changed = true;
+            }
+        }
+    }
+
+    // Build result: layer → files
+    const layers = new Map();
+    for (const [group, layer] of groupLayer.entries()) {
+        const members = groupMembers.get(group) || [];
+        if (!layers.has(layer)) {
+            layers.set(layer, []);
+        }
+        layers.get(layer).push(...members);
+    }
+
+    return layers;
+}
+
+module.exports = { buildDependencyGraph, detectCycles, classifyLayers };
diff --git a/Tools/tests/dependency-graph.test.js b/Tools/tests/dependency-graph.test.js
new file mode 100644
index 00000000..c72a95cb
--- /dev/null
+++ b/Tools/tests/dependency-graph.test.js
@@ -0,0 +1,243 @@
+const path = require('path');
+const fs = require('fs');
+const {
+    buildDependencyGraph,
+    detectCycles,
+    classifyLayers,
+} = require('../lib/dependency-graph');
+
+describe('buildDependencyGraph', () => {
+    test('シンボル参照に基づいてファイル間依存を構築する', () => {
+        const analysisResults = [
+            { file: 'A.js', defines: ['Foo'], references: ['Bar'], sideEffectCategory: 'pure-definition' },
+            { file: 'B.js', defines: ['Bar'], references: [], sideEffectCategory: 'pure-definition' },
+            { file: 'C.js', defines: ['Baz'], references: ['Foo', 'Bar'], sideEffectCategory: 'pure-definition' },
+        ];
+        const graph = buildDependencyGraph(analysisResults);
+        expect(graph.get('A.js')).toEqual(new Set(['B.js']));
+        expect(graph.get('B.js')).toEqual(new Set());
+        expect(graph.get('C.js')).toEqual(new Set(['A.js', 'B.js']));
+    });
+
+    test('同じシンボルが複数ファイルで定義されている場合、すべてに依存する', () => {
+        const analysisResults = [
+            { file: 'A.js', defines: ['X'], references: [], sideEffectCategory: 'pure-definition' },
+            { file: 'B.js', defines: ['X'], references: [], sideEffectCategory: 'pure-definition' },
+            { file: 'C.js', defines: [], references: ['X'], sideEffectCategory: 'pure-definition' },
+        ];
+        const graph = buildDependencyGraph(analysisResults);
+        expect(graph.get('C.js')).toEqual(new Set(['A.js', 'B.js']));
+    });
+
+    test('自ファイル内で定義・参照されるシンボルは依存に含めない', () => {
+        const analysisResults = [
+            { file: 'A.js', defines: ['Foo', 'Bar'], references: ['Foo'], sideEffectCategory: 'pure-definition' },
+        ];
+        const graph = buildDependencyGraph(analysisResults);
+        expect(graph.get('A.js')).toEqual(new Set());
+    });
+
+    test('どのファイルにも定義がないシンボルは無視する', () => {
+        const analysisResults = [
+            { file: 'A.js', defines: ['Foo'], references: ['Unknown'], sideEffectCategory: 'pure-definition' },
+        ];
+        const graph = buildDependencyGraph(analysisResults);
+        expect(graph.get('A.js')).toEqual(new Set());
+    });
+});
+
+describe('detectCycles', () => {
+    test('A→B→C→A の循環を検出する', () => {
+        const graph = new Map([
+            ['A.js', new Set(['B.js'])],
+            ['B.js', new Set(['C.js'])],
+            ['C.js', new Set(['A.js'])],
+        ]);
+        const cycles = detectCycles(graph);
+        expect(cycles.length).toBe(1);
+        expect(cycles[0].sort()).toEqual(['A.js', 'B.js', 'C.js']);
+    });
+
+    test('自己参照（A→A）を検出する', () => {
+        const graph = new Map([
+            ['A.js', new Set(['A.js'])],
+            ['B.js', new Set()],
+        ]);
+        const cycles = detectCycles(graph);
+        expect(cycles.length).toBe(1);
+        expect(cycles[0]).toEqual(['A.js']);
+    });
+
+    test('循環に関与しないノードを誤検出しない', () => {
+        const graph = new Map([
+            ['A.js', new Set(['B.js'])],
+            ['B.js', new Set(['C.js'])],
+            ['C.js', new Set(['B.js'])],
+            ['D.js', new Set(['A.js'])],
+        ]);
+        const cycles = detectCycles(graph);
+        expect(cycles.length).toBe(1);
+        expect(cycles[0].sort()).toEqual(['B.js', 'C.js']);
+    });
+
+    test('循環がない場合は空配列を返す', () => {
+        const graph = new Map([
+            ['A.js', new Set(['B.js'])],
+            ['B.js', new Set(['C.js'])],
+            ['C.js', new Set()],
+        ]);
+        const cycles = detectCycles(graph);
+        expect(cycles.length).toBe(0);
+    });
+
+    test('複数の独立した循環を検出する', () => {
+        const graph = new Map([
+            ['A.js', new Set(['B.js'])],
+            ['B.js', new Set(['A.js'])],
+            ['C.js', new Set(['D.js'])],
+            ['D.js', new Set(['C.js'])],
+        ]);
+        const cycles = detectCycles(graph);
+        expect(cycles.length).toBe(2);
+    });
+});
+
+describe('classifyLayers', () => {
+    test('依存のないファイルはLayer 0になる', () => {
+        const graph = new Map([
+            ['A.js', new Set()],
+            ['B.js', new Set(['A.js'])],
+            ['C.js', new Set(['B.js'])],
+        ]);
+        const cycles = [];
+        const layers = classifyLayers(graph, cycles);
+        expect(layers.get(0)).toContain('A.js');
+        expect(layers.get(1)).toContain('B.js');
+        expect(layers.get(2)).toContain('C.js');
+    });
+
+    test('循環依存のファイルは同一レイヤーにまとめられる', () => {
+        const graph = new Map([
+            ['A.js', new Set()],
+            ['B.js', new Set(['A.js', 'C.js'])],
+            ['C.js', new Set(['B.js'])],
+        ]);
+        const cycles = [['B.js', 'C.js']];
+        const layers = classifyLayers(graph, cycles);
+        expect(layers.get(0)).toContain('A.js');
+        // B and C should be in the same layer
+        const bLayer = findLayer(layers, 'B.js');
+        const cLayer = findLayer(layers, 'C.js');
+        expect(bLayer).toBe(cLayer);
+        expect(bLayer).toBeGreaterThan(0);
+    });
+
+    test('すべてのファイルがいずれかのレイヤーに含まれる', () => {
+        const graph = new Map([
+            ['A.js', new Set()],
+            ['B.js', new Set(['A.js'])],
+            ['C.js', new Set(['A.js'])],
+            ['D.js', new Set(['B.js', 'C.js'])],
+        ]);
+        const cycles = [];
+        const layers = classifyLayers(graph, cycles);
+        const allFiles = new Set();
+        for (const files of layers.values()) {
+            for (const f of files) allFiles.add(f);
+        }
+        expect(allFiles.size).toBe(4);
+    });
+});
+
+describe('create_tests.sh順序との整合性', () => {
+    test('依存グラフがcreate_tests.shのロード順と大きく矛盾しない', () => {
+        const jsonPath = path.join(__dirname, '../../Tools/output/global-symbols.json');
+        if (!fs.existsSync(jsonPath)) {
+            console.warn('global-symbols.json not found, skipping');
+            return;
+        }
+        const analysisResults = JSON.parse(fs.readFileSync(jsonPath, 'utf-8'));
+        const graph = buildDependencyGraph(analysisResults);
+
+        // create_tests.sh load order (index = position, lower = loaded earlier)
+        const loadOrder = [
+            'Sources/GlobalDefinitions.js',
+            'Sources/Utilities.js',
+            'Sources/Logger.js',
+            'Sources/SkillConstants.js',
+            'Sources/Skill.js',
+            'Sources/BattleMapElement.js',
+            'Sources/Tile.js',
+            'Sources/Structures.js',
+            'Sources/Cell.js',
+            'Sources/Table.js',
+            'Sources/HeroInfoConstants.js',
+            'Sources/HeroInfo.js',
+            'Sources/UnitConstants.js',
+            'Sources/BattleContext.js',
+            'Sources/Unit.js',
+            'Sources/UnitManager.js',
+            'Sources/BattleMap.js',
+            'Sources/GlobalBattleContext.js',
+            'Sources/DamageCalculationUtility.js',
+            'Sources/DamageCalculator.js',
+            'Sources/PostCombatSkillHander.js',
+            'Sources/DamageCalculatorWrapper.js',
+            'Sources/BeginningOfTurnSkillHandler.js',
+            'Sources/SkillDatabase.js',
+            'Sources/HeroDatabase.js',
+            'Sources/SampleSkillInfos.js',
+            'Sources/SampleHeroInfos.js',
+            'Sources/SkillEffectCore.js',
+            'Sources/SkillEffectEnv.js',
+            'Sources/SkillEffect.js',
+            'Sources/SkillEffectField.js',
+            'Sources/SkillEffectUnit.js',
+            'Sources/SkillEffectBattleContext.js',
+            'Sources/SkillEffectHooks.js',
+            'Sources/SkillEffectRegistrar.js',
+            'Sources/SkillEffectAliases.js',
+            'Sources/CustomSkill.js',
+            'Sources/SkillImpl.js',
+            'Sources/SkillImpl202408.js',
+            'Sources/SkillImpl202501.js',
+            'Sources/SkillImpl202601.js',
+            'Sources/TestUtilities.js',
+        ];
+
+        const orderIndex = new Map();
+        loadOrder.forEach((f, i) => orderIndex.set(f, i));
+
+        // Count violations: file loaded at position i depends on file loaded at position j where j > i
+        let violations = 0;
+        let totalChecked = 0;
+        for (const [file, deps] of graph.entries()) {
+            const fileIdx = orderIndex.get(file);
+            if (fileIdx === undefined) continue;
+            for (const dep of deps) {
+                const depIdx = orderIndex.get(dep);
+                if (depIdx === undefined) continue;
+                totalChecked++;
+                if (depIdx > fileIdx) {
+                    violations++;
+                }
+            }
+        }
+
+        // Allow some violations (known circular dependencies), but the vast majority should be consistent
+        if (totalChecked > 0) {
+            const violationRate = violations / totalChecked;
+            expect(violationRate).toBeLessThan(0.20); // Less than 20% violations (circular deps cause some)
+        }
+    });
+});
+
+/**
+ * Helper: find the layer number for a given file
+ */
+function findLayer(layers, file) {
+    for (const [layer, files] of layers.entries()) {
+        if (files.includes(file)) return layer;
+    }
+    return -1;
+}
diff --git a/docs/planning/esm-migration/dependency-graph.md b/docs/planning/esm-migration/dependency-graph.md
new file mode 100644
index 00000000..ffa8e92e
--- /dev/null
+++ b/docs/planning/esm-migration/dependency-graph.md
@@ -0,0 +1,361 @@
+# ESM移行 — 依存グラフ分析結果
+
+> 自動生成: `node Tools/build-dependency-graph.js`
+
+## 1. ファイル間依存グラフ
+
+- **Sources/AetherRaidDefensePresets.js** → (依存なし)
+- **Sources/AetherRaidSimulatorMain.js** → Sources/BattleSimulatorBase.js, Sources/Utilities.js
+- **Sources/AppData.js** → Sources/AetherRaidDefensePresets.js, Sources/AudioManager.js, Sources/BattleMap.js, Sources/BattleMapSettings.js, Sources/BattleSimulatorBase.js, Sources/DamageCalculator.js, Sources/GlobalBattleContext.js, Sources/GlobalDefinitions.js, Sources/GlobalDefinitions_Debug.js, Sources/HeroDatabase.js, Sources/HeroInfoConstants.js, Sources/Logger.js, Sources/SettingManager.js, Sources/Skill.js, Sources/SkillConstants.js, Sources/SkillDatabase.js, Sources/Structures.js, Sources/Tile.js, Sources/Unit.js, Sources/UnitConstants.js, Sources/UnitManager.js, Sources/Utilities.js
+- **Sources/ArenaSimulatorMain.js** → Sources/AppData.js, Sources/BattleMap.js, Sources/BattleSimulatorBase.js, Sources/DamageCalculator.js, Sources/HeroIconListerMain.js, Sources/Utilities.js
+- **Sources/AudioManager.js** → Sources/GlobalDefinitions.js, Sources/GlobalDefinitions_Debug.js, Sources/Utilities.js
+- **Sources/BattleContext.js** → Sources/DamageCalculationUtility.js, Sources/Skill.js, Sources/Utilities.js
+- **Sources/BattleMap.js** → Sources/AppData.js, Sources/Cell.js, Sources/DamageCalculator.js, Sources/GlobalDefinitions.js, Sources/GlobalDefinitions_Debug.js, Sources/HeroIconListerMain.js, Sources/HeroInfoConstants.js, Sources/Logger.js, Sources/Skill.js, Sources/SkillConstants.js, Sources/SkillEffect.js, Sources/SkillEffectEnv.js, Sources/SkillEffectHooks.js, Sources/Structures.js, Sources/Table.js, Sources/Tile.js, Sources/UnitConstants.js, Sources/Utilities.js
+- **Sources/BattleMapElement.js** → (依存なし)
+- **Sources/BattleMapSettings.js** → Sources/BattleMap.js, Sources/Structures.js, Sources/Tile.js
+- **Sources/BattleSimulatorBase.js** → Sources/AetherRaidDefensePresets.js, Sources/AetherRaidSimulatorMain.js, Sources/AppData.js, Sources/ArenaSimulatorMain.js, Sources/AudioManager.js, Sources/BattleMap.js, Sources/BeginningOfTurnSkillHandler.js, Sources/Cell.js, Sources/CustomSkill.js, Sources/DamageCalculator.js, Sources/DamageCalculatorWrapper.js, Sources/GlobalDefinitions.js, Sources/GlobalDefinitions_Debug.js, Sources/HeroIconListerMain.js, Sources/HeroInfoConstants.js, Sources/Logger.js, Sources/Main_ImageProcessing.js, Sources/Main_MouseAndTouch.js, Sources/Main_OriginalAi.js, Sources/SettingManager.js, Sources/Skill.js, Sources/SkillConstants.js, Sources/SkillEffect.js, Sources/SkillEffectEnv.js, Sources/SkillEffectHooks.js, Sources/StatusCalcMain.js, Sources/Structures.js, Sources/SummonerDuelsSimulatorMain.js, Sources/Table.js, Sources/Tile.js, Sources/TurnSetting.js, Sources/Unit.js, Sources/UnitBuilderMain.js, Sources/UnitConstants.js, Sources/UnitManager.js, Sources/Utilities.js
+- **Sources/BeginningOfTurnSkillHandler.js** → Sources/HeroInfoConstants.js, Sources/Skill.js, Sources/SkillConstants.js, Sources/SkillEffect.js, Sources/SkillEffectHooks.js, Sources/Structures.js, Sources/UnitConstants.js, Sources/Utilities.js
+- **Sources/Cell.js** → (依存なし)
+- **Sources/CustomSkill.js** → Sources/Skill.js, Sources/SkillConstants.js, Sources/SkillEffect.js, Sources/SkillEffectAliases.js, Sources/SkillEffectBattleContext.js, Sources/SkillEffectCore.js, Sources/SkillEffectHooks.js
+- **Sources/DamageCalculationUtility.js** → Sources/HeroInfoConstants.js, Sources/Logger.js, Sources/Skill.js, Sources/SkillConstants.js, Sources/SkillEffect.js, Sources/SkillEffectEnv.js, Sources/SkillEffectHooks.js
+- **Sources/DamageCalculator.js** → Sources/DamageCalculationUtility.js, Sources/Logger.js, Sources/Skill.js, Sources/SkillConstants.js, Sources/SkillEffect.js, Sources/SkillEffectEnv.js, Sources/SkillEffectHooks.js, Sources/StatusCalcMain.js, Sources/Unit.js, Sources/UnitConstants.js, Sources/Utilities.js
+- **Sources/DamageCalculatorMain.js** → Sources/BattleMap.js, Sources/BeginningOfTurnSkillHandler.js, Sources/DamageCalculationUtility.js, Sources/DamageCalculator.js, Sources/DamageCalculatorWrapper.js, Sources/GlobalBattleContext.js, Sources/HeroDatabase.js, Sources/HeroInfoConstants.js, Sources/KeyRepeatHandler.js, Sources/Logger.js, Sources/Skill.js, Sources/SkillConstants.js, Sources/SkillDatabase.js, Sources/Tile.js, Sources/Unit.js, Sources/UnitConstants.js, Sources/UnitManager.js, Sources/Utilities.js
+- **Sources/DamageCalculatorWrapper.js** → Sources/AppData.js, Sources/DamageCalculationUtility.js, Sources/DamageCalculator.js, Sources/GlobalDefinitions.js, Sources/GlobalDefinitions_Debug.js, Sources/HeroIconListerMain.js, Sources/HeroInfoConstants.js, Sources/PostCombatSkillHander.js, Sources/Skill.js, Sources/SkillConstants.js, Sources/SkillEffect.js, Sources/SkillEffectEnv.js, Sources/SkillEffectHooks.js, Sources/StatusCalcMain.js, Sources/Structures.js, Sources/Tile.js, Sources/Unit.js, Sources/UnitConstants.js, Sources/Utilities.js
+- **Sources/GlobalBattleContext.js** → Sources/HeroInfoConstants.js, Sources/SkillConstants.js, Sources/UnitConstants.js
+- **Sources/GlobalDefinitions.js** → (依存なし)
+- **Sources/GlobalDefinitions_Debug.js** → (依存なし)
+- **Sources/HeroDatabase.js** → (依存なし)
+- **Sources/HeroIconListerMain.js** → Sources/HeroDatabase.js
+- **Sources/HeroInfo.js** → Sources/GlobalDefinitions.js, Sources/GlobalDefinitions_Debug.js, Sources/HeroInfoConstants.js, Sources/Skill.js, Sources/SkillConstants.js
+- **Sources/HeroInfoConstants.js** → Sources/GlobalDefinitions.js, Sources/GlobalDefinitions_Debug.js, Sources/Skill.js
+- **Sources/HeroStatusClustererMain.js** → Sources/HeroDatabase.js, Sources/HeroInfoConstants.js, Sources/Skill.js, Sources/Utilities.js
+- **Sources/KeyRepeatHandler.js** → (依存なし)
+- **Sources/Local.js** → (依存なし)
+- **Sources/Logger.js** → (依存なし)
+- **Sources/Main_ImageProcessing.js** → Sources/AetherRaidSimulatorMain.js, Sources/AppData.js, Sources/ArenaSimulatorMain.js, Sources/BattleMap.js, Sources/BattleSimulatorBase.js, Sources/DamageCalculator.js, Sources/HeroIconListerMain.js, Sources/HeroInfoConstants.js, Sources/Main_MouseAndTouch.js, Sources/SkillConstants.js, Sources/StatusCalcMain.js, Sources/Structures.js, Sources/SummonerDuelsSimulatorMain.js, Sources/UnitBuilderMain.js, Sources/UnitConstants.js, Sources/Utilities.js
+- **Sources/Main_MouseAndTouch.js** → Sources/AetherRaidSimulatorMain.js, Sources/AppData.js, Sources/ArenaSimulatorMain.js, Sources/BattleMap.js, Sources/BattleSimulatorBase.js, Sources/Cell.js, Sources/HeroIconListerMain.js, Sources/Skill.js, Sources/SkillConstants.js, Sources/StatusCalcMain.js, Sources/Structures.js, Sources/SummonerDuelsSimulatorMain.js, Sources/Table.js, Sources/Tile.js, Sources/Unit.js, Sources/UnitBuilderMain.js, Sources/UnitConstants.js, Sources/Utilities.js
+- **Sources/Main_OriginalAi.js** → Sources/AetherRaidSimulatorMain.js, Sources/AppData.js, Sources/ArenaSimulatorMain.js, Sources/BattleSimulatorBase.js, Sources/HeroIconListerMain.js, Sources/SkillConstants.js, Sources/StatusCalcMain.js, Sources/Structures.js, Sources/SummonerDuelsSimulatorMain.js, Sources/Tile.js, Sources/Unit.js, Sources/UnitBuilderMain.js, Sources/UnitConstants.js, Sources/Utilities.js
+- **Sources/PostCombatSkillHander.js** → Sources/AppData.js, Sources/BattleSimulatorBase.js, Sources/HeroIconListerMain.js, Sources/HeroInfoConstants.js, Sources/Skill.js, Sources/SkillConstants.js, Sources/SkillEffect.js, Sources/SkillEffectHooks.js, Sources/Tile.js
+- **Sources/SampleHeroInfos.js** → Sources/HeroInfo.js, Sources/HeroInfoConstants.js
+- **Sources/SampleSkillInfos.js** → Sources/HeroInfoConstants.js, Sources/Skill.js, Sources/SkillConstants.js
+- **Sources/SettingManager.js** → Sources/AppData.js, Sources/BattleSimulatorBase.js, Sources/GlobalDefinitions.js, Sources/GlobalDefinitions_Debug.js, Sources/TurnSetting.js, Sources/Utilities.js
+- **Sources/Skill.js** → Sources/AppData.js, Sources/GlobalDefinitions.js, Sources/GlobalDefinitions_Debug.js, Sources/HeroIconListerMain.js, Sources/Logger.js, Sources/SkillConstants.js, Sources/SkillEffect.js, Sources/SkillEffectEnv.js, Sources/SkillEffectHooks.js, Sources/UnitConstants.js
+- **Sources/SkillConstants.js** → Sources/GlobalDefinitions.js, Sources/GlobalDefinitions_Debug.js
+- **Sources/SkillDatabase.js** → Sources/SkillConstants.js
+- **Sources/SkillEffect.js** → Sources/AppData.js, Sources/BattleSimulatorBase.js, Sources/DamageCalculationUtility.js, Sources/DamageCalculator.js, Sources/HeroIconListerMain.js, Sources/HeroInfoConstants.js, Sources/Logger.js, Sources/Skill.js, Sources/SkillConstants.js, Sources/SkillEffectCore.js, Sources/SkillEffectEnv.js, Sources/SkillEffectUnit.js, Sources/Structures.js, Sources/Tile.js, Sources/Unit.js, Sources/UnitConstants.js, Sources/Utilities.js
+- **Sources/SkillEffectAliases.js** → Sources/AppData.js, Sources/HeroIconListerMain.js, Sources/HeroInfoConstants.js, Sources/Skill.js, Sources/SkillConstants.js, Sources/SkillEffect.js, Sources/SkillEffectBattleContext.js, Sources/SkillEffectCore.js, Sources/SkillEffectEnv.js, Sources/SkillEffectHooks.js, Sources/Tile.js, Sources/Utilities.js
+- **Sources/SkillEffectBattleContext.js** → Sources/AppData.js, Sources/BattleContext.js, Sources/HeroIconListerMain.js, Sources/Skill.js, Sources/SkillConstants.js, Sources/SkillEffect.js, Sources/SkillEffectAliases.js, Sources/SkillEffectCore.js, Sources/SkillEffectEnv.js, Sources/SkillEffectField.js, Sources/UnitConstants.js, Sources/Utilities.js
+- **Sources/SkillEffectCore.js** → Sources/AppData.js, Sources/CustomSkill.js, Sources/HeroIconListerMain.js, Sources/Logger.js, Sources/SkillConstants.js, Sources/SkillEffect.js, Sources/SkillEffectAliases.js, Sources/SkillEffectEnv.js, Sources/Tile.js, Sources/UnitConstants.js, Sources/Utilities.js
+- **Sources/SkillEffectEnv.js** → Sources/AppData.js, Sources/DamageCalculator.js, Sources/HeroIconListerMain.js, Sources/Logger.js
+- **Sources/SkillEffectField.js** → Sources/SkillEffect.js, Sources/SkillEffectCore.js, Sources/Utilities.js
+- **Sources/SkillEffectHooks.js** → Sources/SkillEffectCore.js
+- **Sources/SkillEffectRegistrar.js** → Sources/SkillEffect.js, Sources/SkillEffectAliases.js, Sources/SkillEffectCore.js, Sources/SkillEffectHooks.js, Sources/Utilities.js
+- **Sources/SkillEffectUnit.js** → Sources/SkillEffect.js, Sources/SkillEffectCore.js, Sources/SkillEffectField.js, Sources/Unit.js, Sources/UnitConstants.js, Sources/Utilities.js
+- **Sources/SkillImpl.js** → Sources/AppData.js, Sources/DamageCalculationUtility.js, Sources/DamageCalculator.js, Sources/DamageCalculatorWrapper.js, Sources/HeroIconListerMain.js, Sources/HeroInfoConstants.js, Sources/Skill.js, Sources/SkillConstants.js, Sources/SkillEffect.js, Sources/SkillEffectAliases.js, Sources/SkillEffectBattleContext.js, Sources/SkillEffectCore.js, Sources/SkillEffectHooks.js, Sources/SkillEffectRegistrar.js, Sources/Tile.js, Sources/Unit.js, Sources/UnitConstants.js, Sources/Utilities.js
+- **Sources/SkillImpl202408.js** → Sources/HeroInfoConstants.js, Sources/Skill.js, Sources/SkillConstants.js, Sources/SkillEffect.js, Sources/SkillEffectAliases.js, Sources/SkillEffectBattleContext.js, Sources/SkillEffectCore.js, Sources/SkillEffectHooks.js, Sources/Tile.js, Sources/UnitConstants.js
+- **Sources/SkillImpl202501.js** → Sources/HeroInfoConstants.js, Sources/Skill.js, Sources/SkillConstants.js, Sources/SkillEffect.js, Sources/SkillEffectAliases.js, Sources/SkillEffectBattleContext.js, Sources/SkillEffectCore.js, Sources/SkillEffectHooks.js, Sources/SkillEffectRegistrar.js, Sources/Tile.js, Sources/UnitConstants.js
+- **Sources/SkillImpl202601.js** → Sources/Skill.js, Sources/SkillConstants.js, Sources/SkillEffect.js, Sources/SkillEffectAliases.js, Sources/SkillEffectBattleContext.js, Sources/SkillEffectCore.js, Sources/SkillEffectHooks.js, Sources/SkillEffectRegistrar.js, Sources/SkillEffectUnit.js, Sources/Tile.js, Sources/UnitConstants.js
+- **Sources/StatusCalcMain.js** → Sources/HeroInfoConstants.js, Sources/Skill.js, Sources/Unit.js, Sources/UnitConstants.js
+- **Sources/Structures.js** → Sources/BattleMapElement.js, Sources/GlobalDefinitions.js, Sources/GlobalDefinitions_Debug.js, Sources/Utilities.js
+- **Sources/SummonerDuelsSimulatorMain.js** → Sources/AppData.js, Sources/AudioManager.js, Sources/BattleSimulatorBase.js, Sources/DamageCalculator.js, Sources/HeroIconListerMain.js, Sources/UnitConstants.js, Sources/Utilities.js
+- **Sources/Table.js** → Sources/AppData.js, Sources/Cell.js, Sources/HeroIconListerMain.js
+- **Sources/TestUtilities.js** → Sources/AppData.js, Sources/BattleMap.js, Sources/BeginningOfTurnSkillHandler.js, Sources/DamageCalculator.js, Sources/DamageCalculatorWrapper.js, Sources/GlobalBattleContext.js, Sources/HeroDatabase.js, Sources/HeroIconListerMain.js, Sources/HeroInfoConstants.js, Sources/Logger.js, Sources/Skill.js, Sources/SkillConstants.js, Sources/SkillDatabase.js, Sources/Tile.js, Sources/Unit.js, Sources/UnitManager.js, Sources/Utilities.js
+- **Sources/Tile.js** → Sources/BattleMapElement.js, Sources/GlobalDefinitions.js, Sources/GlobalDefinitions_Debug.js, Sources/HeroInfoConstants.js, Sources/Skill.js, Sources/SkillConstants.js, Sources/Structures.js, Sources/UnitConstants.js
+- **Sources/TurnSetting.js** → Sources/GlobalDefinitions.js, Sources/GlobalDefinitions_Debug.js
+- **Sources/Unit.js** → Sources/AppData.js, Sources/BattleContext.js, Sources/BattleMapElement.js, Sources/GlobalDefinitions.js, Sources/GlobalDefinitions_Debug.js, Sources/HeroIconListerMain.js, Sources/HeroInfoConstants.js, Sources/Logger.js, Sources/Skill.js, Sources/SkillConstants.js, Sources/SkillEffect.js, Sources/SkillEffectEnv.js, Sources/SkillEffectHooks.js, Sources/Structures.js, Sources/Tile.js, Sources/UnitConstants.js, Sources/Utilities.js
+- **Sources/UnitBuilderMain.js** → Sources/AppData.js, Sources/BattleSimulatorBase.js, Sources/DamageCalculator.js, Sources/GlobalDefinitions.js, Sources/GlobalDefinitions_Debug.js, Sources/HeroIconListerMain.js, Sources/HeroInfoConstants.js, Sources/SettingManager.js, Sources/UnitConstants.js, Sources/Utilities.js
+- **Sources/UnitConstants.js** → Sources/DamageCalculator.js, Sources/GlobalDefinitions.js, Sources/GlobalDefinitions_Debug.js, Sources/HeroInfoConstants.js, Sources/Skill.js
+- **Sources/UnitManager.js** → Sources/HeroInfoConstants.js, Sources/Skill.js, Sources/Unit.js, Sources/UnitConstants.js, Sources/Utilities.js
+- **Sources/Utilities.js** → Sources/GlobalDefinitions.js, Sources/GlobalDefinitions_Debug.js, Sources/SkillConstants.js, Sources/Tile.js, Sources/UnitConstants.js
+- **Sources/VueComponents.js** → Sources/BattleSimulatorBase.js, Sources/DamageCalculator.js, Sources/Logger.js, Sources/Tile.js, Sources/Unit.js, Sources/Utilities.js
+
+## 2. 循環依存一覧
+
+1 件の循環依存グループを検出:
+
+### 循環グループ 1
+
+- Sources/AetherRaidSimulatorMain.js
+- Sources/AppData.js
+- Sources/ArenaSimulatorMain.js
+- Sources/AudioManager.js
+- Sources/BattleContext.js
+- Sources/BattleMap.js
+- Sources/BattleMapSettings.js
+- Sources/BattleSimulatorBase.js
+- Sources/BeginningOfTurnSkillHandler.js
+- Sources/CustomSkill.js
+- Sources/DamageCalculationUtility.js
+- Sources/DamageCalculator.js
+- Sources/DamageCalculatorWrapper.js
+- Sources/GlobalBattleContext.js
+- Sources/HeroInfoConstants.js
+- Sources/Main_ImageProcessing.js
+- Sources/Main_MouseAndTouch.js
+- Sources/Main_OriginalAi.js
+- Sources/PostCombatSkillHander.js
+- Sources/SettingManager.js
+- Sources/Skill.js
+- Sources/SkillEffect.js
+- Sources/SkillEffectAliases.js
+- Sources/SkillEffectBattleContext.js
+- Sources/SkillEffectCore.js
+- Sources/SkillEffectEnv.js
+- Sources/SkillEffectField.js
+- Sources/SkillEffectHooks.js
+- Sources/SkillEffectUnit.js
+- Sources/StatusCalcMain.js
+- Sources/Structures.js
+- Sources/SummonerDuelsSimulatorMain.js
+- Sources/Table.js
+- Sources/Tile.js
+- Sources/Unit.js
+- Sources/UnitBuilderMain.js
+- Sources/UnitConstants.js
+- Sources/UnitManager.js
+- Sources/Utilities.js
+
+## 3. 依存レイヤー図
+
+### Layer 0 (9 files)
+
+- Sources/AetherRaidDefensePresets.js
+- Sources/BattleMapElement.js
+- Sources/Cell.js
+- Sources/GlobalDefinitions.js
+- Sources/GlobalDefinitions_Debug.js
+- Sources/HeroDatabase.js
+- Sources/KeyRepeatHandler.js
+- Sources/Local.js
+- Sources/Logger.js
+
+### Layer 1 (3 files)
+
+- Sources/HeroIconListerMain.js
+- Sources/SkillConstants.js
+- Sources/TurnSetting.js
+
+### Layer 2 (1 files)
+
+- Sources/SkillDatabase.js
+
+### Layer 3 (39 files)
+
+- Sources/AetherRaidSimulatorMain.js
+- Sources/AppData.js
+- Sources/ArenaSimulatorMain.js
+- Sources/AudioManager.js
+- Sources/BattleContext.js
+- Sources/BattleMap.js
+- Sources/BattleMapSettings.js
+- Sources/BattleSimulatorBase.js
+- Sources/BeginningOfTurnSkillHandler.js
+- Sources/CustomSkill.js
+- Sources/DamageCalculationUtility.js
+- Sources/DamageCalculator.js
+- Sources/DamageCalculatorWrapper.js
+- Sources/GlobalBattleContext.js
+- Sources/HeroInfoConstants.js
+- Sources/Main_ImageProcessing.js
+- Sources/Main_MouseAndTouch.js
+- Sources/Main_OriginalAi.js
+- Sources/PostCombatSkillHander.js
+- Sources/SettingManager.js
+- Sources/Skill.js
+- Sources/SkillEffect.js
+- Sources/SkillEffectAliases.js
+- Sources/SkillEffectBattleContext.js
+- Sources/SkillEffectCore.js
+- Sources/SkillEffectEnv.js
+- Sources/SkillEffectField.js
+- Sources/SkillEffectHooks.js
+- Sources/SkillEffectUnit.js
+- Sources/StatusCalcMain.js
+- Sources/Structures.js
+- Sources/SummonerDuelsSimulatorMain.js
+- Sources/Table.js
+- Sources/Tile.js
+- Sources/Unit.js
+- Sources/UnitBuilderMain.js
+- Sources/UnitConstants.js
+- Sources/UnitManager.js
+- Sources/Utilities.js
+
+### Layer 4 (8 files)
+
+- Sources/DamageCalculatorMain.js
+- Sources/HeroInfo.js
+- Sources/HeroStatusClustererMain.js
+- Sources/SampleSkillInfos.js
+- Sources/SkillEffectRegistrar.js
+- Sources/SkillImpl202408.js
+- Sources/TestUtilities.js
+- Sources/VueComponents.js
+
+### Layer 5 (4 files)
+
+- Sources/SampleHeroInfos.js
+- Sources/SkillImpl.js
+- Sources/SkillImpl202501.js
+- Sources/SkillImpl202601.js
+
+## 4. 副作用分類表
+
+| ファイル | 分類 |
+|---------|------|
+| Sources/AetherRaidDefensePresets.js | pure-definition |
+| Sources/AetherRaidSimulatorMain.js | global-assignment |
+| Sources/AppData.js | global-assignment |
+| Sources/ArenaSimulatorMain.js | global-assignment |
+| Sources/AudioManager.js | pure-definition |
+| Sources/BattleContext.js | pure-definition |
+| Sources/BattleMap.js | initialization-root |
+| Sources/BattleMapElement.js | pure-definition |
+| Sources/BattleMapSettings.js | pure-definition |
+| Sources/BattleSimulatorBase.js | global-assignment |
+| Sources/BeginningOfTurnSkillHandler.js | pure-definition |
+| Sources/Cell.js | pure-definition |
+| Sources/CustomSkill.js | initialization-root |
+| Sources/DamageCalculationUtility.js | initialization-root |
+| Sources/DamageCalculator.js | pure-definition |
+| Sources/DamageCalculatorMain.js | global-assignment |
+| Sources/DamageCalculatorWrapper.js | pure-definition |
+| Sources/GlobalBattleContext.js | pure-definition |
+| Sources/GlobalDefinitions_Debug.js | global-constant |
+| Sources/GlobalDefinitions.js | global-constant |
+| Sources/HeroDatabase.js | pure-definition |
+| Sources/HeroIconListerMain.js | global-mutable-state |
+| Sources/HeroInfo.js | pure-definition |
+| Sources/HeroInfoConstants.js | initialization-root |
+| Sources/HeroStatusClustererMain.js | global-assignment |
+| Sources/KeyRepeatHandler.js | pure-definition |
+| Sources/Local.js | pure-definition |
+| Sources/Logger.js | pure-definition |
+| Sources/Main_ImageProcessing.js | pure-definition |
+| Sources/Main_MouseAndTouch.js | global-assignment |
+| Sources/Main_OriginalAi.js | pure-definition |
+| Sources/PostCombatSkillHander.js | pure-definition |
+| Sources/SampleHeroInfos.js | pure-definition |
+| Sources/SampleSkillInfos.js | pure-definition |
+| Sources/SettingManager.js | pure-definition |
+| Sources/Skill.js | initialization-root |
+| Sources/SkillConstants.js | initialization-root |
+| Sources/SkillDatabase.js | pure-definition |
+| Sources/SkillEffect.js | pure-definition |
+| Sources/SkillEffectAliases.js | pure-definition |
+| Sources/SkillEffectBattleContext.js | pure-definition |
+| Sources/SkillEffectCore.js | pure-definition |
+| Sources/SkillEffectEnv.js | pure-definition |
+| Sources/SkillEffectField.js | pure-definition |
+| Sources/SkillEffectHooks.js | pure-definition |
+| Sources/SkillEffectRegistrar.js | pure-definition |
+| Sources/SkillEffectUnit.js | pure-definition |
+| Sources/SkillImpl.js | initialization-root |
+| Sources/SkillImpl202408.js | initialization-root |
+| Sources/SkillImpl202501.js | initialization-root |
+| Sources/SkillImpl202601.js | initialization-root |
+| Sources/StatusCalcMain.js | global-mutable-state |
+| Sources/Structures.js | pure-definition |
+| Sources/SummonerDuelsSimulatorMain.js | global-assignment |
+| Sources/Table.js | pure-definition |
+| Sources/TestUtilities.js | pure-definition |
+| Sources/Tile.js | initialization-root |
+| Sources/TurnSetting.js | pure-definition |
+| Sources/Unit.js | pure-definition |
+| Sources/UnitBuilderMain.js | global-assignment |
+| Sources/UnitConstants.js | pure-definition |
+| Sources/UnitManager.js | pure-definition |
+| Sources/Utilities.js | pure-definition |
+| Sources/VueComponents.js | initialization-root |
+
+## 5. HTMLエントリポイント分類
+
+| HTML | 分類 | JSファイル数 |
+|------|------|------------|
+| AetherRaidSimulator.html | ローカル/要確認 | 8 |
+| ArenaSimulator.html | ローカル/要確認 | 8 |
+| DamageCalculator.html | ローカル/要確認 | 9 |
+| HeroIconLister.html | ローカル/要確認 | 1 |
+| HeroStatusClusterer.html | ローカル/要確認 | 4 |
+| StatusCalculator.html | ローカル/要確認 | 1 |
+| SummonerDuelsSimulator.html | ローカル/要確認 | 8 |
+| UnitBuilder.html | ローカル/要確認 | 8 |
+
+### AetherRaidSimulator.html
+
+- Local.js
+- https://code.jquery.com/jquery-3.3.1.slim.min.js
+- https://cdnjs.cloudflare.com/ajax/libs/jquery/1.7.2/jquery.min.js
+- https://fire-emblem.fun/js/jquery-3.7.0.min.js
+- https://cdnjs.cloudflare.com/ajax/libs/select2/4.0.6-rc.0/js/select2.min.js
+- https://cdnjs.cloudflare.com/ajax/libs/vue/2.5.13/vue.min.js
+- https://unpkg.com/vuex@3.6.2/dist/vuex.min.js
+- https://cdnjs.cloudflare.com/ajax/libs/jquery-cookie/1.4.1/jquery.cookie.js
+
+### ArenaSimulator.html
+
+- Local.js
+- https://code.jquery.com/jquery-3.3.1.slim.min.js
+- https://cdnjs.cloudflare.com/ajax/libs/jquery/1.7.2/jquery.min.js
+- https://fire-emblem.fun/js/jquery-3.7.0.min.js
+- https://cdnjs.cloudflare.com/ajax/libs/select2/4.0.6-rc.0/js/select2.min.js
+- https://cdnjs.cloudflare.com/ajax/libs/vue/2.5.13/vue.min.js
+- https://unpkg.com/vuex@3.6.2/dist/vuex.min.js
+- https://cdnjs.cloudflare.com/ajax/libs/jquery-cookie/1.4.1/jquery.cookie.js
+
+### DamageCalculator.html
+
+- Local.js
+- https://code.jquery.com/jquery-3.3.1.slim.min.js
+- https://fire-emblem.fun/js/jquery-3.7.0.min.js
+- https://cdnjs.cloudflare.com/ajax/libs/select2/4.0.6-rc.0/js/select2.min.js
+- https://ajax.googleapis.com/ajax/libs/jqueryui/1.12.1/jquery-ui.min.js
+- https://cdnjs.cloudflare.com/ajax/libs/vue/2.5.13/vue.min.js
+- https://unpkg.com/vuex@3.6.2/dist/vuex.min.js
+- https://cdnjs.cloudflare.com/ajax/libs/lz-string/1.4.4/lz-string.min.js
+- https://cdnjs.cloudflare.com/ajax/libs/Chart.js/2.1.4/Chart.bundle.min.js
+
+### HeroIconLister.html
+
+- Local.js
+
+### HeroStatusClusterer.html
+
+- https://cdnjs.cloudflare.com/ajax/libs/select2/4.0.6-rc.0/js/select2.min.js
+- https://ajax.googleapis.com/ajax/libs/jqueryui/1.12.1/jquery-ui.min.js
+- https://cdnjs.cloudflare.com/ajax/libs/vue/2.5.13/vue.min.js
+- https://unpkg.com/vuex@3.6.2/dist/vuex.min.js
+
+### StatusCalculator.html
+
+- Local.js
+
+### SummonerDuelsSimulator.html
+
+- Local.js
+- https://code.jquery.com/jquery-3.3.1.slim.min.js
+- https://cdnjs.cloudflare.com/ajax/libs/jquery/1.7.2/jquery.min.js
+- https://fire-emblem.fun/js/jquery-3.7.0.min.js
+- https://cdnjs.cloudflare.com/ajax/libs/select2/4.0.6-rc.0/js/select2.min.js
+- https://cdnjs.cloudflare.com/ajax/libs/vue/2.5.13/vue.min.js
+- https://unpkg.com/vuex@3.6.2/dist/vuex.min.js
+- https://cdnjs.cloudflare.com/ajax/libs/jquery-cookie/1.4.1/jquery.cookie.js
+
+### UnitBuilder.html
+
+- Local.js
+- https://code.jquery.com/jquery-3.3.1.slim.min.js
+- https://cdnjs.cloudflare.com/ajax/libs/jquery/1.7.2/jquery.min.js
+- https://fire-emblem.fun/js/jquery-3.7.0.min.js
+- https://cdnjs.cloudflare.com/ajax/libs/select2/4.0.6-rc.0/js/select2.min.js
+- https://cdnjs.cloudflare.com/ajax/libs/vue/2.5.13/vue.min.js
+- https://unpkg.com/vuex@3.6.2/dist/vuex.min.js
+- https://cdnjs.cloudflare.com/ajax/libs/jquery-cookie/1.4.1/jquery.cookie.js
+
+## 6. サマリー
+
+- 解析ファイル数: 64
+- 依存エッジ数: 474
+- 循環依存グループ数: 1
+- レイヤー数: 6
+- HTMLエントリポイント数: 8
