/// @file
/// @brief DamageCalculationUtility クラスの定義です。

/// ダメージ計算用のユーティリティー関数です。
class DamageCalculationUtility {
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
