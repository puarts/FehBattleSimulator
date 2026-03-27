# TDD計画: 巨大ファイル分割リファクタリング

## テスト環境

- **フレームワーク**: Jest (jsdom環境)
- **実行**: `./run_tests.sh` → `create_tests.sh`で全ソース+テストを`All.test.js`に結合 → Jest実行
- **既存テスト**: `DamageCalculator.test.js`, `Performance.test.js`, `CombatFlow.test.js`, `FollowUpAttack.test.js`, `DamageReduction.test.js`, `SpecialCount.test.js`, `StatusEffect.test.js`, `UnitManager.test.js`
- **パターン**: テストファイルは`Tests/`ディレクトリ、`create_tests.sh`の`TEST_FILE_NAMES`で管理

## テスト方針

本リファクタリングは「物理分割のみ・ロジック変更なし」のため、**既存テストの全パスが主要な回帰検出手段**となる。TDDテストは分割固有の問題（シンボルの可視性・ロード順序）を検証する回帰補助チェックとして、各Stepで「存在確認 + 代表挙動1件」を書く。

---

## 3. Phase A: DamageCalculatorWrapper.jsの独立クラス抽出

### 3.3 Step A-1: PerformanceProfile抽出

**実装前に書くテスト**:

```javascript
// Test: PerformanceProfileクラスがグローバルスコープに存在すること
// Test: profile()でコールバックを実行し、経過時間が記録されること（代表挙動）
```

### 3.4 Step A-2: ScopedTileChanger抽出

**実装前に書くテスト**:

```javascript
// Test: ScopedTileChangerクラスがグローバルスコープに存在すること
// （既存のDamageCalculator.test.jsのダメージ計算テストが全パスすることで間接検証）
```

ScopedTileChangerはUnit/Tileインスタンスへの依存が強く、単体での代表挙動テストは既存テストに委ねる。

---

## 4. Phase B: Unit.jsのトップレベル要素抽出

### 4.3 Step B-1: 独立クラス群の抽出

**実装前に書くテスト**:

```javascript
// Test: AttackableUnitInfoクラスがグローバルスコープに存在すること
// Test: AttackEvaluationContextクラスがグローバルスコープに存在すること
// Test: AssistableUnitInfoクラスがグローバルスコープに存在すること
// Test: ActionContextクラスがグローバルスコープに存在すること
// Test: PrecombatContextクラスがグローバルスコープに存在すること（BattleContext.jsからロード）
// Test: new ActionContext()で初期状態が正しいこと — attackableUnitInfos/assistableUnitInfosが空配列（代表挙動）
```

### 4.4 Step B-2: ユーティリティ関数群の抽出

**実装前に書くテスト**:

```javascript
// Test: UnitUtilクラスがグローバルスコープに存在すること
// Test: calcBuffAmount関数がグローバルスコープに存在すること
// Test: calcHealAmount関数がグローバルスコープに存在すること
// Test: isDebufferTier1関数がグローバルスコープに存在すること
// Test: isDebufferTier2関数がグローバルスコープに存在すること
// Test: isAfflictor関数がグローバルスコープに存在すること
// Test: canRefreshTo関数がグローバルスコープに存在すること
// Test: canRefreshTo(targetUnit)が再行動可能なユニットに対してtrueを返すこと（代表挙動）
// （既存のUnitManager.test.jsおよびDamageCalculator.test.jsが全パスすることで間接検証）
```

---

## 全体の回帰テスト

各Step完了後、既存テストスイート全体（`./run_tests.sh`）を実行する。既存テストがカバーする範囲:

- **DamageCalculator.test.js**: ダメージ計算のE2Eテスト → Phase A（PerformanceProfile, ScopedTileChanger）の間接検証
- **CombatFlow.test.js / FollowUpAttack.test.js**: 戦闘フロー → DamageCalculatorWrapper経由の依存検証
- **UnitManager.test.js**: ユニット管理 → Phase B（UnitContext, UnitUtility）の間接検証
- **StatusEffect.test.js**: ステータス効果 → isAfflictor等のユーティリティ間接検証
