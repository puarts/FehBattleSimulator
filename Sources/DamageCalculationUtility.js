/// @file
/// @brief DamageCalculationUtility クラスの定義です。


const TriangleAdvantage = {
    None: 0,
    Advantageous: 1,
    Disadvantageous: 2,
};

/// 相性判定高速化のためのルックアップテーブルです。攻撃者、被攻撃者のColorTypeの整数値を行、列として相性を格納します。
const ColorToTriangleAdvantageTable = [
        // (被攻撃者)赤 青 緑 無
/* 赤 */ TriangleAdvantage.None, TriangleAdvantage.Disadvantageous, TriangleAdvantage.Advantageous, TriangleAdvantage.None,
/* 青 */ TriangleAdvantage.Advantageous, TriangleAdvantage.None, TriangleAdvantage.Disadvantageous, TriangleAdvantage.None,
/* 緑 */ TriangleAdvantage.Disadvantageous, TriangleAdvantage.Advantageous, TriangleAdvantage.None, TriangleAdvantage.None,
/* 無 */ TriangleAdvantage.None, TriangleAdvantage.None, TriangleAdvantage.None, TriangleAdvantage.None,
];


/// ダメージ計算用のユーティリティー関数です。
class DamageCalculationUtility {

    static isEffectiveAttackEnabled(unit, effective) {
        if (unit.canInvalidateSpecifiedEffectiveAttack(effective)) {
            // 特効無効
            return false;
        }

        switch (effective) {
            case EffectiveType.Flying: return unit.moveType === MoveType.Flying;
            case EffectiveType.Armor: return unit.moveType === MoveType.Armor;
            case EffectiveType.Cavalry: return unit.moveType === MoveType.Cavalry;
            case EffectiveType.Dragon:
                return isWeaponTypeBreath(unit.weaponType)
                    || unit.weapon === Weapon.Roputous;
            case EffectiveType.Beast: return isWeaponTypeBeast(unit.weaponType);
            case EffectiveType.Tome: return isWeaponTypeTome(unit.weaponType);
            case EffectiveType.Sword: return unit.weaponType === WeaponType.Sword;
            case EffectiveType.Lance: return unit.weaponType === WeaponType.Lance;
            case EffectiveType.Axe: return unit.weaponType === WeaponType.Axe;
            case EffectiveType.ColorlessBow: return unit.weaponType === WeaponType.ColorlessBow;
            case EffectiveType.Infantry: return unit.moveType === MoveType.Infantry;
        }

        return false;
    }

    static applyDebuffBlade(atkUnit, defUnit) {
        if (defUnit.atkDebuffTotal < 0) { atkUnit.atkSpur += -defUnit.atkDebuffTotal; }
        if (defUnit.spdDebuffTotal < 0) { atkUnit.atkSpur += -defUnit.spdDebuffTotal; }
        if (defUnit.defDebuffTotal < 0) { atkUnit.atkSpur += -defUnit.defDebuffTotal; }
        if (defUnit.resDebuffTotal < 0) { atkUnit.atkSpur += -defUnit.resDebuffTotal; }
    }

    /// 相性有利不利を判定して返します。
    static calcAttackerTriangleAdvantage(atkUnit, defUnit) {
        let tableIndex = atkUnit.color * 4 + defUnit.color;
        return ColorToTriangleAdvantageTable[tableIndex];
    }

    /// 速さ比較で追撃可能かどうかを調べます。
    static examinesCanFollowupAttack(atkUnit, defUnit) {
        var totalSpdAtk = atkUnit.getSpdInCombat(defUnit);
        var totalSpdDef = defUnit.getSpdInCombat(atkUnit);
        return totalSpdAtk >= totalSpdDef + 5;
    }

    /// 戦闘前奥義の回避効果によるダメージ軽減率を取得します。
    static getDodgeDamageReductionRatioForPrecombat(atkUnit, defUnit) {
        let diff = defUnit.getEvalSpdInPrecombat() - atkUnit.getEvalSpdInPrecombat();
        if (diff > 0) {
            let percentage = diff * 4;
            if (percentage > 40) {
                percentage = 40;
            }

            return percentage / 100.0;
        }
        return 0;
    }

    /// 回避効果によるダメージ軽減率を取得します。
    static getDodgeDamageReductionRatio(atkUnit, defUnit) {
        let defUnitSpd = defUnit.getEvalSpdInCombat(atkUnit);
        let atkUnitSpd = atkUnit.getEvalSpdInCombat(defUnit);
        let diff = defUnitSpd - atkUnitSpd;
        if (diff > 0) {
            let percentage = diff * 4;
            if (percentage > 40) {
                percentage = 40;
            }

            return percentage / 100.0;
        }

        return 0;
    }
}
