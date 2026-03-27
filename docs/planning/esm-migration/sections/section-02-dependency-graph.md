Now I have enough context. Let me generate the section content.

# Section 02 — 依存グラフ構築

## Overview

Section-01 で作成した AST 解析ツールの出力（各ファイルの定義シンボル・参照シンボル・副作用分類）を入力として、ファイル間の依存グラフを構築する。循環依存を検出・一覧化し、依存レイヤー図を生成する。HTML エントリポイントの本番/ローカル分類も行う。

**前提**: Section-01 が完了しており、AST 解析スクリプトが各 JS ファイルについて以下の JSON 形式で結果を出力できる状態であること。

```json
{
  "file": "Sources/Unit.js",
  "defines": ["Unit", "MoveType", ...],
  "references": ["BattleContext", "Skill", "g_appData", ...],
  "sideEffects": "pure-definition"
}
```

**成果物**:
- `docs/planning/esm-migration/dependency-graph.md` — ファイル間依存グラフ（テキスト形式）
- 各ファイルの副作用分類表
- 循環依存一覧と対処方針
- 依存レイヤー分類（Layer 0 〜 Layer N）
- HTML エントリポイントの本番/ローカル分類

**依存セクション**: Section-01（AST 解析ツール）
**ブロックするセクション**: Section-03（Strict Mode 準拠化）、Section-04（ディレクトリ設計）

---

## Tests

テストは依存グラフ構築ロジックの正しさを検証する。テストファイルは `Tests/DependencyGraph.test.js` に配置し、`create_tests.sh` の `TEST_FILE_NAMES` には追加しない（ツール専用テストのため、`node --experimental-vm-modules` または直接 Jest で個別実行する）。

### Test 1: 循環依存の正しい検出

```
# Test: 依存グラフが循環依存を正しく検出する
# - A→B→C→A のような循環を検出して一覧化できる
# - 自己参照（A→A）も検出する
# - 循環に関与しないノードを誤検出しない
```

テスト用の小さなグラフデータ（3-5 ファイル分の defines/references）を入力として、循環検出関数が正しい結果を返すことを確認する。

### Test 2: 依存レイヤー分類の正しさ

```
# Test: 依存レイヤー分類が正しい
# - レイヤー0: 他のファイルに依存しないファイル（依存されるだけ）
# - レイヤーN: レイヤーN-1以下のファイルにのみ依存するファイル
# - 循環依存のファイルは同一レイヤーにまとめられる
```

### Test 3: create_tests.sh の順序との整合性

```
# Test: 既知の依存関係（create_tests.shの順序）と矛盾しない
# - create_tests.sh で先にロードされるファイルが、後のファイルに依存していないこと
#   （循環依存の既知パターンを除く）
```

`create_tests.sh` の `SOURCE_FILE_NAMES` 配列の順序は、暗黙的な依存順序を示している。構築した依存グラフがこの順序と大きく矛盾しないことを検証する。

---

## Implementation

### Step 1: 依存グラフ構築スクリプトの作成

ファイル: `Tools/build-dependency-graph.mjs`

Section-01 の AST 解析結果 JSON を読み込み、以下のロジックでファイル間依存グラフを構築する。

**依存の定義**: ファイル A の `references` にシンボル X が含まれ、シンボル X がファイル B の `defines` に含まれる場合、A は B に依存する（A → B）。

**主要関数（スタブ）**:

```javascript
/**
 * AST解析結果の配列からファイル間依存グラフを構築する。
 * @param {Array<{file: string, defines: string[], references: string[], sideEffects: string}>} analysisResults
 * @returns {Map<string, Set<string>>} ファイル名→依存先ファイル名のSet
 */
export function buildDependencyGraph(analysisResults) { /* ... */ }

/**
 * 依存グラフから循環依存を検出する（Tarjanの強連結成分アルゴリズム）。
 * @param {Map<string, Set<string>>} graph
 * @returns {Array<string[]>} 循環に関与するファイルのグループ配列
 */
export function detectCycles(graph) { /* ... */ }

/**
 * 依存グラフからレイヤー分類を生成する。
 * 循環依存のファイルは同一レイヤーとして扱う。
 * @param {Map<string, Set<string>>} graph
 * @param {Array<string[]>} cycles
 * @returns {Map<number, string[]>} レイヤー番号→ファイル名配列
 */
export function classifyLayers(graph, cycles) { /* ... */ }
```

### Step 2: 循環依存の検出と記録

Tarjan の強連結成分（SCC）アルゴリズムを使い、サイズ 2 以上の SCC を循環依存として報告する。

既知の循環パターン（`claude-plan.md` Section 2.5 より）:

| 循環パターン | 現在の緩和 | 将来の対処候補 |
|-------------|-----------|---------------|
| AppData <-> BattleSimulatorBase | g_appData シングルトン | 明示的初期化パターン |
| Unit <-> BattleContext <-> BattleMap | 参照渡し | 型/インターフェース分離 |
| DamageCalculator <-> PostCombatSkillHandler | Wrapper が両方生成 | ファクトリパターン |

Phase 1 では循環依存の **特定と記録** のみを行い、**解消は Phase 2b または将来の ESM 化時** に行う。

### Step 3: 依存レイヤー図の生成

循環依存グループを 1 つのノードに縮約した DAG（有向非巡回グラフ）を作り、トポロジカルソートでレイヤーを割り当てる。

- **Layer 0**: 他のファイルに一切依存しないファイル（例: `GlobalDefinitions.js`, `Utilities.js`, `Logger.js`）
- **Layer N**: Layer 0〜N-1 のファイルにのみ依存するファイル
- **最上位レイヤー**: Main ファイル群（`ArenaSimulatorMain.js` 等）

`create_tests.sh` の `SOURCE_FILE_NAMES` 配列順序は、このレイヤー順序のヒントとなる。構築したレイヤー図が大きく矛盾していないか検証する。

参考: `create_tests.sh` のロード順（先頭が低レイヤー）:

```
GlobalDefinitions → Utilities → Logger → SkillConstants → Skill →
BattleMapElement → Tile → Structures → Cell → Table →
HeroInfoConstants → HeroInfo → UnitConstants → BattleContext → Unit →
UnitManager → BattleMap → GlobalBattleContext →
DamageCalculationUtility → DamageCalculator → PostCombatSkillHander →
DamageCalculatorWrapper → BeginningOfTurnSkillHandler →
SkillDatabase → HeroDatabase → SampleSkillInfos → SampleHeroInfos →
SkillEffectCore → SkillEffectEnv → SkillEffect → SkillEffectField →
SkillEffectUnit → SkillEffectBattleContext → SkillEffectHooks →
SkillEffectRegistrar → SkillEffectAliases → CustomSkill →
SkillImpl → SkillImpl202408 → SkillImpl202501 → SkillImpl202601 →
TestUtilities
```

### Step 4: 副作用分類表の整理

Section-01 の AST 解析で得られた各ファイルの副作用分類（`sideEffects` フィールド）を表形式でまとめる。分類カテゴリは以下の 5 種類:

| カテゴリ | 説明 | 例 |
|---------|------|-----|
| `pure-definition` | クラス/関数/定数の定義のみ | `Utilities.js`, `Logger.js` |
| `global-assignment` | グローバル変数への代入 | `AppData.js`（`g_appData = new AppData()`） |
| `registry-provider` | グローバルレジストリへの登録 | `SkillImpl*.js`（SkillEffectRegistrar への登録） |
| `prototype-extension` | Object.assign による prototype 拡張 | Mixin パターン使用ファイル |
| `initialization-root` | 他の副作用に依存する初期化処理 | Main ファイル群 |

この分類は Phase 2a のディレクトリ設計と将来の ESM 化時の移行順序判断に使用される。

### Step 5: HTML エントリポイントの分類

各 HTML ファイルがどの JS ファイルをロードしているかを解析し、本番/ローカルを分類する。

| HTML ファイル | Deploy.bat 対象 | 分類 |
|-------------|---------------|------|
| AetherRaidSimulator.html | Yes | 本番 |
| ArenaSimulator.html | Yes | 本番 |
| SummonerDuelsSimulator.html | Yes | 本番 |
| DamageCalculator.html | Yes | 本番 |
| UnitBuilder.html | Yes | 本番 |
| StatusCalculator.html | Yes | 本番 |
| HeroIconLister.html | Yes | 本番 |
| HeroStatusClusterer.html | No | 要確認（ローカル専用の可能性） |

各 HTML の `loadScripts()` 配列を解析し、ページごとに必要な JS ファイルのサブセットを記録する。これにより、Phase 2a でパス更新が必要な箇所を漏れなく特定できる。

### Step 6: dependency-graph.md の生成

すべての分析結果を統合し、`docs/planning/esm-migration/dependency-graph.md` として出力する。内容:

1. **ファイル間依存グラフ**（テキスト形式、各ファイルの依存先一覧）
2. **循環依存一覧**（検出されたサイクルと既知パターンとの対応）
3. **依存レイヤー図**（Layer 0 〜 Layer N の分類）
4. **副作用分類表**（全ファイルの分類一覧）
5. **HTML エントリポイント分類**（ページ別 JS ファイルセット）

このドキュメントは Section-03（Strict Mode）と Section-04（ディレクトリ設計）の入力となる。

---

## File Paths Summary

| パス | 操作 |
|------|------|
| `Tools/lib/dependency-graph.js` | 新規作成 — 依存グラフ構築ライブラリ（buildDependencyGraph, detectCycles, classifyLayers） |
| `Tools/build-dependency-graph.js` | 新規作成 — CLIスクリプト（JSON読込→グラフ構築→HTML解析→Markdown出力） |
| `Tools/tests/dependency-graph.test.js` | 新規作成 — グラフ構築ロジックのテスト（13テスト） |
| `docs/planning/esm-migration/dependency-graph.md` | 新規作成 — 分析結果ドキュメント |

**プランからの変更点**:
- `.mjs`（ESM）→ `.js`（CommonJS）: section-01 の既存パターンと統一
- `Tests/` → `Tools/tests/`: ツール専用テストは `Tools/tests/` に配置（section-01 と同様）
- ライブラリ分離: ロジック（`lib/dependency-graph.js`）とCLI（`build-dependency-graph.js`）を分離

---

## Verification Checklist

- [x] `buildDependencyGraph()` が全 64 ファイルの依存関係を正しく構築する（474エッジ検出）
- [x] `detectCycles()` が循環依存を検出する — 39ファイルの巨大SCC 1件として検出。既知3パターンはSCC内の代表的局所循環としてレポートに記載
- [x] `classifyLayers()` の結果が `create_tests.sh` のロード順と概ね整合する（違反率15.3%、20%閾値以内）
- [x] 副作用分類表が全ファイルをカバーしている（64ファイル）
- [x] HTML エントリポイント 8 ファイルすべての JS ロードセットが記録されている（7本番+1ローカル）
- [x] `dependency-graph.md` が生成され、6セクション（依存グラフ、循環依存、レイヤー図、副作用分類、HTMLエントリポイント、サマリー）を含む