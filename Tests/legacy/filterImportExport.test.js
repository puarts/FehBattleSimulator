import { describe, test, expect } from 'vitest';
import { filterImportExport } from './filterImportExport.js';
import fs from 'node:fs';
import path from 'node:path';

describe('filterImportExport', () => {
    test('単行 import 文を除去する', () => {
        const input = [
            "import { Foo } from './Foo.js';",
            "const x = 1;",
            "import Bar from 'bar';",
        ].join('\n');
        const result = filterImportExport(input);
        expect(result).not.toContain('import');
        expect(result).toContain('const x = 1;');
    });

    test('副作用のみの import 文を除去する', () => {
        const input = [
            "import './setup.js';",
            "const x = 1;",
        ].join('\n');
        const result = filterImportExport(input);
        expect(result).not.toContain('import');
        expect(result).toContain('const x = 1;');
    });

    test('複数行 import 文を除去する', () => {
        const input = [
            "import {",
            "    Foo,",
            "    Bar,",
            "} from './module.js';",
            "const y = 2;",
        ].join('\n');
        const result = filterImportExport(input);
        expect(result).not.toContain('import');
        expect(result).not.toContain('Foo');
        expect(result).not.toContain('Bar');
        expect(result).toContain('const y = 2;');
    });

    test('export { } 行を除去する', () => {
        const input = [
            "const a = 1;",
            "export { a, b, c };",
            "const d = 4;",
        ].join('\n');
        const result = filterImportExport(input);
        expect(result).not.toContain('export');
        expect(result).toContain('const a = 1;');
        expect(result).toContain('const d = 4;');
    });

    test('export キーワードのみ除去し宣言は残す', () => {
        const input = [
            "export function foo() {}",
            "export class Bar {}",
            "export const X = 1;",
            "export let Y = 2;",
            "export var Z = 3;",
        ].join('\n');
        const result = filterImportExport(input);
        expect(result).not.toContain('export');
        expect(result).toContain('function foo() {}');
        expect(result).toContain('class Bar {}');
        expect(result).toContain('const X = 1;');
        expect(result).toContain('let Y = 2;');
        expect(result).toContain('var Z = 3;');
    });

    test('通常のコード行は変更しない', () => {
        const input = [
            "const a = 1;",
            "function hello() { return 'world'; }",
            "// a comment",
            "",
        ].join('\n');
        const result = filterImportExport(input);
        expect(result).toBe(input);
    });

    test('Sources/ ディレクトリに filterImportExport 関連ファイルがない', () => {
        const sourcesDir = path.resolve(import.meta.dirname, '../../Sources');
        const files = fs.readdirSync(sourcesDir);
        const matches = files.filter(f => /filterImportExport/i.test(f));
        expect(matches).toEqual([]);
    });
});
