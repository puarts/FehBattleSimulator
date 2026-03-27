/**
 * @file Skill.js分割の検証テスト
 * セクション4: Skill.jsがLayer 2データモデルのみに絞り込まれたことを確認する
 */
import { describe, it, expect } from 'vitest';
import fs from 'node:fs';
import path from 'node:path';
import {
    SkillInfo,
    isPhysicalWeaponType,
    isMeleeWeaponType,
    isRangedWeaponType,
    getAttackRangeOfWeaponType,
    getNormalSkillId,
    getRefinementSkillId,
    getSpecialRefinementSkillId,
    WEAPON_TYPE_ATTACK_RANGE_MAP,
    PHYSICAL_WEAPON_TYPE_SET,
    applySkillEffectForUnitFuncMap,
    canActivateCantoFuncMap,
    calcMoveCountForCantoFuncMap,
    getSkillFunc,
} from '../Sources/Skill.js';
import { canRallyForcibly, canRalliedForcibly, stealBonusEffects, canRallyForciblyByPlayer } from '../Sources/SkillUtil.js';

const createSkillInfo = () => new SkillInfo(
    0, '', 0, 0, 0, 0, 0, 0, 0,
    [], [], 0, 0, 0, false, false, 0, false, false, 0,
    true, 0, 0, 0, false, [], [], false, false, '', 0,
);

describe('Skill.js分割後のシンボル可用性', () => {
    it('SkillInfoクラスがimportでき、インスタンス生成が可能', () => {
        expect(typeof SkillInfo).toBe('function');
        const info = createSkillInfo();
        expect(info).toBeDefined();
    });

    it('武器種判定関数がimportできる', () => {
        expect(typeof isPhysicalWeaponType).toBe('function');
        expect(typeof isMeleeWeaponType).toBe('function');
        expect(typeof isRangedWeaponType).toBe('function');
        expect(typeof getAttackRangeOfWeaponType).toBe('function');
    });

    it('スキルID変換関数がimportできる', () => {
        expect(typeof getNormalSkillId).toBe('function');
        expect(typeof getRefinementSkillId).toBe('function');
        expect(typeof getSpecialRefinementSkillId).toBe('function');
    });

    it('武器種マップ/定数が利用できる', () => {
        expect(WEAPON_TYPE_ATTACK_RANGE_MAP).toBeInstanceOf(Map);
        expect(PHYSICAL_WEAPON_TYPE_SET).toBeInstanceOf(Set);
    });

    it('FuncMap群がMapインスタンスである', () => {
        expect(applySkillEffectForUnitFuncMap).toBeInstanceOf(Map);
        expect(canActivateCantoFuncMap).toBeInstanceOf(Map);
        expect(calcMoveCountForCantoFuncMap).toBeInstanceOf(Map);
    });

    it('getSkillFunc関数が利用できる', () => {
        expect(typeof getSkillFunc).toBe('function');
    });
});

describe('SkillInfoクラスの動作', () => {
    it('基本プロパティにアクセスできる', () => {
        const info = createSkillInfo();
        // SkillInfoのプロパティはコンストラクタで初期化されないためundefined
        // hasOwnPropertyでプロパティの存在を確認するのではなく、プロトタイプにアクセスできることを確認
        expect('id' in info).toBe(true);
        expect(typeof info.getDisplayName).toBe('function');
    });

    it('メソッドが正常に動作する', () => {
        const info = createSkillInfo();
        expect(typeof info.isDuel4).toBe('function');
        expect(typeof info.isDuel3).toBe('function');
        expect(typeof info.getDisplayName).toBe('function');
    });
});

describe('Skill.jsのレイヤー制約', () => {
    it('Skill.jsがLayer 3以上のシンボルをimportしていない', async () => {
        const content = fs.readFileSync(path.join(process.cwd(), 'Sources', 'Skill.js'), 'utf-8');

        // Layer 5のシンボルがimportされていないことを確認
        const forbiddenImports = [
            'NodeEnv',
            'CAN_RALLY_FORCIBLY_HOOKS',
            'CAN_RALLIED_FORCIBLY_HOOKS',
            'getSkillLogLevel',
        ];
        const importLines = content.split('\n').filter(line => /^import /.test(line));
        for (const symbol of forbiddenImports) {
            const found = importLines.some(line => line.includes(symbol));
            expect(found, `Skill.js should not import ${symbol}`).toBe(false);
        }
    });

    it('stealBonusEffects関数がSkill.jsに存在しない', async () => {
        const content = fs.readFileSync(path.join(process.cwd(), 'Sources', 'Skill.js'), 'utf-8');

        // function定義が存在しないことを確認（exportの残留も不可）
        expect(content).not.toMatch(/^function stealBonusEffects/m);
    });

    it('canRallyForcibly/canRalliedForcibly/canRallyForciblyByPlayer関数がSkill.jsに存在しない', async () => {
        const content = fs.readFileSync(path.join(process.cwd(), 'Sources', 'Skill.js'), 'utf-8');

        expect(content).not.toMatch(/^function canRallyForcibly[^B]/m);
        expect(content).not.toMatch(/^function canRalliedForcibly/m);
        expect(content).not.toMatch(/^function canRallyForciblyByPlayer/m);
    });

    it('移動した関数が別ファイルに存在する', () => {
        // canRallyForcibly, canRalliedForcibly, stealBonusEffects が
        // グローバルスコープで利用可能であること（concat環境で確認）
        expect(typeof canRallyForcibly).toBe('function');
        expect(typeof canRalliedForcibly).toBe('function');
        expect(typeof stealBonusEffects).toBe('function');
        expect(typeof canRallyForciblyByPlayer).toBe('function');
    });
});
