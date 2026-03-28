# DamageCalculatorWrapper.js 分割 — TDD Plan

## テスト環境

- **フレームワーク**: Jest（jsdom環境）
- **テスト実行**: `create_tests.sh` がソース＋テストを `All.test.js` に連結 → Jest で実行
- **既存パターン**: `describe`/`test` 構文、`UnitBuilder`/`BattleScenarioBuilder` カスタムビルダー
- **新規テストファイル**: `Tests/DamageCalculatorWrapperSplit.test.js`（`create_tests.sh` の `TEST_FILE_NAMES` に追加）

---

## Phase 1: 準備と検証基盤

### テスト: constructor smoke test
- Test: DamageCalculatorWrapper がエラーなくインスタンス化できること
- Test: インスタンスが DamageCalculator, PostCombatSkillHander, PerformanceProfile の内部インスタンスを保持していること

### テスト: public API names assertion
- Test: DamageCalculatorWrapper.prototype が全 public メソッド名（36個）を持つことを確認
- Test: 分割前のメソッド名一覧と分割後のメソッド名一覧が一致すること

### テスト: definePrototypeMethods ヘルパー
- Test: definePrototypeMethods でメソッドを追加すると、インスタンスから呼び出せること
- Test: 追加されたメソッドが non-enumerable であること（`Object.keys(prototype)` に含まれない）
- Test: 同名メソッドを二重に追加すると Error がスローされること

---

## Phase 2: スキル効果辞書初期化の分離

### テスト: init メソッドの移動検証
- Test: 分割後に `__init__applySkillEffectForAtkUnitFuncDict` がインスタンスメソッドとして存在すること
- Test: 分割後に `__init__applySkillEffectForDefUnitFuncDict` がインスタンスメソッドとして存在すること
- Test: 分割後に `__init__applySkillEffectForUnitFuncDict` がインスタンスメソッドとして存在すること
- Test: 分割後に `__init__applySpecialSkillEffect` がインスタンスメソッドとして存在すること

### テスト: 辞書初期化の正常動作
- Test: constructor 完了後に `_applySkillEffectForAtkUnitFuncDict` にエントリが登録されていること
- Test: constructor 完了後に `_applySkillEffectForDefUnitFuncDict` にエントリが登録されていること
- Test: constructor 完了後に `_applySkillEffectForUnitFuncDict` にエントリが登録されていること

### テスト: self クロージャの動作
- Test: 辞書に登録された関数が `self` 経由でユーティリティメソッド（`__isThereAllyInSpecifiedSpaces` 等）を呼べること

### テスト: 既存テスト全パス
- `./run_tests.sh` で全テスト + ESLint パス

---

## Phase 3: スキル効果適用の分離

### テスト: メソッド存在確認
- Test: `__applySkillEffectForUnit` がインスタンスメソッドとして存在すること
- Test: `____applySkillEffectForUnit` がインスタンスメソッドとして存在すること
- Test: `__applySkillEffectRelatedToEnemyStatusEffects` がインスタンスメソッドとして存在すること

### テスト: スキル効果適用の正常動作
- Test: 既存のスキル効果テスト（DamageCalculator.test.js）が全パスすること

### テスト: 既存テスト全パス
- `./run_tests.sh` で全テスト + ESLint パス

---

## Phase 4: Spur系の分離

### テスト: メソッド存在確認
- Test: `updateAllUnitSpur` がインスタンスメソッドとして存在し呼び出せること（public API）
- Test: `updateUnitSpur` がインスタンスメソッドとして存在し呼び出せること（public API）
- Test: `__updateUnitSpur` がインスタンスメソッドとして存在すること

### テスト: Spur計算の正常動作
- Test: 既存の紋章バフ関連テストが全パスすること

### テスト: 既存テスト全パス
- `./run_tests.sh` で全テスト + ESLint パス

---

## Phase 5: 追撃/反撃/ダメージ軽減の分離

### テスト: メソッド存在確認
- Test: `canCounterAttack` がインスタンスメソッドとして存在し呼び出せること（public API）
- Test: `getFollowupAttackPriorityForBoth` がインスタンスメソッドとして存在し呼び出せること（public API）

### テスト: 追撃/反撃の正常動作
- Test: 既存の追撃・反撃関連テスト（CombatFlow.test.js等）が全パスすること

### テスト: 既存テスト全パス
- `./run_tests.sh` で全テスト + ESLint パス

---

## Phase 6: 最終検証

### テスト: 全体統合
- Test: public API names assertion が分割前と同一であること
- Test: 全既存テストがパスすること
- Test: ESLint がパスすること
- Test: ブラウザで console エラーなく戦闘が実行できること（手動確認）
