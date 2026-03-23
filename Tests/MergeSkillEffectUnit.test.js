import { describe, test, expect } from 'vitest';

describe('Section 2: SkillEffectUnit.js統合', () => {
    describe('SkillEffect.jsからの主要シンボルexport', () => {
        test('UNIT, FOE, ALLY等のインスタンスがexportされていること', async () => {
            const mod = await import('../Sources/SkillEffect.js');
            expect(mod.UNIT).toBeDefined();
            expect(mod.FOE).toBeDefined();
            expect(mod.ALLY).toBeDefined();
            expect(mod.ALLIES).toBeDefined();
            expect(mod.FOES).toBeDefined();
            expect(mod.TARGET).toBeDefined();
            expect(mod.TARGET_FOE).toBeDefined();
            expect(mod.TARGET_ALLY).toBeDefined();
            expect(mod.SKILL_OWNER).toBeDefined();
        });

        test('TextUnitNode, TextFoeNode, EnvUnitNode等のクラスがexportされていること', async () => {
            const mod = await import('../Sources/SkillEffect.js');
            expect(typeof mod.TextUnitNode).toBe('function');
            expect(typeof mod.TextFoeNode).toBe('function');
            expect(typeof mod.TextAllyNode).toBe('function');
            expect(typeof mod.TargetAllyNode).toBe('function');
            expect(typeof mod.TextTargetNode).toBe('function');
            expect(typeof mod.SkillOwnerUnitNode).toBe('function');
            expect(typeof mod.UnitsWithinNode).toBe('function');
        });

        test('DSL関数（GRANTS_BONUS, INFLICTS_PENALTY等）がexportされていること', async () => {
            const mod = await import('../Sources/SkillEffect.js');
            expect(typeof mod.GRANTS_BONUS).toBe('function');
            expect(typeof mod.INFLICTS_PENALTY).toBe('function');
            expect(typeof mod.GRANTS_STATUS_EFFECTS).toBe('function');
            expect(typeof mod.INFLICTS_STATUS_EFFECTS).toBe('function');
            expect(typeof mod.CALL_UNIT_FUNC).toBe('function');
        });

        test('UNIT.sameGroup()がUnitsNodeインスタンスを返すこと', async () => {
            const mod = await import('../Sources/SkillEffect.js');
            // ALLIES is defined as UNIT.sameGroup()
            expect(mod.ALLIES).toBeDefined();
            // ALLIES should have evaluate method (UnitsNode)
            expect(typeof mod.ALLIES.evaluate).toBe('function');
        });
    });

    describe('SkillEffectUnit.js（re-exportファイル）からのimport', () => {
        test('re-export経由で同じシンボルがimportできること', async () => {
            const original = await import('../Sources/SkillEffect.js');
            const reexport = await import('../Sources/SkillEffectUnit.js');
            expect(reexport.UNIT).toBe(original.UNIT);
            expect(reexport.FOE).toBe(original.FOE);
            expect(reexport.ALLIES).toBe(original.ALLIES);
            expect(reexport.GRANTS_BONUS).toBe(original.GRANTS_BONUS);
        });
    });

    describe('過渡期の互換性', () => {
        test('re-exportファイルがfilterImportExportで正しく処理される形式であること', () => {
            const { readFileSync } = require('fs');
            const { resolve } = require('path');

            // re-exportファイルの各行がfilterImportExportで除去される形式であることを検証
            const unitContent = readFileSync(
                resolve(process.cwd(), 'Sources/SkillEffectUnit.js'), 'utf-8'
            );
            const fieldContent = readFileSync(
                resolve(process.cwd(), 'Sources/SkillEffectField.js'), 'utf-8'
            );

            for (const content of [unitContent, fieldContent]) {
                const lines = content.split('\n').filter(l => l.trim() !== '');
                for (const line of lines) {
                    // 各行はimportまたはexport {で始まるはず
                    const isImport = /^import /.test(line);
                    const isExport = /^export \{/.test(line);
                    expect(isImport || isExport, `Line not handled by filterImportExport: ${line}`).toBe(true);
                }
            }
        });
    });
});
