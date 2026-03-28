# Research Findings: DamageCalculatorWrapper.js 分割

## 1. コードベース調査

### 1.1 DamageCalculatorWrapper.js の構造

**ファイル**: `Sources/combat/DamageCalculatorWrapper.js` (17,141行)

**コンストラクタ (Lines 9-45)**:
- パラメータ: `unitManager`, `map`, `globalBattleContext`, `logger`
- 内部インスタンス生成: `DamageCalculator`, `PerformanceProfile`, `PostCombatSkillHander`
- 4つの関数辞書を初期化（スキル効果をIDで引くディスパッチテーブル）
- 5つのinit メソッドで辞書をポピュレート

**メソッド構成**:
- **36 public メソッド**: 戦闘計算の入口、事前計算、追撃判定、反撃判定、ユニット列挙、紋章管理等
- **126+ private メソッド**: スキル効果辞書の初期化、戦闘前処理、護い手ロジック、ユーティリティ等
- **12+ static メソッド**: ユーティリティ関数

**`this` 参照**: 1,274箇所（うち30.8%がプライベートメソッド呼び出し）→ 内部結合度が非常に高い

**辞書ベースのディスパッチ (Lines 1564-9400)**:
```javascript
let self = this;
self._applySkillEffectForAtkUnitFuncDict[skillId] = (unit) => {
    self.__applyOtherMethod();
};
```
- ~6,800行が関数辞書のポピュレーションに費やされている
- クロージャが `self` を捕捉するパターン

### 1.2 前回の分割パターン

**PerformanceProfile.js** (28行):
- 完全に独立したユーティリティクラス
- 他クラスへの依存なし、プロファイリングカウンタ

**ScopedTileChanger.js** (26行):
- Disposableパターン（constructor + dispose）
- グローバル関数 `setUnitToTile()` を使用
- 内部メソッド呼び出しなし

**重要**: 両方とも内部結合度ゼロの独立クラスで、DamageCalculatorWrapperのメソッド分割とは根本的に異なる

### 1.3 ロード順序システム

**create_tests.sh**: ソースファイルを厳密な順序で連結
- DamageCalculatorWrapper は DamageCalculationUtility → DamageCalculator → PostCombatSkillHander → PerformanceProfile → ScopedTileChanger の後にロード

**Deploy.bat**: 同じ依存順序を維持、ファイルをマージ＆ミニファイ

**HTML**: `loadScripts()` 関数によるJavaScript動的ロード（静的scriptタグではない）

**制約**: ES6 imports なし。ファイル連結順序に依存。

### 1.4 テスト構造

- DamageCalculatorWrapper専用のテストファイルなし
- 間接的にテスト: `DamageCalculator.test.js` (37KB), `CombatFlow.test.js` 等
- Jest + カスタムビルダー（`UnitBuilder`, `BattleScenarioBuilder`）
- グローバルテスト状態: `resetGlobalTestState()`

### 1.5 既存の prototype 拡張パターン

**検索結果**: コードベース内に `ClassName.prototype.methodName = ` のパターンはゼロ

現在のパターン: 純粋なES6クラス構文のみ。ランタイムでのメソッドインジェクションなし。

---

## 2. Web調査: JavaScript クラス分割パターン

### 2.1 Prototype 拡張パターン（Mixin）

**基本テクニック**: クラス定義後に別ファイルからメソッドをprototypeに追加

```javascript
// ClassCore.js
class MyClass {
  constructor() { this.value = 42; }
}

// ClassMethods.js (loaded AFTER)
Object.assign(MyClass.prototype, {
  methodA() { return this.value + 1; },
  methodB() { return this.value + 2; },
});
```

**`this` コンテキスト**: 特別な処理不要。`instance.method()` で呼ぶ限り `this` は自動的にインスタンスを参照。

**重要な注意点**:

1. **列挙可能性の違い**: class body 内のメソッドは non-enumerable、`Object.assign` で追加したメソッドは enumerable。`for...in` ループで差異が出る可能性あり。ただし `Object.keys()` 等はown propertiesのみなので通常問題なし。
2. **`super` は動作しない**: `super` は `[[HomeObject]]` に紐づくため、prototype に移動したメソッドでは正しく動作しない。DamageCalculatorWrapperは継承していないので問題なし。
3. **strict mode**: class body 内のメソッドは自動的にstrict mode。prototype に追加した関数は明示的にstrict modeにする必要がある場合がある。

### 2.2 3つのアプローチの比較

| 観点 | A: Prototype拡張 | B: ヘルパークラス委譲 | C: 関数抽出 |
|------|-----------------|---------------------|------------|
| リファクタリング工数 | **低** — メソッド移動のみ | **高** — `this.x` → `this.unit.x` の書換え | **中** — パラメータ明示化 |
| `this` 互換性 | **優** — 変更不要 | **劣** — 全参照書換え | **N/A** — thisなし |
| メソッド間呼び出し | **優** — 変更不要 | **中** — ルーティング必要 | **限定的** |
| テスト容易性 | **同等** | **良** — 独立テスト可 | **優** — 純粋関数 |
| リスク | **最低** — 動作変更なし | **高** — 広範な書換え | **中** — 適用範囲限定 |

### 2.3 推奨アプローチ

**Phase 1 — Prototype拡張（本タスクの主アプローチ）**:
- メソッド群を責務ごとに別ファイルに移動
- `Object.assign(DamageCalculatorWrapper.prototype, { ... })` で追加
- メソッド本体の変更ゼロ → 回帰リスク最小
- 17,000行→複数ファイル（各3,000-5,000行）の目標に最適

**Phase 2以降（将来の改善、今回のスコープ外）**:
- 純粋な計算ロジックのスタンドアロン関数抽出
- 明確に独立した責務のヘルパークラス化

### 2.4 ブラウザ/テスト環境での注意

- クラス定義ファイルが prototype 拡張ファイルより先にロードされる必要あり
- ファイル連結方式では、連結順序が正しければ問題なし
- グローバルスコープを共有するため import/export 不要

---

## 3. ソース

- [Splitting Javascript Classes Into Different Files - DEV Community](https://dev.to/thomasstep/splitting-javascript-classes-into-different-files-359g)
- [javascript.info - Mixins](https://javascript.info/mixins)
- [Mixin Pattern - patterns.dev](https://www.patterns.dev/vanilla/mixin-pattern/)
- [Exploring ES6: OOP besides classes](https://exploringjs.com/es6/ch_oop-besides-classes.html)
- [MDN: Classes](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Classes)
- [MDN: Object.assign()](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Object/assign)
