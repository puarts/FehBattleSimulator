# FEH Battle Simulator — テスト計画リサーチ結果

## Part 1: コードベース調査

### 1. テストファイル構成

| ファイル | 行数 | 内容 |
|---------|------|------|
| SkillEffect.test.js | 1,265 | DSLノード、統計評価、ボーナス/ペナルティ |
| DamageCalculator.test.js | 980 | ダメージ計算、Feudスキル |
| BeginningOfTurnSkillHandler.test.js | 39 | ターン開始スキル |
| UnitManager.test.js | 32 | ユニット列挙 |
| GetRequirements.test.js | 53 | DSLノード要件計算 |
| SimpleUtility.test.js | 16 | ユーティリティ関数 |

合計: 6ファイル、約2,385行、188テスト

### 2. テスト結合プロセス (create_tests.sh)

`create_tests.sh` が44のソースファイルを依存順序で結合し、`All.test.js` を生成:

1. コア/ユーティリティ: GlobalDefinitions, Utilities, Logger, SkillConstants, Skill
2. マップ/ユニット基盤: BattleMapElement, Tile, Structures, Cell, Table, HeroInfo, UnitConstants, BattleContext, Unit, UnitManager, BattleMap, GlobalBattleContext
3. 戦闘計算: DamageCalculationUtility, DamageCalculator, PostCombatSkillHandler, DamageCalculatorWrapper, BeginningOfTurnSkillHandler
4. データベース: SkillDatabase, HeroDatabase, SampleSkillInfos, SampleHeroInfos
5. スキルDSL: SkillEffectCore, SkillEffectEnv, SkillEffect, SkillEffectField, SkillEffectUnit, SkillEffectBattleContext, SkillEffectHooks, SkillEffectRegistrar, SkillEffectAliases, CustomSkill
6. スキル実装: SkillImpl, SkillImpl202408, SkillImpl202501, SkillImpl202601
7. テストユーティリティ: TestUtilities, TestGlobals
8. テストファイル: 全6テストファイル

### 3. Jest設定

```javascript
// jest.config.js
{
  testEnvironment: "jsdom",
  testMatch: ["**/All.test.js"],
  setupFiles: ["./jest.setup.js"],
  clearMocks: true,
  coverageProvider: "v8"
}
```

`jest.setup.js` は `globalThis.performance`、`TextEncoder`、`TextDecoder` を提供。

npm scripts:
- `npm test` → Jest + ESLint
- `npm run test:only` → Jestのみ

### 4. 既存テストヘルパー (TestUtilities.js)

#### test_createDefaultUnit(groupId)
- HP: 40, Atk/Spd: 40, Def/Res: 30
- 武器: Silver Sword+, 移動: 歩行
- タイル(0,0)に配置

#### test_HeroDatabase クラス
- 全英雄情報・スキル情報を保持
- `createUnit(heroName, groupId)` — 英雄名からユニット生成
- `updateUnitSkillInfo(unit)` — スキル更新とリセット

#### test_DamageCalculator クラス
- `UnitManager`, `BattleMap`, `GlobalBattleContext` をラップ
- `updateAllUnitSpur()` — 全ユニットのスパー更新
- `calcDamage(atkUnit, defUnit, applyResultToHp)` — ダメージ計算実行、`CombatResult` を返す

#### test_BeginningOfTurnSkillHandler クラス
- ターン開始スキルの適用フロー全体をラップ
- `applySkillsForBeginningOfTurn(unit)` — 5段階の処理を順次実行

#### グローバルテストデータベース
```javascript
const g_testHeroDatabase = new test_HeroDatabase(
    heroInfos, weaponInfos, supportInfos, specialInfos,
    passiveAInfos, passiveBInfos, passiveCInfos,
    passiveSInfos, passiveXInfos
);
```

### 5. 既存テストパターン

#### DamageCalculator テスト
```javascript
beforeEach(() => {
    heroDatabase = g_testHeroDatabase;
    atkUnit = heroDatabase.createUnit("アルフォンス");
    atkUnit.atkWithSkills = 40;
    calclator = new test_DamageCalculator();
    g_appData = calclator.unitManager;
});

test('Test ImpenetrableDark', () => {
    atkUnit.passiveC = PassiveC.ImpenetrableDark;
    calclator.updateAllUnitSpur();
    let result = calclator.calcDamage(atkUnit, defUnit);
    expect(atkUnit.atkSpur).toBe(4);
    expect(result.atkUnit_normalAttackDamage).toBe((40 + 4) - 30);
});
```

#### SkillEffect テスト (DSLノード)
```javascript
beforeEach(() => {
    unit = heroDatabase.createUnit('アルフォンス');
    env = new NodeEnv();
    env.setTarget(unit);
    unit.spdWithSkills = 40;
    unit.spdSpur = 10;
});

test('during combat with spur', () => {
    env.setCombatPhase(NodeEnv.CombatPhase.AT_START_OF_COMBAT);
    const result = TARGETS_EVAL_SPD_NODE.evaluate(env);
    expect(result).toBe(50);
});
```

### 6. DSLシステム概要

**ファイル構成**:
- `SkillEffectCore.js` — MultiValueMap, SkillEffectHooks, 基本ノードクラス
- `SkillEffect.js` (304KB) — メインノード実装
- `SkillEffectEnv.js` — 実行環境 (NodeEnv, 戦闘フェーズ)
- `SkillEffectBattleContext.js` (151KB) — 戦闘固有ノード・フック
- `SkillEffectAliases.js` (73KB) — DSLヘルパー関数
- `SkillEffectRegistrar.js` — スキル登録システム

**主要DSL関数**:
- `GRANTS_BONUS(ATK_SPD(N)).to(UNIT)` — ステータス付与
- `INFLICTS_PENALTY(ATK_SPD(N)).on(FOE)` — ステータス低下
- `DEALS_DAMAGE(N).excludingAoe()` — ダメージ追加
- `REDUCES_DAMAGE_FROM_FOES_ATTACKS_BY(N)` — ダメージ軽減
- `IF_NODE(condition, ...effects)` — 条件分岐
- `TRUE_NODE`, `FALSE_NODE`, `AND_NODE(...)`, `OR_NODE(...)` — 論理ノード

**登録システム**:
```javascript
SkillEffectRegistrar.registerSkillsDuringCombat(skillId, condNode, ...effects)
SkillEffectRegistrar.registerSkillsForAlliesDuringCombat(skillId, condNode, ...effects)
SkillEffectRegistrar.registerSkillsForFoesDuringCombat(skillId, condNode, ...effects)
```

### 7. テストカバレッジ分析

#### よくテストされている領域
- Feudスキル (ImpenetrableDark, RedFeud3) — 15+テスト
- DSLノード基本 (NumberNode, BoolNode, MultiValueMap) — 20+テスト
- ステータス評価（各フェーズ）— 10+テスト
- ボーナス/ペナルティ適用 — 15+テスト

#### テストカバレッジのギャップ
1. **統合テスト** — ほとんどがユニットレベル
2. **複数ユニット相互作用** — 4ユニット以上のシナリオが限定的
3. **複合スキル組み合わせ** — 複数スキル同時発動のテストが少ない
4. **スタイル/共鳴メカニクス** — 実装あるがテストなし
5. **ダメージ計算エッジケース** — 0ダメージ、オーバーキル、回復
6. **マップベースメカニクス** — 位置・構造物相互作用
7. **追撃攻撃変更** — シナリオカバレッジが限定的
8. **AOE奥義相互作用** — テストが疎

### 8. 戦闘フロー

#### DamageCalculator (2,988行)
- `CombatResult`: damageHistory[], attackHistory[], atkUnit/defUnit各種ダメージ値
- 計算フェーズ: ステータス評価 → 奥義チェック → 軽減適用 → 追加ダメージ → 追撃判定

#### BeginningOfTurnSkillHandler フェーズ
1. `applySkillsForBeginningOfTurn` — ターン開始スキル
2. `applyEnemySkillsForBeginningOfTurn` — 敵ターン開始
3. `applySkillsAfterSkillsForBeginningOfTurn` — 開始後効果
4. `applyHpSkillsForBeginningOfTurn` — HP変更
5. `applyReservedStateForAllUnitsOnMap` — 状態変更適用
6. `applyReservedHpForAllUnitsOnMap` — HP変更適用

---

## Part 2: Web調査 — ベストプラクティス

### 1. Jestカバレッジ設定 & CI連携

#### 推奨Jest設定
```javascript
module.exports = {
  collectCoverage: true,
  collectCoverageFrom: ['./Sources/**/*.js', '!**/node_modules/**'],
  coverageDirectory: 'coverage',
  coverageReporters: ['text-summary', 'lcov', 'json-summary'],
  coverageThreshold: {
    global: { branches: 50, functions: 50, lines: 80, statements: 80 },
  },
};
```

**重要**: `collectCoverageFrom` を明示しないと、テストでインポートされたファイルのみがレポートされる。

#### レポート形式
| 形式 | 用途 |
|------|------|
| text / text-summary | ローカル開発・CIログ |
| lcov | Codecov/Coveralls用HTML+lcov.info |
| json-summary | GitHub Actions PRコメント用 |

#### GitHub Actions連携オプション

**Option A: jest-coverage-report-action** (最シンプル)
```yaml
- uses: ArtiomTr/jest-coverage-report-action@v2
  with:
    test-script: npm test -- --coverage
```

**Option B: Codecov** (業界標準、履歴追跡)
```yaml
- run: npm test -- --coverage
- uses: codecov/codecov-action@v5
  with:
    files: ./coverage/lcov.info
```

**推奨**: `ArtiomTr/jest-coverage-report-action@v2` で開始。最小セットアップでPRレベルのフィードバックが得られる。

**出典**: [Jest Configuration Docs](https://jestjs.io/docs/configuration), [jest-coverage-report-action](https://github.com/marketplace/actions/jest-coverage-report)

### 2. Jestパフォーマンス/ベンチマークテスト

#### 推奨アプローチ

**1. 手動タイミング（最シンプル、依存なし）**
```javascript
test('skill evaluation completes within 100ms', () => {
    const start = performance.now();
    evaluateSkills(testData);
    const elapsed = performance.now() - start;
    expect(elapsed).toBeLessThan(100);
});
```
→ 本プロジェクトではすでに `test_executeTest` + `ScopedStopwatch` で類似パターンあり

**2. @jest-performance-reporter/core（遅いテスト検出）**
```json
{
  "reporters": [["@jest-performance-reporter/core", {
    "errorAfterMs": 5000, "warnAfterMs": 2000
  }]]
}
```

**3. jest-bench（統計的ベンチマーク）** — ops/sec比較が必要な場合のみ

**推奨**: 手動タイミング（既存パターン活用）で開始。CIには `@jest-performance-reporter` を追加して遅いテスト検出。

**出典**: [jest-bench](https://github.com/pckhoi/jest-bench), [jest-performance-reporter](https://github.com/sholzmayer/jest-performance-reporter)

### 3. テストビルダー/ファクトリーパターン

#### パターン比較
| パターン | カスタマイズ性 | ボイラープレート | 最適用途 |
|---------|-------------|---------------|---------|
| ファクトリー関数 | 低 | 最小 | シンプルなオブジェクト |
| オブジェクトマザー | 中 | 中 | 共有プリセット |
| ビルダー | 高 | 多い | 複雑なオブジェクト、多くのオプション |
| ビルダー+ファクトリー | 最高 | 最多 | 複雑ドメイン+共有デフォルト |

#### 推奨: ビルダー+ファクトリーハイブリッド
```javascript
// ファクトリーがビルダーを返す（オブジェクトではなく）
const TestUnits = {
  anInfantry() {
    return new UnitBuilder()
      .withMoveType(MoveType.Infantry)
      .withStats({ hp: 40, atk: 35, spd: 35, def: 25, res: 20 });
  },
  anArmor() {
    return new UnitBuilder()
      .withMoveType(MoveType.Armor)
      .withStats({ hp: 50, atk: 40, spd: 20, def: 40, res: 30 });
  },
};

// ファクトリーがデフォルトを提供、ビルダーでカスタマイズ
const unit = TestUnits.anArmor()
  .withWeapon(Weapon.BraveLance)
  .withSkill(PassiveB.FighterSkill)
  .build();
```

#### ネストビルダー（戦闘シナリオ用）
```javascript
class BattleScenarioBuilder {
  withAttacker(configureFn) { configureFn(this.#attacker); return this; }
  withDefender(configureFn) { configureFn(this.#defender); return this; }
  build() { return new BattleScenario(this.#attacker.build(), this.#defender.build()); }
}
```

**設計原則**:
1. ファクトリーメソッドはビルダーを返す（呼び出し側がカスタマイズ可能）
2. ファクトリーメソッドはゼロパラメータ（デフォルトは有効値）
3. テストに関連する値のみ指定（チェーホフの銃原則）

**出典**: [Test Data Builders (Nat Pryce)](http://www.natpryce.com/articles/000714.html), [Builder Factory Pattern (Harness)](https://www.harness.io/blog/builder-factory-pattern-testing)

### 4. DSL/ノードベースシステムのテスト戦略

#### テストレイヤー

**Layer 1: ノード単体テスト**
```javascript
describe('GRANTS_BONUS node', () => {
  test('applies stat bonus to unit', () => {
    const node = GRANTS_BONUS(ATK_SPD(5));
    node.evaluate(unit, context);
    expect(unit.atkBuff).toBe(5);
    expect(unit.spdBuff).toBe(5);
  });
});
```

**Layer 2: 合成/チェーンテスト**
```javascript
test('IF_NODE conditionally applies effects', () => {
    const node = IF_NODE(HP_GTE(50), GRANTS_BONUS(ATK(5)).to(UNIT));
    // condition true
    node.evaluate(fullHpUnit, context);
    expect(fullHpUnit.atkBuff).toBe(5);
    // condition false
    node.evaluate(lowHpUnit, context);
    expect(lowHpUnit.atkBuff).toBe(0);
});
```

**Layer 3: フルスキル統合テスト（推奨メインアプローチ）**
```javascript
test('Ragnell grants Atk/Def+5 and enables distant counter', () => {
    const attacker = createUnit({ weapon: Weapon.Ragnell });
    const defender = createUnit({ weapon: Weapon.BraveBow });
    const result = simulateCombat(attacker, defender);
    expect(result.attackerAtkDuringCombat).toBe(attacker.atk + 5);
    expect(result.attackerCanCounter).toBe(true);
});
```

#### 推奨戦略

1. **主要戦略: ブラックボックス行動テスト** — スキル設定に対する戦闘結果をテスト。DSLリファクタリングに強い
2. **補助: ノード単体テスト** — 新規・複雑なノードタイプに限定
3. **テストビルダーで戦闘シナリオを宣言的に構築** — DSL自体の宣言的性質に合致
4. **スナップショットテストは避ける** — 急速に進化するDSLには脆い
5. **エッジケースを体系的にテスト**: HPしきい値(25%/50%/75%/100%)、移動タイプ、武器三すくみ
6. **AAA (Arrange-Act-Assert) パターン**: Arrange=ユニット+スキル構築、Act=戦闘実行、Assert=結果確認

**出典**: [JavaScript Testing Best Practices (Goldberg)](https://github.com/goldbergyoni/javascript-testing-best-practices), [The Visitor Pattern in JavaScript](https://medium.com/@artemkhrenov/the-visitor-pattern-in-javascript-a-practical-deep-dive-3ad43056ac5e)
