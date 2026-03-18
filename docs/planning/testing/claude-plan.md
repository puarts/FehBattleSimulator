# FEH Battle Simulator — 大規模テスト計画 実装プラン

## 1. 背景と目標

FEH Battle Simulatorは現在188テスト（6ファイル）で動作しているが、スキル実装の急増に対してテストカバレッジが不足している。本計画では以下を達成する:

- テスト数を500+に拡大（内訳: スキルリグレッション ~300、戦闘ロジック ~120、DSLノード ~50、インフラ ~30）
- AIエージェント（Claude Code等）が修正後に関連テストのみ実行可能な分割構造
- カバレッジ測定とCIレポート
- パフォーマンス回帰検知
- 問題頻発エリアの重点テスト

### 現在のテスト基盤

- **結合方式**: `create_tests.sh`が44ソースファイル+テストファイルを結合し`All.test.js`を生成、Jestで実行
- **既存ヘルパー**: `test_HeroDatabase`（英雄名からユニット生成）、`test_DamageCalculator`（戦闘計算ラッパー）、`test_BeginningOfTurnSkillHandler`（ターン開始処理ラッパー）
- **検証方式**: リグレッションテスト（現在の動作を「正」として固定）
- **実行時間**: 約6秒、目標上限30秒

---

## 2. テスト分割実行アーキテクチャ

### 設計方針

AIエージェントがスキル実装後に関連テストのみ実行できることが最重要要件。`create_tests.sh`の結合方式を維持しつつ、カテゴリ別の結合ファイル生成をサポートする。

### 分割構造

`create_tests.sh`を拡張し、引数でカテゴリを指定可能にする:

```
./create_tests.sh              # 全テスト結合 → All.test.js（既存動作）
./create_tests.sh skill        # スキルテストのみ → All.test.js
./create_tests.sh combat       # 戦闘ロジックテストのみ → All.test.js
./create_tests.sh dsl          # DSLノードテストのみ → All.test.js
./create_tests.sh infra        # インフラテストのみ → All.test.js
```

ソースファイルの結合はすべてのカテゴリで共通（全44ファイル+テストユーティリティ+テストグローバル）。テストファイルのみカテゴリで選択する。

### カテゴリ定義

- **skill**: 特定スキルIDの効果を検証するリグレッションテスト
- **combat**: 戦闘メカニクス（追撃、奥義、ダメージ軽減、戦闘フロー等）のテスト。スキルIDに依存しない汎用的な戦闘ロジック検証
- **dsl**: DSLノードの単体評価・合成テスト
- **infra**: ユーティリティ、ヘルパー、パフォーマンスベンチマーク

### カテゴリマッピング実装

`create_tests.sh`内でcase文によるカテゴリ→テストファイルリストのマッピングを実装:

```bash
case "$1" in
  skill)
    TEST_FILES=("SkillRegression.test.js")
    ;;
  combat)
    TEST_FILES=("DamageCalculator.test.js" "BeginningOfTurnSkillHandler.test.js"
                "CombatFlow.test.js" "SpecialCount.test.js" "DamageReduction.test.js"
                "FollowUpAttack.test.js" "StatusEffect.test.js")
    ;;
  dsl)
    TEST_FILES=("SkillEffect.test.js" "GetRequirements.test.js" "DslNode.test.js")
    ;;
  infra)
    TEST_FILES=("UnitManager.test.js" "SimpleUtility.test.js"
                "Performance.test.js" "TestHelper.test.js")
    ;;
  *)
    TEST_FILES=("${TEST_FILE_NAMES[@]}")  # 全テスト（既存動作）
    ;;
esac
```

### run_tests.sh連携

**重要**: `run_tests.sh`は内部で`create_tests.sh`を無条件呼び出しする。カテゴリ引数を`run_tests.sh`に渡した場合、`create_tests.sh`にも転送する必要がある。

```
./run_tests.sh                  # 全テスト + ESLint（CI用）
./run_tests.sh skill            # スキルテストのみ（ESLintスキップ、AIエージェント用）
./run_tests.sh combat           # 戦闘テストのみ
```

カテゴリ指定時はESLintをスキップし、テスト実行のみ行う（高速化）。

### AIエージェント向けガイドライン

AIエージェント（Claude Code等）がテスト駆動で実装する場合:
- **テスト実行**: `./run_tests.sh [category]`を使用し、エラー出力のみを読み取る
- **禁止**: 結合された`All.test.js`を直接読み込まない（コンテキストウィンドウの浪費）
- **テスト追加**: 個別のテストファイル（`Tests/*.test.js`）を直接編集
- **カテゴリ活用**: スキル実装後は`./run_tests.sh skill`で関連テストのみ実行

### テストファイル分類

```
Tests/
  # 既存（変更なし）
  DamageCalculator.test.js       → combat カテゴリ
  SkillEffect.test.js            → dsl カテゴリ
  BeginningOfTurnSkillHandler.test.js → combat カテゴリ
  GetRequirements.test.js        → dsl カテゴリ
  UnitManager.test.js            → infra カテゴリ
  SimpleUtility.test.js          → infra カテゴリ

  # 新規追加
  SkillRegression.test.js        → skill カテゴリ（スキルリグレッション）
  CombatFlow.test.js             → combat カテゴリ（戦闘フロー）
  SpecialCount.test.js           → combat カテゴリ（奥義カウント）
  DamageReduction.test.js        → combat カテゴリ（ダメージ軽減）
  FollowUpAttack.test.js         → combat カテゴリ（追撃判定）
  StatusEffect.test.js           → combat カテゴリ（ステータス効果）
  DslNode.test.js                → dsl カテゴリ（DSLノード単体）
  Performance.test.js            → infra カテゴリ（パフォーマンス）
  TestHelper.test.js             → infra カテゴリ（ヘルパー自体のテスト）
```

### create_tests.sh への登録

新規9テストファイルを`TEST_FILE_NAMES`配列に追加:

```bash
TEST_FILE_NAMES=(
  # 既存
  "DamageCalculator.test.js"
  "UnitManager.test.js"
  "BeginningOfTurnSkillHandler.test.js"
  "SkillEffect.test.js"
  "GetRequirements.test.js"
  "SimpleUtility.test.js"
  # 新規
  "SkillRegression.test.js"
  "CombatFlow.test.js"
  "SpecialCount.test.js"
  "DamageReduction.test.js"
  "FollowUpAttack.test.js"
  "StatusEffect.test.js"
  "DslNode.test.js"
  "Performance.test.js"
  "TestHelper.test.js"
)
```

---

## 3. テストヘルパー拡充

### 3.1 UnitBuilder クラス

既存の`test_HeroDatabase`を拡張する形で、フルーエントAPIのビルダーを導入する。`TestUtilities.js`に追加。

```javascript
class UnitBuilder {
    // 英雄名またはデフォルトユニットから開始
    static fromHero(heroName, groupId)
    static default(groupId)

    // 固定ステータスのテスト用ダミーユニット（スキルロジックテスト用）
    static createDummy(groupId, { hp, atk, spd, def, res } = { hp: 50, atk: 50, spd: 50, def: 50, res: 50 })

    // ステータス設定
    withStats({ hp, atk, spd, def, res })
    withAtk(value)
    withSpd(value)
    withDef(value)
    withRes(value)

    // スキル設定
    withWeapon(weaponId)
    withSupport(supportId)
    withSpecial(specialId)
    withPassiveA(passiveAId)
    withPassiveB(passiveBId)
    withPassiveC(passiveCId)
    withPassiveS(passiveSId)
    withPassiveX(passiveXId)

    // 位置設定
    atPosition(x, y)

    // 状態設定
    withHpPercent(percent)
    withSpecialCount(count)
    withBonuses({ atk, spd, def, res })
    withPenalties({ atk, spd, def, res })

    // ビルド
    build()  // → Unit
}
```

**設計ポイント**:
- `fromHero`は内部で`g_testHeroDatabase.createUnit`を呼ぶ
- `default`は`test_createDefaultUnit`をラップ
- `createDummy`は固定ステータス（デフォルト全50）のユニットを生成。スキルロジックテストではこちらを標準使用し、英雄のベースステータス変更によるテスト破壊を防ぐ
- 既存テストは変更不要、新規テストでUnitBuilderを使用
- スキル設定後は`g_testHeroDatabase.updateUnitSkillInfo(unit)`を呼び出してステータスを再計算

### 3.2 BattleScenarioBuilder クラス

戦闘シナリオを宣言的に記述するヘルパー。ビルド済みのUnitを受け取るシンプルなAPI。

```javascript
class BattleScenarioBuilder {
    // ユニット設定（ビルド済みUnitを受け取る）
    withAttacker(unit)
    withDefender(unit)
    addAlly(unit)
    addFoe(unit)

    // 戦闘設定
    onTurn(turnNumber)

    // 実行
    execute()                 // → CombatResult
    executeBeginningOfTurn()  // → ターン開始後の状態
}
```

**内部実装の要点**:
- `execute()`は内部で`test_DamageCalculator`を生成
- ユニットを`calculator.unitManager`に登録（グループID適切に設定）
- 味方/敵ユニットの位置が重複しないよう自動配置
- `g_appData`を`calculator.unitManager`に設定
- `updateAllUnitSpur()`呼び出し後に`calcDamage()`実行

### 3.3 グローバル状態管理

テスト間の状態汚染を防ぐため、グローバル状態のリセット戦略を導入:

```javascript
// 各テストファイルのbeforeEachで使用
function resetGlobalTestState() {
    g_appData = null;
    // その他のグローバル状態リセット
}
```

**対象グローバル変数**:
- `g_appData`: テスト間で最も漏洩しやすい。各describe/beforeEachでリセット
- `g_testHeroDatabase`: 読み取り専用のため、リセット不要
- スキル登録: ソースファイル読み込み時に1回登録、テスト中の動的登録は基本的に行わない

**FEH固有の状態漏洩リスク**:
- ユニットの状態付与（バフ/デバフ/パニック等）: BattleScenarioBuilder内で毎回新規ユニットを使用することで回避
- 奥義カウントの現在値: ユニット生成時に初期化されるため、ユニット再利用しなければ問題なし
- `resetGlobalTestState()`はg_appDataのnull化に加え、テスト中に変更される可能性のあるグローバル変数をリストアップし順次追加する

BattleScenarioBuilderは内部で状態を管理し、execute()後にクリーンアップを行う。

### 3.4 リグレッションテストヘルパー

現在の動作を記録し、将来の変更で回帰を検出するユーティリティ。

```javascript
class RegressionTestHelper {
    /**
     * スキル付きユニット同士の戦闘結果からアサーション対象値を抽出
     * CombatResultの主要プロパティを検証用オブジェクトに変換
     */
    static extractCombatSnapshot(combatResult)

    /**
     * ユニットのステータス状態をスナップショットとして取得
     */
    static extractUnitSnapshot(unit)
}
```

---

## 4. カバレッジ測定導入

### 4.1 結合方式との互換性

**制約**: `create_tests.sh`による結合方式では、Jestのファイル別カバレッジ（`collectCoverageFrom`）は機能しない。Jestはモジュール/インポート単位でカバレッジを計測するため、結合された`All.test.js`のみがレポート対象となる。

**対応方針**: `All.test.js`全体の行カバレッジとして測定を開始する。ファイル別の詳細なカバレッジは将来のモジュール化時に対応。現時点ではテスト数と行カバレッジ率で進捗を追跡する。

### 4.2 Jest設定変更

`jest.config.js`に以下を追加:

- `collectCoverage`: CI環境時のみ有効（`process.env.CI`で判定）
- `coverageDirectory`: `coverage`
- `coverageReporters`: `['text-summary', 'lcov', 'json-summary']`

**注意**: `collectCoverageFrom`はAll.test.jsの結合方式では無効なため設定しない。

ローカル開発時は`--coverage`フラグで明示的に有効化。

### 4.3 初期閾値

初期は閾値を設定しない（現在のカバレッジ値が不明なため）。Phase 1完了後にベースラインを測定し、その値の90%を最初の閾値として設定する。

段階的引き上げスケジュール:
1. Phase 1完了: ベースライン測定、閾値は警告のみ
2. Phase 2完了: スキルテスト追加後の値を新閾値に、ビルド失敗を有効化
3. Phase 3完了: 最終閾値設定

### 4.4 GitHub Actions連携

既存の`.github/workflows/jekyll.yml`に追加:
- `test-script`パラメータで`./create_tests.sh && npx jest --coverage`を指定（結合方式への対応）
- カバレッジレポートのPRコメント機能は結合方式との互換性を検証後に導入
- `coverage/`ディレクトリを`.gitignore`に追加

---

## 5. パフォーマンス回帰テスト

### 5.1 ベンチマーク対象

**主要ベンチマーク（ユーザー指定）**:
- 全英雄戦闘計算: ベースライン 238ms（「追跡対象の計算」ログ値）

**追加ベンチマーク候補（リサーチ結果）**:
- ターン開始スキル適用（全英雄）: BeginningOfTurnSkillHandler全体の処理時間
- DSLノード評価: 複雑な条件ツリーの評価時間
- ユニット初期化: test_HeroDatabaseによる全英雄生成

### 5.2 実装方式

既存の`test_executeTest`/`ScopedStopwatch`パターンを活用。`Performance.test.js`に集約。

```javascript
describe('Performance benchmarks', () => {
    test('全英雄戦闘計算は1200ms以内', () => {
        // ウォームアップ（V8 JIT最適化を促す、Flaky test回避）
        for (let i = 0; i < 5; i++) runCalculation();

        // 本計測
        const start = performance.now();
        runCalculation();
        const duration = performance.now() - start;
        expect(duration).toBeLessThan(CI ? 1200 : 480);
    });
    test('ターン開始処理は1000ms以内', () => { ... });
});
```

**ウォームアップの重要性**: V8エンジンのJITコンパイル特性上、初回実行は2回目以降より大幅に遅い。計測前に5回のウォームアップ実行を行い、JIT最適化後の安定した値で閾値判定する。

### 5.3 CI環境での閾値

**重要**: GitHub Actionsの共有ランナーはローカル環境の3〜5倍遅い場合がある。閾値はベースラインの5倍以上で設定する。

- ローカルベースライン 238ms → CI閾値 1200ms
- CI環境変数（`process.env.CI`）で閾値を切り替え:
  - ローカル: ベースラインの2倍
  - CI: ベースラインの5倍

### 5.4 CI統合

パフォーマンステストはinfraカテゴリに含め、全テスト実行時に走る。閾値超過時はテスト失敗となる。

---

## 6. スキルリグレッションテスト

### 6.1 テスト構造

`SkillRegression.test.js`に、スキルIDごとのdescribeブロックで構造化。

```
describe('Weapon skills', () => {
    describe('SkillImpl202601 weapons', () => {
        test('HeroicMaltet: grants Atk/Spd/Def/Res+10, deals +25 damage', () => { ... });
        ...
    });
});

describe('Passive A skills', () => { ... });
describe('Passive B skills', () => { ... });
```

### 6.2 優先度

1. **最優先**: SkillImpl202601.jsの全スキル（最新・最複雑）
2. **次点**: SkillImpl202501.jsの主要スキル
3. **低優先**: SkillImpl202408.js以前（コード確認で必要に応じてピックアップ）

### 6.3 テストテンプレート

新規スキル実装時に同時にテストを書けるテンプレートパターンを確立:

```javascript
// テンプレート: 戦闘中スキルテスト
{
    const skillId = Weapon.NewWeaponName;
    test(`${getSkillName(skillId)}: [効果の説明]`, () => {
        // スキルロジックテストにはcreateDummyを使用（英雄ベースステータス変更の影響を受けない）
        const attacker = UnitBuilder.createDummy(UnitGroupType.Ally)
            .withWeapon(skillId)
            .build();
        const defender = UnitBuilder.createDummy(UnitGroupType.Enemy)
            .build();
        const result = new BattleScenarioBuilder()
            .withAttacker(attacker)
            .withDefender(defender)
            .execute();
        // アサーション
    });
}
```

### 6.4 リグレッション検証方式

各テストは「現在の動作を正とする」方式:
1. テスト作成時に現在のシミュレータで実行
2. 得られた結果値をexpect値として記録
3. 将来の変更で値が変わったらテスト失敗 → 意図的変更か回帰かを判断

---

## 7. 戦闘ロジックテスト — 重点エリア

### 7.1 奥義カウント変動 (SpecialCount.test.js)

戦闘中の奥義カウント変動は最も問題が発生しやすいエリア。テスト対象:

- **基本カウント減少**: 攻撃時の通常カウント減少
- **カウント加速**: Guard Bearing, Heavy Blade等のカウント加速スキル
- **カウント減速**: Guard系スキルによる敵のカウント遅延
- **カウント加速 vs 減速**: 両方が同時に適用された場合の優先度
- **特殊なカウント変動**: ターン開始時のカウント変動（Pulse系）、戦闘前のカウント変動
- **カウント0到達時の発動**: 攻撃奥義・防御奥義の発動タイミング

### 7.2 追撃判定 (FollowUpAttack.test.js)

- **速さ基準追撃**: 速さ差5以上で追撃
- **絶対追撃**: Quick Riposte, Bold Fighter等
- **追撃不可**: Wary Fighter等
- **絶対追撃 vs 追撃不可**: 両方適用時のキャンセル挙動
- **追撃順序**: 速さ基準の攻撃順序

### 7.3 ダメージ軽減 (DamageReduction.test.js)

- **割合軽減**: ○%軽減の計算
- **固定軽減**: 固定値でダメージを軽減
- **軽減の累積**: 複数の軽減効果の積み重ね順序（乗算）
- **軽減貫通**: ダメージ軽減を無視するスキル
- **奥義によるダメージ軽減**: 防御奥義の軽減

### 7.4 戦闘フロー (CombatFlow.test.js)

- **再行動 (Grant another action)**: Canto系、再移動スキルの発動条件と効果
- **祈り (Miracle)**: HP1で耐える効果、1回限り制約
- **回復不可**: Deep Wounds等の回復無効化
- **反撃不可/反撃可能**: Sweep系 vs 遠距離反撃
- **戦闘前スキル**: AoE奥義等
- **戦闘後スキル**: 回復、デバフ付与

### 7.5 ステータス効果 (StatusEffect.test.js)

- **暗闘 (Feud)**: 特定条件でのバフ無効化（既存テストあり、拡充）
- **スタイル**: スタイル効果の適用と相互作用
- **パニック**: バフ反転
- **キャンセル**: 奥義発動抑制

### 7.6 FEH固有エッジケース

FEHで最もバグが起きやすい相互作用。各テストファイルに分散して記述:

- **HP条件評価タイミング**: 戦闘前ダメージ（AoE奥義）を受けた後のHP条件スキル（猛攻、待ち伏せ、HP25%以上条件等）の評価。「戦闘開始時のHP」と「戦闘中のHP変動」の区別
- **虚勢（Phantom Stats）の適用範囲**: 速さの虚勢が「追撃判定」には影響するが「速さの○%をダメージに加算」には影響しない切り分け
- **相性激化と相性相殺**: 武器相性の倍率変動と、それを無効化・反転する処理の優先度

---

## 8. DSLノードテスト拡充

### 8.1 ノード単体テスト (DslNode.test.js)

既存のSkillEffect.test.jsに加え、未テストのノードタイプをカバー:

- **効果ノード**: GRANTS_BONUS, INFLICTS_PENALTY, DEALS_DAMAGE, REDUCES_DAMAGE_FROM_FOES_ATTACKS_BY
- **条件ノード**: HP条件、ステータス比較、武器タイプ条件、移動タイプ条件
- **合成ノード**: IF_NODE, AND_NODE, OR_NODE のネスト
- **対象ノード**: UNIT, FOE, ALLIES, FOES のフィルタリング
- **フック**: 各フックタイミングでのスキル登録と評価

### 8.2 テスト方針

- ブラックボックス行動テストを主体（戦闘結果で検証）
- ノード単体テストは新規・複雑なノードタイプに限定
- NodeEnvの各戦闘フェーズでの評価を確認

---

## 9. 実装順序

### Phase 1: インフラ整備（基盤）

1. **create_tests.shのカテゴリ対応**: カテゴリマッピング（case文）、テストファイルフィルタリング
2. **run_tests.shのカテゴリ対応**: カテゴリ引数の`create_tests.sh`への転送、カテゴリ指定時ESLintスキップ
3. **グローバル状態管理**: `resetGlobalTestState()`関数、テストファイル共通beforeEachパターン
4. **UnitBuilder実装**: フルーエントAPI
5. **BattleScenarioBuilder実装**: ユニット登録・位置設定・戦闘実行
6. **RegressionTestHelper実装**: スナップショット抽出
7. **カバレッジ設定**: jest.config.js変更、.gitignore更新
8. **パフォーマンスベンチマーク**: Performance.test.js作成、CI環境閾値対応

### Phase 2: スキルリグレッションテスト

1. **テストテンプレート確立**: スキルテストの標準パターン定義
2. **SkillImpl202601.jsの全スキルテスト**: 最新スキルから開始
3. **SkillImpl202501.jsの主要スキルテスト**: 重要スキルをピックアップ
4. **DSLノード拡充テスト**: 未テストノードタイプのカバー

### Phase 3: 戦闘ロジックテスト

1. **奥義カウント変動テスト**: 最も問題が多いエリア
2. **追撃判定テスト**: 絶対追撃/追撃不可の相互作用
3. **ダメージ軽減テスト**: 累積・貫通
4. **戦闘フローテスト**: 再行動、祈り、回復不可
5. **ステータス効果テスト**: Feud、スタイル、パニック

---

## 10. ファイル変更一覧

### 変更ファイル

| ファイル | 変更内容 |
|---------|---------|
| `create_tests.sh` | カテゴリ引数対応（case文マッピング）、新規9テストファイルをTEST_FILE_NAMESに追加 |
| `run_tests.sh` | カテゴリ引数をcreate_tests.shに転送、カテゴリ指定時ESLintスキップ |
| `jest.config.js` | カバレッジ設定追加（coverageDirectory, coverageReporters） |
| `.github/workflows/jekyll.yml` | カバレッジレポート生成コマンド追加 |
| `.gitignore` | `coverage/`追加 |
| `Sources/TestUtilities.js` | UnitBuilder, BattleScenarioBuilder, RegressionTestHelper, resetGlobalTestState追加 |

### 新規ファイル

| ファイル | カテゴリ | 内容 | 予想テスト数 |
|---------|---------|------|------------|
| `Tests/SkillRegression.test.js` | skill | スキルリグレッションテスト | ~300 |
| `Tests/CombatFlow.test.js` | combat | 戦闘フロー（再行動、祈り、回復不可） | ~25 |
| `Tests/SpecialCount.test.js` | combat | 奥義カウント変動 | ~25 |
| `Tests/DamageReduction.test.js` | combat | ダメージ軽減 | ~20 |
| `Tests/FollowUpAttack.test.js` | combat | 追撃判定 | ~15 |
| `Tests/StatusEffect.test.js` | combat | ステータス効果 | ~20 |
| `Tests/DslNode.test.js` | dsl | DSLノード単体テスト | ~50 |
| `Tests/Performance.test.js` | infra | パフォーマンスベンチマーク | ~5 |
| `Tests/TestHelper.test.js` | infra | ヘルパー自体のテスト | ~15 |
