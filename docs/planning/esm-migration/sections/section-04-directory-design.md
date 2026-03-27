# Section 04: ディレクトリ構成設計

## 概要

Phase 1（section-02）で構築した依存グラフと副作用分類に基づいて、Sources/配下の64個のJSファイルを機能ドメイン別のディレクトリに再配置するための設計書を作成する。この段階ではJSコードの内容は一切変更せず、ディレクトリ構成の設計と移動バッチ計画の策定のみを行う。

**依存セクション**: section-02（依存グラフ構築）の成果物（dependency-graph.md、副作用分類表、循環依存一覧、依存レイヤー分類）が完了していることが前提。

**後続セクション**: section-05（ファイル移動の実施）がこの設計書に基づいて実際のファイル移動を行う。

---

## テスト方針

このセクションは設計ドキュメントの作成が主成果物であり、コード変更は伴わない。ただし、設計の妥当性を検証するためのチェックを行う。

### 設計検証チェック

```
# Check: 全64 JSファイルが設計書のいずれかのディレクトリに割り当てられている（漏れなし）
# Check: 1ディレクトリあたり1-10ファイル程度の粒度になっている
# Check: ディレクトリ間の依存方向が一方向に近い（循環依存がディレクトリ境界を跨がないか、跨ぐ場合は記録されている）
# Check: SkillImpl系ファイルの移動が最小限に抑えられている（update_skillsブランチとのコンフリクト対策）
# Check: 移動バッチ計画の各バッチで、create_tests.sh / HTML / Deploy.bat / Local.jsの更新箇所が明確
```

### 移動バッチ計画の検証（section-05で実施）

```
# Test: 各移動バッチ後にcreate_tests.shが正常にAll.test.jsを生成
# Test: 各移動バッチ後にJestテストがすべてパス
# Test: 各移動バッチ後にDeploy.batが正常に結合JSを生成
# Test: 各移動バッチ後に本番7ページがブラウザで正常動作
# Test: Deploy.bat出力のJSファイルサイズが移動前と同等（結合内容が同じことの確認）
```

---

## 設計の原則

### 1. 依存関係に基づく分類

section-02の依存グラフから自然なグルーピングを導出する。同じ依存レイヤーにあり、相互参照が多いファイル群を同一ディレクトリに配置する。

### 2. 循環依存を可視化しやすい構成

ディレクトリ間の依存方向が把握しやすいよう設計する。ディレクトリ構成で循環依存そのものは解消されないが、問題の所在を見つけやすくする。

### 3. 適切な粒度

1ディレクトリあたり1〜10ファイル程度を目安とする。

### 4. 将来のbarrelファイル

各ディレクトリが将来ESM化時に`index.js`で公開APIを定義できる構造にする。

---

## ディレクトリ構成の設計

以下は、現在のファイル構成と既知の依存関係パターン（Deploy.batのカテゴリ分類コメント、create_tests.shの順序、HTML loadScriptsの順序）から導出した暫定設計である。**section-02の依存グラフが完成した時点で、実際の依存関係に基づいて修正する。**

### 暫定ディレクトリ構成

```
Sources/
├── core/                    # 基盤・ユーティリティ（レイヤー0〜1）
│   ├── GlobalDefinitions.js
│   ├── GlobalDefinitions_Debug.js
│   ├── Utilities.js
│   ├── Logger.js
│   └── KeyRepeatHandler.js
│
├── data/                    # データ定義・定数（レイヤー0〜1）
│   ├── SkillConstants.js
│   ├── Skill.js
│   ├── HeroInfoConstants.js
│   ├── HeroInfo.js
│   └── UnitConstants.js
│
├── map/                     # マップ・構造物（レイヤー1〜2）
│   ├── BattleMapElement.js
│   ├── Tile.js
│   ├── BattleMap.js
│   ├── BattleMapSettings.js
│   ├── Structures.js
│   ├── Cell.js
│   └── Table.js
│
├── unit/                    # ユニット・コンテキスト（レイヤー2〜3）
│   ├── BattleContext.js
│   ├── Unit.js
│   ├── UnitManager.js
│   ├── GlobalBattleContext.js
│   └── TurnSetting.js
│
├── combat/                  # 戦闘計算（レイヤー3〜4）
│   ├── DamageCalculationUtility.js
│   ├── DamageCalculator.js
│   ├── PostCombatSkillHander.js
│   ├── DamageCalculatorWrapper.js
│   └── BeginningOfTurnSkillHandler.js
│
├── database/                # データベース・プリセット（レイヤー3〜4）
│   ├── SkillDatabase.js
│   ├── HeroDatabase.js
│   ├── SampleSkillInfos.js
│   ├── SampleHeroInfos.js
│   └── AetherRaidDefensePresets.js
│
├── skill-dsl/               # スキルDSL基盤（レイヤー2〜4）
│   ├── SkillEffectCore.js
│   ├── SkillEffectEnv.js
│   ├── SkillEffect.js
│   ├── SkillEffectField.js
│   ├── SkillEffectUnit.js
│   ├── SkillEffectBattleContext.js
│   ├── SkillEffectHooks.js
│   ├── SkillEffectRegistrar.js
│   └── SkillEffectAliases.js
│
├── skill-impl/              # スキル実装（レイヤー最上位、変更頻度高）
│   ├── CustomSkill.js
│   ├── SkillImpl.js
│   ├── SkillImpl202408.js
│   ├── SkillImpl202501.js
│   └── SkillImpl202601.js
│
├── app/                     # アプリケーション・UI統合（レイヤー最上位）
│   ├── SettingManager.js
│   ├── AppData.js
│   ├── AudioManager.js
│   ├── Main_ImageProcessing.js
│   ├── Main_OriginalAi.js
│   ├── Main_MouseAndTouch.js
│   ├── BattleSimulatorBase.js
│   └── VueComponents.js
│
├── pages/                   # ページ固有エントリポイント
│   ├── AetherRaidSimulatorMain.js
│   ├── ArenaSimulatorMain.js
│   ├── SummonerDuelsSimulatorMain.js
│   ├── DamageCalculatorMain.js
│   ├── StatusCalcMain.js
│   ├── UnitBuilderMain.js
│   ├── HeroIconListerMain.js
│   └── HeroStatusClustererMain.js
│
├── Local.js                 # ローカル開発用（ルートに維持）
├── TestUtilities.js         # テスト用（ルートに維持）
│
├── *.html                   # HTMLファイル（ルートに維持）
└── samples/                 # 既存（変更なし）
    └── tmp.js
```

### 設計根拠

**Deploy.batの既存カテゴリ分類との対応**（Deploy.batのコメントから読み取れる分類）:

| Deploy.batカテゴリ | 対応ディレクトリ |
|---|---|
| 基盤・ユーティリティ | `core/` |
| マップ・構造 | `map/` |
| ユニット・情報 | `data/` + `unit/` |
| 計算ロジック | `combat/` |
| データベース・設定 | `database/` |
| メインロジック・UI | `app/` |

**SkillImpl系の扱い**: `skill-impl/`ディレクトリに移動する設計だが、update_skillsブランチとのコンフリクトリスクが高い。コンフリクト対策として、SkillImpl系ファイルの移動は移動バッチの最後に実施し、移動せず現在位置に維持する選択肢も残す（section-02の分析結果で最終判断）。

### 依存グラフ分析結果による調整ポイント

section-02の成果物が完成した時点で、以下を確認して設計を調整する:

1. **レイヤー分類の確認**: 各ファイルの実際の依存レイヤーが暫定設計の配置と整合するか
2. **循環依存のディレクトリ跨ぎ**: 循環依存チェーンがディレクトリ境界を跨ぐ箇所を特定し、必要に応じてグルーピングを変更
3. **副作用分類の影響**: `initialization-root`や`global-assignment`のファイルがロード順序制約を持つため、同一バッチでの移動が必要か確認
4. **skill-dsl/ と combat/ の境界**: SkillEffectBattleContext.jsなどが戦闘コンテキストとスキルDSL両方に関わるため、最適な配置を検討

---

## 移動バッチ計画

依存の強い塊をまとめて1バッチで移動する。各バッチ完了時にテスト+ブラウザ確認を行う。

### バッチ実行順序

バッチは依存レイヤーの低い（他に依存されるだけの）ファイルから順に移動する。これにより、各バッチ時点での`create_tests.sh`やDeploy.batのパス更新が最小限で済む。

**バッチ1: core/ — 基盤ユーティリティ**
- 対象: `GlobalDefinitions.js`, `GlobalDefinitions_Debug.js`, `Utilities.js`, `Logger.js`, `KeyRepeatHandler.js`
- 理由: 他の全ファイルから参照される最下層。移動しても他ファイルのJSコードに影響なし（グローバルスコープのため）
- 更新対象: `create_tests.sh`, 全HTML, `Deploy.bat`

**バッチ2: data/ — データ定義・定数**
- 対象: `SkillConstants.js`, `Skill.js`, `HeroInfoConstants.js`, `HeroInfo.js`, `UnitConstants.js`
- 理由: core/の次に依存レイヤーが低いファイル群
- 更新対象: `create_tests.sh`, 全HTML, `Deploy.bat`

**バッチ3: map/ — マップ関連**
- 対象: `BattleMapElement.js`, `Tile.js`, `BattleMap.js`, `BattleMapSettings.js`, `Structures.js`, `Cell.js`, `Table.js`
- 更新対象: `create_tests.sh`, 全HTML, `Deploy.bat`

**バッチ4: unit/ — ユニット・コンテキスト**
- 対象: `BattleContext.js`, `Unit.js`, `UnitManager.js`, `GlobalBattleContext.js`, `TurnSetting.js`
- 更新対象: `create_tests.sh`, 全HTML, `Deploy.bat`

**バッチ5: combat/ — 戦闘計算**
- 対象: `DamageCalculationUtility.js`, `DamageCalculator.js`, `PostCombatSkillHander.js`, `DamageCalculatorWrapper.js`, `BeginningOfTurnSkillHandler.js`
- 更新対象: `create_tests.sh`, 全HTML, `Deploy.bat`

**バッチ6: database/ — データベース・プリセット**
- 対象: `SkillDatabase.js`, `HeroDatabase.js`, `SampleSkillInfos.js`, `SampleHeroInfos.js`, `AetherRaidDefensePresets.js`
- 更新対象: `create_tests.sh`, 全HTML, `Deploy.bat`

**バッチ7: skill-dsl/ — スキルDSL基盤**
- 対象: `SkillEffectCore.js`〜`SkillEffectRegistrar.js`, `SkillEffectAliases.js`
- 更新対象: `create_tests.sh`, 全HTML, `Deploy.bat`, `Local.js`（SKILL_EFFECT_FILESのパス更新）

**バッチ8: app/ — アプリケーション層**
- 対象: `SettingManager.js`, `AppData.js`, `AudioManager.js`, `Main_*.js`, `BattleSimulatorBase.js`, `VueComponents.js`
- 更新対象: `create_tests.sh`, 全HTML, `Deploy.bat`

**バッチ9: pages/ — ページエントリポイント**
- 対象: `*Main.js`（各ページ固有のMain）
- 更新対象: `create_tests.sh`, 対応HTML, `Deploy.bat`

**バッチ10（最後）: skill-impl/ — スキル実装ファイル**
- 対象: `CustomSkill.js`, `SkillImpl.js`, `SkillImpl202408.js`, `SkillImpl202501.js`, `SkillImpl202601.js`
- 更新対象: `create_tests.sh`, 全HTML, `Deploy.bat`, `Local.js`（SKILL_IMPL_FILESのパス更新）
- **注意**: update_skillsブランチとのコンフリクトリスクが最も高いバッチ。移動しない判断もあり得る

---

## 周辺ファイルのパス更新方式

各バッチで以下のファイルのパス更新が必要になる。

### create_tests.sh

現在のパス構成:
```bash
cat ./Sources/${name}.js >> ./$TARGET_FILE
```

移動後は各ファイルのディレクトリが異なるため、SOURCE_FILE_NAMESの各エントリをディレクトリ付きのパスに変更する必要がある。2つの方式がある:

**方式A**: フルパスをSOURCE_FILE_NAMESに記載
```bash
SOURCE_FILE_NAMES=(
    core/GlobalDefinitions
    core/Utilities
    core/Logger
    ...
)
# catの行: cat ./Sources/${name}.js >> ./$TARGET_FILE（変更不要）
```

**方式B**: ディレクトリごとの配列に分離
```bash
CORE_FILES=(GlobalDefinitions Utilities Logger ...)
# 各配列をループ: cat ./Sources/core/${name}.js
```

**推奨**: 方式A。変更が最小限で、既存の結合ロジックをそのまま維持できる。

### HTMLファイルのloadScripts配列

各HTMLの`additionalScripts`配列のファイル名にディレクトリプレフィックスを追加:
```javascript
// Before
"GlobalDefinitions.js",
// After
"core/GlobalDefinitions.js",
```

### Deploy.bat

ファイル名変数にディレクトリプレフィックスを追加。`MergeSourcesAndCompress.bat`が`Sources/`をベースパスとして使用しているため、相対パスの追加で済む:
```bat
rem Before
set BF=GlobalDefinitions,Utilities,...
rem After
set BF=core\GlobalDefinitions,core\Utilities,...
```

**注意**: `MergeSourcesAndCompress.bat`の内部でパスがどう使われているか確認が必要。`Sources\%name%.js`形式であれば、`core\GlobalDefinitions`のように渡せば`Sources\core\GlobalDefinitions.js`に解決される。

### Local.js

SKILL_EFFECT_FILESとSKILL_IMPL_FILESのパスにディレクトリプレフィックスを追加:
```javascript
const SKILL_EFFECT_FILES = [
    "skill-dsl/SkillEffectCore.js",
    ...
];
```

---

## update_skillsブランチとのコンフリクト対策

### コンフリクト発生箇所の予測

1. **SkillImpl系ファイル自体**: git mvによるrename。update_skillsブランチでの内容変更とのmergeはGitのrename検出に依存
2. **Local.js**: SKILL_IMPL_FILESの配列。新しいSkillImpl日付ファイルが追加される可能性
3. **HTMLファイル**: loadScriptsの配列。SkillImpl系の追加でコンフリクト
4. **create_tests.sh**: SOURCE_FILE_NAMESの配列
5. **Deploy.bat**: skill_impl_filenames変数

### 緩和策

1. **SkillImpl系ファイルの移動は最後のバッチ（バッチ10）で実施**: コンフリクト期間を最小化
2. **移動しない選択肢の維持**: section-02の分析結果と、移動時点のupdate_skillsブランチの状況に応じて判断
3. **git mvの徹底**: フォーマット変更を混ぜない。Gitのrename検出を確実にする
4. **Phase 2a全体を集中的に実施**: コンフリクト期間の短縮
5. **マージ手順のドキュメント化**: バッチ10完了後のマージ手順を事前に記載

### マージ手順（ドキュメント化すべき内容）

```
1. refactor/module-structureブランチでPhase 2a完了をコミット
2. update_skillsブランチの最新をfetch
3. git merge update_skills（またはrebase）
4. コンフリクト解決:
   a. SkillImpl系ファイル: 新パスで内容はupdate_skills側を採用
   b. Local.js / HTML / create_tests.sh / Deploy.bat: 新パス形式で新ファイル名を追加
5. テスト実行 + ブラウザ確認
6. コミット
```

---

## 実施結果

### 成果物

- [x] ディレクトリ構成設計書: `docs/planning/esm-migration/directory-design.md`
- [x] 全64ファイルのディレクトリ割り当て表（漏れなし、合計確認済み）
- [x] 移動バッチ計画（10バッチ、各バッチの対象ファイル・Layer・副作用分類・更新箇所）
- [x] 周辺ファイル（create_tests.sh, HTML, Deploy.bat, Local.js）のパス更新方式
- [x] update_skillsブランチとのコンフリクト対策手順
- [x] マージ手順ドキュメント

### 計画からの追加事項（コードレビューで追加）

- **ロード順序の維持ルール**: `create_tests.sh` / HTML / `Deploy.bat` のファイル列挙は「相対パスのみ更新、相対順序は維持」と明記
- **クロスディレクトリ依存分析テーブル**: 全体内部率16%。ディレクトリ分割は「機能ドメイン整理」であり「依存方向の強制」ではないことを定量的に確認。Phase 2b優先順位付けに活用

### 設計書の出力先

`docs/planning/esm-migration/directory-design.md` — section-05がこの設計書を参照してファイル移動を実施する。