# Phase 4: ESM循環依存解消・import補完

## ゴール

全ソースファイルが正規のESMモジュールとして動作し、**Vite dev server（`npm run dev`）でブラウザ上の動作確認が可能な状態**にする。

## 前提条件（全て完了済み）

- Phase 2: ESM移行（import/export文の追加）
- Phase 3: Vite/Vitest/Vue 3移行、jQuery削除、CI整備
- Jest/create_tests.sh は削除済み
- CI は Vitest ベース
- テスト500件パス、`vite build` 成功

## 現状の問題

### 1. import漏れ

Phase 2 でファイルにimport/export文が追加されたが、**全シンボル参照に対応するimportが揃っていない**。741件の不足importが25ファイルに存在する。

旧来の連結方式ではグローバルスコープ共有で動作していたが、ESMでは各ファイルが独立モジュールのため `ReferenceError` が発生する。

#### 規模

| カテゴリ | ファイル数 | 不足import数 |
|----------|-----------|-------------|
| 大規模（50+件） | 4 | CustomSkill.js(172), BattleSimulatorBase.js(149), AppData.js(96), Unit.js(70) |
| 中規模（10-49件） | 8 | DamageCalculatorWrapper.js(31), SkillEffect.js(29), SkillEffectBattleContext.js(29), SkillEffectRegistrar.js(28), BattleMap.js(25), Skill.js(19), Tile.js(17), VueComponents.js(17) |
| 小規模（1-9件） | 13 | 残り13ファイル（1〜16件ずつ） |

詳細: `docs/issues/esm-missing-imports.md`

### 2. 循環依存

単純にimport文を追加すると、以下の循環が発生しモジュール初期化が失敗する。

#### 確認済みの循環パス

```
Logger.js → Utilities.js → Unit.js → Skill.js → SkillEffect.js → SkillEffectCore.js → Logger.js
```

#### 主な双方向参照

| ファイルA | ↔ | ファイルB | 参照内容 |
|-----------|---|-----------|----------|
| Skill.js | ↔ | SkillEffect.js | StatusEffectType ↔ DSLノード群 |
| Skill.js | ↔ | Unit.js | SkillInfo ↔ Unit |
| Unit.js | ↔ | SkillEffect.js | Unit ↔ エフェクトノード |
| Unit.js | ↔ | SkillEffectHooks.js | Unit ↔ フック群 |
| SkillEffect.js | ↔ | SkillEffectBattleContext.js | DSLノード ↔ 戦闘DSLノード |
| SkillEffectCore.js | ↔ | CustomSkill.js | コアノード ↔ カスタムスキル |
| Logger.js | → | Utilities.js | static初期化子でObjectUtil使用 |

### 3. テストの実行方式

現在 `vitest.setup.js` が `vm.runInThisContext` を使って全ソースファイルを連結・評価する方式でテストを実行している。循環依存が解消されたら、各テストファイルが直接ESM importする方式に切り替える必要がある。

## 解消戦略

### レイヤーアーキテクチャ

ファイルを責務別のレイヤーに分類し、**上位→下位のみ参照可**の制約を導入する。

```
Layer 0 (Base):      GlobalDefinitions, Utilities (core), Logger (core)
Layer 1 (Constants): SkillConstants, HeroInfoConstants, UnitConstants
Layer 2 (Models):    Skill (data), HeroInfo, Tile, Cell, BattleMapElement, Structures, Table
Layer 3 (Entities):  Unit, BattleContext, UnitManager, BattleMap, GlobalBattleContext
Layer 4 (Logic):     DamageCalculator, DamageCalculatorWrapper, 各SkillHandler
Layer 5 (DSL):       SkillEffectCore, SkillEffectEnv, SkillEffect, SkillEffectField,
                     SkillEffectUnit, SkillEffectBattleContext, SkillEffectHooks,
                     SkillEffectRegistrar, SkillEffectAliases
Layer 6 (Impl):      SkillImpl群, CustomSkill
Layer 7 (App):       AppData, BattleSimulatorBase, VueComponents, DialogUtil, store
Layer 8 (Entry):     ArenaSimulatorMain, AetherRaidSimulatorMain, etc.
```

### 解消手法

#### 1. 共通定数モジュールへの抽出

複数レイヤーから参照される定数・Enumを専用ファイルに移動する。

対象候補:
- `StatusIndex` — 8ファイルから参照（現在 Skill.js にある）
- `StatusEffectType` — 7ファイルから参照（現在 Skill.js にある）
- `ColorType` — SkillConstants.js にある（Layer 1、問題少）

#### 2. ファイル分割

大きすぎるファイルが複数レイヤーの責務を持っているために循環が生じる。

**Skill.js → 分割候補:**
- スキルデータ構造（Layer 2）
- StatusEffectType等の列挙型 → Layer 1 に移動
- UI/表示関連コード → 上位レイヤー

**Unit.js → 分割候補:**
- Unitクラスのコアプロパティ・状態管理（Layer 3）
- スキル効果適用ロジック → Layer 4+

**Utilities.js → 分割候補:**
- 汎用ユーティリティ（ObjectUtil, MathUtil等） → Layer 0
- ゲーム固有ユーティリティ（Unit/Tile依存） → Layer 3+

#### 3. 遅延初期化・遅延参照

モジュールトップレベルでの即時参照を関数内参照に変更。

```js
// Before: トップレベルで即時実行（循環時にundefined）
static LOG_LEVEL_MAP = ObjectUtil.makeMapFromObj(this.LogLevel);

// After: 遅延初期化
static get LOG_LEVEL_MAP() {
    if (!this._logLevelMap) {
        this._logLevelMap = new Map(Object.entries(this.LogLevel).map(([k, v]) => [v, k]));
    }
    return this._logLevelMap;
}
```

#### 4. 依存分析ツールの活用

既存のnpmツールを導入して循環を検出・可視化する。

- **madge** — `madge --circular Sources/` で循環パスを即座に一覧化。SVG/PNGでグラフ出力も可能
- **dependency-cruiser** — ルールベースでレイヤー間の依存制約を定義・CI検証が可能

まず madge で現状の循環を把握し、解消後は dependency-cruiser でレイヤー制約をCIに組み込む。

#### 5. 機械的import追加

循環が解消されたレイヤーから順に、不足しているimport文を一括追加する。大半は同一パターンの繰り返しなので、スクリプトで自動化可能。

## スコープ

### 含むもの

- 全ソースファイルの循環依存解消
- 741件の不足import補完
- vitest.setup.js の連結方式からESM import方式への切り替え
- Vite dev server でのブラウザ動作確認

### 含まないもの

- HTML側のリファクタリング（`<dialog>`要素への変換等）→ 別フェーズ
- `g_appData` グローバルのDI化 → 別フェーズ（影響範囲が広すぎる）
- ファイル名のリネーム → 不要な変更を避ける

## 成功基準

1. `npm run dev` でVite dev serverが起動し、全8シミュレータがブラウザでエラーなく読み込める
2. `npm test` で全テストがパスする
3. `npm run build` でビルドが成功する
4. `vitest.setup.js` の `vm.runInThisContext` 連結方式が不要になる
5. ソースファイル間に循環依存が存在しない（依存グラフがDAG）

## リスク

- **SkillImpl群は行数が膨大**（合計4万行超）。import追加は機械的だがレビューが困難
- **ファイル分割は既存の動作に影響**。各ステップでテスト全パスを確認する必要がある
- **循環依存の検出漏れ**。テストでは顕在化しないがブラウザでは発生するケースがある（TDZ問題）

## 参考資料

- `docs/planning/phase4/esm-circular-deps-plan.md` — 詳細なリサーチ結果
- `docs/issues/esm-missing-imports.md` — 不足import一覧
- `docs/issues/dialog-native-migration.md` — 別フェーズのHTML改善TODO
