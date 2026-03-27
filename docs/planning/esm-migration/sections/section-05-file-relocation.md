Now I have all the context I need to write this section. The key insight is that `MergeSources.bat` hardcodes `Sources\%%n.js`, so the Deploy.bat integration requires either keeping files in Sources/ or modifying MergeSources.bat to support subdirectories.

# Section 05: ファイル移動の実施 (File Relocation)

## 概要

section-04（ディレクトリ構成設計）で決定したディレクトリ構成に基づき、`Sources/`配下のJSファイルを物理的に移動する。`git mv`を使用してGitのrename検出を確実にする。JSコードの内容は一切変更しない。ファイル移動に伴い、以下の周辺ファイルのパス参照を更新する:

- `create_tests.sh` の `SOURCE_FILE_NAMES` 配列
- 各HTMLファイルの `loadScripts` 配列（ローカル開発用スクリプトロードパス）
- `Deploy.bat` および `MergeSources.bat` のファイル参照パス
- `Local.js` の `SKILL_EFFECT_FILES` / `SKILL_IMPL_FILES` 定義

## 前提条件（依存セクション）

- **section-03（Strict Mode準拠化）** が完了していること — Strict Mode違反が修正済み
- **section-04（ディレクトリ構成設計）** が完了していること — 移動先のディレクトリ構成と移動バッチ計画が確定済み

section-04の成果物（ディレクトリ構成設計書、移動バッチ計画）が本セクションの入力となる。具体的なディレクトリ構造はPhase 1の依存分析結果に基づいてsection-04で決定されるため、本セクションでは移動の手順・検証方法・周辺ファイルの更新方法を詳述する。

## テスト方針

ファイル移動は純粋なリネーム操作であり、JSコードの内容を変更しないため、新規テストの作成は不要。代わりに、各移動バッチ完了後に以下の回帰テストを実施する。

### 回帰テスト（各移動バッチ後に実行）

```
# Test: 各移動バッチ後にcreate_tests.shが正常にAll.test.jsを生成
#   → ./create_tests.sh を実行し、All.test.js が生成されることを確認
#   → 生成されたAll.test.jsのファイルサイズが移動前と同等であることを確認

# Test: 各移動バッチ後にJestテストがすべてパス
#   → ./run_tests.sh を実行し、全16テストスイートがパスすることを確認

# Test: 各移動バッチ後にDeploy.batが正常に結合JSを生成
#   → Deploy.batを実行し、各ページ用の結合JSが生成されることを確認
#   → 結合JSのファイルサイズが移動前と同等であることを確認（内容が同じことの間接確認）

# Test: 各移動バッチ後に本番7ページがブラウザで正常動作
#   → 以下の各HTMLファイルをブラウザで開き、ページが正常にロード・動作することを確認:
#     - AetherRaidSimulator.html
#     - ArenaSimulator.html
#     - SummonerDuelsSimulator.html
#     - DamageCalculator.html
#     - UnitBuilder.html
#     - StatusCalculator.html
#     - HeroIconLister.html

# Test: Deploy.bat出力のJSファイルサイズが移動前と同等（結合内容が同じことの確認）
#   → 移動前にDeploy.bat出力の各JSファイルのSHA256ハッシュを記録しておく
#   → 移動後のハッシュと比較し、一致することを確認
```

### update_skillsブランチとのコンフリクト確認

```
# Test: git mergeまたはrebase時にSkillImpl系ファイルのコンフリクトが発生しない
#   → SkillImpl系ファイルを移動しない場合、コンフリクトは発生しないはず
#   → 移動する場合は、git mvによるrename検出が正しく機能することを確認

# Test: マージ後にテストがすべてパス
#   → update_skillsブランチとマージし、./run_tests.sh がパスすることを確認
```

## 実装手順

### ステップ0: 移動前のベースライン記録

ファイル移動を開始する前に、以下のベースラインを記録しておく。

1. `./run_tests.sh` を実行し、全テストがパスすることを確認
2. `./create_tests.sh` を実行し、生成される `All.test.js` のファイルサイズとSHA256ハッシュを記録
3. Deploy.batを実行できる環境がある場合、各出力JSのSHA256ハッシュを記録
4. 各HTMLページのブラウザ動作を確認

```bash
# ベースライン記録の例
sha256sum All.test.js > baseline_checksums.txt
```

### ステップ1: ディレクトリ構造の作成

section-04の設計書に基づき、`Sources/`配下にサブディレクトリを作成する。

```bash
# 例（実際の構成はsection-04で決定）
mkdir -p Sources/core
mkdir -p Sources/map
mkdir -p Sources/unit
mkdir -p Sources/combat
mkdir -p Sources/skill/effect
mkdir -p Sources/skill/impl
mkdir -p Sources/data
mkdir -p Sources/ui
mkdir -p Sources/entry
```

ディレクトリ作成のみでコミットする。

### ステップ2: バッチ移動の実行

section-04の移動バッチ計画に従い、依存の強い塊をまとめて移動する。各バッチは以下の手順で実行する。

#### バッチ移動の手順（各バッチ共通）

1. **`git mv`でファイルを移動**
   ```bash
   git mv Sources/TargetFile.js Sources/newdir/TargetFile.js
   ```
   - 必ず `git mv` を使用する（`mv` + `git add` ではなく）
   - Git rename検出の精度を上げるため、ファイルの内容変更は混ぜない

2. **`create_tests.sh`のパスを更新**
   - `SOURCE_FILE_NAMES`配列では、現在ファイル名のみ（パスなし）を列挙し、ループ内で `./Sources/${name}.js` として結合している
   - サブディレクトリに移動した場合、この参照方法を更新する必要がある
   - **方針A**: `SOURCE_FILE_NAMES` にサブディレクトリを含むパスを記載する（例: `core/GlobalDefinitions`）
   - **方針B**: ファイル名とパスの対応表を別途定義する
   - 方針Aが単純で推奨。ループ内のパス結合は `./Sources/${name}.js` のまま維持できる

   ```bash
   # 方針Aの例: create_tests.sh
   SOURCE_FILE_NAMES=(
       core/GlobalDefinitions
       core/Utilities
       core/Logger
       # ...
   )

   # ループは変更不要（パスにサブディレクトリが含まれるため自然に解決）
   for name in ${SOURCE_FILE_NAMES[@]}; do
       cat ./Sources/${name}.js >> ./$TARGET_FILE
   done
   ```

3. **HTMLファイルのスクリプトロードパスを更新**
   - 各HTMLの `loadScripts` 配列内のファイル名にサブディレクトリプレフィクスを追加
   - `jsRootPath` は `"./"` のまま維持（HTMLファイルは `Sources/` 直下に残る）
   - ファイル名の参照形式: `"core/GlobalDefinitions.js"` のように変更

   ```javascript
   // 変更前
   "GlobalDefinitions.js",
   // 変更後
   "core/GlobalDefinitions.js",
   ```

   - 8つのHTMLファイルすべてで同じ更新が必要:
     - `/Users/studio/Documents/GitHub/FehBattleSimulator/Sources/AetherRaidSimulator.html`
     - `/Users/studio/Documents/GitHub/FehBattleSimulator/Sources/ArenaSimulator.html`
     - `/Users/studio/Documents/GitHub/FehBattleSimulator/Sources/SummonerDuelsSimulator.html`
     - `/Users/studio/Documents/GitHub/FehBattleSimulator/Sources/DamageCalculator.html`
     - `/Users/studio/Documents/GitHub/FehBattleSimulator/Sources/UnitBuilder.html`
     - `/Users/studio/Documents/GitHub/FehBattleSimulator/Sources/StatusCalculator.html`
     - `/Users/studio/Documents/GitHub/FehBattleSimulator/Sources/HeroIconLister.html`
     - `/Users/studio/Documents/GitHub/FehBattleSimulator/Sources/HeroStatusClusterer.html`

4. **`Deploy.bat` / `MergeSources.bat`のパスを更新**

   **重要な制約**: `MergeSources.bat`（`/Users/studio/Documents/GitHub/FehBattleSimulator/MergeSources.bat`）はファイル参照を以下のようにハードコードしている:
   ```bat
   type %~dp0Sources\%%n.js>>%output_js%
   ```
   この `Sources\%%n.js` というパターンは、ファイルが `Sources/` 直下にあることを前提としている。

   **対処方法**: `MergeSources.bat` のファイル参照パターンを、サブディレクトリ付きファイル名に対応できるよう修正する。`Deploy.bat`側のファイル名リストにサブディレクトリを含める:

   ```bat
   rem Deploy.bat の変更例
   set BF=core\GlobalDefinitions,core\Utilities,core\Logger,...
   ```

   `MergeSources.bat` のファイルパス結合は `Sources\%%n.js` のままで、`%%n` に `core\GlobalDefinitions` のようなサブパスが入ることで `Sources\core\GlobalDefinitions.js` と解決される。この方式なら `MergeSources.bat` 自体の変更は不要。

   **検証**: ファイル名にバックスラッシュ区切りのサブパスを渡した場合に `type` コマンドが正しく動作するか、事前にテストする。

5. **`Local.js`のパスを更新**
   - `SKILL_EFFECT_FILES` と `SKILL_IMPL_FILES` のファイル名にサブディレクトリプレフィクスを追加

   ```javascript
   // 変更前
   const SKILL_EFFECT_FILES = [
       "SkillEffectCore.js",
       // ...
   ];
   // 変更後
   const SKILL_EFFECT_FILES = [
       "skill/effect/SkillEffectCore.js",
       // ...
   ];
   ```

   ファイルパス: `/Users/studio/Documents/GitHub/FehBattleSimulator/Sources/Local.js`

6. **テスト実行 + ブラウザ確認**
   ```bash
   cd /Users/studio/Documents/GitHub/FehBattleSimulator
   ./run_tests.sh
   ```
   - 全テストスイートがパスすることを確認
   - ブラウザで本番7ページの起動を確認

7. **コミット**
   - バッチ単位でコミットする
   - コミットメッセージ例: `refactor(structure): core層ファイルをSources/coreに移動`

### ステップ3: SkillImpl系ファイルの取り扱い

`update_skills`ブランチとのコンフリクトを最小化するため、SkillImpl系ファイルの扱いには特別な注意が必要。

**対象ファイル**（頻繁に変更される）:
- `SkillImpl.js`
- `SkillImpl202408.js`
- `SkillImpl202501.js`
- `SkillImpl202601.js`
- `SkillEffectAliases.js`
- `CustomSkill.js`

**推奨方針**: 可能であればSkillImpl系ファイルは `Sources/` 直下に維持し、移動しない。これにより `update_skills` ブランチとのコンフリクトを完全に回避できる。

**移動する場合の注意点**:
- 移動バッチの最後に実施する
- `git mv`を徹底してrename検出を確実にする
- 移動後すぐに `update_skills` ブランチとのマージテストを実施する
- フォーマット変更（空行追加、インデント変更など）を絶対に混ぜない

### ステップ4: HTMLファイルとLocal.jsの位置

HTMLファイル（8ファイル）と `Local.js` は `Sources/` 直下に残す。理由:
- HTMLファイルはブラウザで直接開くため、パスの起点となる
- `Local.js` は `<script src="Local.js">` としてHTML内で参照される
- `Deploy.bat` がHTMLファイルのコピー先を `Sources/%%n.html` として参照している

同様に、`GlobalDefinitions_Debug.js` も `Sources/` 直下に残す（HTMLから直接参照されるため）。

### ステップ5: エントリポイント（*Main.js）の取り扱い

各ページ固有のエントリポイントファイル:
- `AetherRaidSimulatorMain.js`
- `ArenaSimulatorMain.js`
- `SummonerDuelsSimulatorMain.js`
- `DamageCalculatorMain.js`
- `UnitBuilderMain.js`
- `StatusCalcMain.js`
- `HeroIconListerMain.js`
- `HeroStatusClustererMain.js`

これらは対応するHTMLファイルと同じディレクトリ（`Sources/` 直下）に残すか、`Sources/entry/` のようなサブディレクトリにまとめるかをsection-04の設計に従って決定する。

## 更新対象ファイル一覧

| ファイル | 更新内容 |
|---------|---------|
| `/Users/studio/Documents/GitHub/FehBattleSimulator/create_tests.sh` | `SOURCE_FILE_NAMES`のパスにサブディレクトリを追加 |
| `/Users/studio/Documents/GitHub/FehBattleSimulator/Sources/Local.js` | `SKILL_EFFECT_FILES`/`SKILL_IMPL_FILES`のパスにサブディレクトリを追加 |
| `/Users/studio/Documents/GitHub/FehBattleSimulator/Deploy.bat` | ファイル名リストにサブディレクトリを追加 |
| `/Users/studio/Documents/GitHub/FehBattleSimulator/MergeSources.bat` | 変更不要の見込み（サブパス付きファイル名で自然に解決） |
| `/Users/studio/Documents/GitHub/FehBattleSimulator/Sources/AetherRaidSimulator.html` | `loadScripts`配列のパス更新 |
| `/Users/studio/Documents/GitHub/FehBattleSimulator/Sources/ArenaSimulator.html` | `loadScripts`配列のパス更新 |
| `/Users/studio/Documents/GitHub/FehBattleSimulator/Sources/SummonerDuelsSimulator.html` | `loadScripts`配列のパス更新 |
| `/Users/studio/Documents/GitHub/FehBattleSimulator/Sources/DamageCalculator.html` | `loadScripts`配列のパス更新 |
| `/Users/studio/Documents/GitHub/FehBattleSimulator/Sources/UnitBuilder.html` | `loadScripts`配列のパス更新 |
| `/Users/studio/Documents/GitHub/FehBattleSimulator/Sources/StatusCalculator.html` | `loadScripts`配列のパス更新 |
| `/Users/studio/Documents/GitHub/FehBattleSimulator/Sources/HeroIconLister.html` | `loadScripts`配列のパス更新 |
| `/Users/studio/Documents/GitHub/FehBattleSimulator/Sources/HeroStatusClusterer.html` | `loadScripts`配列のパス更新 |

## 重要な技術的注意点

### MergeSources.batのパス解決

`MergeSources.bat` は `%~dp0Sources\%%n.js` でファイルを参照する。`%%n` にサブディレクトリパスを含める場合（例: `core\GlobalDefinitions`）、Windowsの `type` コマンドが `Sources\core\GlobalDefinitions.js` を正しく解決できるかを事前に検証すること。Windowsのバッチファイルではバックスラッシュ区切りのパスが標準であり、通常は問題ないが、カンマ区切りのパラメータ渡しで区切り文字との競合がないかも確認する。

### loadScriptsのパス解決

HTMLファイル内の `loadScripts` 関数は、`jsRootPath`（デフォルト `"./"` ）にファイル名を結合してスクリプトをロードする。HTMLファイルが `Sources/` 直下にあるため、`"./core/GlobalDefinitions.js"` は `Sources/core/GlobalDefinitions.js` に解決される。この動作は問題ない。

### create_tests.shのパス解決

`create_tests.sh` のループは `./Sources/${name}.js` でファイルを結合する。`name` に `core/GlobalDefinitions` のようなサブパスが入ると `./Sources/core/GlobalDefinitions.js` に解決される。bashではスラッシュ区切りなので問題ない。

### GitのRename検出

`git mv` を使用すること。ファイル内容の変更を同時に行わないこと（rename検出の精度が落ちる）。1バッチあたりの移動ファイル数が多すぎると `git diff --find-renames` のしきい値に影響する場合があるが、通常のバッチサイズ（5-15ファイル程度）では問題ない。

## コンフリクト対策の具体的手順

### マージ手順のドキュメント化

Phase 2a完了後に`update_skills`ブランチとマージする際の手順:

1. 移行ブランチで全テストがパスすることを確認
2. `update_skills`ブランチの最新をfetch
3. `git merge update_skills` または `git rebase update_skills` を実行
4. コンフリクトがある場合:
   - SkillImpl系: `update_skills`側の内容変更を採用し、パスのみ移行ブランチ側に合わせる
   - `create_tests.sh`, `Local.js`, HTML: 移行ブランチ側のパス構成を維持しつつ、新規ファイル追加を反映
5. マージ後に `./run_tests.sh` で全テストパスを確認
6. ブラウザで本番7ページの動作確認

### コンフリクト期間の短縮

Phase 2aのファイル移動は集中的に実施し、早期完了を目指す。移動バッチ間で長い期間を空けないこと。理想的には1-2日で全バッチを完了する。

## 成果物

- 新しいディレクトリ構成に移動されたJSファイル群
- 更新された `create_tests.sh`（パス更新済み）
- 更新された全HTMLファイル（`loadScripts`配列のパス更新済み）
- 更新された `Deploy.bat`（ファイル名リストのパス更新済み）
- 更新された `Local.js`（`SKILL_EFFECT_FILES`/`SKILL_IMPL_FILES`のパス更新済み）
- 移動前後のベースライン比較結果（`All.test.js`サイズ、Deploy.bat出力ハッシュ）