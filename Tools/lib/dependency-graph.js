/**
 * ファイル間依存グラフの構築・循環検出・レイヤー分類
 *
 * AST解析結果（defines/references）を入力として、ファイル間の依存関係を解析する。
 */

/**
 * AST解析結果の配列からファイル間依存グラフを構築する。
 * @param {Array<{file: string, defines: string[], references: string[], sideEffectCategory: string}>} analysisResults
 * @returns {Map<string, Set<string>>} ファイル名→依存先ファイル名のSet
 */
function buildDependencyGraph(analysisResults) {
    // Build symbol → defining files index
    const symbolToFiles = new Map();
    for (const result of analysisResults) {
        for (const sym of result.defines) {
            if (!symbolToFiles.has(sym)) {
                symbolToFiles.set(sym, []);
            }
            symbolToFiles.get(sym).push(result.file);
        }
    }

    // Build dependency graph
    const graph = new Map();
    for (const result of analysisResults) {
        const deps = new Set();
        for (const ref of result.references) {
            const definingFiles = symbolToFiles.get(ref);
            if (!definingFiles) continue;
            for (const defFile of definingFiles) {
                if (defFile !== result.file) {
                    deps.add(defFile);
                }
            }
        }
        graph.set(result.file, deps);
    }

    return graph;
}

/**
 * 依存グラフから循環依存を検出する（Tarjanの強連結成分アルゴリズム）。
 * サイズ2以上のSCC、または自己参照を持つサイズ1のSCCを循環として返す。
 * @param {Map<string, Set<string>>} graph
 * @returns {Array<string[]>} 循環に関与するファイルのグループ配列
 */
function detectCycles(graph) {
    let index = 0;
    const indices = new Map();
    const lowlinks = new Map();
    const onStack = new Set();
    const stack = [];
    const sccs = [];

    function strongconnect(node) {
        indices.set(node, index);
        lowlinks.set(node, index);
        index++;
        stack.push(node);
        onStack.add(node);

        const neighbors = graph.get(node) || new Set();
        for (const neighbor of neighbors) {
            if (!indices.has(neighbor)) {
                strongconnect(neighbor);
                lowlinks.set(node, Math.min(lowlinks.get(node), lowlinks.get(neighbor)));
            } else if (onStack.has(neighbor)) {
                lowlinks.set(node, Math.min(lowlinks.get(node), indices.get(neighbor)));
            }
        }

        if (lowlinks.get(node) === indices.get(node)) {
            const scc = [];
            let w;
            do {
                w = stack.pop();
                onStack.delete(w);
                scc.push(w);
            } while (w !== node);

            // Only report SCCs that represent actual cycles
            if (scc.length > 1) {
                sccs.push(scc);
            } else if (scc.length === 1) {
                // Self-reference check
                const self = scc[0];
                const deps = graph.get(self) || new Set();
                if (deps.has(self)) {
                    sccs.push(scc);
                }
            }
        }
    }

    for (const node of graph.keys()) {
        if (!indices.has(node)) {
            strongconnect(node);
        }
    }

    return sccs;
}

/**
 * 依存グラフからレイヤー分類を生成する。
 * 循環依存のファイルは同一レイヤーとして扱う。
 * @param {Map<string, Set<string>>} graph
 * @param {Array<string[]>} cycles
 * @returns {Map<number, string[]>} レイヤー番号→ファイル名配列
 */
function classifyLayers(graph, cycles) {
    // Map each file to its cycle group (or itself if not in a cycle)
    const fileToGroup = new Map();
    for (const [i, cycle] of cycles.entries()) {
        const groupId = `__cycle_${i}`;
        for (const file of cycle) {
            fileToGroup.set(file, groupId);
        }
    }
    for (const file of graph.keys()) {
        if (!fileToGroup.has(file)) {
            fileToGroup.set(file, file);
        }
    }

    // Build condensed DAG (group → Set<group>)
    const condensed = new Map();
    const groupMembers = new Map();
    for (const [file, group] of fileToGroup.entries()) {
        if (!groupMembers.has(group)) {
            groupMembers.set(group, []);
        }
        groupMembers.get(group).push(file);
        if (!condensed.has(group)) {
            condensed.set(group, new Set());
        }
    }

    for (const [file, deps] of graph.entries()) {
        const srcGroup = fileToGroup.get(file);
        for (const dep of deps) {
            const depGroup = fileToGroup.get(dep);
            if (depGroup && depGroup !== srcGroup) {
                condensed.get(srcGroup).add(depGroup);
            }
        }
    }

    // Compute layer for each group via BFS/topological approach
    const groupLayer = new Map();
    const allGroups = [...condensed.keys()];

    // Iteratively compute layers: layer of a group = max(layer of deps) + 1
    // Initialize all to 0
    for (const g of allGroups) {
        groupLayer.set(g, 0);
    }

    // Repeat until stable (with safety limit)
    const maxIterations = allGroups.length + 1;
    let changed = true;
    let iterations = 0;
    while (changed && iterations < maxIterations) {
        changed = false;
        iterations++;
        for (const g of allGroups) {
            const deps = condensed.get(g) || new Set();
            let maxDepLayer = -1;
            for (const dep of deps) {
                const depLayer = groupLayer.get(dep);
                if (depLayer !== undefined && depLayer > maxDepLayer) {
                    maxDepLayer = depLayer;
                }
            }
            const newLayer = deps.size === 0 ? 0 : maxDepLayer + 1;
            if (newLayer !== groupLayer.get(g)) {
                groupLayer.set(g, newLayer);
                changed = true;
            }
        }
    }

    // Build result: layer → files
    const layers = new Map();
    for (const [group, layer] of groupLayer.entries()) {
        const members = groupMembers.get(group) || [];
        if (!layers.has(layer)) {
            layers.set(layer, []);
        }
        layers.get(layer).push(...members);
    }

    return layers;
}

module.exports = { buildDependencyGraph, detectCycles, classifyLayers };
