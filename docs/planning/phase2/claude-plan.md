# Phase 2 実装計画: ESモジュール化

## 1. 概要

### 目的

FEH Battle Simulator の65個のJSファイル（約12MB）をグローバルスコープ依存から ES Modules（import/export）に段階的に移行する。全ファイルが明示的な依存関係を宣言し、将来の Vite バンドラー導入（Phase 3）の基盤を作る。

### スコープ

- 全65 JSファイルに `export`/`import` 文を追加
- 循環依存の解消（必要なリファクタリング含む）
- 既存のテスト・ビルド・ローカル開発が全て動作し続けること

### スコープ外

- ビルドツール切り替え（build.mjs → Vite build）
- テスト基盤移行（Jest → Vitest）
- Vue 2 → Vue 3 移行
- ローカル開発方式の変更

---

## 2. 互換性戦略

### 問題

現在のプロジェクトは3つの仕組みでJSファイルを消費している:

1. **テスト**: `create_tests.sh` が全ファイルを結合 → Jest 実行
2. **ビルド**: `scripts/build.mjs` が全ファイルを結合 → 1ファイル出力
3. **ローカル開発**: HTML が `loadScripts()` で個別ファイルを `<script>` タグとして動的読み込み

いずれもグローバルスコープ前提。ESM の `export`/`import` 文を追加すると、結合モードや `<script>` タグ読み込みで構文エラーになる。

### 解決策: export は末尾に、import は結合時に除去

#### export の追加方法

ファイル末尾に名前付き export を追加する。結合モード（`<script>` タグ）ではトップレベルの `export` 文は構文エラーになるが、**結合スクリプト（build.mjs, create_tests.sh）側で export 行を除去するフィルタ**を追加することで互換性を維持する。

```javascript
// Utilities.js の末尾
export { ObjectUtil, NULL_OBJECT, TreeNode };
```

#### import の追加方法

ファイル先頭に import 文を追加する。こちらも結合時に除去する。

```javascript
// Logger.js の先頭
import { ObjectUtil } from './Utilities.js';
```

#### コーディング規約（import/export の記述ルール）

**重要**: import 文と export 文は**必ず1行で記述する**。複数行にまたがる import/export は禁止。

```javascript
// OK: 1行で書く
import { Weapon, Support, Special, PassiveA, PassiveB } from './SkillConstants.js';
export { ObjectUtil, NULL_OBJECT, TreeNode };

// NG: 複数行にまたがる（結合時のフィルタが破綻する）
import {
    Weapon,
    Support,
} from './SkillConstants.js';
```

**export スタイル**: 末尾まとめ `export { ... };` に統一。インライン export（`export class`, `export function`）は禁止。

```javascript
// OK: 末尾まとめ export
class MyClass { ... }
function myFunc() { ... }
export { MyClass, myFunc };

// NG: インライン export
export class MyClass { ... }
```

#### 結合スクリプトのフィルタ

`build.mjs` と `create_tests.sh` の結合処理で、`import` 行と `export` 行を除去するフィルタを追加する。1行ルールにより、行単位の単純なフィルタで安全に動作する。

**build.mjs の変更:**
`mergeFiles()` 関数でファイル内容を読み込んだ後、行単位で `import ` で始まる行と `export {` で始まる行を除去。

**create_tests.sh の変更:**
`cat` でファイルを結合する際に `grep -v` で同様のパターンを除去。

**検証**: フィルタ適用後の出力に `import ` / `export {` が残っていないことを確認するテストを追加。

#### ローカル開発（loadScripts）の対応

Phase 2 では**ローカル開発の loadScripts 方式は変更しない**。`<script type="module">` への切り替えはスコープの変更（グローバル → モジュールローカル）を伴い、Vue テンプレートやインラインイベントハンドラが全て壊れるため、Phase 3（Vite dev server 導入）で対応する。

Phase 2 の間、ローカル開発では `npm run build` で結合出力を生成し、結合済みファイルを読み込む方式で開発可能。

#### 外部ライブラリの扱い

Vue 2, jQuery, Select2 等の外部ライブラリは Phase 2 では ESM import しない。CDN からグローバルに読み込まれる前提を維持する。ESLint 用に `/* global Vue, jQuery */` コメントで対応。Phase 3 で npm パッケージからの import に切り替える。

---

## 3. 変換順序

### 原則

- **依存の葉（末端）から上位へ**ボトムアップで変換
- **1ファイルずつ変換 → テスト確認**を繰り返す
- **循環依存のあるファイル群はまとめて変換**（先にリファクタリングで解消してから）

### Stage A: インフラ層（依存なし）

最初に変換するファイル群。他ファイルへの依存がゼロまたは最小。

| ファイル | 定義 | 依存 |
|---------|------|------|
| Utilities.js | ObjectUtil, NULL_OBJECT, TreeNode | なし |
| Logger.js | LoggerBase | Utilities |
| Cell.js | Cell | なし |
| Table.js | Table, BackgroundImageInfo | Cell |
| BattleMapElement.js | BattleMapElement（抽象基底） | なし |
| AudioManager.js | AudioManager | なし |
| GlobalDefinitions.js | 全グローバル定数 | なし |

**作業内容:**
1. 各ファイルの末尾に `export { ... }` を追加
2. 依存があるファイルには先頭に `import { ... } from '...'` を追加
3. build.mjs に import/export 除去フィルタを追加
4. create_tests.sh に同様のフィルタを追加
5. テスト実行して全パスを確認

**注意**: Stage A の最初のファイルを変換する前に、build.mjs と create_tests.sh のフィルタを先に実装する。

### Stage B: 定数・列挙型

| ファイル | 定義 | 依存 |
|---------|------|------|
| SkillConstants.js | Weapon, Support, Special, PassiveA/B/C, SkillType, WeaponType 等 | GlobalDefinitions |
| HeroInfoConstants.js | StatusType, MoveType, BlessingType, SeasonType 等 | SkillConstants, UnitConstants |
| UnitConstants.js | Hero enum, DUO_HERO_SET | SkillConstants |

**注意**: SkillConstants.js は非常に大きなファイル（数千のスキルID定数）。export するシンボルが多いが、末尾にまとめて export する。

### Stage C: データ構造

| ファイル | 定義 | 依存 |
|---------|------|------|
| Tile.js | Tile, TileType, DivineVeinType | BattleMapElement, GlobalDefinitions |
| Structures.js | StructureBase, 各構造物クラス, ObjType | BattleMapElement, GlobalDefinitions |
| BattleMapSettings.js | BattleMapSettings | Tile, BattleMapElement |
| TurnSetting.js | TurnSetting | GlobalDefinitions |
| Skill.js | SkillInfo | SkillConstants, GlobalDefinitions |

### Stage D: 情報クラス・データベース

| ファイル | 定義 | 依存 |
|---------|------|------|
| HeroInfo.js | HeroInfo | Skill, SkillConstants, HeroInfoConstants, UnitConstants |
| SkillDatabase.js | SkillDatabase | Skill, SkillConstants |
| HeroDatabase.js | HeroDatabase | HeroInfo |
| SampleSkillInfos.js | スキルデータ配列 | Skill, SkillConstants |
| SampleHeroInfos.js | ヒーローデータ配列 | HeroInfo, HeroInfoConstants |

### Stage E: スキルDSL基盤

スキルDSLは独立した系統で、コアゲームクラス（Unit, BattleContext）への依存が軽微。先に変換できる。

| ファイル | 定義 | 依存 |
|---------|------|------|
| SkillEffectCore.js | MultiValueMap, SkillEffectHooks クラス | なし |
| SkillEffectEnv.js | NodeEnv | Logger（型参照のみ） |
| SkillEffect.js | SkillEffectNode, SingleEffectNode, EffectsNode | Logger, Utilities |
| SkillEffectField.js | SkillEffectField, SkillEffectFieldNode | SkillEffect |
| SkillEffectUnit.js | UNIT, FOE, ALLY 等のユニット指定子 | SkillEffect, SkillEffectEnv |
| SkillEffectBattleContext.js | BattleContext フィールド変更ノード | SkillEffectField |
| SkillEffectHooks.js | 25+のグローバルフックインスタンス | SkillEffectCore |
| SkillEffectRegistrar.js | SkillEffectRegistrar | SkillEffectCore, SkillEffectHooks |
| SkillEffectAliases.js | GRANTS_BONUS, INFLICTS_PENALTY, ATK_SPD 等 | 全 SkillEffect* ファイル |

### Stage F: コアゲームクラス（循環依存の解消が必要）

ここが最も複雑なステージ。Unit.js は DamageCalculator.js, BattleContext.js, BattleMap.js と相互参照がある。

#### F-1. 循環依存の解析と解消

変換前に、実際の循環依存を詳細に解析する:

1. **Unit.js が DamageCalculator.js から使うもの**: 関数参照か、型参照のみか
2. **DamageCalculator.js が Unit.js から使うもの**: Unit クラスのインスタンスメソッド・プロパティ

ESM の循環依存は「実行時に相手のエクスポートが undefined になる」問題。以下の手法で解消:

- **型参照のみの循環**: ESM では問題にならない（初期化後にアクセスするため）
- **初期化時の相互参照**: 共通の型/インターフェースを別ファイルに抽出
- **実行時の相互呼び出し**: 遅延参照（関数内で動的にアクセス）で解消

#### F-2. コアクラスの変換

| ファイル | 定義 | 主要依存 |
|---------|------|---------|
| BattleContext.js | BattleContext | Utilities |
| GlobalBattleContext.js | GlobalBattleContext | なし |
| UnitManager.js | UnitManager | Unit |
| Unit.js | Unit, AttackableUnitInfo 等 | HeroInfo, Tile, BattleContext, SkillConstants |
| BattleMap.js | BattleMap, MapType | Tile, Structures, Unit, BattleMapSettings |

### Stage G: スキル実装（副作用モジュール）

| ファイル | 種類 | 依存 |
|---------|------|------|
| CustomSkill.js | カスタムスキル登録 | Unit, SkillDatabase |
| SkillImpl.js | レガシースキル実装 | SkillConstants, SkillEffectHooks, グローバルマップ |
| SkillImpl202408.js | 2024-08+ | SkillEffectAliases, SkillEffectRegistrar |
| SkillImpl202501.js | 2025-01+ | 同上 |
| SkillImpl202601.js | 2026-01+ | 同上 |

**副作用モジュールの扱い:**

SkillImpl ファイルはスキルをグローバルマップ/フックに登録する副作用コードが主体。ESM 化後は:

```javascript
// SkillImpl202601.js の先頭
import { Weapon, Special, PassiveA } from './SkillConstants.js';
import { SkillEffectRegistrar } from './SkillEffectRegistrar.js';
import { TRUE_NODE, GRANTS_BONUS, ATK_SPD, UNIT, FOE } from './SkillEffectAliases.js';
// ...

// 既存のスキル登録コードはそのまま
{
    const skillId = Weapon.HeroicMaltet;
    SkillEffectRegistrar.registerSkillsDuringCombat(skillId, TRUE_NODE,
        GRANTS_BONUS(ATK_SPD(5)).to(UNIT),
    );
}
```

export は不要（副作用のみ）。ただし、SkillImpl.js が定義するグローバルマップ（`applySkillEffectForUnitFuncMap` 等）は export が必要。

**update_skills ブランチとのコンフリクト対策:**

SkillImpl ファイルは頻繁に更新される。ESM 化で追加される import 文はファイル先頭に集約されるため、スキル実装の追加（ファイル末尾）とのコンフリクトは最小限。

### Stage H: 戦闘計算

| ファイル | 定義 | 主要依存 |
|---------|------|---------|
| DamageCalculationUtility.js | ダメージ計算ユーティリティ | Unit, BattleContext |
| DamageCalculator.js | DamageCalculator, CombatResult | Unit, BattleContext, SkillImpl |
| PostCombatSkillHander.js | PostCombatSkillHander | Unit, DamageCalculator, BattleMap |
| DamageCalculatorWrapper.js | DamageCalculatorWrapper | DamageCalculator, PostCombatSkillHander |
| BeginningOfTurnSkillHandler.js | BeginningOfTurnSkillHandler | Unit, BattleMap, SkillEffectHooks |

### Stage I: アプリ層

| ファイル | 定義 | 主要依存 |
|---------|------|---------|
| AppData.js | AppData | UnitManager, HeroDatabase, SkillDatabase, BattleMap, GlobalBattleContext |
| SettingManager.js | SettingManager | AppData, Unit, TurnSetting |
| AetherRaidDefensePresets.js | プリセットデータ | Unit, HeroInfo |

### Stage J: UI・エントリポイント

| ファイル | 定義 | 主要依存 |
|---------|------|---------|
| Main_ImageProcessing.js | 画像処理 | なし（外部ライブラリ） |
| Main_OriginalAi.js | AI ロジック | Unit, DamageCalculator, BattleMap |
| Main_MouseAndTouch.js | マウス/タッチ | BattleSimulatorBase |
| KeyRepeatHandler.js | キー入力 | BattleSimulatorBase |
| BattleSimulatorBase.js | BattleSimulatorBase | AppData, DamageCalculatorWrapper 等 |
| VueComponents.js | Vue コンポーネント | BattleSimulatorBase, AppData |
| ArenaSimulatorMain.js | ArenaSimulator, g_app | BattleSimulatorBase |
| AetherRaidSimulatorMain.js | AetherRaidSimulator, g_app | BattleSimulatorBase |
| SummonerDuelsSimulatorMain.js | SummonerDuelsSimulator, g_app | BattleSimulatorBase |
| UnitBuilderMain.js | UnitBuilder | AppData, Unit |
| StatusCalcMain.js | StatusCalculator | AppData, Unit |
| DamageCalculatorMain.js | DamageCalculator UI | DamageCalculator, AppData |
| HeroIconListerMain.js | HeroIconLister | HeroDatabase |

### Stage K: テスト・ユーティリティ

| ファイル | 定義 | 主要依存 |
|---------|------|---------|
| TestUtilities.js | UnitBuilder, BattleScenarioBuilder, test_* | Unit, HeroInfo, BattleMap |

---

## 4. build.mjs と create_tests.sh の変更

### build.mjs の変更（Stage A の前に実施）

`mergeFiles()` 関数に import/export 行除去フィルタを追加:

`mergeFiles()` 関数で行単位のフィルタリングを追加。1行ルール（コーディング規約）により、行頭マッチだけで安全に動作する:

- `import ` で始まる行を除去
- `export {` で始まる行を除去
- インライン export（`export class` 等）は規約で禁止しているため対応不要

フィルタ適用後に `import ` / `export {` が残っていないことを検証するアサーションを追加。

### create_tests.sh の変更（Stage A の前に実施）

ファイル結合時に同様の行単位フィルタを適用。`grep -v` で `^import ` と `^export {` を除去。

---

## 5. 各ファイルの変換手順

全ファイルで共通の変換手順:

1. **依存の特定**: ファイル内で使用している他ファイルの定義を特定
2. **import 文の追加**: ファイル先頭に必要な import を追加
3. **export 文の追加**: ファイル末尾に `export { ... };` を追加（インライン export は禁止）
4. **テスト実行**: `./run_tests.sh` で全テストパスを確認
5. **ビルド確認**: `npm run build` で出力が正常なことを確認

### export のスタイル

末尾まとめ export を基本とする:

```javascript
// ファイル末尾
export { ClassName1, ClassName2, CONSTANT_A, functionB };
```

理由: 既存のコード構造への変更が最小限で、何を公開しているか一目でわかる。

### import のスタイル

直接 import を使用（バレルファイルは作らない）:

```javascript
// ファイル先頭
import { ObjectUtil } from './Utilities.js';
import { Weapon, WeaponType } from './SkillConstants.js';
```

---

## 6. リスク管理

### 循環依存が解消できない場合

ESM の循環依存は、アクセスが初期化完了後であれば問題にならないケースが多い。もし build.mjs の結合時フィルタで import/export を除去するアプローチを取る限り、実際に ESM ローダーが循環を解決する必要はない（Phase 2 のスコープでは結合出力のみ）。

ただし、Phase 3 で Vite build に移行する際に循環依存は問題になるため、Phase 2 の段階で可能な限り解消しておく。

### SkillImpl ファイルのコンフリクト

update_skills ブランチでのスキル実装追加は常にファイル末尾。ESM 化で追加する import 文はファイル先頭。コンフリクトは先頭（import 文の追加）でのみ発生し、解消は容易（import 行をマージするだけ）。

### テストの回帰

各ファイル変換後に全305テスト + スモークテストを実行。回帰があれば即座に該当ファイルの変換を修正。

### build.mjs の出力変化

import/export 行の除去により、出力ファイルからこれらの行が消える。既存の動作には影響しない（これらの行はもともと存在しなかったため、除去後の出力は変換前と同等）。

---

## 7. 完了基準

1. 全65ファイルが `import`/`export` 文を持つ
2. `./run_tests.sh` で全305テスト + スモークテストがパス
3. `npm run build` で全7シミュレータのJSファイルが正常に出力される
4. ローカル開発（HTML直接開き + 結合済みファイル読み込み）が動作する
5. 各ファイルの依存関係が import 文で明示的に宣言されている
6. ネイティブ ESM 検証: エントリポイントを `node --input-type=module` で読み込み、TDZ エラー（`Cannot access 'X' before initialization`）が出ないことを確認（Phase 3 での Vite 移行に備える）

---

## 8. master への取り込み方針

Phase 2 の成果（`vite-migration` ブランチ）は **master に直接マージしない**。

### 前提条件

`update_skills` ブランチと `vite-migration` ブランチ上で以下を全て完了してから master に取り込む:

1. **Vite ビルドへの完全移行** — `build.mjs` の結合方式から Vite バンドラーに切り替え
2. **Vue 2 → Vue 3 移行** — 全シミュレーターが Vue 3 で動作すること
3. **全シミュレーターの動作確認** — 飛空城、闘技場、双界、ユニットビルダー、ステータス計算、ダメージ計算、英雄アイコン
4. **テスト全パス** — Jest/Vitest + ESLint

### 理由

Phase 2 の ESM 化は中間段階であり、import/export フィルタ（`create_tests.sh`, `build.mjs`, HTML の `createScriptElement`）による互換性維持は一時的な仕組み。Vite + Vue 3 に完全移行すればこれらのフィルタは不要になり、よりクリーンな状態で master に取り込める。
