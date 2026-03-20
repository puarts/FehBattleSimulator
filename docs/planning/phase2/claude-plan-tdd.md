# Phase 2 TDD計画: ESモジュール化

テスト基盤: Jest + jsdom、`create_tests.sh` による結合方式。テストファイルは `Tests/` に配置、`create_tests.sh` の `TEST_FILE_NAMES` に登録。

---

## Stage A 前: ビルド・テスト基盤のフィルタ追加

### テスト: フィルタの正確性

```
# Test: build.mjs のフィルタが import 行を除去する
# Test: build.mjs のフィルタが export { ... } 行を除去する
# Test: build.mjs のフィルタが通常のコード行を除去しない（"import" を含む文字列リテラル、コメント等）
# Test: フィルタ適用後の出力に ^import / ^export { が残っていないことを検証
# Test: フィルタ適用前後で、import/export 以外の行数が変わらないことを検証
```

### テスト: 結合出力の互換性

```
# Test: npm run build の出力が正常（フィルタ追加前と同等のサイズ・内容）
# Test: 全305テスト + スモークテストがパス
```

---

## Stage A: インフラ層

### テスト: export/import の正確性（各ファイル共通）

```
# Test: Utilities.js — ObjectUtil, NULL_OBJECT, TreeNode がグローバルに存在する（スモークテストで確認済み）
# Test: Logger.js — LoggerBase がグローバルに存在する
# Test: Cell.js — Cell がグローバルに存在する
# Test: Table.js — Table がグローバルに存在する
# Test: BattleMapElement.js — BattleMapElement がグローバルに存在する
# Test: GlobalDefinitions.js — g_siteRootPath 等の定数がグローバルに存在する
```

各ファイル変換後、全テストスイートを実行して回帰がないことを確認。

---

## Stage B: 定数・列挙型

### テスト: 定数の存在確認

```
# Test: SkillConstants.js — Weapon, Support, Special, PassiveA/B/C, WeaponType, SkillType が定義されている（スモークテスト既存）
# Test: HeroInfoConstants.js — StatusType, MoveType, BlessingType, SeasonType が定義されている（スモークテスト既存）
# Test: UnitConstants.js — UnitGroupType が定義されている（スモークテスト既存）
```

---

## Stage C: データ構造

### テスト

```
# Test: Tile.js — Tile, TileType が定義されている
# Test: Structures.js — StructureBase, ObjType が定義されている
# Test: Skill.js — SkillInfo が定義されている
```

---

## Stage D: 情報クラス・データベース

### テスト

```
# Test: HeroInfo.js — HeroInfo が定義されている（スモークテスト既存）
# Test: SkillDatabase.js — SkillDatabase が定義されている（スモークテスト既存）
# Test: HeroDatabase.js — HeroDatabase が定義されている（スモークテスト既存）
# Test: SampleSkillInfos.js — スキルデータが読み込まれている（スモークテスト既存）
# Test: SampleHeroInfos.js — ヒーローデータが読み込まれている（スモークテスト既存）
```

---

## Stage E: スキルDSL基盤

### テスト

```
# Test: SkillEffectCore.js — SkillEffectHooks クラスが定義されている
# Test: SkillEffect.js — SkillEffectNode, SingleEffectNode, EffectsNode が定義されている（スモークテスト既存）
# Test: SkillEffectAliases.js — GRANTS_BONUS, INFLICTS_PENALTY, ATK_SPD 等のDSL関数が定義されている（スモークテスト既存）
# Test: SkillEffectHooks.js — AT_START_OF_COMBAT_HOOKS 等のフックが定義されている（スモークテスト既存）
# Test: SkillEffectRegistrar.js — SkillEffectRegistrar が定義されている（スモークテスト既存）
```

---

## Stage F: コアゲームクラス

### テスト: 循環依存の解消

```
# Test: Unit.js 変換後、UnitBuilder.fromHero('マルス').build() でユニット作成が正常動作
# Test: BattleContext.js 変換後、BattleScenarioBuilder で戦闘実行が正常動作
# Test: Unit.js と DamageCalculator.js 間の循環依存が解消されている（Phase 2 完了時にネイティブ ESM で検証）
```

---

## Stage G: スキル実装（副作用モジュール）

### テスト: 副作用の登録

```
# Test: SkillImpl.js — 代表スキル（Weapon.QuietingAntler）が登録されている（スモークテスト既存）
# Test: SkillImpl202408.js — 代表スキル（Weapon.LadysBow）が登録されている（スモークテスト既存）
# Test: SkillImpl202501.js — 代表スキル（Weapon.DongJiNoshiRiPlus）が登録されている（スモークテスト既存）
# Test: SkillImpl202601.js — 代表スキル（Weapon.HeroicMaltet）が登録されている（スモークテスト既存）
# Test: 戦闘実行が正常動作する（スモークテスト既存）
```

---

## Stage H: 戦闘計算

### テスト

```
# Test: DamageCalculator 変換後、全 combat カテゴリテストがパス
# Test: BeginningOfTurnSkillHandler 変換後、ターン開始処理テストがパス
```

---

## Stage I-K: アプリ層・UI・テストユーティリティ

### テスト

```
# Test: AppData 変換後、全テストスイートがパス
# Test: TestUtilities.js 変換後、UnitBuilder / BattleScenarioBuilder が正常動作
# Test: 全305テスト + スモークテストがパス（最終確認）
```

---

## 最終検証: ネイティブ ESM

```
# Test: エントリポイント（ArenaSimulatorMain.js）を Node.js の ESM モードで import し、TDZ エラーが出ないこと
# Test: 循環依存のあるファイル群（Unit ↔ DamageCalculator）が ESM ネイティブで正常に初期化されること
```
