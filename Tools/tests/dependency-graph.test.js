const path = require('path');
const fs = require('fs');
const {
    buildDependencyGraph,
    detectCycles,
    classifyLayers,
} = require('../lib/dependency-graph');

describe('buildDependencyGraph', () => {
    test('シンボル参照に基づいてファイル間依存を構築する', () => {
        const analysisResults = [
            { file: 'A.js', defines: ['Foo'], references: ['Bar'], sideEffectCategory: 'pure-definition' },
            { file: 'B.js', defines: ['Bar'], references: [], sideEffectCategory: 'pure-definition' },
            { file: 'C.js', defines: ['Baz'], references: ['Foo', 'Bar'], sideEffectCategory: 'pure-definition' },
        ];
        const graph = buildDependencyGraph(analysisResults);
        expect(graph.get('A.js')).toEqual(new Set(['B.js']));
        expect(graph.get('B.js')).toEqual(new Set());
        expect(graph.get('C.js')).toEqual(new Set(['A.js', 'B.js']));
    });

    test('同じシンボルが複数ファイルで定義されている場合、すべてに依存する', () => {
        const analysisResults = [
            { file: 'A.js', defines: ['X'], references: [], sideEffectCategory: 'pure-definition' },
            { file: 'B.js', defines: ['X'], references: [], sideEffectCategory: 'pure-definition' },
            { file: 'C.js', defines: [], references: ['X'], sideEffectCategory: 'pure-definition' },
        ];
        const graph = buildDependencyGraph(analysisResults);
        expect(graph.get('C.js')).toEqual(new Set(['A.js', 'B.js']));
    });

    test('自ファイル内で定義・参照されるシンボルは依存に含めない', () => {
        const analysisResults = [
            { file: 'A.js', defines: ['Foo', 'Bar'], references: ['Foo'], sideEffectCategory: 'pure-definition' },
        ];
        const graph = buildDependencyGraph(analysisResults);
        expect(graph.get('A.js')).toEqual(new Set());
    });

    test('どのファイルにも定義がないシンボルは無視する', () => {
        const analysisResults = [
            { file: 'A.js', defines: ['Foo'], references: ['Unknown'], sideEffectCategory: 'pure-definition' },
        ];
        const graph = buildDependencyGraph(analysisResults);
        expect(graph.get('A.js')).toEqual(new Set());
    });
});

describe('detectCycles', () => {
    test('A→B→C→A の循環を検出する', () => {
        const graph = new Map([
            ['A.js', new Set(['B.js'])],
            ['B.js', new Set(['C.js'])],
            ['C.js', new Set(['A.js'])],
        ]);
        const cycles = detectCycles(graph);
        expect(cycles.length).toBe(1);
        expect(cycles[0].sort()).toEqual(['A.js', 'B.js', 'C.js']);
    });

    test('自己参照（A→A）を検出する', () => {
        const graph = new Map([
            ['A.js', new Set(['A.js'])],
            ['B.js', new Set()],
        ]);
        const cycles = detectCycles(graph);
        expect(cycles.length).toBe(1);
        expect(cycles[0]).toEqual(['A.js']);
    });

    test('循環に関与しないノードを誤検出しない', () => {
        const graph = new Map([
            ['A.js', new Set(['B.js'])],
            ['B.js', new Set(['C.js'])],
            ['C.js', new Set(['B.js'])],
            ['D.js', new Set(['A.js'])],
        ]);
        const cycles = detectCycles(graph);
        expect(cycles.length).toBe(1);
        expect(cycles[0].sort()).toEqual(['B.js', 'C.js']);
    });

    test('循環がない場合は空配列を返す', () => {
        const graph = new Map([
            ['A.js', new Set(['B.js'])],
            ['B.js', new Set(['C.js'])],
            ['C.js', new Set()],
        ]);
        const cycles = detectCycles(graph);
        expect(cycles.length).toBe(0);
    });

    test('複数の独立した循環を検出する', () => {
        const graph = new Map([
            ['A.js', new Set(['B.js'])],
            ['B.js', new Set(['A.js'])],
            ['C.js', new Set(['D.js'])],
            ['D.js', new Set(['C.js'])],
        ]);
        const cycles = detectCycles(graph);
        expect(cycles.length).toBe(2);
    });
});

describe('classifyLayers', () => {
    test('依存のないファイルはLayer 0になる', () => {
        const graph = new Map([
            ['A.js', new Set()],
            ['B.js', new Set(['A.js'])],
            ['C.js', new Set(['B.js'])],
        ]);
        const cycles = [];
        const layers = classifyLayers(graph, cycles);
        expect(layers.get(0)).toContain('A.js');
        expect(layers.get(1)).toContain('B.js');
        expect(layers.get(2)).toContain('C.js');
    });

    test('循環依存のファイルは同一レイヤーにまとめられる', () => {
        const graph = new Map([
            ['A.js', new Set()],
            ['B.js', new Set(['A.js', 'C.js'])],
            ['C.js', new Set(['B.js'])],
        ]);
        const cycles = [['B.js', 'C.js']];
        const layers = classifyLayers(graph, cycles);
        expect(layers.get(0)).toContain('A.js');
        // B and C should be in the same layer
        const bLayer = findLayer(layers, 'B.js');
        const cLayer = findLayer(layers, 'C.js');
        expect(bLayer).toBe(cLayer);
        expect(bLayer).toBeGreaterThan(0);
    });

    test('すべてのファイルがいずれかのレイヤーに含まれる', () => {
        const graph = new Map([
            ['A.js', new Set()],
            ['B.js', new Set(['A.js'])],
            ['C.js', new Set(['A.js'])],
            ['D.js', new Set(['B.js', 'C.js'])],
        ]);
        const cycles = [];
        const layers = classifyLayers(graph, cycles);
        const allFiles = new Set();
        for (const files of layers.values()) {
            for (const f of files) allFiles.add(f);
        }
        expect(allFiles.size).toBe(4);
    });
});

describe('create_tests.sh順序との整合性', () => {
    test('依存グラフがcreate_tests.shのロード順と大きく矛盾しない', () => {
        const jsonPath = path.join(__dirname, '../../Tools/output/global-symbols.json');
        if (!fs.existsSync(jsonPath)) {
            console.warn('global-symbols.json not found, skipping');
            return;
        }
        const analysisResults = JSON.parse(fs.readFileSync(jsonPath, 'utf-8'));
        const graph = buildDependencyGraph(analysisResults);

        // create_tests.sh load order (index = position, lower = loaded earlier)
        const loadOrder = [
            'Sources/GlobalDefinitions.js',
            'Sources/Utilities.js',
            'Sources/Logger.js',
            'Sources/SkillConstants.js',
            'Sources/Skill.js',
            'Sources/BattleMapElement.js',
            'Sources/Tile.js',
            'Sources/Structures.js',
            'Sources/Cell.js',
            'Sources/Table.js',
            'Sources/HeroInfoConstants.js',
            'Sources/HeroInfo.js',
            'Sources/UnitConstants.js',
            'Sources/BattleContext.js',
            'Sources/Unit.js',
            'Sources/UnitManager.js',
            'Sources/BattleMap.js',
            'Sources/GlobalBattleContext.js',
            'Sources/DamageCalculationUtility.js',
            'Sources/DamageCalculator.js',
            'Sources/PostCombatSkillHander.js',
            'Sources/DamageCalculatorWrapper.js',
            'Sources/BeginningOfTurnSkillHandler.js',
            'Sources/SkillDatabase.js',
            'Sources/HeroDatabase.js',
            'Sources/SampleSkillInfos.js',
            'Sources/SampleHeroInfos.js',
            'Sources/SkillEffectCore.js',
            'Sources/SkillEffectEnv.js',
            'Sources/SkillEffect.js',
            'Sources/SkillEffectField.js',
            'Sources/SkillEffectUnit.js',
            'Sources/SkillEffectBattleContext.js',
            'Sources/SkillEffectHooks.js',
            'Sources/SkillEffectRegistrar.js',
            'Sources/SkillEffectAliases.js',
            'Sources/CustomSkill.js',
            'Sources/SkillImpl.js',
            'Sources/SkillImpl202408.js',
            'Sources/SkillImpl202501.js',
            'Sources/SkillImpl202601.js',
            'Sources/TestUtilities.js',
        ];

        const orderIndex = new Map();
        loadOrder.forEach((f, i) => orderIndex.set(f, i));

        // Count violations: file loaded at position i depends on file loaded at position j where j > i
        let violations = 0;
        let totalChecked = 0;
        for (const [file, deps] of graph.entries()) {
            const fileIdx = orderIndex.get(file);
            if (fileIdx === undefined) continue;
            for (const dep of deps) {
                const depIdx = orderIndex.get(dep);
                if (depIdx === undefined) continue;
                totalChecked++;
                if (depIdx > fileIdx) {
                    violations++;
                }
            }
        }

        // Allow some violations (known circular dependencies), but the vast majority should be consistent
        if (totalChecked > 0) {
            const violationRate = violations / totalChecked;
            expect(violationRate).toBeLessThan(0.20); // Less than 20% violations (circular deps cause some)
        }
    });
});

/**
 * Helper: find the layer number for a given file
 */
function findLayer(layers, file) {
    for (const [layer, files] of layers.entries()) {
        if (files.includes(file)) return layer;
    }
    return -1;
}
