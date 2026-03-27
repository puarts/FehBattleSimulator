#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const { buildDependencyGraph, detectCycles, classifyLayers } = require('./lib/dependency-graph');

function loadAnalysisResults(inputPath) {
    const data = fs.readFileSync(inputPath, 'utf-8');
    return JSON.parse(data);
}

function parseHtmlScripts(htmlDir) {
    const htmlFiles = fs.readdirSync(htmlDir)
        .filter(f => f.endsWith('.html'))
        .sort();

    const results = [];
    for (const htmlFile of htmlFiles) {
        const filePath = path.join(htmlDir, htmlFile);
        const content = fs.readFileSync(filePath, 'utf-8');

        // Extract JS file references from HTML
        const scripts = [];

        // Match additionalScripts = [...] or similar array assignments with JS filenames
        const arrayAssignments = content.matchAll(/(?:additionalScripts|scripts)\s*=\s*\[([\s\S]*?)\]/g);
        for (const arrMatch of arrayAssignments) {
            const arrayContent = arrMatch[1];
            const scriptPaths = arrayContent.match(/"([^"]+\.js)"/g) || [];
            for (const s of scriptPaths) {
                scripts.push(s.replace(/"/g, ''));
            }
        }

        // Also match inline <script src="..."> tags
        const scriptTagRegex = /<script\s+src="([^"]+\.js)"/g;
        let match;
        while ((match = scriptTagRegex.exec(content)) !== null) {
            scripts.push(match[1]);
        }

        results.push({ file: htmlFile, scripts });
    }
    return results;
}

function classifyHtmlFiles(htmlScripts, deployBatPath) {
    let deployTargets = new Set();
    if (fs.existsSync(deployBatPath)) {
        const content = fs.readFileSync(deployBatPath, 'utf-8');
        // Deploy.bat copies HTML files: set copyfiles=Name1 Name2 ...
        // followed by: copy Sources\%%n.html destination\%%n.html
        // Find the copyfiles assignment closest to the .html copy line
        const allMatches = [...content.matchAll(/set\s+copyfiles\s*=\s*(.+)/gi)];
        // The last assignment before the HTML copy section is the HTML list
        for (const m of allMatches) {
            const afterMatch = content.slice(m.index);
            if (afterMatch.includes('.html')) {
                const names = m[1].trim().split(/\s+/);
                for (const name of names) {
                    if (!name.startsWith('%')) { // skip variable references
                        deployTargets.add(name + '.html');
                    }
                }
            }
        }
    }

    return htmlScripts.map(entry => ({
        ...entry,
        isProduction: deployTargets.has(entry.file),
    }));
}

function generateMarkdown(graph, cycles, layers, analysisResults, htmlEntries) {
    const lines = [];
    lines.push('# ESM移行 — 依存グラフ分析結果');
    lines.push('');
    lines.push('> 自動生成: `node Tools/build-dependency-graph.js`');
    lines.push('');

    // 1. File dependency graph
    lines.push('## 1. ファイル間依存グラフ');
    lines.push('');
    const sortedFiles = [...graph.keys()].sort();
    for (const file of sortedFiles) {
        const deps = [...graph.get(file)].sort();
        if (deps.length === 0) {
            lines.push(`- **${file}** → (依存なし)`);
        } else {
            lines.push(`- **${file}** → ${deps.join(', ')}`);
        }
    }
    lines.push('');

    // 2. Cycle report
    lines.push('## 2. 循環依存一覧');
    lines.push('');
    if (cycles.length === 0) {
        lines.push('循環依存は検出されませんでした。');
    } else {
        lines.push(`${cycles.length} 件の循環依存グループを検出:`);
        lines.push('');
        for (let i = 0; i < cycles.length; i++) {
            const cycle = cycles[i].sort();
            lines.push(`### 循環グループ ${i + 1}`);
            lines.push('');
            lines.push(cycle.map(f => `- ${f}`).join('\n'));
            lines.push('');
        }
    }

    // 3. Layer classification
    lines.push('## 3. 依存レイヤー図');
    lines.push('');
    const sortedLayers = [...layers.keys()].sort((a, b) => a - b);
    for (const layer of sortedLayers) {
        const files = layers.get(layer).sort();
        lines.push(`### Layer ${layer} (${files.length} files)`);
        lines.push('');
        for (const f of files) {
            lines.push(`- ${f}`);
        }
        lines.push('');
    }

    // 4. Side-effect classification table
    lines.push('## 4. 副作用分類表');
    lines.push('');
    lines.push('| ファイル | 分類 |');
    lines.push('|---------|------|');
    const sorted = [...analysisResults]
        .filter(r => !r.error)
        .sort((a, b) => a.file.localeCompare(b.file));
    for (const r of sorted) {
        lines.push(`| ${r.file} | ${r.sideEffectCategory} |`);
    }
    lines.push('');

    // 5. HTML entry points
    lines.push('## 5. HTMLエントリポイント分類');
    lines.push('');
    lines.push('| HTML | 分類 | JSファイル数 |');
    lines.push('|------|------|------------|');
    for (const entry of htmlEntries) {
        const type = entry.isProduction ? '本番' : 'ローカル/要確認';
        lines.push(`| ${entry.file} | ${type} | ${entry.scripts.length} |`);
    }
    lines.push('');

    for (const entry of htmlEntries) {
        lines.push(`### ${entry.file}`);
        lines.push('');
        if (entry.scripts.length === 0) {
            lines.push('スクリプトなし（または動的ロード）');
        } else {
            for (const s of entry.scripts) {
                lines.push(`- ${s}`);
            }
        }
        lines.push('');
    }

    // 6. Summary stats
    lines.push('## 6. サマリー');
    lines.push('');
    lines.push(`- 解析ファイル数: ${analysisResults.length}`);
    lines.push(`- 依存エッジ数: ${[...graph.values()].reduce((sum, deps) => sum + deps.size, 0)}`);
    lines.push(`- 循環依存グループ数: ${cycles.length}`);
    lines.push(`- レイヤー数: ${sortedLayers.length}`);
    lines.push(`- HTMLエントリポイント数: ${htmlEntries.length}`);
    lines.push('');

    return lines.join('\n');
}

function main() {
    const args = process.argv.slice(2);
    let inputPath = 'Tools/output/global-symbols.json';
    let outputPath = 'docs/planning/esm-migration/dependency-graph.md';
    let sourcesDir = 'Sources';

    for (let i = 0; i < args.length; i++) {
        if (args[i] === '--input' && i + 1 < args.length) {
            inputPath = args[++i];
        } else if (args[i] === '--output' && i + 1 < args.length) {
            outputPath = args[++i];
        } else if (args[i] === '--sources' && i + 1 < args.length) {
            sourcesDir = args[++i];
        }
    }

    console.log(`Reading analysis results from: ${inputPath}`);
    const analysisResults = loadAnalysisResults(inputPath);

    console.log(`Building dependency graph for ${analysisResults.length} files...`);
    const graph = buildDependencyGraph(analysisResults);

    console.log('Detecting cycles...');
    const cycles = detectCycles(graph);
    console.log(`Found ${cycles.length} cycle groups`);

    console.log('Classifying layers...');
    const layers = classifyLayers(graph, cycles);
    console.log(`Classified into ${layers.size} layers`);

    console.log(`Parsing HTML entry points from: ${sourcesDir}`);
    const htmlScripts = parseHtmlScripts(sourcesDir);
    const deployBatPath = path.join(sourcesDir, '..', 'Deploy.bat');
    const htmlEntries = classifyHtmlFiles(htmlScripts, deployBatPath);

    const markdown = generateMarkdown(graph, cycles, layers, analysisResults, htmlEntries);

    const dir = path.dirname(outputPath);
    if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
    }
    fs.writeFileSync(outputPath, markdown, 'utf-8');
    console.log(`Dependency graph written to: ${outputPath}`);
}

main();
