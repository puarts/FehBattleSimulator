import { describe, test, expect } from 'vitest';

describe('Build filter', () => {
    // build.mjs の filterImportExport と同じロジック (Keep in sync with scripts/build.mjs)
    function filterImportExport(content) {
        return content
            .split('\n')
            .filter(line => !(/^import /.test(line) || /^export \{/.test(line)))
            .join('\n');
    }

    test('import 行を除去する', () => {
        const input = [
            "import { Foo } from './Bar.js';",
            "import { Weapon, Support } from './SkillConstants.js';",
            "const x = 1;",
        ].join('\n');
        const result = filterImportExport(input);
        expect(result).toBe("const x = 1;");
    });

    test('export { ... } 行を除去する', () => {
        const input = [
            "const x = 1;",
            "export { Foo, Bar };",
            "export { Baz };",
        ].join('\n');
        const result = filterImportExport(input);
        expect(result).toBe("const x = 1;");
    });

    test('通常のコード行を除去しない', () => {
        const lines = [
            "// import something",
            "const s = 'import { X } from ...';",
            "console.log('export { ... }');",
            "  import { indented } from './Foo.js';",
        ];
        const input = lines.join('\n');
        const result = filterImportExport(input);
        expect(result).toBe(input);
    });

    test('フィルタ適用前後で import/export 以外の行数が変わらない', () => {
        const normalLines = [
            "const a = 1;",
            "function foo() {}",
            "class Bar {}",
            "// comment",
        ];
        const input = normalLines.join('\n');
        const result = filterImportExport(input);
        expect(result.split('\n').length).toBe(normalLines.length);
    });

    test('import + コード + export の混合パターンを正しくフィルタする', () => {
        const input = [
            "import { Weapon } from './SkillConstants.js';",
            "import { Unit } from './Unit.js';",
            "",
            "class MyClass {",
            "    constructor() {",
            "        this.value = 1;",
            "    }",
            "}",
            "",
            "export { MyClass };",
        ].join('\n');
        const expected = [
            "",
            "class MyClass {",
            "    constructor() {",
            "        this.value = 1;",
            "    }",
            "}",
            "",
        ].join('\n');
        const result = filterImportExport(input);
        expect(result).toBe(expected);
    });
});
