Now I have all the information needed. Here is the section content:

# Section 03: StatusConstants.js の新設（定数抽出）

## 概要

`Sources/Skill.js`（Layer 2）に含まれる Layer 1 相当の定数群を新規ファイル `Sources/StatusConstants.js` に抽出する。これにより、`SkillEffect.js`（Layer 5）が `Skill.js`（Layer 2）を直接 import する必要がなくなり、`SkillEffect.js → Skill.js` 経由の循環参照パスを断ち切る。

## 背景

現在の循環依存パスの1つ:

```
Skill.js → (他のファイル経由) → SkillEffect.js → Skill.js
```

`SkillEffect.js` は `Skill.js` から `StatusIndex` のみを import している（12行目）。`StatusIndex` は4つのステータスインデックス（ATK, SPD, DEF, RES）を定義する単純な定数オブジェクトであり、Skill.js のデータモデル層（Layer 2）に属する必要がない。これを Layer 1 の定数ファイルに分離することで、SkillEffect.js は Skill.js への依存を完全に除去できる。

## 依存関係

- **前提**: Section 01（tooling-baseline）が完了していること（madge でベースライン確認済み）
- **ブロック**: Section 04（Skill.js 分割）、Section 05（Unit.js 分割）がこのセクションに依存

## テスト（実装前に作成）

テストファイル: `/Users/studio/Documents/GitHub/FehBattleSimulator/Tests/StatusConstants.test.js`

以下のテストスタブを作成する:

- **Test: StatusConstants.js から StatusIndex を import でき、全プロパティが存在する** -- `StatusIndex.NONE`, `StatusIndex.ATK`, `StatusIndex.SPD`, `StatusIndex.DEF`, `StatusIndex.RES` が正しい値（-1, 0, 1, 2, 3）を持つこと。`Object.isFrozen(StatusIndex)` が true であること。

- **Test: StatusConstants.js から StatusEffectType を import でき、全プロパティが存在する** -- `StatusEffectType.None` が -1、`StatusEffectType.Panic` が 0 など、代表的なプロパティが正しい値を持つこと。

- **Test: StatusConstants.js から POSITIVE_STATUS_EFFECT_ARRAY を import でき、正しい要素数を持つ** -- 配列であること、要素数が現在の値と一致すること（現在159要素前後）。

- **Test: StatusConstants.js から StatFlags を import でき、全プロパティが存在する** -- `StatFlags.NONE` が `[false, false, false, false]`、`StatFlags.ALL` が `[true, true, true, true]` であること。`Object.isFrozen(StatFlags)` が true であること。

- **Test: Skill.js からの re-export で StatusIndex / StatusEffectType が引き続き取得できる（後方互換）** -- `import { StatusIndex, StatusEffectType } from '../Sources/Skill.js'` が動作し、StatusConstants.js から直接 import した値と同一であること（`===` で比較）。

- **Test: SkillEffect.js が StatusConstants.js から直接 import しており、Skill.js への循環参照がない** -- SkillEffect.js の import 文を読み取り、`'./Skill.js'` からの import が存在しないことを確認する（ファイル内容のテキスト検証、または madge の手動実行で確認）。

### 回帰テスト

- 既存テスト 500 件が全パス（`npm test`）
- `madge --circular Sources/` で SkillEffect → Skill 経由の循環が消えている

## 実装手順

### 手順 1: `Sources/StatusConstants.js` を新規作成

以下のシンボルを `Sources/Skill.js` から **移動**（カット&ペースト）して新ファイルに配置する:

| シンボル | 種別 | Skill.js での行番号（目安） |
|----------|------|---------------------------|
| `StatusEffectType` | const オブジェクト（enum 相当） | 1271-1382 |
| `POSITIVE_STATUS_EFFECT_ARRAY` | const 配列 | 1384-1542 |
| `POSITIVE_STATUS_EFFECT_ORDER_MAP` | const Map（`POSITIVE_STATUS_EFFECT_ARRAY` から生成） | 1543-1544 |
| `NEGATIVE_STATUS_EFFECT_ARRAY` | const 配列 | 1550-1579 |
| `NEGATIVE_STATUS_EFFECT_ORDER_MAP` | const Map（`NEGATIVE_STATUS_EFFECT_ARRAY` から生成） | 1580-1581 |
| `StatusIndex` | const frozen オブジェクト | 1820-1826 |
| `StatFlags` | const frozen オブジェクト | 1831-1848 |
| `getStatusName` | function（StatusIndex のみに依存） | 1850-1855 |

`StatusConstants.js` の構造:

```javascript
// Sources/StatusConstants.js
// Layer 1: ステータス関連定数

/**
 * @enum {number}
 */
const StatusEffectType = {
    // ... (Skill.js から移動、全プロパティそのまま)
};

const POSITIVE_STATUS_EFFECT_ARRAY = [
    // ... (Skill.js から移動)
];
const POSITIVE_STATUS_EFFECT_ORDER_MAP = new Map();
POSITIVE_STATUS_EFFECT_ARRAY.forEach((v, i) => POSITIVE_STATUS_EFFECT_ORDER_MAP.set(v, i));

const NEGATIVE_STATUS_EFFECT_ARRAY = [
    // ... (Skill.js から移動)
];
const NEGATIVE_STATUS_EFFECT_ORDER_MAP = new Map();
NEGATIVE_STATUS_EFFECT_ARRAY.forEach((v, i) => NEGATIVE_STATUS_EFFECT_ORDER_MAP.set(v, i));

const StatusIndex = Object.freeze({
    NONE: -1,
    ATK: 0,
    SPD: 1,
    DEF: 2,
    RES: 3,
});

const StatFlags = Object.freeze({
    // ... (Skill.js から移動)
});

function getStatusName(index) {
    // ... (Skill.js から移動)
}

export {
    StatusEffectType,
    POSITIVE_STATUS_EFFECT_ARRAY,
    POSITIVE_STATUS_EFFECT_ORDER_MAP,
    NEGATIVE_STATUS_EFFECT_ARRAY,
    NEGATIVE_STATUS_EFFECT_ORDER_MAP,
    StatusIndex,
    StatFlags,
    getStatusName,
};
```

**重要**: `StatusConstants.js` は **他のソースファイルを import しない**。Layer 1 ファイルとして、依存は Layer 0 以下のみ許可されるが、実際にはこれらの定数は純粋な値定義であり、外部依存がゼロである。

### 手順 2: Skill.js を修正（re-export による後方互換維持）

`Skill.js` の先頭に import を追加し、既存の export 文でそのまま re-export する。

`Skill.js` 冒頭の変更:

```javascript
import { WeaponType, Weapon, Support, Special, PassiveA, PassiveB, PassiveC, PassiveS, PassiveX, Captain, SkillType, WeaponRefinementType, EmblemHero, NONE_ID } from './SkillConstants.js';
import { g_siteRootPath, g_skillIconRootPath } from './GlobalDefinitions.js';
import { StatusEffectType, POSITIVE_STATUS_EFFECT_ARRAY, POSITIVE_STATUS_EFFECT_ORDER_MAP, NEGATIVE_STATUS_EFFECT_ARRAY, NEGATIVE_STATUS_EFFECT_ORDER_MAP, StatusIndex, StatFlags, getStatusName } from './StatusConstants.js';
```

Skill.js 内部で `StatusEffectType`, `StatusIndex` 等を使用している箇所（例: `stealBonusEffects` 関数の 1869 行目の `StatusEffectType.Dosage`、`RALLY_BUFF_AMOUNT_MAP` の `StatusIndex.ATK` 参照など）は、import 経由で変数が利用可能になるため、コードの変更は不要。

既存の export 文（2113 行目, 2116 行目）はそのまま維持:

```javascript
export { StatusEffectType, POSITIVE_STATUS_EFFECT_ARRAY, POSITIVE_STATUS_EFFECT_ORDER_MAP, NEGATIVE_STATUS_EFFECT_ARRAY, NEGATIVE_STATUS_EFFECT_ORDER_MAP };
export { StatusIndex, StatFlags, getStatusName, stealBonusEffects, getSkillFunc };
```

これにより `import { StatusIndex } from './Skill.js'` が既存コードで引き続き動作する。

### 手順 3: SkillEffect.js の import 先を変更（循環解消の核心）

**修正前**（SkillEffect.js 12 行目）:

```javascript
import { StatusIndex } from './Skill.js';
```

**修正後**:

```javascript
import { StatusIndex } from './StatusConstants.js';
```

これが本セクションの最も重要な変更。SkillEffect.js から Skill.js への直接参照がなくなることで、`SkillEffect.js → Skill.js` の循環パスが断ち切られる。

### 手順 4: その他の参照元ファイルの import 先変更

以下のファイルは現在 `import { StatusEffectType } from './Skill.js'` を使用している。これらの import 先を `'./StatusConstants.js'` に変更する。全ファイルの変更は必須ではないが（Skill.js からの re-export で動作するため）、循環回避と依存グラフの健全化のために可能な限り変更する。

| ファイル | 現在の import | 変更後の import |
|----------|-------------|---------------|
| `Sources/SkillEffect.js` | `import { StatusIndex } from './Skill.js'` | `import { StatusIndex } from './StatusConstants.js'` |
| `Sources/SkillImpl.js` | `import { StatusEffectType } from './Skill.js'` | `import { StatusEffectType } from './StatusConstants.js'` |
| `Sources/SkillImpl202408.js` | `import { StatusEffectType } from './Skill.js'` | `import { StatusEffectType } from './StatusConstants.js'` |
| `Sources/SkillImpl202501.js` | `import { StatusEffectType } from './Skill.js'` | `import { StatusEffectType } from './StatusConstants.js'` |
| `Sources/SkillImpl202601.js` | `import { StatusEffectType } from './Skill.js'` | `import { StatusEffectType } from './StatusConstants.js'` |
| `Sources/CustomSkill.js` | `import { StatusEffectType } from './Skill.js'` | `import { StatusEffectType } from './StatusConstants.js'` |
| `Sources/DamageCalculator.js` | `import { StatusEffectType } from './Skill.js'` | `import { StatusEffectType } from './StatusConstants.js'` |
| `Sources/DamageCalculatorWrapper.js` | `import { StatusEffectType } from './Skill.js'` | `import { StatusEffectType } from './StatusConstants.js'` |
| `Sources/BeginningOfTurnSkillHandler.js` | `import { StatusEffectType } from './Skill.js'` | `import { StatusEffectType } from './StatusConstants.js'` |
| `Sources/PostCombatSkillHander.js` | `import { StatusEffectType } from './Skill.js'` | `import { StatusEffectType } from './StatusConstants.js'` |

**注意**: これらのファイルが `StatusEffectType` 以外のシンボルも `Skill.js` から import している場合、その import 行は残す。`StatusEffectType` / `StatusIndex` / `StatFlags` / `getStatusName` のみを別行で `StatusConstants.js` から import するよう分離する。

### 手順 5: 検証

1. `npm test` を実行し、既存テスト 500 件が全パスすることを確認
2. `npx madge --circular Sources/` を実行し、SkillEffect.js → Skill.js を含む循環パスが消えていることを確認
3. 新規テスト `Tests/StatusConstants.test.js` がパスすることを確認

## 成功条件

- `Sources/StatusConstants.js` が Layer 1 として機能し、外部依存がない
- `SkillEffect.js` が `Skill.js` を import していない（`StatusConstants.js` から直接 import）
- Skill.js からの re-export で既存コードの後方互換が維持される
- 既存テスト 500 件が全パス
- madge の循環パスから SkillEffect → Skill 経由のパスが消えている

## 実装結果

### 実施内容（計画通り）

- `Sources/StatusConstants.js` を新規作成（8シンボル抽出: StatusEffectType, POSITIVE_STATUS_EFFECT_ARRAY, POSITIVE_STATUS_EFFECT_ORDER_MAP, NEGATIVE_STATUS_EFFECT_ARRAY, NEGATIVE_STATUS_EFFECT_ORDER_MAP, StatusIndex, StatFlags, getStatusName）
- `Sources/Skill.js` に `StatusConstants.js` からの import + re-export を追加（後方互換維持）
- 10ファイルの import 先を `Skill.js` → `StatusConstants.js` に変更
- `vitest.setup.js` の連結順序に `StatusConstants` を追加（`SkillConstants` と `Skill` の間）
- `Tests/StatusConstants.test.js` を新規作成（12テスト）

### 計画との差異

- POSITIVE_STATUS_EFFECT_ARRAY の要素数は計画の「159要素前後」ではなく実際は79要素（計画の見積もり誤り、データロスなし）
- テストの配列要素数チェックは厳密な `toBe()` に変更（レビュー指摘による改善）

### 検証結果

- 515テスト中、新規12テスト含め全パス（DamageCalculator_HeroBattleTest の1件はタイムアウトによる既知のflaky test）
- `npx madge --circular Sources/` → **循環依存ゼロ**
- StatusConstants.js は外部 import なし（Layer 1 準拠）