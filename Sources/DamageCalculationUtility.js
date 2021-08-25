/// @file
/// @brief DamageCalculationUtility クラスの定義です。

/// ダメージ計算用のユーティリティー関数です。
class DamageCalculationUtility {
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
