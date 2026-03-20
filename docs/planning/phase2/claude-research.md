# Phase 2 リサーチ結果

## 1. コードベース依存グラフ解析

### ファイル階層（依存の深さ順）

| Tier | レイヤー | ファイル | 循環依存リスク |
|------|---------|---------|---------------|
| 0 | インフラ | GlobalDefinitions, Utilities, Logger, Cell, Table, BattleMapElement, AudioManager | なし |
| 1 | 定数・列挙型 | SkillConstants, UnitConstants, HeroInfoConstants | なし |
| 2 | データ構造 | Tile, Structures, TurnSetting, BattleMapSettings, Skill | なし |
| 3 | 情報クラス | HeroInfo, SkillDatabase, HeroDatabase, SampleSkillInfos, SampleHeroInfos | なし |
| 4 | コアゲーム | Unit, BattleContext, BattleMap, GlobalBattleContext, UnitManager | **Unit↔DamageCalc, Unit↔BattleContext** |
| 5 | スキルDSL | SkillEffectCore, SkillEffectEnv, SkillEffect, SkillEffectField, SkillEffectUnit, SkillEffectBattleContext, SkillEffectHooks, SkillEffectRegistrar, SkillEffectAliases | なし（独立系） |
| 6 | スキル実装 | CustomSkill, SkillImpl, SkillImpl202408, SkillImpl202501, SkillImpl202601 | 副作用（グローバル登録） |
| 7 | 戦闘計算 | DamageCalculationUtility, DamageCalculator, PostCombatSkillHander, DamageCalculatorWrapper, BeginningOfTurnSkillHandler | **DamageCalc↔Unit（高リスク）** |
| 8 | アプリ層 | AppData, SettingManager | 全依存の収束点 |
| 9 | UI・エントリ | Main_ImageProcessing, Main_OriginalAi, Main_MouseAndTouch, BattleSimulatorBase, VueComponents, *Main.js | なし（最上位） |

### 循環依存の詳細

#### 1. Unit.js ↔ DamageCalculator.js（高リスク）
- Unit.js が DamageCalculator の関数を参照
- DamageCalculator.js が Unit クラスを広範に使用
- **解決策**: 型参照のみの依存であれば ESM で問題なし。実行時の相互呼び出しがある場合は、共通インターフェースの抽出または遅延参照（lazy import）が必要

#### 2. Unit.js ↔ BattleContext.js（中リスク）
- Unit が battleContext プロパティとして BattleContext インスタンスを保持
- BattleContext が Unit 型を JSDoc で参照
- **解決策**: BattleContext は Unit への実行時依存が軽微。ESM でも問題なく動作する可能性が高い

#### 3. Unit.js ↔ BattleMap.js（中リスク）
- Unit が placedTile（Tile）を保持
- BattleMap が Unit の配置を管理
- **解決策**: Tile を中間層として分離することで解決可能

### グローバルシングルトン・可変状態

| 変数 | 型 | 定義場所 | 使用箇所 |
|------|-----|---------|---------|
| `g_appData` | AppData | *Main.js | 全体で広範に参照 |
| `g_app` | BattleSimulatorBase 派生 | *Main.js | UI層で参照 |
| `g_idGenerator` | IdGenerator | 不明 | 構造物生成 |
| `g_deffenceStructureContainer` | 構造コンテナ | 不明 | BattleMap関連 |
| `g_offenceStructureContainer` | 構造コンテナ | 不明 | BattleMap関連 |

### 副作用ファイル（ロード時にコード実行）

**SkillImpl*.js** — スキル登録がファイル読み込み時に実行される
```javascript
{
    let skillId = Weapon.SkillName;
    applySkillEffectForUnitFuncMap.set(skillId, function(...) {...});
    SkillEffectRegistrar.registerSkillsDuringCombat(skillId, condition, ...effects);
}
```

- SkillImpl.js → SkillImpl202408.js → SkillImpl202501.js → SkillImpl202601.js の順序が必要
- ESM では `import './SkillImpl.js'` で副作用を発火させる
- Rollup/Vite の tree-shaking で除去されないよう `sideEffects` 設定が必要

### グローバルスキルマップ・フック（30+）

SkillImpl.js で使用されるグローバルマップ:
- `applySkillEffectForUnitFuncMap`, `applySkillEffectForAtkUnitFuncMap`, `applySkillEffectForDefUnitFuncMap`
- `hasTransformSkillsFuncMap`, `canActivateCantoFuncMap`
- `applySkillForBeginningOfTurnFuncMap`
- その他多数

SkillEffectHooks.js で定義されるフック:
- `AT_START_OF_COMBAT_HOOKS`, `AT_START_OF_TURN_HOOKS`, `AFTER_COMBAT_HOOKS`
- 約25個のフックオブジェクト

---

## 2. Web調査結果

### 2.1 グローバル→ESM段階的移行パターン

#### 推奨アプローチ: ボトムアップ（葉から）移行

1. **依存グラフをマッピング**: `madge` または `dependency-cruiser` を使用
2. **葉ファイルから変換**: ユーティリティ、定数など
3. **ブリッジパターン**: 移行期間中、ESM の export を window にも公開
   ```javascript
   // utils.js（ESM化済み）
   export function calculateDamage(atk, def) { ... }

   // bridge.js（未変換ファイル向け）
   import { calculateDamage } from './utils.js';
   window.calculateDamage = calculateDamage;
   ```
4. **上位層に向かって変換を進める**

#### 移行期間の混在対応

- バンドラーを早期導入すれば、`import`/`export` 構文を使いつつ単一結合ファイルを出力できる
- `<script type="module">` は deferred 実行されるため、従来の `<script>` との混在に注意

#### 依存グラフ解析ツール

| ツール | 用途 |
|--------|------|
| **madge** | 循環依存の検出、依存グラフの可視化 (`npx madge --circular Sources/`) |
| **dependency-cruiser** | ルールベースの依存関係検証、CI統合 |

#### よくある落とし穴

1. **実行順序の変化**: `<script type="module">` は deferred
2. **循環依存**: グローバルスコープでは問題にならないが ESM では問題になる
3. **`this` の変化**: クラシックスクリプトでは `window`、ESM では `undefined`
4. **副作用ファイル**: 明示的に import しないと実行されない
5. **一括移行の試み**: 小さな PR で段階的に進めるべき

### 2.2 Rollup/Vite IIFE出力設定

#### Vite ライブラリモード

```javascript
// vite.config.js
export default defineConfig({
  build: {
    rollupOptions: {
      input: {
        arena: 'Sources/ArenaSimulatorMain.js',
        duels: 'Sources/SummonerDuelsSimulatorMain.js',
      },
      output: {
        format: 'iife',
        dir: 'dist',
        entryFileNames: '[name].js',
      },
    },
  },
});
```

#### 副作用モジュールの処理

```json
// package.json
{
  "sideEffects": ["Sources/SkillImpl*.js"]
}
```

エントリポイントで明示的にインポート:
```javascript
import './SkillImpl.js';
import './SkillImpl202408.js';
```

Rollup の treeshake 設定:
```javascript
treeshake: {
  moduleSideEffects: (id) => id.includes('SkillImpl'),
}
```

#### `extend: true` オプション

```javascript
output: {
  format: 'iife',
  name: 'window',
  extend: true,  // 既存の window に追加（新しいスコープで包まない）
}
```

現在のファイル結合と非常に似た出力が得られる。

### 2.3 Jest → Vitest 移行

#### 主要な違い

| 機能 | Jest | Vitest |
|------|------|--------|
| ESM | 実験的 | ネイティブ |
| 速度 | 遅め | 高速 |
| グローバル | `jest.fn()` | `vi.fn()` (`globals: true` で互換) |
| jsdom | 組み込み | 組み込み |

#### Vitest 設定例

```javascript
// vitest.config.js
export default defineConfig({
  test: {
    environment: 'jsdom',
    globals: true,        // describe, it, expect をインポート不要に
    include: ['Tests/**/*.test.js'],
    setupFiles: ['./Tests/setup.js'],
  },
});
```

#### 並行移行（推奨）

Jest と Vitest を同時に動かすことが可能:
```json
{
  "scripts": {
    "test:jest": "jest",
    "test:vitest": "vitest run",
    "test": "npm run test:jest && npm run test:vitest"
  }
}
```

1. 既存テストは Jest のまま維持
2. ESM 化したファイルの新テストを Vitest で作成
3. 段階的に既存テストも Vitest に移行
4. 全移行完了後に Jest を削除

#### API 変更

```javascript
jest.fn()     → vi.fn()
jest.mock()   → vi.mock()
jest.spyOn()  → vi.spyOn()
```

`globals: true` を設定すれば `describe`, `it`, `expect` は変更不要。

---

## 3. テスト基盤の現状

### 現在の構成
- `create_tests.sh`: 46ソースファイル + 15テストファイルを結合 → `All.test.js`
- Jest + jsdom 環境
- カテゴリ別テスト実行: `skill`, `combat`, `dsl`, `infra`
- Phase 0 で追加したスモークテスト: グローバル変数チェック、スキル登録チェック

### テストカバレッジ
- 戦闘ロジック: 良好（~980行）
- スキルDSL: 良好（~1,265行）
- UI・初期化: ゼロ
- 合計305テスト

---

## 4. 推奨移行順序まとめ

| 順序 | 内容 | リスク |
|------|------|--------|
| 1 | Tier 0（Utilities, Logger, Cell, Table等）をESM化 | 低 |
| 2 | Tier 1-2（定数・データ構造）をESM化 | 低 |
| 3 | Tier 5（SkillEffect* DSL基盤）をESM化 | 低（独立系） |
| 4 | Tier 3（HeroInfo, Database類）をESM化 | 低〜中 |
| 5 | build.mjs を Rollup/Vite build に切り替え | 中（ここでバンドラー導入） |
| 6 | Tier 4（Unit, BattleContext, BattleMap）をESM化 | **高**（循環依存） |
| 7 | Tier 6（SkillImpl* 副作用モジュール）をESM化 | 中（副作用処理） |
| 8 | Tier 7（DamageCalculator等）をESM化 | **高**（Unit↔DamageCalc循環） |
| 9 | Tier 8-9（AppData, UI, Entry）をESM化 | 中 |
| 10 | テスト基盤を Vitest に移行 | 中 |
