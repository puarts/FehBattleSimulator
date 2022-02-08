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

const EffectiveFuncTable = {};
EffectiveFuncTable[EffectiveType.None] = unit => { return false; };
EffectiveFuncTable[EffectiveType.Flying] = unit => { return unit.moveType === MoveType.Flying; };
EffectiveFuncTable[EffectiveType.Armor] = unit => { return unit.moveType === MoveType.Armor; };
EffectiveFuncTable[EffectiveType.Cavalry] = unit => { return unit.moveType === MoveType.Cavalry; };
EffectiveFuncTable[EffectiveType.Dragon] = unit => {
    return isWeaponTypeBreath(unit.weaponType)
        || unit.weapon === Weapon.Roputous;
};
EffectiveFuncTable[EffectiveType.Beast] = unit => { return isWeaponTypeBeast(unit.weaponType); };
EffectiveFuncTable[EffectiveType.Tome] = unit => { return isWeaponTypeTome(unit.weaponType); };
EffectiveFuncTable[EffectiveType.Sword] = unit => { return unit.weaponType === WeaponType.Sword; };
EffectiveFuncTable[EffectiveType.Lance] = unit => { return unit.weaponType === WeaponType.Lance; };
EffectiveFuncTable[EffectiveType.Axe] = unit => { return unit.weaponType === WeaponType.Axe; };
EffectiveFuncTable[EffectiveType.ColorlessBow] = unit => { return unit.weaponType === WeaponType.ColorlessBow; };
EffectiveFuncTable[EffectiveType.Infantry] = unit => { return unit.moveType === MoveType.Infantry; };

/// ダメージ計算用のユーティリティー関数です。
class DamageCalculationUtility {
    /**
     * 特効が指定したユニット対して有効化調べます。
     * @param  {Unit} unit
     * @param  {EffectiveType} effective
     */
    static isEffectiveAttackEnabled(unit, effective) {
        if (unit.canInvalidateSpecifiedEffectiveAttack(effective)) {
            // 特効無効
            return false;
        }

        let func = EffectiveFuncTable[effective];
        return func !== undefined && func(unit);
    }

    static applyDebuffBlade(atkUnit, defUnit) {
        if (defUnit.atkDebuffTotal < 0) { atkUnit.atkSpur += -defUnit.atkDebuffTotal; }
        if (defUnit.spdDebuffTotal < 0) { atkUnit.atkSpur += -defUnit.spdDebuffTotal; }
        if (defUnit.defDebuffTotal < 0) { atkUnit.atkSpur += -defUnit.defDebuffTotal; }
        if (defUnit.resDebuffTotal < 0) { atkUnit.atkSpur += -defUnit.resDebuffTotal; }
    }

    /// 相性有利不利を判定して返します。
    static calcAttackerTriangleAdvantage(atkUnit, defUnit) {
        // 無色に有利な効果を持つ場合
        if (atkUnit.isAdvantageForColorless() && defUnit.color === ColorType.Colorless) {
            return TriangleAdvantage.Advantageous;
        }

        if (defUnit.isAdvantageForColorless(atkUnit) && atkUnit.color === ColorType.Colorless) {
            return TriangleAdvantage.Disadvantageous;
        }

        // 通常の有利判定
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
    static getDodgeDamageReductionRatioForPrecombat(atkUnit, defUnit, percentage = 4, maxPercentage = 40) {
        let diff = defUnit.getEvalSpdInPrecombat() - atkUnit.getEvalSpdInPrecombat();
        return diff > 0 ? Math.min(diff * percentage, maxPercentage) / 100.0 : 0;
    }

    /// 回避効果によるダメージ軽減率を取得します。
    static getDodgeDamageReductionRatio(atkUnit, defUnit, percentage = 4, maxPercentage = 40) {
        let diff = defUnit.getEvalSpdInCombat(atkUnit) - atkUnit.getEvalSpdInCombat(defUnit);
        return diff > 0 ? Math.min(diff * percentage, maxPercentage) / 100.0 : 0;
    }
}
