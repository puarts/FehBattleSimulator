/**
 * Section 11: テストファイルのESM import化 検証テスト
 *
 * 全テストファイルがESM importを使用していること、
 * グローバル変数への暗黙依存がないことを静的に検証する。
 */
import { describe, it, expect } from 'vitest';
import fs from 'fs';
import path from 'path';

describe('テストファイルのESM import化検証', () => {
    const testsDir = path.resolve(process.cwd(), 'Tests');

    /** テストファイル一覧を取得 */
    function getTestFiles() {
        return fs.readdirSync(testsDir)
            .filter(f => f.endsWith('.test.js'))
            .map(f => path.join(testsDir, f));
    }

    it('全テストファイルにESM import文が存在する', () => {
        for (const file of getTestFiles()) {
            const content = fs.readFileSync(file, 'utf-8');
            const hasImport = /^import /m.test(content);
            expect(hasImport, `${path.basename(file)} should have ESM import statements`).toBe(true);
        }
    });

    it('テスト内でimportなしのグローバルシンボル参照がない', () => {
        const globalSymbols = [
            'g_testHeroDatabase',
            'UnitBuilder',
            'BattleScenarioBuilder',
            'test_DamageCalculator',
            'test_BeginningOfTurnSkillHandler',
            'resetGlobalTestState',
            'test_executeTest',
            'test_UnitManager',
        ];

        // SkillEffect.test.js: DSLノード型同一性に強く依存しており、
        // ESM/連結版のノードクラスが別インスタンスとなるため32テスト失敗する。
        // Section 12（連結方式廃止）で一括対処する。
        // - 連結版依存のinstanceof/constructor同一性アサーションを洗い出す
        // - 構造・振る舞いベースの検証へ移行する
        const excludedFiles = new Set(['SkillEffect.test.js']);

        for (const file of getTestFiles()) {
            const content = fs.readFileSync(file, 'utf-8');
            const basename = path.basename(file);
            if (excludedFiles.has(basename)) continue;
            for (const sym of globalSymbols) {
                // 文字列リテラル内の出現を除外してシンボル使用を検出
                const lines = content.split('\n');
                const isUsed = lines.some(line => {
                    // import文やコメント行は除外
                    if (/^\s*(import |\/\/)/.test(line)) return false;
                    // 文字列リテラル内の出現を除外
                    const stripped = line.replace(/(['"`])(?:(?!\1).)*\1/g, '""');
                    // mod.XXXのようなプロパティアクセスは除外（dynamic importテスト）
                    const withoutPropAccess = stripped.replace(/\bmod\.\w+/g, '');
                    return new RegExp(`\\b${sym}\\b`).test(withoutPropAccess);
                });
                if (isUsed) {
                    // このシンボルが使われている場合、import文にも存在するはず
                    const importRegex = new RegExp(`import.*\\b${sym}\\b.*from`);
                    expect(importRegex.test(content),
                        `${basename} uses '${sym}' but does not import it`).toBe(true);
                }
            }
        }
    });

    it('ESM Read-Only bindings違反がない（import対象変数の再代入なし）', () => {
        for (const file of getTestFiles()) {
            const content = fs.readFileSync(file, 'utf-8');
            const basename = path.basename(file);
            const importedNames = [];
            const importRegex = /^import\s+\{([^}]+)\}\s+from/gm;
            let match;
            while ((match = importRegex.exec(content)) !== null) {
                const names = match[1].split(',').map(n => n.trim().split(/\s+as\s+/).pop().trim());
                importedNames.push(...names);
            }
            for (const name of importedNames) {
                // Check for direct reassignment: name = (not ===, !==, <=, >=)
                const reassignRegex = new RegExp(`^\\s*${name}\\s*=[^=]`, 'm');
                expect(reassignRegex.test(content),
                    `${basename} reassigns imported binding '${name}'`).toBe(false);
            }
        }
    });
});
