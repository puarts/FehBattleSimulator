I now have sufficient context. Let me write the section content.

# Section 09: SkillImpl*ファイルのimport追加

## 実装結果

**ステータス**: 完了

### 実際のimport追加数
| ファイル | 既存import | 追加import | 合計 |
|----------|-----------|-----------|------|
| SkillImpl202601.js | 30 | 266 (265 + X) | 296 |
| SkillImpl202501.js | 33 | 940 | 973 |
| SkillImpl202408.js | 29 | 569 | 598 |
| SkillImpl.js | 99 | 62 | 161 |

### 実装方法
- `find-missing-imports.mjs`スクリプトで全exportシンボルをマッピングし、各ファイル内の未import参照を自動検出
- `inject-imports.mjs`で不足importを自動注入
- `consolidate-imports.mjs`で同一ソースからの重複importブロックを統合
- 循環依存チェック（madge）: 問題なし

### 発見した問題と対処
1. **`X`（1文字export）のフィルタリング**: importスキャナが`symbol.length < 2`の短い名前をスキップしていたため、`X`（XNumberNode, SkillEffectCore.jsからexport）が漏れた。ESMとグローバル連結の間でinstanceof不一致が発生（cross-realm問題）。`X`を明示的にimportして解決。
2. **import統合**: コードレビューで指摘された重複importブロックを統合（SkillImpl.jsは29ブロック→1ブロックに統合）

### テスト
- `Tests/SkillImplImports.test.js`: 動的importで各ファイルのESMモジュール評価を検証（4/4パス）
- 全テストスイート: 633/634パス（1件はDamageCalculatorの既知タイムアウト）

## 概要

4つのSkillImpl系ファイル（合計約24,000行）に不足しているESM importを追加する。これらのファイルは既にいくつかのimportを持っているが、連結方式（`vitest.setup.js`の`vm.runInThisContext`）によってグローバルスコープに展開されたシンボルに暗黙的に依存しており、大量のDSLシンボル・クラス・定数のimportが不足している。

## 依存関係

- **前提**: section-05-unexported-symbols（未エクスポートシンボルの対処が完了していること）
- **前提**: section-02-merge-unit, section-03-merge-field（SkillEffectUnit.js, SkillEffectField.jsがSkillEffect.jsに統合済みであること）
- **後続**: section-11-test-esm（全ソースファイルのimport完備後にテストをESM化）

## 対象ファイル

| ファイル | 行数（概算） | 既存import行数 | 不足import数（概算） |
|----------|-------------|---------------|---------------------|
| `/Users/studio/Documents/GitHub/FehBattleSimulator/Sources/SkillImpl202601.js` | ~1,950 | 8 | ~200 |
| `/Users/studio/Documents/GitHub/FehBattleSimulator/Sources/SkillImpl202501.js` | ~15,000 | 9 | ~891 |
| `/Users/studio/Documents/GitHub/FehBattleSimulator/Sources/SkillImpl202408.js` | ~4,000 | 8 | ~548 |
| `/Users/studio/Documents/GitHub/FehBattleSimulator/Sources/SkillImpl.js` | ~3,500 | 30 | ~500 |

## テスト（実装前に作成）

テストファイル: `/Users/studio/Documents/GitHub/FehBattleSimulator/Tests/SkillImplImports.test.js`

各SkillImplファイルが独立したESMモジュールとして評価可能であること（ReferenceErrorなし）を動的importで検証する。

```javascript
import { describe, test, expect } from 'vitest';

describe('SkillImpl* ESM import completeness', () => {
    // 各SkillImplファイルの動的importが成功すること（ReferenceErrorが発生しないこと）
    test('SkillImpl202601.js can be dynamically imported without errors', async () => {
        // 動的importでモジュール評価。import不足があればReferenceErrorで失敗する
        await expect(import('../Sources/SkillImpl202601.js')).resolves.toBeDefined();
    });

    test('SkillImpl202501.js can be dynamically imported without errors', async () => {
        await expect(import('../Sources/SkillImpl202501.js')).resolves.toBeDefined();
    });

    test('SkillImpl202408.js can be dynamically imported without errors', async () => {
        await expect(import('../Sources/SkillImpl202408.js')).resolves.toBeDefined();
    });

    test('SkillImpl.js can be dynamically imported without errors', async () => {
        await expect(import('../Sources/SkillImpl.js')).resolves.toBeDefined();
    });

    // 各ファイルのimport後にスキル登録が正しく行われていることの簡易確認
    // （スキル登録はモジュール評価時の副作用として実行される）
    test('skill registrations are performed after import', async () => {
        // SkillEffectRegistrarのスキル登録がモジュール評価の副作用として実行されることを確認
        // 具体的な検証方法はSkillEffectRegistrarの内部構造に依存する
    });
});
```

**テスト戦略**: これらのテストはimport追加前は全て失敗する（ReferenceErrorで動的importが拒否される）。import追加後に全てパスすることを確認する。

## 実装手順

### 共通方針

1. **処理順序**: 新しいファイルから順に作業する（SkillImpl202601.js -> SkillImpl202501.js -> SkillImpl202408.js -> SkillImpl.js）
2. **importパターンの確立**: 最初のファイル（SkillImpl202601.js）で確立したimportパターンを後続ファイルに適用
3. **DSLシンボルの供給元**: 大部分のDSLシンボルは以下のファイルから供給される
   - `SkillEffect.js` — `UNIT`, `FOE`, `ALLY`, `ALLIES`, `FOES`, `GRANTS_BONUS`, `INFLICTS_PENALTY`, `DEALS_DAMAGE`, `REDUCES_DAMAGE_FROM_FOES_ATTACKS_BY`, `IF_NODE`, `EnvUnitNode`, `TextUnitNode`, その他DSL関数・定数・クラス群
   - `SkillEffectAliases.js` — `IS_TARGET_WITHIN_3_ROWS_OR_3_COLUMNS_CENTERED_ON_SKILL_OWNER_NODE`, `GRANTS_ALL_STATS_PLUS_5_TO_TARGET_DURING_COMBAT_NODE`, `NEUTRALIZES_EFFECTS_THAT_GRANT_SPECIAL_COOLDOWN_CHARGE_PLUS_X`, その他大量の定義済みノード定数
   - `SkillEffectBattleContext.js` — 戦闘コンテキスト関連クラス・ノード（`InflictsStatsMinusOnFoeDuringCombatNode`, `NeutralizesPenaltiesToTargetsStatsNode`, `GrantsGreatTalentsPlusToTargetNode`, `StatsNode`等）
   - `SkillEffectCore.js` — `SkillEffectNode`, `NODE_FUNC`, `NumberNode`, `TRUE_NODE`, `makeArray`, `COND_OP`等（既にimport済みの場合が多い）
   - `SkillEffectHooks.js` — `AT_START_OF_TURN_HOOKS`, `AT_START_OF_COMBAT_HOOKS`, `AFTER_COMBAT_HOOKS`等（既にimport済みの場合が多い）
   - `SkillConstants.js` — `Weapon`, `Support`, `Special`, `PassiveA`-`PassiveX`, `Captain`等（既にimport済み）
   - `StatusConstants.js` — `StatusEffectType`, `StatusIndex`, `GameMode`等
   - `Skill.js` — `getNormalSkillId`, funcMap系変数（SkillImpl.jsで多く使用）
4. **ブラウザ互換性**: Viteビルド前提のためimport/exportのブラウザ互換性は考慮不要

### Step 1: SkillImpl202601.js（~200 missing imports）

**ファイル**: `/Users/studio/Documents/GitHub/FehBattleSimulator/Sources/SkillImpl202601.js`

既存のimport（8行）に加えて、ファイル内で参照されているがimportされていないシンボルを全て特定し、import文を追加する。

**作業手順**:
1. ファイル全体をスキャンし、未import参照シンボルを全てリストアップする
2. 各シンボルの定義元ファイルを特定する（`SkillEffect.js`, `SkillEffectAliases.js`, `SkillEffectBattleContext.js`等）
3. 定義元ファイルごとにgroupedなimport文をファイル先頭に追加する
4. 動的importテストを実行して検証する

**典型的な不足シンボルの例**（ファイル内で使用されているが未import）:
- `UNIT`, `FOE`, `ALLY` — SkillEffect.js
- `GRANTS_BONUS`, `INFLICTS_PENALTY`, `DEALS_DAMAGE`, `REDUCES_DAMAGE_FROM_FOES_ATTACKS_BY` — SkillEffect.js
- `ATK_SPD_DEF_RES`, `ATK_SPD`, `DEF_RES` — SkillEffect.js
- `REDUCES_DAMAGE_FROM_AOE_SPECIALS_BY_X_PERCENT_NODE` — SkillEffectAliases.jsまたはSkillEffectBattleContext.js
- `IS_TARGET_WITHIN_3_ROWS_OR_3_COLUMNS_CENTERED_ON_SKILL_OWNER_NODE` — SkillEffectAliases.js
- `setSpecialCountAndType` — SkillEffectBattleContext.jsまたは他ファイル
- `BOOSTS_DAMAGE_WHEN_SPECIAL_TRIGGERS_NODE` — SkillEffectAliases.jsまたはSkillEffectBattleContext.js

**注意**: 具体的なシンボルと定義元のマッピングは、section-01-investigationの調査結果およびsection-05-unexported-symbolsの完了状態に依存する。実装時にファイル内の全未定義参照を網羅的にスキャンすること。

### Step 2: SkillImpl202501.js（~891 missing imports）

**ファイル**: `/Users/studio/Documents/GitHub/FehBattleSimulator/Sources/SkillImpl202501.js`

最大のファイル（~15,000行）。Step 1で確立したimportパターンをベースに、このファイル固有の追加シンボルを特定してimportする。

**作業手順**: Step 1と同様だが、ファイルサイズが大きいため:
1. まず既存import（9行）を確認
2. ファイル全体の未定義参照をスキャン（ファイルが大きいため、セクションごとに分割してスキャンすることを推奨）
3. Step 1のimportリストをベースに、追加で必要なシンボルを特定
4. import文を追加（50-100行程度のimportブロックになる可能性がある）
5. 動的importテストで検証

**SkillImpl202601.jsとの差分**: SkillImpl202501.jsは`FOR_ALLIES_STATS_SKILLS_USING_STATS_HOOKS`等の追加のHooksを使用している。また、`BEFORE_AOE_SPECIAL_ACTIVATION_CHECK_HOOKS`（SkillImpl202601.jsでは`BEFORE_AOE_SPECIAL_HOOKS`）のように、微妙に異なるHook名を使用している場合がある。

### Step 3: SkillImpl202408.js（~548 missing imports）

**ファイル**: `/Users/studio/Documents/GitHub/FehBattleSimulator/Sources/SkillImpl202408.js`

Step 1-2で確立したパターンを適用する。

**作業手順**: Step 1と同様。

**固有の注意点**: SkillImpl202408.jsは`AFTER_RALLY_SKILL_IS_USED_BY_UNIT_HOOKS`, `AFTER_MOVEMENT_SKILL_IS_USED_BY_UNIT_HOOKS`等の追加Hooksや、`getEmblemHeroSkillId`等の追加ユーティリティ関数をimportしている。未import参照についても同様のパターンの追加シンボルがある可能性がある。

### Step 4: SkillImpl.js（~500 missing imports）

**ファイル**: `/Users/studio/Documents/GitHub/FehBattleSimulator/Sources/SkillImpl.js`

最もレガシーなファイル。他の3ファイルとは異なり、funcMap系の変数を大量にimportして使用するパターンが主流。

**既存import**: 30行（主に`Skill.js`のfuncMap系変数、`SkillConstants.js`、`StatusConstants.js`、`HeroInfoConstants.js`）

**固有の注意点**:
- DSLノード系のシンボルに加えて、funcMap系変数（`applySkillEffectForUnitFuncMap`等）が`Skill.js`から大量にimportされている
- 新しいDSLパターンとレガシーのfuncMap直接操作パターンが混在している
- `MoveType`（`HeroInfoConstants.js`）、`GameMode`（`StatusConstants.js`）等の追加の定数importも必要
- funcMap系の未import参照があれば`Skill.js`からの既存importブロックに追加する

## 共通の注意事項

1. **循環依存の確認**: import追加後に`npx madge --circular Sources/`で新たな循環が発生していないことを確認する。SkillImpl*ファイルはモジュール階層の最上位に位置し、下位モジュールからimportするのみなので、循環は発生しないはずだが念のため確認する。

2. **importの整理方針**: 各ファイルのimportは以下の順序でグループ化する:
   - `SkillConstants.js`（スキルID定数）
   - `StatusConstants.js`（ステータス定数）
   - `HeroInfoConstants.js`（ヒーロー情報定数、必要な場合のみ）
   - `Skill.js`（funcMap系、ユーティリティ関数）
   - `SkillEffectCore.js`（コアクラス）
   - `SkillEffectHooks.js`（フック定数）
   - `SkillEffectRegistrar.js`（登録クラス）
   - `SkillEffect.js`（DSLシンボル、統合後のクラス群）
   - `SkillEffectBattleContext.js`（戦闘コンテキストクラス）
   - `SkillEffectAliases.js`（エイリアス定数）
   - その他

3. **filterImportExportとの互換性**: `vitest.setup.js`の`filterImportExport`は`import`文と`export`文を除去して連結実行する。import行を追加しても除去されるため、過渡期（section-12で連結方式を廃止するまで）の互換性は維持される。

4. **シンボル定義元の特定方法**: 実装時に未定義シンボルを発見した場合、以下の手順で定義元を特定する:
   - `grep -r "export.*シンボル名" Sources/` または Grep ツールで検索
   - `export function シンボル名`、`export class シンボル名`、`export const シンボル名`、`export { ..., シンボル名, ... }` のいずれかのパターンに一致するファイルが定義元
   - section-05で追加されたexportも対象に含まれる

5. **大量importの効率的な作業方法**: 特にSkillImpl202501.js（~891 missing）のような大量importが必要なファイルでは:
   - まず他のSkillImpl*ファイル（特にSkillImpl202601.js）のimportリストをコピーしてベースにする
   - その上でファイル固有の追加シンボルを特定して追加する
   - 動的importテストを実行してReferenceErrorが出なくなるまで繰り返す