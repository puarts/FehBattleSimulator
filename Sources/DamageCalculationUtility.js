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
EffectiveFuncTable[EffectiveType.Infantry] = unit => { return unit.moveType === MoveType.Infantry; };

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
EffectiveFuncTable[EffectiveType.Staff] = unit => { return unit.weaponType === WeaponType.Staff; };
EffectiveFuncTable[EffectiveType.Dagger] = unit => { return unit.weaponType === WeaponType.Dagger; };

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
        for (let skillId of atkUnit.enumerateSkills()) {
            switch (skillId) {
                case PassiveA.Duality:
                    switch (defUnit.color) {
                        case ColorType.Red:
                        case ColorType.Blue:
                        case ColorType.Green:
                            if (defUnit.isAdvantageForColorless() && atkUnit.color === ColorType.Colorless) {
                                return TriangleAdvantage.None;
                            } else {
                                return TriangleAdvantage.Advantageous;
                            }
                    }
                    break;
            }
        }
        for (let skillId of defUnit.enumerateSkills()) {
            switch (skillId) {
                case PassiveA.Duality:
                    switch (atkUnit.color) {
                        case ColorType.Red:
                        case ColorType.Blue:
                        case ColorType.Green:
                            if (atkUnit.isAdvantageForColorless() && defUnit.color === ColorType.Colorless) {
                                return TriangleAdvantage.None;
                            } else {
                                return TriangleAdvantage.Disadvantageous;
                            }
                    }
                    break;
            }
        }
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

    /**
     * 速さ比較で追撃可能かどうかを調べます。
     * @param {Unit} atkUnit
     * @param {Unit} defUnit
     * @param {number} evalValue 神速4など追撃条件判定時に補正がかかる場合に使用する。アタッカーにどれくらいの補正をかけるのかを表す(例. 神速4なら-25)。
     */
    static examinesCanFollowupAttack(atkUnit, defUnit, evalValue=0) {
        let atkUnitSpd = atkUnit.getSpdInCombat(defUnit);
        let defUnitSpd = defUnit.getSpdInCombat(atkUnit);
        // TODO: 追撃条件に必要な速さの差についてきちんと検証する
        const spdDifferenceNecessaryForFollowupAttack = 5;
        let d = spdDifferenceNecessaryForFollowupAttack +
            atkUnit.battleContext.additionalSpdDifferenceNecessaryForFollowupAttack +
            evalValue;
        return atkUnitSpd >= defUnitSpd + d;
    }

    /// 戦闘前奥義の回避効果によるダメージ軽減率を取得します。
    static getDodgeDamageReductionRatioForPrecombat(atkUnit, defUnit, percentage = 4, maxPercentage = 40) {
        let diff = defUnit.getEvalSpdInPrecombat() - atkUnit.getEvalSpdInPrecombat();
        return diff > 0 ? Math.min(diff * percentage, maxPercentage) / 100.0 : 0;
    }

    /// 戦闘前奥義の魔防回避効果によるダメージ軽減率を取得します。
    static getResDodgeDamageReductionRatioForPrecombat(atkUnit, defUnit, percentage = 4, maxPercentage = 40) {
        let diff = defUnit.getEvalResInPrecombat() - atkUnit.getEvalResInPrecombat();
        return diff > 0 ? Math.min(diff * percentage, maxPercentage) / 100.0 : 0;
    }

    /// 回避効果によるダメージ軽減率を取得します。
    static getDodgeDamageReductionRatio(atkUnit, defUnit, percentage = 4, maxPercentage = 40) {
        let diff = defUnit.getEvalSpdInCombat(atkUnit) - atkUnit.getEvalSpdInCombat(defUnit);
        return diff > 0 ? Math.min(diff * percentage, maxPercentage) / 100.0 : 0;
    }

    /// 魔防回避効果によるダメージ軽減率を取得します。
    static getResDodgeDamageReductionRatio(atkUnit, defUnit, percentage = 4, maxPercentage = 40) {
        let diff = defUnit.getEvalResInCombat(atkUnit) - atkUnit.getEvalResInCombat(defUnit);
        return diff > 0 ? Math.min(diff * percentage, maxPercentage) / 100.0 : 0;
    }
}
