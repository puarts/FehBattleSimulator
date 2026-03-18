# FEH Battle Simulator — テスト計画 TDDプラン

各セクションの実装前に書くべきテストスタブを定義する。プランのセクション構造をミラーリングし、テスト→実装の順序で進める。

---

## 2. テスト分割実行アーキテクチャ

### create_tests.sh カテゴリ対応のテスト

テスト対象: `create_tests.sh` のカテゴリ引数が正しくテストファイルをフィルタリングするか

手動検証（シェルスクリプトのため自動テスト不要）:
- Test: `./create_tests.sh` で全テストファイルが結合される
- Test: `./create_tests.sh skill` で SkillRegression.test.js のみ結合される
- Test: `./create_tests.sh combat` で戦闘系テストファイルのみ結合される
- Test: `./create_tests.sh dsl` で DSLテストファイルのみ結合される
- Test: `./create_tests.sh infra` でインフラテストファイルのみ結合される
- Test: 存在しないカテゴリ指定時にフォールバック（全テスト実行）される

### run_tests.sh カテゴリ連携のテスト

- Test: `./run_tests.sh skill` でESLintがスキップされスキルテストのみ実行される
- Test: `./run_tests.sh` （引数なし）でESLint + 全テストが実行される

---

## 3. テストヘルパー拡充

### 3.1 UnitBuilder (TestHelper.test.js)

- Test: `UnitBuilder.fromHero('マルス')` で有効なユニットが生成される
- Test: `UnitBuilder.default()` でデフォルトユニットが生成される
- Test: `UnitBuilder.createDummy()` で全ステータス50のユニットが生成される
- Test: `createDummy({hp:99, atk:60, spd:40, def:30, res:20})` でカスタムステータスのユニットが生成される
- Test: `withWeapon(weaponId)` でスキル設定後にステータスが再計算される
- Test: `withStats({atk:99})` でステータスが上書きされる
- Test: `withHpPercent(50)` でHPが最大HPの50%に設定される
- Test: `withSpecialCount(0)` で奥義カウントが0に設定される
- Test: `withBonuses({atk:6})` でバフが適用される
- Test: `withPenalties({spd:-7})` でデバフが適用される
- Test: `atPosition(3,4)` で位置が設定される
- Test: メソッドチェーンが正しく動作する（fromHero().withWeapon().withStats().build()）

### 3.2 BattleScenarioBuilder (TestHelper.test.js)

- Test: `withAttacker(unit).withDefender(unit).execute()` で戦闘結果が返される
- Test: `addAlly(unit)` で味方ユニットが戦闘に参加する
- Test: `addFoe(unit)` で敵ユニットが戦闘に参加する
- Test: `onTurn(3)` でターン数が正しく設定される
- Test: `executeBeginningOfTurn()` でターン開始処理が実行される
- Test: 位置未設定のユニットが自動配置され重複しない
- Test: execute()後にグローバル状態がクリーンアップされる

### 3.3 グローバル状態管理 (TestHelper.test.js)

- Test: `resetGlobalTestState()` 後に `g_appData` が null になる
- Test: BattleScenarioBuilder.execute() 後に別のexecute()が影響を受けない

### 3.4 RegressionTestHelper (TestHelper.test.js)

- Test: `extractCombatSnapshot()` が戦闘結果からHP・ダメージ等の主要値を抽出する
- Test: `extractUnitSnapshot()` がユニットのステータス・状態を抽出する

---

## 4. カバレッジ測定導入

テストコード不要（設定変更のみ）。検証項目:
- Test: `jest --coverage` で coverage/ ディレクトリにレポートが生成される
- Test: CI環境（`CI=true`）でカバレッジが自動収集される
- Test: ローカル環境でカバレッジがデフォルト無効

---

## 5. パフォーマンス回帰テスト (Performance.test.js)

- Test: 全英雄戦闘計算がCI閾値(1200ms)以内で完了する（ウォームアップ5回後に計測）
- Test: 全英雄戦闘計算がローカル閾値(480ms)以内で完了する
- Test: ターン開始スキル適用（全英雄）が閾値以内で完了する
- Test: ユニット初期化（test_HeroDatabase全英雄生成）が閾値以内で完了する

---

## 6. スキルリグレッションテスト (SkillRegression.test.js)

### テストテンプレートの検証

実装前にテストテンプレート自体を検証:
- Test: テンプレートパターン（createDummy + withWeapon + execute）で既知スキルの動作が再現される

### SkillImpl202601 スキルテスト

各スキルについて、戦闘結果のリグレッションテストスタブ:

#### 武器スキル
- Test: 各武器スキルの戦闘中効果（バフ値・ダメージ補正・軽減率）が期待値と一致する
- Test: 条件付き武器スキルが条件未満時に発動しない
- Test: 錬成武器の追加効果が正しく適用される

#### パッシブスキル (A/B/C/聖印)
- Test: 各パッシブスキルの効果が戦闘結果に反映される
- Test: 複数パッシブの同時適用が正しく動作する

#### 奥義スキル
- Test: 攻撃奥義のダメージ補正が正しい
- Test: 防御奥義のダメージ軽減が正しい

---

## 7. 戦闘ロジックテスト

### 7.1 奥義カウント変動 (SpecialCount.test.js)

- Test: 攻撃時に奥義カウントが1減少する
- Test: Heavy Blade条件成立時にカウントが追加で1減少する
- Test: Heavy Blade条件不成立時に追加減少しない
- Test: Guard系スキルでカウント減少が1遅延する
- Test: カウント加速とカウント減速が同時適用時に相殺する
- Test: ターン開始Pulse系でカウントが減少する
- Test: カウント0到達で攻撃奥義が発動する
- Test: 防御奥義が敵攻撃時にカウント0で発動する
- Test: 奥義発動後にカウントが最大値にリセットされる

### 7.2 追撃判定 (FollowUpAttack.test.js)

- Test: 速さ差5以上で追撃が発生する
- Test: 速さ差4以下で追撃が発生しない
- Test: Quick Riposte等で速さに関係なく追撃が発生する（絶対追撃）
- Test: Wary Fighter等で追撃が発生しない（追撃不可）
- Test: 絶対追撃と追撃不可が同時適用時にキャンセルされる
- Test: 複数の絶対追撃/追撃不可の累積時の挙動

### 7.3 ダメージ軽減 (DamageReduction.test.js)

- Test: 割合軽減（例: 40%軽減）が正しく計算される
- Test: 固定値軽減が正しく適用される
- Test: 複数の割合軽減が乗算で累積される（40%+30% → 1-(0.6*0.7)=58%）
- Test: 軽減貫通スキルが割合軽減を無視する
- Test: 防御奥義による軽減が正しいタイミングで適用される

### 7.4 戦闘フロー (CombatFlow.test.js)

- Test: Canto系スキルで戦闘後に再移動が可能になる
- Test: 祈り（Miracle）でHP1で生存する
- Test: 祈りが同一戦闘で2回発動しない
- Test: Deep Wounds等の回復不可効果が適用される
- Test: Sweep系スキルで敵が反撃できない
- Test: 遠距離反撃スキルで距離に関係なく反撃する
- Test: AoE奥義が戦闘前に発動しダメージを与える
- Test: 戦闘後回復スキルが発動する
- Test: 戦闘後デバフ付与が発動する

### 7.5 ステータス効果 (StatusEffect.test.js)

- Test: Feudスキルで対象の可視バフが無効化される
- Test: スタイル効果が正しく適用される
- Test: パニック状態でバフが反転する（+6 → -6）
- Test: キャンセル状態で奥義発動が抑制される

### 7.6 FEH固有エッジケース

- Test: AoE奥義後のHP条件スキル（待ち伏せ等）が戦闘前ダメージ後のHPで評価される
- Test: 猛攻のHP条件が戦闘開始時HPで評価される（戦闘中HP変動の影響を受けない）
- Test: 速さの虚勢が追撃判定に影響する
- Test: 速さの虚勢が「速さの○%をダメージに加算」に影響しない
- Test: 相性激化で有利相性の倍率が増加する
- Test: 相性相殺で相性激化が無効化される

---

## 8. DSLノードテスト拡充 (DslNode.test.js)

### 効果ノード
- Test: GRANTS_BONUS(ATK_SPD(5)).to(UNIT) で攻/速+5が適用される
- Test: INFLICTS_PENALTY(DEF_RES(5)).on(FOE) で守/魔-5が適用される
- Test: DEALS_DAMAGE(10).excludingAoe() で追加ダメージ10が加算される
- Test: REDUCES_DAMAGE_FROM_FOES_ATTACKS_BY(N) でN分のダメージ軽減が適用される

### 条件ノード
- Test: HP条件ノードがHP閾値で正しく判定する（境界値テスト）
- Test: ステータス比較ノードが攻/速/守/魔を正しく比較する
- Test: 武器タイプ条件が指定武器種のみに一致する
- Test: 移動タイプ条件が指定移動タイプのみに一致する

### 合成ノード
- Test: IF_NODE(条件, 効果) で条件成立時のみ効果が適用される
- Test: IF_NODE(条件, 効果) で条件不成立時に効果が適用されない
- Test: AND_NODE(条件A, 条件B) で両方成立時のみtrueを返す
- Test: OR_NODE(条件A, 条件B) でどちらか成立時にtrueを返す
- Test: ネストされたIF_NODE(AND_NODE(...), IF_NODE(...)) が正しく評価される

### 対象ノード
- Test: UNIT が自ユニットを正しく参照する
- Test: FOE が敵ユニットを正しく参照する

### フック
- Test: AT_START_OF_COMBAT_HOOKS で登録したスキルが戦闘開始時に評価される
- Test: AFTER_COMBAT_HOOKS で登録したスキルが戦闘後に評価される
- Test: registerSkillsDuringCombat で登録したスキルが戦闘中に評価される
