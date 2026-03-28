# DamageCalculatorWrapper.js 分割リファクタリング — 実装計画

## 1. 概要

### 1.1 背景

FEH Battle Simulator の `Sources/combat/DamageCalculatorWrapper.js` は17,141行・約170メソッド（public 36、private 126+、static 12+）を持つ単一クラスで、戦闘計算ロジックのほぼすべてを集約している。このファイルを責務ごとに分割し、可読性・保守性を向上させる。

前回のリファクタリングで PerformanceProfile（28行）と ScopedTileChanger（26行）を独立クラスとして抽出済みだが、これらは内部結合度ゼロの独立クラスだったため容易だった。今回は DamageCalculatorWrapper クラス本体のメソッド群を分離する、より複雑なタスク。

### 1.2 目標

- DamageCalculatorWrapper.js をコア + 5分割ファイルに分割（原則5,000行以下、単一巨大メソッドのみ例外可）
- **ロジック変更ゼロ**（物理分割のみ）
- 既存テスト全パスを維持
- ブラウザ・テスト（create_tests.sh）・Deploy.bat の3系統のロード順序を正しく更新

### 1.3 非目標

- アーキテクチャ変更やクラス再設計
- パフォーマンス最適化
- メソッドの統合・削除・リネーム

---

## 2. 技術方針

### 2.1 分割方式: Prototype拡張パターン

**主軸**: `definePrototypeMethods` ヘルパーを使い、non-enumerable でメソッドを外部ファイルから追加

**理由**:
- メソッド本体の変更ゼロ → 回帰リスク最小
- `this` コンテキストは `instance.method()` 呼び出しで自動的にインスタンスを参照（特別な処理不要）
- 1,274箇所の `this` 参照を一切変更する必要がない
- コードベースに前例はないが、技術的に安全

### 2.2 `definePrototypeMethods` ヘルパー

コアファイルのクラス定義の直後に以下のヘルパーを定義する:

```javascript
DamageCalculatorWrapper.definePrototypeMethods = function(methods) {
    for (const [name, fn] of Object.entries(methods)) {
        if (Object.prototype.hasOwnProperty.call(DamageCalculatorWrapper.prototype, name)) {
            throw new Error(`Duplicate prototype method: ${name}`);
        }
        Object.defineProperty(DamageCalculatorWrapper.prototype, name, {
            value: fn,
            writable: true,
            configurable: true,
            enumerable: false, // class bodyと同じnon-enumerable
        });
    }
};
```

**利点**:
- class body内のメソッドと完全に同じ enumerable: false → VM レベルで「ロジック変更ゼロ」を保証
- 重複定義時に即座にエラー → メソッド移動時の転記ミスを検出
- `Object.keys(prototype)` や `for...in` の挙動が元と変わらない

各分割ファイルでは:
```javascript
DamageCalculatorWrapper.definePrototypeMethods({
    methodName() { ... },
});
```

### 2.3 技術的注意点

1. **`super`**: DamageCalculatorWrapper は継承していないため問題なし
2. **`let self = this` クロージャ**: init メソッド内のクロージャは `self` を捕捉している。prototype拡張でメソッドを外部ファイルに移しても、コンストラクタからの呼び出し時に `this`（＝`self`）が正しくバインドされるため動作に影響なし
3. **ロード順序**: prototype拡張ファイルはクラス定義ファイル（コア）の直後にロードする必要あり。順序は**固定**（自由ではない）

### 2.4 ファイル命名規則

`DamageCalculatorWrapper_責務名.js`（`Sources/combat/` 配下）

### 2.5 分割ファイルのテンプレート

各分割ファイルの冒頭にロード前提チェックを置く:

```javascript
if (typeof DamageCalculatorWrapper === "undefined") {
    throw new Error("DamageCalculatorWrapper.js must be loaded before this file");
}

DamageCalculatorWrapper.definePrototypeMethods({
    // ... メソッド群
});
```

---

## 3. 依存分析の結果

### 3.1 依存の種類

- **トップレベル評価時依存**: クラス定義後にprototypeを追加するだけなので限定的。`DamageCalculatorWrapper` クラスの存在のみが前提
- **実行時メソッド相互呼び出し**: 存在する。異なる責務グループのメソッドが `this.xxx()` で呼び合うが、prototype chain で実行時に解決されるため、ファイル間の順序に依存しない
- **ES module/import レベルの循環依存**: そもそもimportを使わないため該当なし

### 3.2 `calcCombatResult` のオーケストレーション

`calcCombatResult`（line 548、202行）がメインの戦闘計算フロー制御ハブで、以下の順序で各責務のメソッドを呼び出す:

1. 戦闘開始時効果（line 563-565）
2. **Spur更新**（line 569-570）→ updateUnitSpur
3. スキル効果適用（line 573）→ __applySkillEffect
4. 味方/敵Spur適用（line 585-587）→ __applySpursFromAllies / __applySpursFromEnemies
5. 反撃全距離判定（line 620）
6. ステータス確定後Spur（line 628-645）
7. **反撃判定**（line 674）→ canCounterAttack
8. **追撃判定**（line 680-683）→ __examinesCanFollowupAttackFor{Attacker,Defender}
9. 奥義ダメージ軽減（line 688-689）
10. 固定ダメージ加算（line 664-667）
11. 実ダメージ計算（line 746）

### 3.3 横断的ユーティリティメソッド

以下のメソッドは10以上の責務グループから呼ばれており、コアファイルに残す必要がある:

| メソッド | 呼び出し元 |
|---------|-----------|
| `__isThereAllyInSpecifiedSpaces` | 30+ 箇所（全グループ） |
| `__isNear` | 20+ 箇所（Spur、スキル効果） |
| `enumerateUnitsInTheSameGroupOnMap` | 15+ 箇所 |
| `__isThereAllyIn2Spaces` | 12+ 箇所 |
| `__isSolo` | 8+ 箇所 |
| `__isInCross`, `__isInCrossWithOffset` | 5-6 箇所 |
| `__canDisableSkillsFrom` | 6+ 箇所（Spur, ApplySkillEffects 等） |

### 3.4 Spur系の依存関係

**呼び出し元**: calcCombatResult の3箇所（line 569-570, 585-587, 628-645）、__initSaverUnit
**内部呼び出し**: enumerateUnits系、__isNear、__isInCross系、__canDisableSkillsFrom、__countUnit
**追撃/反撃との直接依存**: **なし**（間接的にステータス値を通じて影響）

→ Prototype拡張で安全に分離可能。呼び出すユーティリティはコアに残す。

### 3.5 追撃/反撃系の依存関係

**追撃 → 反撃**: `__examinesCanFollowupAttackForAttacker` が `canCounterAttack` を呼ぶ（武器固有チェック）
**共有ユーティリティ**: `__isThereAllyInSpecifiedSpaces`, `__isThereAllyIn2Spaces`, `__isSolo`

→ 追撃と反撃は相互依存があるため1ファイルにまとめる。

---

## 4. 分割計画

### 4.1 ファイル構成（コア + 5分割ファイル）

**コア残置の原則**: コアファイルには以下の3種類のみを残す:
- **入口メソッド**: 外部から呼ばれる public API（calcDamage, calcCombatResult 等）
- **オーケストレーション**: 戦闘計算フローを制御するメソッド（calcCombatResult の本体等）
- **共有ユーティリティ**: 3つ以上の責務グループから横断的に呼ばれるメソッド

| # | ファイル | 推定行数 | 内容 |
|---|--------|---------|------|
| 0 | `DamageCalculatorWrapper.js`（コア） | ~2,500 | クラス定義、コンストラクタ、public API入口、calcCombatResult、横断ユーティリティ、definePrototypeMethods ヘルパー |
| 1a | `DamageCalculatorWrapper_InitSkillEffectDict_AtkDef.js` | ~1,000 | Atk/Def辞書初期化 + Special辞書初期化 |
| 1b | `DamageCalculatorWrapper_InitSkillEffectDict_Unit.js` | ~6,900 | Unit辞書初期化（最大メソッド） |
| 2 | `DamageCalculatorWrapper_ApplySkillEffects.js` | ~3,000 | スキル効果適用本体 |
| 3 | `DamageCalculatorWrapper_Spur.js` | ~2,500 | Spur更新・適用・ヘルパー |
| 4 | `DamageCalculatorWrapper_FollowupAndCounter.js` | ~900 | 追撃/反撃判定、ダメージ軽減（`__calcFixedAddDamage` は `#` private 制約によりコアに残留） |

**注**: ファイル1bは~6,900行で原則の5,000行を超えるが、`__init__applySkillEffectForUnitFuncDict` は単一メソッドであり、これ以上の分割はメソッド内部の切断を意味する。「単一巨大メソッドは例外可」の方針に基づき許容する。将来このメソッド自体のリファクタリング（辞書登録の自動化等）で対処する。

### 4.2 各ファイルの詳細

#### ファイル0: `DamageCalculatorWrapper.js`（コア）— ~2,500行

**残すもの**:
- クラス定義（`class DamageCalculatorWrapper {`）とコンストラクタ（line 9-45）
- `definePrototypeMethods` ヘルパー（クラス定義の直後）
- プロパティアクセサ（line 67-117）
- メインAPI入口: `updateDamageCalculation`, `calcDamageTemporary`, `calcDamage`, `calcPreCombatResult`, `calcCombatResult`, `calcPrecombatSpecialDamage`, `calcPrecombatSpecialResult`
- 戦闘前スキル: `__applySkillEffectsBeforeCombat`, `__applySkillEffectsBeforePrecombat`, `__applyPrecombatSkills`
- 護い手ロジック: `__getSaverUnitIfPossible`, `__canActivateSaveSkill*`, `__canDisableSaveSkill`, `__initSaverUnit`
- 事前ダメージ軽減: `__applyPrecombatDamageReductionRatio`, `__applyResDodge`, `__applyPrecombatDamageReduction`, `__applyPrecombatSpecialDamageMult`
- マップ関連: `__setBattleContextRelatedToMap`
- スキル効果ハブ: `__applySkillEffect`, `__applyTransformedSkillEffects`, `__applyChangingAttackPrioritySkillEffects`
- 防御参照: `__canInvalidatesReferenceLowerMit`, `__selectReferencingResOrDef`
- **横断ユーティリティ（全グループ共有）**:
  - 列挙: `enumerateUnitsInTheSameGroup*`, `enumerateUnitsInDifferentGroup*`（4メソッド）
  - 距離判定: `__isNear`, `__isInCross`, `__isInCrossWithOffset`, `__isThereAllyIn2Spaces`, `__isThereAllyInSpecifiedSpaces`, `__isThereAllyInSquare`
  - カウント: `__countUnit`, `__countAllies*`, `__countEnemies*`（6メソッド）
  - 状態判定: `__isSolo`, `__isNextToOtherUnits*`, `__isThereAnyAllyUnit`, `__isTherePartnerInSpace*`
  - スキル無効化: `__canDisableSkillsFrom`
  - スタティック: `__getAtk`, `__getSpd`, `__getDef`, `__getRes`, `__calcAddDamageForDiffOfNPercent`
- 初期化ヘルパー: `__init__skillFunctions`（19行、小規模）
- ログ: `writeDebugLog`, `__writeDamageCalcDebugLog`, `__logSpdInCombat`

**クラス定義の末尾**: `}` の閉じブレースはコアファイルに置く。

#### ファイル1a: `DamageCalculatorWrapper_InitSkillEffectDict_AtkDef.js` — ~1,000行

**移動するメソッド**:
- `__init__applySkillEffectForAtkUnitFuncDict`（line 1564-1862、299行）
- `__init__applySkillEffectForDefUnitFuncDict`（line 1863-2280、418行）
- `__init__applySpecialSkillEffect`（line 14853-15170、318行）— 奥義効果辞書も「辞書初期化」という責務が共通のため、Atk/Defと同じファイルに配置

#### ファイル1b: `DamageCalculatorWrapper_InitSkillEffectDict_Unit.js` — ~6,900行

**移動するメソッド**:
- `__init__applySkillEffectForUnitFuncDict`（line 2559-9400、6,842行）

**注意点（ファイル1a/1b共通）**:
- 全initメソッド内の `let self = this` は変更不要（prototypeメソッドとして呼ばれた時点で `this` は正しいインスタンスを参照）
- initメソッドはコンストラクタから呼ばれる。全prototype拡張ファイルがロード済みの後にインスタンス化されるため正常に動作する
- 内部で `self.__isThereAllyInSpecifiedSpaces()` 等のユーティリティを呼ぶが、これらはコアファイルのクラス定義内にあるため prototype chain で解決される

#### ファイル2: `DamageCalculatorWrapper_ApplySkillEffects.js` — ~3,000行

**移動するメソッド**:
- `__applySkillEffectForUnit`（profiling wrapper）
- `____applySkillEffectForUnit`（辞書引き＋フォールバック処理）
  - ※ `__init__applySkillEffectForUnitFuncDict` の終了位置と `____applySkillEffectForUnit` の開始位置の正確な境界を実装時に確認
- `__applySkillEffectRelatedToEnemyStatusEffects`（225行）
- `__applySkillEffectRelatedToFollowupAttackPossibility`（12行）
- `__applyInvalidationSkillEffect`（46行）
- `__applySpecialSkillEffect`（12行）
- `__setSkillEffetToContext`（36行）
- `__setSelfSkillEffectToContext`（36行）
- `__setBothOfAtkDefSkillEffetToContext`（90行）
- `__setBothOfAtkDefSkillEffetToContextForEnemyUnit`（42行）
- `__isBreakableStructureForEnemyIn2Spaces`（10行）
- `__getPartnersInSpecifiedRange`（3行）
- `__countAllyUnitsInCrossWithOffset`（9行）
- `__getTotalBuffAmountOfTop3Units`（26行）

#### ファイル3: `DamageCalculatorWrapper_Spur.js` — ~2,500行

**移動するメソッド**:
- Spur適用（calcCombatResult から呼ばれる）:
  - `__applySpursFromAllies`（20行）
  - `__applySpursFromEnemies`（24行）
  - `__applySpursFromAlliesAfterCombatStatusFixedSkills`（21行）
  - `__applySpurForUnitAfterCombatStatusFixed`（14行）
- ボーナス/デバフユーティリティ:
  - `__applyBonusReversals`（19行）、`__getHighestBuffs`（19行）、`__getHighestTotalBuff`（11行）
  - `__applyBuffAbsorption`（9行）、`__applyDebuffReverse`（9行）、`__applySabotage`（7行）
  - `__maxDebuffsFromAlliesWithinSpecificSpaces`（15行）、`__applyPotent` 関連
- Spur更新:
  - `updateAllUnitSpur`（5行、public wrapper）
  - `updateUnitSpur`（6行、public wrapper）
  - `__updateUnitSpur`（688行 — コア処理）
  - `__updateUnitSpurFromAllies`（150行）
  - `__updateUnitSpurFromEnemyAllies`（270行）
- Spurヘルパー:
  - `__addSpurInRange2`（260行）
  - `__addSpurInRange1`（83行）
  - `__addSelfSpurInRange1`（61行）
  - `__applyFormSkill`（37行）
  - `__applyPreUpdateUnitSpurSkillEffects`（104行）

#### ファイル4: `DamageCalculatorWrapper_FollowupAndCounter.js` — ~900行

**移動するメソッド**:
- 追撃判定:
  - `__examinesCanFollowupAttack`（16行）
  - `__examinesCanFollowupAttackForAttacker`（88行）
  - `__examinesCanFollowupAttackForDefender`（167行）
  - `getFollowupAttackPriorityForBoth`（196行、public）
- 反撃判定:
  - `canCounterAttack`（4行、public）
  - `__examinesCanCounterattackBasically`（84行）
  - `__canDisableCounterAttack`（194行）
- ダメージ軽減:
  - `__applyDamageReductionRatio`（25行）
  - `__getDamageReductionRatio`（332行）
  - `__applyDamageReductionRatioBySpecial`（57行）
- 固定ダメージ:
  - `__calcFixedSpecialAddDamage`（180行）

**コアに残すもの（`#` private 制約）**:
- `__calcFixedAddDamage` — `this.#calcFixedAddDamageForSkill` を呼ぶため、`#` private と一緒にコアに残す
- `#calcFixedAddDamageForSkill` — `#` private フィールドはクラス定義外からアクセス不可

---

## 5. 実装手順

### 5.1 Phase 1: 準備と検証基盤

**commit 粒度**: Phase 1 全体で1 commit

1. **現状のテスト全パスを確認**: `./run_tests.sh` を実行し、ベースラインを取得

2. **プレフライトチェック**:
   - `DamageCalculatorWrapper.js` のクラス定義外（ファイル先頭・末尾）に変数・定数・関数が定義されていないか確認。グローバルスコープ連結環境なのでアクセスは可能だが、把握しておく必要がある
   - `#` プライベートフィールド/メソッドの使用有無を確認（`#\w+` で検索）。存在する場合はコアファイルに残す必要がある
   - `new DamageCalculatorWrapper(...)` の全呼び出し箇所を検索し、インスタンス生成が全scriptロード完了後に行われることを確認
   - `DamageCalculatorWrapper` を参照・結合している全箇所を `grep` で棚卸し（create_tests.sh, Deploy.bat, HTML以外にも CI 設定、npm scripts 等を確認）

3. **テストの作成**: prototype拡張後の検証テストを作成
   - **constructor smoke test**: `new DamageCalculatorWrapper(...)` がエラーなく完了すること
   - **public API names assertion**: 全 public メソッド名の一覧を配列で保持し、意図しない増減を検知
   - **代表メソッド呼び出しテスト**: 各分割ファイルから移動した代表メソッド（1ファイルにつき1-2個）を実際に呼び出して動作確認

4. **`definePrototypeMethods` ヘルパーの追加**: コアファイルのクラス定義直後に追加

### 5.2 Phase 2: スキル効果辞書初期化の分離（最優先）

**commit 粒度**: 1 commit（ファイル1a + 1b + ロード順序更新をまとめて）

**対象**: `DamageCalculatorWrapper_InitSkillEffectDict_AtkDef.js` + `DamageCalculatorWrapper_InitSkillEffectDict_Unit.js`

1. 2つの新ファイルを作成し、initメソッドを移動
2. `definePrototypeMethods` で包む
3. 各ファイル冒頭にロード前提チェックを追加
4. コアファイルからinitメソッドの本体を削除（コンストラクタからの呼び出しはそのまま）
5. create_tests.sh、Deploy.bat、全HTMLファイルのロード順序を更新（DamageCalculatorWrapper.js の直後に追加）
6. テスト実行で検証（特に constructor smoke test）

**この段階で~7,900行が分離**。コアファイルは~9,200行に縮小。

### 5.3 Phase 3: スキル効果適用の分離

**commit 粒度**: 1 commit

**対象**: `DamageCalculatorWrapper_ApplySkillEffects.js`

1. スキル効果適用系メソッドを新ファイルに移動
2. `definePrototypeMethods` で包む + ロード前提チェック
3. ロード順序を更新
4. テスト実行で検証

### 5.4 Phase 4: Spur系の分離

**commit 粒度**: 1 commit

**対象**: `DamageCalculatorWrapper_Spur.js`

1. Spur関連の全メソッドを新ファイルに移動
2. `definePrototypeMethods` で包む + ロード前提チェック
3. ロード順序を更新
4. テスト実行で検証

### 5.5 Phase 5: 追撃/反撃/ダメージ軽減の分離

**commit 粒度**: 1 commit

**対象**: `DamageCalculatorWrapper_FollowupAndCounter.js`

1. 追撃・反撃・ダメージ軽減・固定ダメージメソッドを新ファイルに移動
2. `definePrototypeMethods` で包む + ロード前提チェック
3. ロード順序を更新
4. テスト実行で検証

### 5.6 Phase 6: 最終検証

1. 全テスト実行（`./run_tests.sh`）
2. ESLint パス確認
3. **ブラウザでの動作確認**:
   - ArenaSimulator.html を開いて console エラーなしを確認
   - 戦闘開始〜結果表示まで1ケース実行
   - 範囲奥義（precombat special）を含むケース
   - 追撃/反撃を含むケース
4. 各ファイルの行数確認（目標: 5,000行以下、ファイル1bは例外）
5. public API names assertion テストのパス

---

## 6. ロード順序の更新

### 6.1 更新対象

3系統すべてで、DamageCalculatorWrapper.js の直後に分割ファイルを**固定順序**で追加:

```
combat/DamageCalculationUtility
combat/DamageCalculator
combat/PostCombatSkillHander
combat/PerformanceProfile
combat/ScopedTileChanger
combat/DamageCalculatorWrapper                            ← クラス定義（コア）
combat/DamageCalculatorWrapper_InitSkillEffectDict_AtkDef  ← NEW
combat/DamageCalculatorWrapper_InitSkillEffectDict_Unit    ← NEW
combat/DamageCalculatorWrapper_ApplySkillEffects           ← NEW
combat/DamageCalculatorWrapper_Spur                        ← NEW
combat/DamageCalculatorWrapper_FollowupAndCounter           ← NEW
combat/BeginningOfTurnSkillHandler
```

### 6.2 更新ファイルの特定方法

固定リストではなく、**検索ベースで更新対象を確定**する:

1. `grep -r "DamageCalculatorWrapper"` でファイル名を参照している全箇所を検索
2. `grep -r "SOURCE_FILE_NAMES\|loadScripts\|Deploy"` でロード順序を管理している全箇所を検索
3. 漏れがないことを確認した上で更新

**既知の更新対象**:
1. **create_tests.sh**: `SOURCE_FILE_NAMES` 配列
2. **Deploy.bat**: ファイル結合リスト
3. **HTML ファイル**: `loadScripts()` の呼び出しリスト（`Glob` で `Sources/**/*.html` を検索して全特定）
4. **その他**: 結合済み配布物やテスト生成系（CI設定、npm scripts等）にも参照がないか確認

### 6.3 順序の重要性

全prototype拡張ファイルは `DamageCalculatorWrapper.js`（クラス定義）の後に**固定順序**でロードする。これは:

- コンストラクタが全prototype拡張メソッドの存在を前提とするため
- ファイル冒頭のガードチェックがロード順序ミスを即座に検出するため
- `BeginningOfTurnSkillHandler` より前にロード完了する必要があるため

---

## 7. リスクと対策

### 7.1 initメソッドの `self` クロージャ

**リスク**: initメソッド内の `let self = this` がprototype拡張後に正しく動作するか。
**対策**: prototype メソッドとして呼ばれた時点で `this` はインスタンスを指すため、`let self = this` は正しくインスタンスを捕捉する。動作変更なし。ただし Phase 2 完了時に重点的にテスト。

### 7.2 メソッド境界の誤り

**リスク**: 行番号ベースの分析のため、実際のメソッド境界が想定と異なる可能性。
**対策**: 各 Phase でメソッドの正確な開始・終了行を手動確認してから移動。

### 7.3 ロード順序の漏れ

**リスク**: 更新対象ファイルの一部で更新漏れが発生する可能性。
**対策**: Phase 1 のプレフライトチェックで全参照箇所を棚卸し。各分割ファイル冒頭のガードチェックでロード順序ミスを即座に検出。

### 7.4 メソッド重複定義

**リスク**: 同名メソッドを複数ファイルで定義してしまう。
**対策**: `definePrototypeMethods` ヘルパーが重複を検出して例外をスロー。

### 7.5 ファイルスコープ変数

**リスク**: DamageCalculatorWrapper.js のクラス定義外に変数・定数が存在し、移動したメソッドからアクセスできない可能性。
**対策**: プレフライトチェックで監査。このコードベースはグローバルスコープ連結なので、ファイル外の変数はグローバルアクセス可能。ただしクラス定義と同じファイル内で `const` 定義されたローカル変数があれば、分割先ファイルからアクセスできないため対処が必要。

---

## 8. テスト戦略

### 8.1 既存テスト

- `DamageCalculator.test.js`（37KB）: 主要な戦闘計算テスト
- `CombatFlow.test.js`: 戦闘フローシナリオ
- その他の combat 関連テスト

これらは間接的に DamageCalculatorWrapper のメソッドをテストしている。分割後に全パスすることが最低限の検証。

### 8.2 新規テスト

Phase 1 で追加するテスト:

1. **constructor smoke test**: 最小限の依存でインスタンスを生成し、エラーなく完了することを確認
2. **public API names assertion**: 全 public メソッド名の配列を保持し、分割後も同一であることを確認
3. **代表メソッド呼び出しテスト**: 各分割ファイルから移動した代表メソッド（1ファイルにつき1-2個）を実際に呼び出して動作確認（存在確認だけでなく実行確認）

### 8.3 各 Phase のテスト実行

各ファイル分離後に `./run_tests.sh` を実行し、全テスト + ESLint のパスを確認。1 phase = 1 commit で、各 commit 単独で green であることを保証。失敗した場合は原因を切り分けて当該 phase 内で修正する。
