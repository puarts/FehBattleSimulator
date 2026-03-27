const { extractSymbols } = require('../lib/ast-extractor');
const { classifySideEffects } = require('../lib/side-effect-classifier');
const fs = require('fs');
const path = require('path');

describe('ast-extractor', () => {
    describe('定義シンボル抽出', () => {
        test('クラス定義を正しく抽出する', () => {
            const code = 'class Foo {}';
            const result = extractSymbols(code);
            expect(result.defines).toContain('Foo');
        });

        test('関数定義を正しく抽出する', () => {
            const code = 'function bar() {}';
            const result = extractSymbols(code);
            expect(result.defines).toContain('bar');
        });

        test('const/let/var宣言を正しく抽出する', () => {
            const code = 'const X = 1; let y = 2; var z = 3;';
            const result = extractSymbols(code);
            expect(result.defines).toContain('X');
            expect(result.defines).toContain('y');
            expect(result.defines).toContain('z');
        });

        test('ネストされたスコープ内の宣言は除外する', () => {
            const code = `
function outer() {
    const inner = 1;
    let local = 2;
}`;
            const result = extractSymbols(code);
            expect(result.defines).toContain('outer');
            expect(result.defines).not.toContain('inner');
            expect(result.defines).not.toContain('local');
        });
    });

    describe('参照シンボル抽出', () => {
        test('グローバル変数参照を正しく検出する', () => {
            const code = `
class Bar extends Foo {
    constructor() {
        super();
        g_appData.init();
    }
}`;
            const result = extractSymbols(code);
            expect(result.references).toContain('Foo');
            expect(result.references).toContain('g_appData');
            expect(result.defines).toContain('Bar');
        });

        test('組み込みグローバル（window, document, console, Math等）は参照に含まれない', () => {
            const code = 'console.log(Math.max(1, 2)); document.getElementById("x");';
            const result = extractSymbols(code);
            expect(result.references).not.toContain('console');
            expect(result.references).not.toContain('Math');
            expect(result.references).not.toContain('document');
        });

        test('プロパティアクセスの右辺は参照に含まれない', () => {
            const code = 'foo.bar.baz();';
            const result = extractSymbols(code);
            expect(result.references).toContain('foo');
            expect(result.references).not.toContain('bar');
            expect(result.references).not.toContain('baz');
        });

        test('メソッド定義名は参照に含まれない', () => {
            const code = `
class MyClass {
    method() { return 1; }
    get prop() { return 2; }
}`;
            const result = extractSymbols(code);
            expect(result.references).not.toContain('method');
            expect(result.references).not.toContain('prop');
        });

        test('ローカル変数は参照に含まれない', () => {
            const code = `
function test() {
    const local = 1;
    return local + externalVar;
}`;
            const result = extractSymbols(code);
            expect(result.references).not.toContain('local');
            expect(result.references).toContain('externalVar');
        });

        test('関数パラメータは参照に含まれない', () => {
            const code = `
function test(param1, param2) {
    return param1 + param2 + externalVar;
}`;
            const result = extractSymbols(code);
            expect(result.references).not.toContain('param1');
            expect(result.references).not.toContain('param2');
            expect(result.references).toContain('externalVar');
        });

        test('catch句のパラメータは参照に含まれない', () => {
            const code = `
function test() {
    try { foo(); } catch (err) { console.log(err); }
}`;
            const result = extractSymbols(code);
            expect(result.references).not.toContain('err');
        });

        test('for-in/for-ofの左辺変数は参照に含まれない', () => {
            const code = `
function test() {
    for (const key in obj) { process(key); }
    for (const val of arr) { process(val); }
}`;
            const result = extractSymbols(code);
            expect(result.references).not.toContain('key');
            expect(result.references).not.toContain('val');
            expect(result.references).toContain('obj');
            expect(result.references).toContain('arr');
            expect(result.references).toContain('process');
        });
    });

    describe('重複の排除', () => {
        test('同じシンボルが複数回参照されても1回だけ含まれる', () => {
            const code = `
function test() {
    g_appData.foo();
    g_appData.bar();
}`;
            const result = extractSymbols(code);
            const count = result.references.filter(r => r === 'g_appData').length;
            expect(count).toBe(1);
        });
    });

    describe('実ファイル解析', () => {
        test('GlobalDefinitions.jsの結果JSONの形式が正しい', () => {
            const filePath = path.join(__dirname, '../../Sources/GlobalDefinitions.js');
            const code = fs.readFileSync(filePath, 'utf-8');
            const result = extractSymbols(code);
            expect(Array.isArray(result.defines)).toBe(true);
            expect(Array.isArray(result.references)).toBe(true);
            expect(result.defines).toContain('g_siteRootPath');
        });
    });
});

describe('side-effect-classifier', () => {
    test('pure-definition: クラス定義と関数定義のみ', () => {
        const code = `
class Foo {}
function bar() {}
const X = 1;`;
        expect(classifySideEffects(code)).toBe('pure-definition');
    });

    test('global-constant: g_プレフィクスのリテラル定数', () => {
        const code = `const g_siteRootPath = "/";
const g_imageRootPath = g_siteRootPath + "images/";`;
        expect(classifySideEffects(code)).toBe('global-constant');
    });

    test('global-mutable-state: let/varのg_変数でnull/false/空文字初期化', () => {
        const code = `let g_appData = null;`;
        expect(classifySideEffects(code)).toBe('global-mutable-state');
    });

    test('global-assignment: g_変数へのnew式代入', () => {
        const code = `
class AppData {}
const g_appData = new AppData();`;
        expect(classifySideEffects(code)).toBe('global-assignment');
    });

    test('global-assignment: g_変数への関数呼び出し代入', () => {
        const code = `const g_data = fetchData();`;
        expect(classifySideEffects(code)).toBe('global-assignment');
    });

    test('global-assignment: ExpressionStatementでのg_変数への代入', () => {
        const code = `var g_appData;
g_appData = new AppData();`;
        expect(classifySideEffects(code)).toBe('global-assignment');
    });

    test('registry-provider: レジストリ登録呼び出し', () => {
        const code = `
class Foo {}
SkillEffectRegistrar.register(Foo);`;
        expect(classifySideEffects(code)).toBe('registry-provider');
    });

    test('prototype-extension: Object.assign(*.prototype, ...)', () => {
        const code = `
class Foo {}
Object.assign(Foo.prototype, { method() {} });`;
        expect(classifySideEffects(code)).toBe('prototype-extension');
    });

    test('initialization-root: 上記以外のトップレベル副作用', () => {
        const code = `
class Foo {}
document.addEventListener("DOMContentLoaded", () => {});`;
        expect(classifySideEffects(code)).toBe('initialization-root');
    });

    test('複数カテゴリに該当する場合は最も重いカテゴリを採用', () => {
        const code = `
class Foo {}
Object.assign(Foo.prototype, { method() {} });
SkillEffectRegistrar.register(Foo);`;
        expect(classifySideEffects(code)).toBe('registry-provider');
    });
});
