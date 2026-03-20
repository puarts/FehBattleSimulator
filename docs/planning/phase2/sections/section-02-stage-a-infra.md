I have enough context. Now I can generate the section content.

# Section 02: Stage A -- インフラ層の ESM 化

## 概要

依存関係を持たない（または最小限の依存のみの）インフラ層ファイル7個に `export` / `import` 文を追加し、ESモジュール化の最初のステップを完了する。

対象ファイル:
- `Sources/Utilities.js`
- `Sources/Logger.js`
- `Sources/Cell.js`
- `Sources/Table.js`
- `Sources/BattleMapElement.js`
- `Sources/AudioManager.js`
- `Sources/GlobalDefinitions.js`

## 前提条件

- **section-01-build-filter が完了していること**: `build.mjs` の `mergeFiles()` 関数と `create_tests.sh` の結合処理に、`import` 行と `export {` 行を除去するフィルタが実装済みであること。このフィルタがないと、export/import 文を追加した時点でテストとビルドが壊れる。

## テスト方針

Stage A のテストは「既存テストが壊れないこと」の回帰確認が主体。各ファイル変換後に `./run_tests.sh` を実行し、全テストがパスすることを確認する。

### テスト項目

```
# Test: Utilities.js -- ObjectUtil, NULL_OBJECT, TreeNode がグローバルに存在する（スモークテストで確認済み）
# Test: Logger.js -- LoggerBase がグローバルに存在する
# Test: Cell.js -- Cell がグローバルに存在する
# Test: Table.js -- Table がグローバルに存在する
# Test: BattleMapElement.js -- BattleMapElement がグローバルに存在する
# Test: GlobalDefinitions.js -- g_siteRootPath 等の定数がグローバルに存在する
```

これらは既存のスモークテストでカバーされている。新規テストの追加は不要。各ファイル変換後に全テストスイートを実行して回帰がないことを確認する。

## コーディング規約（重要）

export/import 文を追加する際、以下のルールを厳守する:

1. **import 文と export 文は必ず1行で記述する**。複数行にまたがる import/export は禁止（結合時のフィルタが行単位で動作するため）。
2. **export スタイル**: ファイル末尾に `export { ... };` でまとめる。インライン export（`export class`, `export function`）は禁止。
3. **import はファイル先頭に記述する**。

```javascript
// OK
import { ObjectUtil } from './Utilities.js';
export { LoggerBase, GroupLog, GroupLogger, SimpleLogger, HtmlLogger, ConsoleLogger, DetailLevel, DetailLabels, DetailUtils };

// NG: 複数行にまたがる
import {
    ObjectUtil,
} from './Utilities.js';

// NG: インライン export
export class LoggerBase { ... }
```

## 実装手順

### ステップ 1: GlobalDefinitions.js

**ファイル**: `/Users/studio/Documents/GitHub/FehBattleSimulator/Sources/GlobalDefinitions.js`

**依存**: なし

**作業**: ファイル末尾に export 文を追加する。import は不要（依存なし）。

**エクスポート対象シンボル**: このファイルは多数のグローバル定数を定義している。以下の全トップレベル `const` を export する:

- `g_siteRootPath`, `g_explicitSiteRootPath`
- `g_imageRootPath`, `g_corsImageRootPath`, `g_audioRootPath`, `g_heroIconRootPath`, `g_skillIconRootPath`, `g_iconRootPath`
- `TurnSettingCookiePrefix`, `UnitCookiePrefix`, `StructureCookiePrefix`, `TileCookiePrefix`, `TurnWideCookieId`
- `NameValueDelimiter`, `ElemDelimiter`, `ValueDelimiter`, `ArrayValueElemDelimiter`
- `DebugModeDefault`, `TabChar`, `G_SKILL_LOG_LEVEL`
- `g_debugImageRootPath`, `g_debugSkillIconRootPath`
- `G_DEV_SKILL_NUM`, `G_WEAPON_ID_BASE`, `G_ASSIST_ID_BASE`, `G_SPECIAL_ID_BASE`, `G_PASSIVE_A_ID_BASE`, `G_PASSIVE_B_ID_BASE`, `G_PASSIVE_C_ID_BASE`, `G_PASSIVE_S_ID_BASE`, `G_PASSIVE_X_ID_BASE`

**確認**: `./run_tests.sh` 実行、全テストパス。

### ステップ 2: Utilities.js

**ファイル**: `/Users/studio/Documents/GitHub/FehBattleSimulator/Sources/Utilities.js`

**依存**: なし（外部ライブラリ `Tesseract`, `cv`, `jQuery` はグローバル前提を維持）

**作業**: ファイル末尾に export 文を追加する。import は不要。

**エクスポート対象シンボル**: このファイルは非常に大きく、多くのクラス・関数・定数を定義している。他ファイルから参照される主要なシンボルを全て export する:

- クラス: `ObjectUtil`, `TreeNode`, `Stack`, `Queue`, `CookieWriter`, `LocalStorageUtil`, `KeyboardManager`, `IdGenerator`, `ObjectStorage`, `StructureContainer`, `ScopedStopwatch`, `ScopedPerformanceTimer`, `Stopwatch`, `Command`, `CommandQueue`, `CommandType`
- 定数: `NULL_OBJECT`, `ErrorCorrectionValue`
- 関数: `sleep`, `startProgressiveProcess`, `using_`, `getFirstElementByTagName`, `distinct`, `distinctStr`, `toBoolean`, `calcDistance`, `boolToInt`, `intToBool`, `calcSimilarity`, `levenshtein`, `cropCanvas`, `manipurateHsv`, `cropAndPostProcessAndOcr`, `executeTesseractRecognize`, `cropAndBinarizeImageAndOcr`, `combineText`, `convertOcrResultToArray`, `getMaxLengthElem`, `getMaxLengthElem2`, `loadImage`, `loadFile`, `loadAndProcessImage`, `matTypeToString`, `getRandomInt`, `selectText`, `importJs`, `dateStrToNumber`, `floorNumberWithFloatError`, `truncNumberWithFloatError`, `roundFloat`, `getIncHtml`, `getSpecialChargedImgTag`, `getDivineVeinTag`, `getDivineVeinImgPath`

全てのトップレベル定義をリストアップして export に含める。実際のファイルを確認して漏れがないようにすること。

**確認**: `./run_tests.sh` 実行、全テストパス。

### ステップ 3: BattleMapElement.js

**ファイル**: `/Users/studio/Documents/GitHub/FehBattleSimulator/Sources/BattleMapElement.js`

**依存**: なし

**作業**: ファイル末尾に export 文を追加する。

**エクスポート対象**: `BattleMapElement`

**確認**: `./run_tests.sh` 実行、全テストパス。

### ステップ 4: Cell.js

**ファイル**: `/Users/studio/Documents/GitHub/FehBattleSimulator/Sources/Cell.js`

**依存**: なし

**作業**: ファイル末尾に export 文を追加する。

**エクスポート対象**: `CellType`, `Cell`

**確認**: `./run_tests.sh` 実行、全テストパス。

### ステップ 5: Table.js

**ファイル**: `/Users/studio/Documents/GitHub/FehBattleSimulator/Sources/Table.js`

**依存**: `Cell.js`（`Cell`, `CellType` を使用）

**作業**:
1. ファイル先頭に import を追加: `import { Cell, CellType } from './Cell.js';`
2. ファイル末尾に export を追加。

**エクスポート対象**: `getCellId`, `getPositionFromCellId`, `updateCellBgColor`, `setCellFocusBorder`, `clearCellFocusStyle`, `BackgroundImageInfo`, `Table`

**確認**: `./run_tests.sh` 実行、全テストパス。

### ステップ 6: Logger.js

**ファイル**: `/Users/studio/Documents/GitHub/FehBattleSimulator/Sources/Logger.js`

**依存**: `Utilities.js`（`ObjectUtil` を使用 -- `LoggerBase` のクラスフィールド初期化で `ObjectUtil.makeMapFromObj` を呼んでいる）

**作業**:
1. ファイル先頭に import を追加: `import { ObjectUtil } from './Utilities.js';`
2. ファイル末尾に export を追加。

**エクスポート対象**: `LoggerBase`, `GroupLog`, `GroupLogger`, `SimpleLogger`, `HtmlLogger`, `ConsoleLogger`, `DetailLevel`, `DetailLabels`, `DetailUtils`

**確認**: `./run_tests.sh` 実行、全テストパス。

### ステップ 7: AudioManager.js

**ファイル**: `/Users/studio/Documents/GitHub/FehBattleSimulator/Sources/AudioManager.js`

**依存**: なし（`g_audioRootPath` はグローバル定数だが、結合モードではグローバルスコープで解決される。ESM ネイティブモードでは `GlobalDefinitions.js` からの import が必要になるが、Phase 2 では結合モードが前提のため、import は追加しない。将来の Phase 3 で対応する）

**注意**: `AudioManager` のコンストラクタで `Queue` クラス（`Utilities.js` 定義）を使用している。ただし、こちらも結合モードで解決されるため、Phase 2 では import を追加しない方針でよい。ネイティブ ESM 検証（section-11）で問題が出た場合に import を追加する。

**作業**: ファイル末尾に export 文を追加する。

**エクスポート対象**: `SoundEffectId`, `BgmId`, `AudioManager`

**確認**: `./run_tests.sh` 実行、全テストパス。

## 最終確認

全7ファイルの変換完了後に以下を確認する:

1. `./run_tests.sh` で全テストがパスする
2. `npm run build` で全シミュレータの JS ファイルが正常に出力される
3. ビルド出力に `^import ` や `^export {` で始まる行が含まれていないこと（section-01 で追加したフィルタが正しく動作していることの確認）

## 変換対象外ファイルに関する注意

Stage A のファイルを import する側のファイル（例: `SkillConstants.js` が `GlobalDefinitions.js` を使用する等）は、この段階では変更しない。それらのファイルへの import 追加は後続セクション（section-03 以降）で行う。

## 他セクションとの依存関係

- **依存**: section-01-build-filter（フィルタが先に必要）
- **ブロック**: section-03（定数層）、section-04（データ構造）、section-05（情報クラス）、section-06（スキルDSL）-- これらは Stage A のファイルを import 元として参照する

## 実装結果

### 最終確認結果
- [x] `./run_tests.sh` で全310テストがパス
- [x] `npm run build` で正常出力
- [x] ビルド出力に import/export 行が含まれていないことを確認

### 実装時の差分（計画との相違点）
- Utilities.js のエクスポートシンボルは計画の列挙（~69個）より多い（~87個）。計画の指示通り、実ファイルの全トップレベル定義を確認して追加した（IterUtil, GeneratorUtil, ArrayUtil, SetUtil, MathUtil, DebugUtil, MapUtil, HtmlLogUtil, Base62, Base62Util, JsonUtil, Query, UnitQuery, TileQuery 等）
- コードレビューで指摘された trailing newline の欠落は既存の問題であり、本セクションのスコープ外として対応なし