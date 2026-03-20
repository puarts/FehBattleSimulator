# TODO: ESM import漏れの一括解消（741件 / 25ファイル）

## 状況

Phase 2（ESM移行）で各ソースファイルに `import`/`export` 文が追加されたが、**全てのシンボル参照に対応するimportが追加されていない**。旧来の連結方式（create_tests.sh）では全ファイルが1つにまとめられるためグローバル参照で動作していたが、Vite dev server（ESMネイティブ）では `ReferenceError` が発生する。

## 影響

- **Vite dev server（`npm run dev`）でブラウザ動作確認不可能**
- `vite build` は成功する（Rollupが未使用パスを最適化するため）
- Vitest テストは全500件パス（テスト内では必要なimportが揃っているため）

## 規模

| カテゴリ | ファイル数 | 不足import数 |
|----------|-----------|-------------|
| 大規模（50+件） | 4 | CustomSkill.js(172), BattleSimulatorBase.js(149), AppData.js(96), Unit.js(70) |
| 中規模（10-49件） | 8 | DamageCalculatorWrapper.js(31), SkillEffect.js(29), SkillEffectBattleContext.js(29), SkillEffectRegistrar.js(28), BattleMap.js(25), Skill.js(19), Tile.js(17), VueComponents.js(17) |
| 小規模（1-9件） | 13 | DamageCalculator.js(8), SettingManager.js(5), HeroInfoConstants.js(5), UnitConstants.js(4), DamageCalculatorMain.js(3), PostCombatSkillHandler.js(2), BeginningOfTurnSkillHandler.js(2), SkillEffectCore.js(10), SkillEffectField.js(1), SkillEffectEnv.js(1), BattleContext.js(1), BattleMapSettings.js(1), Main_ImageProcessing.js(16) |

**合計: 741件の不足import / 25ファイル**

## 頻出する不足シンボル（Top 10）

1. `StatusIndex`（Skill.js） — 8ファイルで不足
2. `StatusEffectType`（Skill.js） — 7ファイルで不足
3. `MoveType`（HeroInfoConstants.js） — 6ファイルで不足
4. `UnitGroupType`（UnitConstants.js） — 6ファイルで不足
5. `LoggerBase`（Logger.js） — 6ファイルで不足
6. `ColorType`（SkillConstants.js） — 2ファイルで不足
7. `NodeEnv`（SkillEffectEnv.js） — 5ファイルで不足
8. `DivineVeinType`（Tile.js） — 5ファイルで不足
9. `GameMode`（DamageCalculator.js） — 4ファイルで不足
10. `Unit`（Unit.js） — 5ファイルで不足

## 循環依存リスク

単純にimportを追加すると循環依存が発生するケース：
- `SkillEffect.js` ↔ `Skill.js`
- `SkillEffectCore.js` ↔ `CustomSkill.js`
- `SkillEffectCore.js` ↔ `SkillEffect.js`（既に部分的に存在）

解決策の候補：
- 共有定数モジュールへの分離
- 遅延import（dynamic import）
- ファイル構造のリファクタリング

## 対応方針

Phase 4 として対応予定。HTML側の大規模リファクタリングと合わせて実施する。
