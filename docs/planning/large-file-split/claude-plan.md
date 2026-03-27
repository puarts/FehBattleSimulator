# 実装計画: 巨大ファイル分割リファクタリング

## 1. 概要

### 何を行うか

FEH Battle SimulatorのDamageCalculatorWrapper.js（17,193行）とUnit.js（7,424行）から、独立性の高いクラスと関数を別ファイルに抽出する。4つのステップで4つの新規ファイルを作成し、既存の関連ファイル（BattleContext.js、create_tests.sh、Deploy.bat、複数のHTMLファイル）も更新する。各ステップごとにテストとsmoke checkで回帰がないことを確認する。

### なぜ行うか

1. **責務分離**: 単一ファイルに複数の無関係な責務が混在している。独立したクラスやユーティリティ関数を適切なファイルに分離することで、コードの見通しを改善する
2. **ESM移行の準備**: 将来のimport/export導入時に、すでに責務ごとに分かれたファイル群があれば移行がスムーズになる
3. **保守性**: 17,000行や7,400行のファイルは変更時の認知負荷が高い。抽出可能な部分を分離するだけでも見通しが改善される

### プロジェクト背景

本プロジェクトはバニラJavaScript + Vue.js + jQueryで構築されたFire Emblem Heroesのバトルシミュレータ。ビルドツールなし、HTMLファイルをブラウザで直接開いて動作する。

テストは`create_tests.sh`で全ソースファイルとテストファイルを1つの`All.test.js`に結合し、Jestで実行する。本番用は`Deploy.bat`でファイルを結合する。いずれもグローバルスコープ前提で、ファイルのロード順序が依存関係の解決を担う。

ESM移行計画のSection 05（ディレクトリ再編）とSection 06（BattleSimulatorBaseからの一部抽出）が完了済み。本作業はその続きとなるSection 07相当の構造改善。

ブランチ: `refactor/large-file-splits`

### スコープ外

- **BattleSimulatorBase.js**: Section 06でStep 1のみ実施し意図的に止めた高リスク領域。別計画とする
- **SkillEffect.js**: 既に8つのファイルに部分分割済み。後続計画で検討
- **SkillImpl系ファイル**: 日付ベース分割方式を維持
- **DamageCalculatorWrapperのstaticメソッド**: 全て内部呼び出しのみで外部再利用性がなく、分離メリットが薄い
- **DamageCalculatorWrapperのインスタンスメソッド**: `this`に密結合で安全な分離が困難
- **Unitクラス本体**: 650+メソッドが密結合しており、大規模な再分割は行わない

---

## 2. 技術的制約

### グローバルスコープとロード順序

全ファイルはグローバルスコープで連結される。新ファイルを追加する場合、以下3箇所のロード順序を管理する必要がある:

1. **`create_tests.sh`** の `SOURCE_FILE_NAMES` 配列 — テスト実行用（ファイル結合）
2. **`Deploy.bat`** の結合リスト — 本番ビルド用（ファイル結合）
3. **HTMLファイルの`loadScripts`配列** — ローカル開発用（個別`<script>`タグで逐次ロード）

依存先のファイルは依存元より先にロードされなければならない。

**重要: 3系統の相対順序は必ず一致させること。** `create_tests.sh`・`Deploy.bat`・HTMLで新規ファイルの相対的なロード順序が異なると、一方では動作しもう一方では壊れるという検出困難なバグを生む。各ステップで3系統すべてを更新し、相対順序の一致を確認する。

### `let`/`const`スコープとスクリプトロード方式の差異

テスト（`create_tests.sh`）と本番（`Deploy.bat`）はファイル結合方式であり、全コードが単一ファイル内のスコープを共有する。一方、HTMLの`loadScripts`は個別の`<script>`タグを動的生成する方式で、各ファイルが別スクリプトとして実行される。

通常の`<script>`タグ間では`let`/`const`宣言もグローバルレキシカルスコープを共有するためアクセス可能だが、`window`オブジェクトのプロパティにはならない点に注意。**抽出対象コード内で`window.X`形式でアクセスされるシンボルが`const`/`let`で宣言されている場合は問題となるため、事前に確認する。**

### テスト方式

`./run_tests.sh`が全テスト+ESLintを実行する。テスト対象ファイルは`create_tests.sh`の`SOURCE_FILE_NAMES`で管理されており、新規ファイルは必ずここに追加する。

### ESLintグローバル宣言

ファイル分割後、新ファイル内で参照するが同ファイル内に定義がないシンボルはESLintの`no-undef`エラーとなる。各新規ファイルの先頭に `/* global SymbolName1, SymbolName2, ... */` コメントを追加してESLintを通過させる。

### 後方互換性

セーブデータ、URLパラメータ、グローバルに公開されるクラス名・関数名を変更してはならない。ファイル分割はあくまで物理的な配置変更であり、論理的なAPIは一切変更しない。

### ロジック変更禁止

本作業ではロジック変更を禁止する。物理分割・再配置・ロード順更新・ESLint注記のみ許可する。

**禁止**:
- typoの修正（例: `addElaspedMilliseconds`のスペルミスはそのまま維持）
- コードの整形・改行変更
- 未使用変数の削除
- ロジックの変更・改善

**許可**:
- コードの物理的な移動（新規ファイルへの抽出）
- 別ファイルへの再配置（PrecombatContext → BattleContext.js）
- 新規ファイルのファイルヘッダコメント追加
- `/* global ... */` ESLintコメントの追加
- ロード順序リスト（`create_tests.sh`, `Deploy.bat`, HTML）の更新
- 移動元からのコード削除

---

## 3. Phase A: DamageCalculatorWrapper.jsの独立クラス抽出

### 3.1 対象ファイルの構造

`Sources/combat/DamageCalculatorWrapper.js` (17,193行) の先頭部分に、DamageCalculatorWrapperクラスとは独立した2つの小クラスが定義されている:

| クラス | 行範囲 | 行数 | 責務 |
|--------|--------|------|------|
| `PerformanceProfile` | 2-28 | 27 | パフォーマンスプロファイリング。関数実行時間を計測・蓄積するユーティリティ |
| `ScopedTileChanger` | 30-52 | 22 | タイル位置の一時変更とリストア。スコープ管理パターンの実装 |

DamageCalculatorWrapperクラス本体は行54から始まり、コンストラクタで`this.profiler = new PerformanceProfile()`としてPerformanceProfileを使用する。ScopedTileChangerはDamageCalculatorWrapper内部のメソッドで使用される。

### 3.2 対象HTMLファイル（Phase A）

DamageCalculatorWrapper.jsを`loadScripts`で読み込んでいるHTMLファイル:

| HTML | Unit.js | DamageCalculatorWrapper.js |
|------|---------|---------------------------|
| `ArenaSimulator.html` | Yes | Yes |
| `DamageCalculator.html` | Yes | Yes |
| `UnitBuilder.html` | Yes | Yes |
| `AetherRaidSimulator.html` | Yes | Yes |
| `SummonerDuelsSimulator.html` | Yes | Yes |
| `HeroStatusClusterer.html` | Yes | No |
| `StatusCalculator.html` | Yes | No |

Phase Aの新規ファイル（PerformanceProfile.js, ScopedTileChanger.js）は、DamageCalculatorWrapper.jsを読み込んでいる5つのHTMLに追加する。HeroStatusClusterer.htmlとStatusCalculator.htmlには追加不要。

### 3.3 Step A-1: PerformanceProfile抽出

**新規ファイル**: `Sources/combat/PerformanceProfile.js`

**事前チェック**:
1. `PerformanceProfile`の全非ローカル参照を列挙し、外部依存がないことを確認
2. リポジトリ全体で`PerformanceProfile`の重複定義がないことを確認
3. トップレベルの`let`/`const`宣言の有無を確認

**抽出内容**: `PerformanceProfile`クラス全体（コンストラクタ、`addElaspedMilliseconds`メソッド、`profile`メソッド）。DamageCalculatorWrapper.jsの行2-28を移動する。

**依存関係**: なし。`Date.now()`と`console.log()`のみ使用する自己完結クラス。

**ロード順序**: DamageCalculatorWrapperのコンストラクタで`new PerformanceProfile()`されるため、DamageCalculatorWrapperより前にロードする。

**更新対象ファイル**:

- `create_tests.sh`: `SOURCE_FILE_NAMES`にDamageCalculatorWrapperの直前に`PerformanceProfile`を追加
- `Deploy.bat`: DamageCalculatorWrapper行の前に`PerformanceProfile`を追加
- HTMLファイル（5つ）: `ArenaSimulator.html`, `DamageCalculator.html`, `UnitBuilder.html`, `AetherRaidSimulator.html`, `SummonerDuelsSimulator.html`の`loadScripts`配列にDamageCalculatorWrapperの前に追加
- **3系統の相対順序が一致することを確認**

**検証**:
1. `./run_tests.sh` — 全テスト+ESLintパス
2. ブラウザsmoke check: DamageCalculator.htmlを読み込み、コンソールエラーなし

### 3.4 Step A-2: ScopedTileChanger抽出

**新規ファイル**: `Sources/combat/ScopedTileChanger.js`

**事前チェック**:
1. `ScopedTileChanger`の全非ローカル参照を列挙: `Unit`（`placedTile`プロパティ）、`setUnitToTile()`
2. リポジトリ全体で`ScopedTileChanger`の重複定義がないことを確認
3. `setUnitToTile()`の定義ファイルとロード順序を確認

**抽出内容**: `ScopedTileChanger`クラス全体（コンストラクタ、`dispose`メソッド）。DamageCalculatorWrapper.jsの行30-52を移動する。

**依存関係**:
- `Unit`クラス（`placedTile`プロパティを参照）
- `setUnitToTile()`グローバル関数

いずれもDamageCalculatorWrapperより前にロード済みのため、ScopedTileChangerをDamageCalculatorWrapperの直前に配置すれば依存は解決される。

**ロード順序**: PerformanceProfileの後、DamageCalculatorWrapperの前。

**更新対象ファイル**:
- `create_tests.sh`: PerformanceProfileの後、DamageCalculatorWrapperの前に`ScopedTileChanger`を追加
- `Deploy.bat`: 同上
- HTMLファイル（5つ）: 同上（Phase A対象の5ファイル）
- **3系統の相対順序が一致することを確認**

**検証**:
1. `./run_tests.sh` — 全テスト+ESLintパス
2. ブラウザsmoke check: DamageCalculator.htmlを読み込み、ダメージ計算を1回実行、コンソールエラーなし

---

## 4. Phase B: Unit.jsのトップレベル要素抽出

### 4.1 対象ファイルの構造

`Sources/unit/Unit.js` (7,424行) は以下の構造を持つ:

```
行 6-16:     極小トップレベル関数3つ (isThief等) → 残す
行 19-51:    AttackableUnitInfo クラス → UnitContext.jsへ
行 54-120:   AttackEvaluationContext クラス → UnitContext.jsへ
行 123-268:  AssistableUnitInfo クラス → UnitContext.jsへ
行 271-350:  ActionContext クラス → UnitContext.jsへ
行 356-371:  PrecombatContext クラス → BattleContext.jsへ
行 374-7143: Unit クラス本体 → 残す
行 7144-7424: ユーティリティ関数群 → UnitUtility.jsへ
```

### 4.2 対象HTMLファイル（Phase B）

Unit.jsを`loadScripts`で読み込んでいるHTMLファイル（全7ファイル）:

`ArenaSimulator.html`, `DamageCalculator.html`, `UnitBuilder.html`, `AetherRaidSimulator.html`, `SummonerDuelsSimulator.html`, `HeroStatusClusterer.html`, `StatusCalculator.html`

Phase Bの新規ファイル（UnitContext.js, UnitUtility.js）は全7ファイルに追加する。

### 4.3 Step B-1: 独立クラス群の抽出

**新規ファイル**: `Sources/unit/UnitContext.js`

**事前チェック**:
1. 4クラスそれぞれの全非ローカル参照を完全列挙する
2. リポジトリ全体で4クラス名の重複定義がないことを確認
3. `PrecombatContext`のリポジトリ全体での参照箇所を列挙する
4. 4クラスがパース/ロード時（static初期化、デフォルト引数等）に`Unit`シンボルを評価していないことを確認（メソッド内での参照は実行時解決されるため問題ない）
5. 主な外部参照を列挙し、ロード順とESLint対応を確認

**抽出内容** (4クラス、約326行):
- `AttackableUnitInfo` (33行) — 攻撃対象情報のデータコンテナ。Unitの`targetUnit`プロパティのみ参照
- `AttackEvaluationContext` (67行) — 攻撃優先度の評価コンテキスト。計算ロジックを内包するが独立性は高い
- `AssistableUnitInfo` (146行) — アシスト対象評価のデータコンテナ。5つのprivateメソッドで優先度サブ計算を行う
- `ActionContext` (80行) — AI意思決定のコンテキスト。AttackableUnitInfoとAssistableUnitInfoのリストを管理

**例外的な再配置**: `PrecombatContext` (16行) は `Sources/unit/BattleContext.js` の末尾に移動する。本Stepで唯一「新規ファイルへの抽出」ではなく「既存ファイルへの再配置」を行う対象である。このクラスは`copyTo`メソッドでBattleContextに値をコピーする関係があり、責務的にBattleContext側が適切。移動前に以下を確認:
- `PrecombatContext`の全参照一覧（grep結果）
- `copyTo`の受け先BattleContextの前提条件
- BattleContext.js内に同名や類似責務のコードがないこと
- PrecombatContext追加によりBattleContext.jsが新たに参照する外部シンボルの有無、およびESLint/ロード順への影響

**依存関係の分析**:

`UnitContext.js`の4クラスはいずれもUnitクラスのインスタンスをプロパティとして保持するが、定義時にはUnitクラス本体は不要（実行時にはUnit互換オブジェクトを前提とする）。ただし、`AssistableUnitInfo`の`calcAssistTargetPriority`メソッドなど、Unitのプロパティを読み取るメソッドが存在するため、実行時にはUnit定義が必要。

`AttackEvaluationContext`は`CombatResultType`列挙型を参照する。`CombatResultType`は`Sources/data/UnitConstants.js`（行219）に`const`で定義されており、全HTMLで`UnitConstants.js` → `Unit.js`の順にロードされているため、`UnitContext.js`をUnit.jsの直前に配置すれば問題ない。

**ロード順序**: UnitContext.jsはUnit.jsの直前に配置する。4クラスはUnit定義前に宣言されていた（元のUnit.jsでもUnitクラスより前）ため、この順序は元の配置と同じ。

PrecombatContextのBattleContext.jsへの移動は、BattleContext.jsがUnit.jsより前にロードされることが前提となる。実装前に`create_tests.sh`・`Deploy.bat`・HTMLの3系統すべてでこの順序を確認すること。

**更新対象ファイル**:
- `create_tests.sh`: `SOURCE_FILE_NAMES`にUnit直前に`UnitContext`を追加
- `Deploy.bat`: Unit関連の結合リストでUnit直前に追加
- HTMLファイル（全7ファイル）: loadScripts配列でUnit.jsの前に追加
- `BattleContext.js`自体にPrecombatContextを追記
- **3系統の相対順序が一致することを確認**

**ESLint対応**: UnitContext.jsの先頭に `/* global ... */` を追加。対象シンボルは事前チェック#1で列挙した4クラス全体の非ローカル参照に基づいて決定する（`CombatResultType`は確定、それ以外は列挙結果に応じて追加）。

**検証**:
1. `./run_tests.sh` — 全テスト+ESLintパス
2. ブラウザsmoke check: ArenaSimulator.htmlを読み込み、ユニット配置などの代表操作を1つ実行、コンソールエラーなし

### 4.4 Step B-2: ユーティリティ関数群の抽出

**新規ファイル**: `Sources/unit/UnitUtility.js`

**事前チェック（必須）**:
1. 以下の全シンボルについて、リポジトリ全体でのgrep（参照元ファイル一覧の作成）:
   - `calcBuffAmount`, `calcHealAmount`, `isDebufferTier1`, `isDebufferTier2`, `isAfflictor`, `canRefreshTo`, `UnitUtil`
2. 参照元ファイルがUnitUtility.js（= Unit.jsの直後）より後にロードされることの確認
3. Unit.jsより前に実行される初期化コードからの参照がないことの確認
4. 同名シンボルの重複定義チェック
5. フックオブジェクト（`CALC_HEAL_AMOUNT_HOOKS`, `IS_DEBUFFER_TIER_1_HOOKS`等）の定義場所・宣言方式（var/let/const）・登録タイミングの確認
6. 抽出対象関数がトップレベルで即時実行される経路がないことの確認（関数定義のみなら安全、ロード時評価がある場合は要注意）
7. 対象関数の前後10-20行を確認し、一緒に移すべきローカルヘルパーや関連定数がないかチェック

**抽出内容** (1クラス + 6関数、約259行):
- `UnitUtil`クラス (21行) — `withCache`静的メソッドによるキャッシュラッパー。挙動変更なし・キャッシュ仕様は現状維持
- `calcBuffAmount(assistUnit, targetUnit)` (41行) — バフ量の計算。サポートスキルタイプに応じたswitch文
- `calcHealAmount(assistUnit, targetUnit)` (83行) — 回復量の計算。20+のヒールタイプに対応。`CALC_HEAL_AMOUNT_HOOKS`を使用
- `isDebufferTier1(unit)` (9行) — Tier 1デバッファー判定。`IS_DEBUFFER_TIER_1_HOOKS`を使用
- `isDebufferTier2(unit)` (38行) — Tier 2デバッファー判定。フック+switch文
- `isAfflictor(unit)` (64行) — ステータス付与判定。フック+スキルチェック
- `canRefreshTo(unit, targetUnit)` (3行) — リフレッシュ可否の単純判定

**依存関係の分析**:

これらの関数はUnit.jsの末尾（Unitクラス定義の後）に定義されている。依存するシンボル:
- `Unit`クラス（引数としてUnitインスタンスを受け取る）
- `Support`列挙型（calcBuffAmount, calcHealAmountで使用）
- `StatusEffectType`（isAfflictorで使用）
- `CALC_HEAL_AMOUNT_HOOKS`, `IS_DEBUFFER_TIER_1_HOOKS`等のフックオブジェクト
- グローバル関数（`isRallyUp`等）

**ロード順序**: UnitUtility.jsはUnit.jsの直後に配置する。これらの関数は元のUnit.jsでもUnitクラス定義の後に置かれていたため、ロード順序は元の配置と同等。

事前チェック#2の結果、UnitUtility.js内の関数を呼び出すファイルがUnit.jsの直後以降にロードされることを確認する。元の配置でUnit.jsの一部だったため、Unit.jsの直後に置けば通常は問題ないが、明示的に確認する。

**更新対象ファイル**:
- `create_tests.sh`: `SOURCE_FILE_NAMES`にUnitの直後に`UnitUtility`を追加
- `Deploy.bat`: Unit関連の結合リストでUnitの直後に追加
- HTMLファイル（全7ファイル）: loadScripts配列でUnit.jsの後に追加
- **3系統の相対順序が一致することを確認**

**ESLint対応**: UnitUtility.jsの先頭に `/* global Unit, Support, StatusEffectType, CALC_HEAL_AMOUNT_HOOKS, IS_DEBUFFER_TIER_1_HOOKS, ... */` を追加（事前チェックで特定した全外部シンボル）。

**検証**:
1. `./run_tests.sh` — 全テスト+ESLintパス
2. ブラウザsmoke check: ArenaSimulator.htmlを読み込み、戦闘シミュレーションの代表操作を1つ実行、コンソールエラーなし

---

## 5. ファイル変更サマリー

### 新規作成ファイル

| ファイル | 内容 | 行数目安 |
|---------|------|---------|
| `Sources/combat/PerformanceProfile.js` | PerformanceProfileクラス | ~27 |
| `Sources/combat/ScopedTileChanger.js` | ScopedTileChangerクラス | ~22 |
| `Sources/unit/UnitContext.js` | AttackableUnitInfo, AttackEvaluationContext, AssistableUnitInfo, ActionContext | ~326 |
| `Sources/unit/UnitUtility.js` | UnitUtil, calcBuffAmount, calcHealAmount, isDebufferTier1/2, isAfflictor, canRefreshTo | ~259 |

### 変更ファイル

| ファイル | 変更内容 |
|---------|---------|
| `Sources/combat/DamageCalculatorWrapper.js` | 行2-52を削除（PerformanceProfile + ScopedTileChanger） |
| `Sources/unit/Unit.js` | 行19-350, 356-371, 7144-7424を削除 |
| `Sources/unit/BattleContext.js` | PrecombatContextクラスを末尾に追加 |
| `create_tests.sh` | SOURCE_FILE_NAMESに4ファイル追加 |
| `Deploy.bat` | 結合リストに4ファイル追加 |
| `ArenaSimulator.html` | loadScripts配列に4ファイル追加 |
| `DamageCalculator.html` | loadScripts配列にPhase Aの2ファイル追加 |
| `UnitBuilder.html` | loadScripts配列に4ファイル追加 |
| `AetherRaidSimulator.html` | loadScripts配列に4ファイル追加 |
| `SummonerDuelsSimulator.html` | loadScripts配列に4ファイル追加 |
| `HeroStatusClusterer.html` | loadScripts配列にPhase Bの2ファイル追加 |
| `StatusCalculator.html` | loadScripts配列にPhase Bの2ファイル追加 |

### 行数変化の見込み

| ファイル | 変更前 | 変更後 |
|---------|--------|--------|
| DamageCalculatorWrapper.js | 17,193 | ~17,144 (-49) |
| Unit.js | 7,424 | ~6,823 (-601) |
| BattleContext.js | 1,138 | ~1,154 (+16) |

---

## 6. リスクと対策

### ロード順序の破壊

**リスク**: 新ファイルのロード位置を誤ると、未定義参照エラーが発生する。
**対策**: 元のファイル内での定義位置（Unitクラスの前/後）と同じ相対位置を新ファイルでも維持する。各ステップで`./run_tests.sh`を実行し、ロード順序の問題を即座に検出する。ただしテスト通過だけでは十分でない場合があるため、ブラウザでの直接確認も必須とする。

### 3系統のロード順序不整合

**リスク**: `create_tests.sh`では通るが、`Deploy.bat`やHTMLのロード順序が異なり本番やブラウザで壊れる。
**対策**: 各ステップで`create_tests.sh`、`Deploy.bat`、HTMLの3系統すべてを更新し、新規追加ファイルの相対順序が一致することを確認する。

### 依存シンボルの見落とし

**リスク**: 抽出対象コードが参照しているグローバルシンボルが、新ファイルのロード時点でまだ定義されていない。
**対策**: 各Stepの事前チェックとして、抽出対象コード内の全非ローカル参照を完全列挙し、それぞれの定義元ファイルとロード順序を確認する。特にStep B-2では全参照元ファイルのgrepを必須とする。

### Deploy.batの更新漏れ

**リスク**: create_tests.shは更新したがDeploy.batの更新を忘れ、本番ビルドが壊れる。
**対策**: 各ステップのチェックリストにcreate_tests.sh、Deploy.bat、HTML更新を必ず含める。Phase A-1で実務フローを確立し、以降のステップで繰り返す。

### HTML更新漏れ

**リスク**: 一部のHTMLファイルでscript追加を忘れ、そのページだけ機能停止する。
**対策**: 3.2節・4.2節で対象HTMLを明示列挙済み。各ステップで該当するすべてのHTMLを更新する。

### PrecombatContextのBattleContext.js移動

**リスク**: PrecombatContextがUnit.jsの他のコードから内部的に参照されている可能性。
**対策**: 移動前にgrepでPrecombatContextの全参照箇所を確認する。BattleContext.jsはUnit.jsより前にロードされるため、Unit.jsからのPrecombatContext参照は問題なく解決される。

---

## 7. 各Step共通の実施手順

各ステップは以下の順序で実施する:

1. **事前チェック**: 依存関係の列挙、重複定義確認、ロード順序確認
2. **ファイル作成/移動**: コードの移動（移動以外の変更禁止）
3. **ESLint対応**: `/* global ... */`コメント追加
4. **ロード順序更新**: `create_tests.sh`, `Deploy.bat`, HTML（3系統すべて）
5. **3系統の相対順序一致確認**
6. **テスト実行**: `./run_tests.sh`
7. **ブラウザsmoke check**: 具体的な操作の実行 + コンソールエラーなし確認
8. **コミット**: 1 Step = 1コミット

---

## 8. コミット計画

| コミット | メッセージ | 内容 |
|---------|----------|------|
| 1 | `refactor(combat): PerformanceProfileをDamageCalculatorWrapperから独立ファイルに分離` | Step A-1 |
| 2 | `refactor(combat): ScopedTileChangerをDamageCalculatorWrapperから独立ファイルに分離` | Step A-2 |
| 3 | `refactor(unit): 独立コンテキストクラス群をUnitContext.jsに分離、PrecombatContextをBattleContext.jsに移動` | Step B-1 |
| 4 | `refactor(unit): ユーティリティ関数群をUnitUtility.jsに分離` | Step B-2 |
