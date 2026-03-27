# Usage Guide: 巨大ファイル分割リファクタリング

## 概要

DamageCalculatorWrapper.js と Unit.js から独立クラス・関数群を分離し、新規ファイルに配置するリファクタリング。ロジック変更なし、物理分割のみ。

## 新規ファイル一覧

| ファイル | 内容 | 元のファイル |
|---------|------|-------------|
| `Sources/combat/PerformanceProfile.js` | PerformanceProfileクラス | DamageCalculatorWrapper.js |
| `Sources/combat/ScopedTileChanger.js` | ScopedTileChangerクラス | DamageCalculatorWrapper.js |
| `Sources/unit/UnitContext.js` | AttackableUnitInfo, AttackEvaluationContext, AssistableUnitInfo, ActionContext | Unit.js |
| `Sources/unit/UnitUtility.js` | UnitUtil, calcBuffAmount, calcHealAmount, isDebufferTier1/2, isAfflictor, canRefreshTo | Unit.js |

## ロード順序

3系統すべて（`create_tests.sh`, `Deploy.bat`, HTML 7ファイル）で以下の相対順序が維持されている:

```
... → BattleContext → UnitContext → Unit → UnitUtility → UnitManager → ...
... → PerformanceProfile → ScopedTileChanger → DamageCalculatorWrapper → ...
```

PrecombatContext は BattleContext.js 末尾に配置。

## テスト

```bash
# 全テスト実行（312テスト + ESLint）
./run_tests.sh

# 分割関連のテストのみ
./run_tests.sh --testNamePattern "FileSplit|ScopedTileChanger|UnitContext|UnitUtility|PerformanceProfile"
```

## 注意事項

- 新規ソースファイルを追加する場合は `create_tests.sh` の `SOURCE_FILE_NAMES` に登録が必要
- 新規テストファイルは `TEST_FILE_NAMES` に登録が必要
- Deploy.bat と HTML の loadScripts も更新が必要（ロード順序に注意）
