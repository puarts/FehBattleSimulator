/// @file
/// @brief DamageCalculationUtility クラスの定義です。

/// ダメージ計算用のユーティリティー関数です。
class DamageCalculationUtility {

    static isEffectiveAttackEnabled(unit, effective) {
        if (unit.canInvalidateSpecifiedEffectiveAttack(effective)) {
            // 特効無効
            return false;
        }

        switch (effective) {
            case EffectiveType.Armor: return unit.moveType == MoveType.Armor;
            case EffectiveType.Cavalry: return unit.moveType == MoveType.Cavalry;
            case EffectiveType.Flying: return unit.moveType == MoveType.Flying;
            case EffectiveType.Infantry: return unit.moveType == MoveType.Infantry;
            case EffectiveType.Dragon:
                return isWeaponTypeBreath(unit.weaponType)
                    || unit.weapon == Weapon.Roputous;
            case EffectiveType.Beast: return isWeaponTypeBeast(unit.weaponType);
            case EffectiveType.Tome: return isWeaponTypeTome(unit.weaponType);
            case EffectiveType.Sword: return unit.weaponType == WeaponType.Sword;
            case EffectiveType.Lance: return unit.weaponType == WeaponType.Lance;
            case EffectiveType.Axe: return unit.weaponType == WeaponType.Axe;
            case EffectiveType.ColorlessBow: return unit.weaponType == WeaponType.ColorlessBow;
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
        if (atkUnit.color == ColorType.Red) {
            if (defUnit.color == ColorType.Green) {
                return TriangleAdvantage.Advantageous;
            }
            if (defUnit.color == ColorType.Blue) {
                return TriangleAdvantage.Disadvantageous;
            }
        }

        if (atkUnit.color == ColorType.Blue) {
            if (defUnit.color == ColorType.Red) {
                return TriangleAdvantage.Advantageous;
            }
            else if (defUnit.color == ColorType.Green) {
                return TriangleAdvantage.Disadvantageous;
            }
        }

        if (atkUnit.color == ColorType.Green) {
            if (defUnit.color == ColorType.Blue) {
                return TriangleAdvantage.Advantageous;
            }
            else if (defUnit.color == ColorType.Red) {
                return TriangleAdvantage.Disadvantageous;
            }
        }

        if (atkUnit.battleContext.isAdvantageForColorless
            || atkUnit.isAdvantageForColorless(defUnit)
        ) {
            if (defUnit.color == ColorType.Colorless) {
                return TriangleAdvantage.Advantageous;
            }
        }

        if (defUnit.battleContext.isAdvantageForColorless
            || defUnit.isAdvantageForColorless(atkUnit)
        ) {
            if (atkUnit.color == ColorType.Colorless) {
                return TriangleAdvantage.Disadvantageous;
            }
        }

        return TriangleAdvantage.None;
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
