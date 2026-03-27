# リサーチ結果: 巨大ファイル分割リファクタリング

## 1. コードベース調査

### 1.1 DamageCalculatorWrapper.js (17,193行)

#### ファイル構造

| 要素 | 行範囲 | 行数 | 抽出可能性 |
|------|--------|------|-----------|
| `PerformanceProfile` クラス | 2-28 | 27 | **高** (依存なし、純ユーティリティ) |
| `ScopedTileChanger` クラス | 30-52 | 22 | **高** (Unit, setUnitToTileのみ依存) |
| `DamageCalculatorWrapper` クラス | 54-17193 | 17,139 | 本体は分割困難 |

#### DamageCalculatorWrapper静的メソッド一覧

全静的メソッドは**内部からのみ呼び出されている**（外部ファイルからの呼び出しなし）:

| メソッド | 行 | 可視性 |
|---------|-----|--------|
| `canActivateBreakerSkill()` | 14536 | public static（内部呼び出しのみ: 14344, 14450行） |
| `__applyIdealEffect()` | 11775 | private static |
| `__applyBonusDoubler()` | 12706 | private static |
| `__applyHeavyBladeSkill()` | 12717 | private static |
| `__applyFlashingBladeSkill()` | 12723 | private static |
| `__getAtk/Spd/Def/Res()` | 13717-13726 | private static |
| `__calcAddDamageForDiffOfNPercent()` | 13730 | private static |

**結論**: 全staticメソッドが内部専用のため、外部に切り出しても呼び出し元はDamageCalculatorWrapper自身のみ。無理に分離するメリットは薄い。

#### DamageCalculatorWrapperインスタンスメソッド分類 (~168メソッド)

- **公開API (14メソッド)**: `updateDamageCalculation`, `calcDamage`, `calcCombatResult`等
- **スキル効果処理 (110+メソッド)**: `__init__applySkillEffectFor*FuncDict`, `__applySkillEffect*`等
- **戦闘フロー/セットアップ (20+メソッド)**: `__applySkillEffectsBeforeCombat`等
- **ユーティリティ/ヘルパー (40+メソッド)**: `__getSaverUnitIfPossible`等

**結合度分析**: メソッドは`this`経由で`_damageCalc`, `globalBattleContext`等のインスタンスプロパティに密結合。インスタンスメソッドの外部抽出は現実的でない。

### 1.2 Unit.js (7,424行)

#### ファイル構造

| 要素 | 行範囲 | 行数 | 抽出可能性 |
|------|--------|------|-----------|
| `isThief()` | 6-8 | 3 | **高** |
| `calcArenaBaseStatusScore()` | 10-12 | 3 | **高** |
| `calcArenaTotalSpScore()` | 14-16 | 3 | **高** |
| `AttackableUnitInfo` クラス | 19-51 | 33 | **高** (データコンテナ) |
| `AttackEvaluationContext` クラス | 54-120 | 67 | **高** (データコンテナ) |
| `AssistableUnitInfo` クラス | 123-268 | 146 | **高** (データコンテナ) |
| `ActionContext` クラス | 271-350 | 80 | **高** (データコンテナ) |
| `PrecombatContext` クラス | 356-371 | 16 | **高** (最小ユーティリティ) |
| **Unit クラス** | **374-7143** | **6,770** | **分割困難 (650+メソッド, `this`密結合)** |
| `UnitUtil` クラス | 7144-7164 | 21 | **高** |
| `calcBuffAmount()` | 7166-7206 | 41 | **高** |
| `calcHealAmount()` | 7214-7296 | 83 | **高** |
| `isDebufferTier1()` | 7300-7308 | 9 | **高** |
| `isDebufferTier2()` | 7311-7348 | 38 | **高** |
| `isAfflictor()` | 7357-7420 | 64 | **高** |
| `canRefreshTo()` | 7422-7424 | 3 | **高** |

**Unit前の独立クラス合計**: 約342行（5クラス）
**Unit後のユーティリティ合計**: 約259行（1クラス + 6関数）
**抽出可能合計**: 約610行

#### Unit本体のメソッドグループ

- **ステータス/装備管理 (70+メソッド)**: スキル初期化、バフゲッター、ブレッシング管理、シリアライズ
- **戦闘/評価 (60+メソッド)**: ラリー判定、デバフ計算、スパー適用
- **ステータス効果管理 (70+メソッド)**: 予約、追加、除去、中和、チェック
- **奥義/武器効果 (40+メソッド)**: 奥義ハンドリング、武器有効性
- **ダメージ/戦闘状態 (50+メソッド)**: ダメージ計算、状態適用
- **行動/AI (60+メソッド)**: 行動実行、状態管理
- **ステータス計算 (40+メソッド)**: マージ・スキル・バフ込みの計算
- **カント/移動 (15+メソッド)**: カント発動と管理

### 1.3 ビルド/テストインフラ

#### create_tests.sh ロード順序

```
1. Core: GlobalDefinitions, Utilities, Logger
2. Data: SkillConstants, Skill
3. Map: BattleMapElement, Tile, Structures, Cell, Table
4. Hero: HeroInfoConstants, HeroInfo, UnitConstants
5. Unit: BattleContext, Unit, UnitManager
6. Map: BattleMap
7. Context: GlobalBattleContext
8. Combat: DamageCalculationUtility, DamageCalculator, DamageCalculatorWrapper
9. PostCombat: PostCombatSkillHander, BeginningOfTurnSkillHandler
10. Database: SkillDatabase, HeroDatabase, SampleSkillInfos, SampleHeroInfos
11. DSL: SkillEffectCore → ... → SkillEffectAliases (9ファイル)
12. SkillImpl: CustomSkill, SkillImpl, SkillImpl202408, SkillImpl202501, SkillImpl202601
13. Test: TestUtilities
```

**新ファイル挿入位置**:
- DamageCalculatorWrapper前: PerformanceProfile, ScopedTileChanger
- Unit前: Unitから抽出したコンテキストクラス群
- Unit後: Unitから抽出したユーティリティ関数群

#### Deploy.bat 結合パターン

戦闘関連の結合順: `DamageCalculationUtility → DamageCalculator → PostCombatSkillHander → DamageCalculatorWrapper → BeginningOfTurnSkillHandler`

#### HTMLスクリプトロード

`loadScripts` 配列でファイルを順次読み込み。`DamageCalculatorWrapper.js`は`DamageCalculator.js`の後にロード。

#### テストファイル

- `DamageCalculator.test.js` (980行)
- `Performance.test.js`
- `CombatFlow.test.js`, `FollowUpAttack.test.js`, `DamageReduction.test.js`
- `SpecialCount.test.js`, `StatusEffect.test.js`
- `UnitManager.test.js`

### 1.4 既存の分割パターン

#### MapOperations.js / SettingsPersistence.js（section-06で抽出）

- **パターン**: 純粋な自由関数ライブラリとして抽出
- クラス定義なし、BattleSimulatorBase状態への依存なし
- ロード順序で差し込むだけで動作

#### SkillEffect*.js（9ファイル、計19,423行）

- **パターン**: 責務ごとに分離（Core, Env, Field, Unit, BattleContext, Hooks, Registrar, Aliases）
- SkillEffectCoreが基盤、それ以降が拡張
- ロード順序が厳密に管理されている

---

## 2. ウェブ調査: ベストプラクティス

### 2.1 大規模JSファイルの安全な分割パターン

#### テスト先行の鉄則
リファクタリング開始前にテストスイートを用意し、分割の各ステップ後に同一出力を検証する。Chrome DevToolsチームはモジュール移行で約20%のコードを変更したが、包括的テストによりリグレッションは極めて少なかった。

#### グローバルスコープ特有の注意点

| 問題 | 対策 |
|------|------|
| 暗黙のグローバル依存 | `var`宣言や未宣言変数がグローバルに紐付く。分割時にロード順が変わると参照エラー |
| ファイルロード順依存 | create_tests.shとDeploy.batの順序を厳密に管理 |
| 名前衝突 | 同名シンボルがないか事前確認 |

#### 後方互換性パターン

- **Facadeパターン**: 元クラスをFacadeとして維持し、分割先に委譲。外部コードの変更不要
- **Prototypeへのメソッド注入**: クラスを物理的に複数ファイルに分割しつつ、結合後は単一クラスとして動作
- **Strangler Figパターン**: 新方式で書き始め、古い方式を徐々に削減

### 2.2 God Classリファクタリング戦略

#### 段階的分割プロセス

1. **整理と分析**: メソッドを論理グループに整理し、共有データによるクラスタリングで抽出候補を特定
2. **移動の準備**: 残留メソッドがパラメータ経由で結果を受け取るよう修正
3. **最小単位から抽出**: コールチェーンの末端（leafメソッド）から開始。新クラスにコピー→テスト→元を削除
4. **関係の整理**: 旧クラスと新クラスの関係は単方向が理想

#### 静的メソッド vs インスタンスメソッド

- **静的メソッド**: 最も安全に抽出可能。インスタンス状態に依存しないため単純移動
- **インスタンスメソッド**: `this`に密結合の場合、無理な分離は逆効果
- **密結合メソッド**: 依存注入またはパラメータ渡しで結合を明示化

#### 分割すべきでないケース

1. 各クラスが「頭に入る」サイズになったら停止
2. 結合が密すぎて分離コストが利益を上回る場合
3. 単にファイルサイズを小さくしたいだけの場合
4. リファクタリングの中間状態で可読性が悪化する場合

### 2.3 出典

- [Chrome DevTools: migrating to JavaScript modules](https://developer.chrome.com/blog/migrating-to-js-modules)
- [Martin Fowler: This class is too large](https://martinfowler.com/articles/class-too-large.html)
- [DigDeepRoots: Use Data to Split a God Class](https://www.digdeeproots.com/articles/split-god-class/)
- [scorm-again: God Class Refactoring](https://github.com/jcputney/scorm-again/blob/master/GOD-CLASS-REFACTORING.md)
- [Refactoring.Guru: Extract Class](https://refactoring.guru/extract-class)

---

## 3. 本プロジェクトへの適用まとめ

### DamageCalculatorWrapper.js

- **PerformanceProfile** (27行) と **ScopedTileChanger** (22行) は安全に抽出可能
- staticメソッドは全て内部呼び出しのみ → 外部切り出しのメリットは薄い
- クラス本体(17,139行)のインスタンスメソッドは`this`密結合で分割困難
- **推奨**: 独立クラス2つの抽出 + staticメソッドの分離判断にとどめる

### Unit.js

- Unit前の独立クラス5つ(342行)とUnit後のユーティリティ(259行) = 約610行が抽出可能
- Unit本体(6,770行, 650+メソッド)は分割困難
- **推奨**: コンテキストクラス群とユーティリティ関数を別ファイルに抽出
- MapOperations.jsと同じ「純関数ライブラリ」パターンを適用

### 安全ネット

- `create_tests.sh`による結合テストが最重要の回帰検証手段
- 各ステップでtest + ESLint + ブラウザ確認の3段階検証
- git bisect可能なコミット粒度を維持
