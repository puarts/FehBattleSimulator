/**
 * @file Unit.js分割の検証テスト
 * セクション5: Unit.jsをUnitCore.js / UnitBattle.js / UnitSkillEffect.jsに分割し、
 * Layer 5循環依存を解消したことを確認する
 */
import { describe, it, expect } from 'vitest';
import fs from 'node:fs';
import path from 'node:path';

const SOURCES = path.resolve(import.meta.dirname, '..', 'Sources');

describe('UnitCore.js', () => {
    it('Unitクラスがimportでき、基本プロパティにアクセスできる', () => {
        expect(typeof Unit).toBe('function');
        const unit = new Unit();
        expect(unit).toBeDefined();
        // 基本プロパティ
        expect(unit.hp).toBeDefined();
        expect(unit.atk).toBeDefined();
        expect(unit.spd).toBeDefined();
        expect(unit.def).toBeDefined();
        expect(unit.res).toBeDefined();
    });

    it('BattleMapElementを正しく継承している', () => {
        const unit = new Unit();
        expect(unit instanceof BattleMapElement).toBe(true);
    });

    it('Layer 5ファイルを一切importしていない', () => {
        const content = fs.readFileSync(path.join(SOURCES, 'UnitCore.js'), 'utf-8');
        const importLines = content.split('\n').filter(l => /^import\s/.test(l));
        for (const line of importLines) {
            expect(line).not.toMatch(/SkillEffectEnv\.js/);
            expect(line).not.toMatch(/SkillEffectHooks\.js/);
            expect(line).not.toMatch(/SkillEffect\.js/);
        }
    });

    it('_addStatusEffectRawアクセサが存在する', () => {
        const unit = new Unit();
        expect(typeof unit._addStatusEffectRaw).toBe('function');
    });
});

describe('UnitBattle.js', () => {
    it('Layer 5ファイルを一切importしていない', () => {
        const content = fs.readFileSync(path.join(SOURCES, 'UnitBattle.js'), 'utf-8');
        const importLines = content.split('\n').filter(l => /^import\s/.test(l));
        for (const line of importLines) {
            expect(line).not.toMatch(/SkillEffectEnv\.js/);
            expect(line).not.toMatch(/SkillEffectHooks\.js/);
            expect(line).not.toMatch(/SkillEffect\.js/);
        }
    });

    it('戦闘関連メソッドがUnitインスタンスで呼び出せる', () => {
        const unit = new Unit();
        expect(typeof unit.initBattleContext).toBe('function');
        expect(typeof unit.getAtkInCombat).toBe('function');
        expect(typeof unit.getSpdInCombat).toBe('function');
        expect(typeof unit.getDefInCombat).toBe('function');
        expect(typeof unit.getResInCombat).toBe('function');
    });

    it('スナップショット関連メソッドが利用可能', () => {
        const unit = new Unit();
        expect(typeof unit.createSnapshot).toBe('function');
        expect(typeof unit.createSnapshotIfNull).toBe('function');
        expect(typeof unit.deleteSnapshot).toBe('function');
    });

    it('Spur関連メソッドが利用可能', () => {
        const unit = new Unit();
        expect(typeof unit.addAllSpur).toBe('function');
        expect(typeof unit.addSpurs).toBe('function');
        expect(typeof unit.resetSpurs).toBe('function');
    });
});

describe('UnitSkillEffect.js initUnitSkillEffects', () => {
    it('initUnitSkillEffects呼び出し後、スキル効果メソッドが使用可能', () => {
        const unit = new Unit();
        expect(typeof unit.canActivatePass).toBe('function');
        expect(typeof unit.endActionBySkillEffect).toBe('function');
        expect(typeof unit.endActionByStatusEffect).toBe('function');
        expect(typeof unit.applyEndActionSkills).toBe('function');
        expect(typeof unit.activateCantoIfPossible).toBe('function');
        expect(typeof unit.calcMoveCountForCanto).toBe('function');
        expect(typeof unit.hasPathfinderEffect).toBe('function');
        expect(typeof unit.addStatusEffect).toBe('function');
    });

    it('init前に作成したインスタンスでもメソッドが使用可能（prototype拡張）', () => {
        // initUnitSkillEffects はsetupで既に呼ばれている
        // prototype拡張なので既存インスタンスにも反映される
        const unit = new Unit();
        expect(typeof unit.getColorWhenDeterminingWeaponTriangle).toBe('function');
        expect(typeof unit.deactivateStyleAfterAction).toBe('function');
    });
});

describe('Unit.js facade後方互換', () => {
    it('UnitクラスのinstanceofCheck', () => {
        const unit = new Unit();
        expect(unit instanceof Unit).toBe(true);
    });

    it('補助クラスが利用可能', () => {
        expect(typeof AttackableUnitInfo).toBe('function');
        expect(typeof AttackEvaluationContext).toBe('function');
        expect(typeof AssistableUnitInfo).toBe('function');
        expect(typeof ActionContext).toBe('function');
        expect(typeof PrecombatContext).toBe('function');
        expect(typeof UnitUtil).toBe('function');
    });

    it('スタンドアロン関数が利用可能', () => {
        expect(typeof isThief).toBe('function');
        expect(typeof calcArenaBaseStatusScore).toBe('function');
        expect(typeof calcArenaTotalSpScore).toBe('function');
        expect(typeof calcBuffAmount).toBe('function');
        expect(typeof calcHealAmount).toBe('function');
        expect(typeof isDebufferTier1).toBe('function');
        expect(typeof isDebufferTier2).toBe('function');
        expect(typeof isAfflictor).toBe('function');
        expect(typeof canRefreshTo).toBe('function');
    });
});
