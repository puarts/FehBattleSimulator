// ゴールデンマスター・適合判定（conformance runner）
//
// 目的: コミット済みのゴールデンベクタ（Tests/golden/corpus.json）を読み戻し、
//       各ベクタの input(spec) を現エンジンで再実行して output と一致するか照合する。
// 役割:
//   1) JS側の回帰ガード（エンジン変更で既存ベクタが壊れたら即検知）
//   2) 将来 Rust/WASM 版が満たすべき適合スイートの参照実装
//        （同じ JSON・同じ比較セマンティクスを Rust 側でも実装する）
//
// 比較は許容誤差つき（GoldenScenario.compare）。整数は厳密、浮動小数は tol 以内で一致。

const fs = require('fs');
const path = require('path');

const GOLDEN_DIR = path.join(process.cwd(), 'Tests', 'golden');

function loadVectors() {
    const corpusPath = path.join(GOLDEN_DIR, 'corpus.json');
    if (!fs.existsSync(corpusPath)) return [];
    const corpus = JSON.parse(fs.readFileSync(corpusPath, 'utf8'));
    return Array.isArray(corpus.vectors) ? corpus.vectors : [];
}

function formatDiffs(diffs) {
    return diffs.slice(0, 10).map(
        d => `  ${d.path}: expected=${JSON.stringify(d.expected)} actual=${JSON.stringify(d.actual)}`
    ).join('\n') + (diffs.length > 10 ? `\n  ...(他 ${diffs.length - 10} 件)` : '');
}

describe('Golden comparator self-check (比較器が差分を検出/許容できるか)', () => {
    test('数値の不一致を検出する', () => {
        const diffs = GoldenScenario.compare({ a: 1, b: 2 }, { a: 1, b: 3 });
        expect(diffs.length).toBe(1);
        expect(diffs[0].path).toBe('b');
    });

    test('配列要素・ネストの不一致を path 付きで検出する', () => {
        const diffs = GoldenScenario.compare(
            { s: { arr: [0.1, 0.2] } }, { s: { arr: [0.1, 0.9] } });
        expect(diffs.length).toBe(1);
        expect(diffs[0].path).toBe('s.arr[1]');
    });

    test('浮動小数の微小誤差は許容する（tol 以内）', () => {
        const diffs = GoldenScenario.compare({ r: 0.3 }, { r: 0.3 + 1e-12 });
        expect(diffs.length).toBe(0);
    });

    test('boolean/null の不一致を検出する', () => {
        expect(GoldenScenario.compare({ x: true }, { x: false }).length).toBe(1);
        expect(GoldenScenario.compare({ x: null }, { x: 0 }).length).toBe(1);
    });

    test('配列長の違いを検出する', () => {
        expect(GoldenScenario.compare({ a: [1, 2] }, { a: [1] }).length).toBe(1);
    });
});

describe('Golden conformance (現エンジンが保存済みベクタを再現するか)', () => {
    const vectors = loadVectors();

    beforeEach(() => resetGlobalTestState());

    test('corpus.json が存在しベクタを含む', () => {
        expect(vectors.length).toBeGreaterThan(0);
    });

    for (const v of vectors) {
        test(`conform: ${v.label}`, () => {
            const actual = GoldenScenario.run(v.input);
            const diffs = GoldenScenario.compare(v.output, actual);
            if (diffs.length > 0) {
                throw new Error(
                    `ベクタ "${v.label}" が現エンジンの出力と一致しません（差分 ${diffs.length} 件）:\n`
                    + formatDiffs(diffs));
            }
            expect(diffs.length).toBe(0);
        });
    }
});
