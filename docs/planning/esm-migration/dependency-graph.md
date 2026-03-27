# ESM移行 — 依存グラフ分析結果

> 自動生成: `node Tools/build-dependency-graph.js`

## 1. ファイル間依存グラフ

- **Sources/AetherRaidDefensePresets.js** → (依存なし)
- **Sources/AetherRaidSimulatorMain.js** → Sources/BattleSimulatorBase.js, Sources/Utilities.js
- **Sources/AppData.js** → Sources/AetherRaidDefensePresets.js, Sources/AudioManager.js, Sources/BattleMap.js, Sources/BattleMapSettings.js, Sources/BattleSimulatorBase.js, Sources/DamageCalculator.js, Sources/GlobalBattleContext.js, Sources/GlobalDefinitions.js, Sources/GlobalDefinitions_Debug.js, Sources/HeroDatabase.js, Sources/HeroInfoConstants.js, Sources/Logger.js, Sources/SettingManager.js, Sources/Skill.js, Sources/SkillConstants.js, Sources/SkillDatabase.js, Sources/Structures.js, Sources/Tile.js, Sources/Unit.js, Sources/UnitConstants.js, Sources/UnitManager.js, Sources/Utilities.js
- **Sources/ArenaSimulatorMain.js** → Sources/AppData.js, Sources/BattleMap.js, Sources/BattleSimulatorBase.js, Sources/DamageCalculator.js, Sources/HeroIconListerMain.js, Sources/Utilities.js
- **Sources/AudioManager.js** → Sources/GlobalDefinitions.js, Sources/GlobalDefinitions_Debug.js, Sources/Utilities.js
- **Sources/BattleContext.js** → Sources/DamageCalculationUtility.js, Sources/Skill.js, Sources/Utilities.js
- **Sources/BattleMap.js** → Sources/AppData.js, Sources/Cell.js, Sources/DamageCalculator.js, Sources/GlobalDefinitions.js, Sources/GlobalDefinitions_Debug.js, Sources/HeroIconListerMain.js, Sources/HeroInfoConstants.js, Sources/Logger.js, Sources/Skill.js, Sources/SkillConstants.js, Sources/SkillEffect.js, Sources/SkillEffectEnv.js, Sources/SkillEffectHooks.js, Sources/Structures.js, Sources/Table.js, Sources/Tile.js, Sources/UnitConstants.js, Sources/Utilities.js
- **Sources/BattleMapElement.js** → (依存なし)
- **Sources/BattleMapSettings.js** → Sources/BattleMap.js, Sources/Structures.js, Sources/Tile.js
- **Sources/BattleSimulatorBase.js** → Sources/AetherRaidDefensePresets.js, Sources/AetherRaidSimulatorMain.js, Sources/AppData.js, Sources/ArenaSimulatorMain.js, Sources/AudioManager.js, Sources/BattleMap.js, Sources/BeginningOfTurnSkillHandler.js, Sources/Cell.js, Sources/CustomSkill.js, Sources/DamageCalculator.js, Sources/DamageCalculatorWrapper.js, Sources/GlobalDefinitions.js, Sources/GlobalDefinitions_Debug.js, Sources/HeroIconListerMain.js, Sources/HeroInfoConstants.js, Sources/Logger.js, Sources/Main_ImageProcessing.js, Sources/Main_MouseAndTouch.js, Sources/Main_OriginalAi.js, Sources/SettingManager.js, Sources/Skill.js, Sources/SkillConstants.js, Sources/SkillEffect.js, Sources/SkillEffectEnv.js, Sources/SkillEffectHooks.js, Sources/StatusCalcMain.js, Sources/Structures.js, Sources/SummonerDuelsSimulatorMain.js, Sources/Table.js, Sources/Tile.js, Sources/TurnSetting.js, Sources/Unit.js, Sources/UnitBuilderMain.js, Sources/UnitConstants.js, Sources/UnitManager.js, Sources/Utilities.js
- **Sources/BeginningOfTurnSkillHandler.js** → Sources/HeroInfoConstants.js, Sources/Skill.js, Sources/SkillConstants.js, Sources/SkillEffect.js, Sources/SkillEffectHooks.js, Sources/Structures.js, Sources/UnitConstants.js, Sources/Utilities.js
- **Sources/Cell.js** → (依存なし)
- **Sources/CustomSkill.js** → Sources/Skill.js, Sources/SkillConstants.js, Sources/SkillEffect.js, Sources/SkillEffectAliases.js, Sources/SkillEffectBattleContext.js, Sources/SkillEffectCore.js, Sources/SkillEffectHooks.js
- **Sources/DamageCalculationUtility.js** → Sources/HeroInfoConstants.js, Sources/Logger.js, Sources/Skill.js, Sources/SkillConstants.js, Sources/SkillEffect.js, Sources/SkillEffectEnv.js, Sources/SkillEffectHooks.js
- **Sources/DamageCalculator.js** → Sources/DamageCalculationUtility.js, Sources/Logger.js, Sources/Skill.js, Sources/SkillConstants.js, Sources/SkillEffect.js, Sources/SkillEffectEnv.js, Sources/SkillEffectHooks.js, Sources/StatusCalcMain.js, Sources/Unit.js, Sources/UnitConstants.js, Sources/Utilities.js
- **Sources/DamageCalculatorMain.js** → Sources/BattleMap.js, Sources/BeginningOfTurnSkillHandler.js, Sources/DamageCalculationUtility.js, Sources/DamageCalculator.js, Sources/DamageCalculatorWrapper.js, Sources/GlobalBattleContext.js, Sources/HeroDatabase.js, Sources/HeroInfoConstants.js, Sources/KeyRepeatHandler.js, Sources/Logger.js, Sources/Skill.js, Sources/SkillConstants.js, Sources/SkillDatabase.js, Sources/Tile.js, Sources/Unit.js, Sources/UnitConstants.js, Sources/UnitManager.js, Sources/Utilities.js
- **Sources/DamageCalculatorWrapper.js** → Sources/AppData.js, Sources/DamageCalculationUtility.js, Sources/DamageCalculator.js, Sources/GlobalDefinitions.js, Sources/GlobalDefinitions_Debug.js, Sources/HeroIconListerMain.js, Sources/HeroInfoConstants.js, Sources/PostCombatSkillHander.js, Sources/Skill.js, Sources/SkillConstants.js, Sources/SkillEffect.js, Sources/SkillEffectEnv.js, Sources/SkillEffectHooks.js, Sources/StatusCalcMain.js, Sources/Structures.js, Sources/Tile.js, Sources/Unit.js, Sources/UnitConstants.js, Sources/Utilities.js
- **Sources/GlobalBattleContext.js** → Sources/HeroInfoConstants.js, Sources/SkillConstants.js, Sources/UnitConstants.js
- **Sources/GlobalDefinitions.js** → (依存なし)
- **Sources/GlobalDefinitions_Debug.js** → (依存なし)
- **Sources/HeroDatabase.js** → (依存なし)
- **Sources/HeroIconListerMain.js** → Sources/HeroDatabase.js
- **Sources/HeroInfo.js** → Sources/GlobalDefinitions.js, Sources/GlobalDefinitions_Debug.js, Sources/HeroInfoConstants.js, Sources/Skill.js, Sources/SkillConstants.js
- **Sources/HeroInfoConstants.js** → Sources/GlobalDefinitions.js, Sources/GlobalDefinitions_Debug.js, Sources/Skill.js
- **Sources/HeroStatusClustererMain.js** → Sources/HeroDatabase.js, Sources/HeroInfoConstants.js, Sources/Skill.js, Sources/Utilities.js
- **Sources/KeyRepeatHandler.js** → (依存なし)
- **Sources/Local.js** → (依存なし)
- **Sources/Logger.js** → (依存なし)
- **Sources/Main_ImageProcessing.js** → Sources/AetherRaidSimulatorMain.js, Sources/AppData.js, Sources/ArenaSimulatorMain.js, Sources/BattleMap.js, Sources/BattleSimulatorBase.js, Sources/DamageCalculator.js, Sources/HeroIconListerMain.js, Sources/HeroInfoConstants.js, Sources/Main_MouseAndTouch.js, Sources/SkillConstants.js, Sources/StatusCalcMain.js, Sources/Structures.js, Sources/SummonerDuelsSimulatorMain.js, Sources/UnitBuilderMain.js, Sources/UnitConstants.js, Sources/Utilities.js
- **Sources/Main_MouseAndTouch.js** → Sources/AetherRaidSimulatorMain.js, Sources/AppData.js, Sources/ArenaSimulatorMain.js, Sources/BattleMap.js, Sources/BattleSimulatorBase.js, Sources/Cell.js, Sources/HeroIconListerMain.js, Sources/Skill.js, Sources/SkillConstants.js, Sources/StatusCalcMain.js, Sources/Structures.js, Sources/SummonerDuelsSimulatorMain.js, Sources/Table.js, Sources/Tile.js, Sources/Unit.js, Sources/UnitBuilderMain.js, Sources/UnitConstants.js, Sources/Utilities.js
- **Sources/Main_OriginalAi.js** → Sources/AetherRaidSimulatorMain.js, Sources/AppData.js, Sources/ArenaSimulatorMain.js, Sources/BattleSimulatorBase.js, Sources/HeroIconListerMain.js, Sources/SkillConstants.js, Sources/StatusCalcMain.js, Sources/Structures.js, Sources/SummonerDuelsSimulatorMain.js, Sources/Tile.js, Sources/Unit.js, Sources/UnitBuilderMain.js, Sources/UnitConstants.js, Sources/Utilities.js
- **Sources/PostCombatSkillHander.js** → Sources/AppData.js, Sources/BattleSimulatorBase.js, Sources/HeroIconListerMain.js, Sources/HeroInfoConstants.js, Sources/Skill.js, Sources/SkillConstants.js, Sources/SkillEffect.js, Sources/SkillEffectHooks.js, Sources/Tile.js
- **Sources/SampleHeroInfos.js** → Sources/HeroInfo.js, Sources/HeroInfoConstants.js
- **Sources/SampleSkillInfos.js** → Sources/HeroInfoConstants.js, Sources/Skill.js, Sources/SkillConstants.js
- **Sources/SettingManager.js** → Sources/AppData.js, Sources/BattleSimulatorBase.js, Sources/GlobalDefinitions.js, Sources/GlobalDefinitions_Debug.js, Sources/TurnSetting.js, Sources/Utilities.js
- **Sources/Skill.js** → Sources/AppData.js, Sources/GlobalDefinitions.js, Sources/GlobalDefinitions_Debug.js, Sources/HeroIconListerMain.js, Sources/Logger.js, Sources/SkillConstants.js, Sources/SkillEffect.js, Sources/SkillEffectEnv.js, Sources/SkillEffectHooks.js, Sources/UnitConstants.js
- **Sources/SkillConstants.js** → Sources/GlobalDefinitions.js, Sources/GlobalDefinitions_Debug.js
- **Sources/SkillDatabase.js** → Sources/SkillConstants.js
- **Sources/SkillEffect.js** → Sources/AppData.js, Sources/BattleSimulatorBase.js, Sources/DamageCalculationUtility.js, Sources/DamageCalculator.js, Sources/HeroIconListerMain.js, Sources/HeroInfoConstants.js, Sources/Logger.js, Sources/Skill.js, Sources/SkillConstants.js, Sources/SkillEffectCore.js, Sources/SkillEffectEnv.js, Sources/SkillEffectUnit.js, Sources/Structures.js, Sources/Tile.js, Sources/Unit.js, Sources/UnitConstants.js, Sources/Utilities.js
- **Sources/SkillEffectAliases.js** → Sources/AppData.js, Sources/HeroIconListerMain.js, Sources/HeroInfoConstants.js, Sources/Skill.js, Sources/SkillConstants.js, Sources/SkillEffect.js, Sources/SkillEffectBattleContext.js, Sources/SkillEffectCore.js, Sources/SkillEffectEnv.js, Sources/SkillEffectHooks.js, Sources/Tile.js, Sources/Utilities.js
- **Sources/SkillEffectBattleContext.js** → Sources/AppData.js, Sources/BattleContext.js, Sources/HeroIconListerMain.js, Sources/Skill.js, Sources/SkillConstants.js, Sources/SkillEffect.js, Sources/SkillEffectAliases.js, Sources/SkillEffectCore.js, Sources/SkillEffectEnv.js, Sources/SkillEffectField.js, Sources/UnitConstants.js, Sources/Utilities.js
- **Sources/SkillEffectCore.js** → Sources/AppData.js, Sources/CustomSkill.js, Sources/HeroIconListerMain.js, Sources/Logger.js, Sources/SkillConstants.js, Sources/SkillEffect.js, Sources/SkillEffectAliases.js, Sources/SkillEffectEnv.js, Sources/Tile.js, Sources/UnitConstants.js, Sources/Utilities.js
- **Sources/SkillEffectEnv.js** → Sources/AppData.js, Sources/DamageCalculator.js, Sources/HeroIconListerMain.js, Sources/Logger.js
- **Sources/SkillEffectField.js** → Sources/SkillEffect.js, Sources/SkillEffectCore.js, Sources/Utilities.js
- **Sources/SkillEffectHooks.js** → Sources/SkillEffectCore.js
- **Sources/SkillEffectRegistrar.js** → Sources/SkillEffect.js, Sources/SkillEffectAliases.js, Sources/SkillEffectCore.js, Sources/SkillEffectHooks.js, Sources/Utilities.js
- **Sources/SkillEffectUnit.js** → Sources/SkillEffect.js, Sources/SkillEffectCore.js, Sources/SkillEffectField.js, Sources/Unit.js, Sources/UnitConstants.js, Sources/Utilities.js
- **Sources/SkillImpl.js** → Sources/AppData.js, Sources/DamageCalculationUtility.js, Sources/DamageCalculator.js, Sources/DamageCalculatorWrapper.js, Sources/HeroIconListerMain.js, Sources/HeroInfoConstants.js, Sources/Skill.js, Sources/SkillConstants.js, Sources/SkillEffect.js, Sources/SkillEffectAliases.js, Sources/SkillEffectBattleContext.js, Sources/SkillEffectCore.js, Sources/SkillEffectHooks.js, Sources/SkillEffectRegistrar.js, Sources/Tile.js, Sources/Unit.js, Sources/UnitConstants.js, Sources/Utilities.js
- **Sources/SkillImpl202408.js** → Sources/HeroInfoConstants.js, Sources/Skill.js, Sources/SkillConstants.js, Sources/SkillEffect.js, Sources/SkillEffectAliases.js, Sources/SkillEffectBattleContext.js, Sources/SkillEffectCore.js, Sources/SkillEffectHooks.js, Sources/Tile.js, Sources/UnitConstants.js
- **Sources/SkillImpl202501.js** → Sources/HeroInfoConstants.js, Sources/Skill.js, Sources/SkillConstants.js, Sources/SkillEffect.js, Sources/SkillEffectAliases.js, Sources/SkillEffectBattleContext.js, Sources/SkillEffectCore.js, Sources/SkillEffectHooks.js, Sources/SkillEffectRegistrar.js, Sources/Tile.js, Sources/UnitConstants.js
- **Sources/SkillImpl202601.js** → Sources/Skill.js, Sources/SkillConstants.js, Sources/SkillEffect.js, Sources/SkillEffectAliases.js, Sources/SkillEffectBattleContext.js, Sources/SkillEffectCore.js, Sources/SkillEffectHooks.js, Sources/SkillEffectRegistrar.js, Sources/SkillEffectUnit.js, Sources/Tile.js, Sources/UnitConstants.js
- **Sources/StatusCalcMain.js** → Sources/HeroInfoConstants.js, Sources/Skill.js, Sources/Unit.js, Sources/UnitConstants.js
- **Sources/Structures.js** → Sources/BattleMapElement.js, Sources/GlobalDefinitions.js, Sources/GlobalDefinitions_Debug.js, Sources/Utilities.js
- **Sources/SummonerDuelsSimulatorMain.js** → Sources/AppData.js, Sources/AudioManager.js, Sources/BattleSimulatorBase.js, Sources/DamageCalculator.js, Sources/HeroIconListerMain.js, Sources/UnitConstants.js, Sources/Utilities.js
- **Sources/Table.js** → Sources/AppData.js, Sources/Cell.js, Sources/HeroIconListerMain.js
- **Sources/TestUtilities.js** → Sources/AppData.js, Sources/BattleMap.js, Sources/BeginningOfTurnSkillHandler.js, Sources/DamageCalculator.js, Sources/DamageCalculatorWrapper.js, Sources/GlobalBattleContext.js, Sources/HeroDatabase.js, Sources/HeroIconListerMain.js, Sources/HeroInfoConstants.js, Sources/Logger.js, Sources/Skill.js, Sources/SkillConstants.js, Sources/SkillDatabase.js, Sources/Tile.js, Sources/Unit.js, Sources/UnitManager.js, Sources/Utilities.js
- **Sources/Tile.js** → Sources/BattleMapElement.js, Sources/GlobalDefinitions.js, Sources/GlobalDefinitions_Debug.js, Sources/HeroInfoConstants.js, Sources/Skill.js, Sources/SkillConstants.js, Sources/Structures.js, Sources/UnitConstants.js
- **Sources/TurnSetting.js** → Sources/GlobalDefinitions.js, Sources/GlobalDefinitions_Debug.js
- **Sources/Unit.js** → Sources/AppData.js, Sources/BattleContext.js, Sources/BattleMapElement.js, Sources/GlobalDefinitions.js, Sources/GlobalDefinitions_Debug.js, Sources/HeroIconListerMain.js, Sources/HeroInfoConstants.js, Sources/Logger.js, Sources/Skill.js, Sources/SkillConstants.js, Sources/SkillEffect.js, Sources/SkillEffectEnv.js, Sources/SkillEffectHooks.js, Sources/Structures.js, Sources/Tile.js, Sources/UnitConstants.js, Sources/Utilities.js
- **Sources/UnitBuilderMain.js** → Sources/AppData.js, Sources/BattleSimulatorBase.js, Sources/DamageCalculator.js, Sources/GlobalDefinitions.js, Sources/GlobalDefinitions_Debug.js, Sources/HeroIconListerMain.js, Sources/HeroInfoConstants.js, Sources/SettingManager.js, Sources/UnitConstants.js, Sources/Utilities.js
- **Sources/UnitConstants.js** → Sources/DamageCalculator.js, Sources/GlobalDefinitions.js, Sources/GlobalDefinitions_Debug.js, Sources/HeroInfoConstants.js, Sources/Skill.js
- **Sources/UnitManager.js** → Sources/HeroInfoConstants.js, Sources/Skill.js, Sources/Unit.js, Sources/UnitConstants.js, Sources/Utilities.js
- **Sources/Utilities.js** → Sources/GlobalDefinitions.js, Sources/GlobalDefinitions_Debug.js, Sources/SkillConstants.js, Sources/Tile.js, Sources/UnitConstants.js
- **Sources/VueComponents.js** → Sources/BattleSimulatorBase.js, Sources/DamageCalculator.js, Sources/Logger.js, Sources/Tile.js, Sources/Unit.js, Sources/Utilities.js

## 2. 循環依存一覧

1 件の循環依存グループを検出:

### 循環グループ 1

- Sources/AetherRaidSimulatorMain.js
- Sources/AppData.js
- Sources/ArenaSimulatorMain.js
- Sources/AudioManager.js
- Sources/BattleContext.js
- Sources/BattleMap.js
- Sources/BattleMapSettings.js
- Sources/BattleSimulatorBase.js
- Sources/BeginningOfTurnSkillHandler.js
- Sources/CustomSkill.js
- Sources/DamageCalculationUtility.js
- Sources/DamageCalculator.js
- Sources/DamageCalculatorWrapper.js
- Sources/GlobalBattleContext.js
- Sources/HeroInfoConstants.js
- Sources/Main_ImageProcessing.js
- Sources/Main_MouseAndTouch.js
- Sources/Main_OriginalAi.js
- Sources/PostCombatSkillHander.js
- Sources/SettingManager.js
- Sources/Skill.js
- Sources/SkillEffect.js
- Sources/SkillEffectAliases.js
- Sources/SkillEffectBattleContext.js
- Sources/SkillEffectCore.js
- Sources/SkillEffectEnv.js
- Sources/SkillEffectField.js
- Sources/SkillEffectHooks.js
- Sources/SkillEffectUnit.js
- Sources/StatusCalcMain.js
- Sources/Structures.js
- Sources/SummonerDuelsSimulatorMain.js
- Sources/Table.js
- Sources/Tile.js
- Sources/Unit.js
- Sources/UnitBuilderMain.js
- Sources/UnitConstants.js
- Sources/UnitManager.js
- Sources/Utilities.js

#### 巨大SCC内の代表的な局所循環パターン

39ファイルが1つのSCCに収まるのは、グローバル依存が推移的に絡み合っている実態を反映している。以下はSCC内部の主要な局所循環であり、Phase 2b以降の分割候補の起点となる:

| 局所循環パターン | 現在の緩和策 | 将来の対処候補 |
|----------------|------------|---------------|
| AppData ↔ BattleSimulatorBase | g_appData シングルトン経由 | 明示的初期化パターン・DI |
| Unit ↔ BattleContext ↔ BattleMap | 参照渡し | 型/インターフェース分離 |
| DamageCalculator ↔ PostCombatSkillHandler | DamageCalculatorWrapper が両方を生成 | ファクトリパターン |

> **Note**: Section-04（ディレクトリ設計）では「巨大SCCをどう分割候補に切るか」を主題として扱う。

## 3. 依存レイヤー図

### Layer 0 (9 files)

- Sources/AetherRaidDefensePresets.js
- Sources/BattleMapElement.js
- Sources/Cell.js
- Sources/GlobalDefinitions.js
- Sources/GlobalDefinitions_Debug.js
- Sources/HeroDatabase.js
- Sources/KeyRepeatHandler.js
- Sources/Local.js
- Sources/Logger.js

### Layer 1 (3 files)

- Sources/HeroIconListerMain.js
- Sources/SkillConstants.js
- Sources/TurnSetting.js

### Layer 2 (1 files)

- Sources/SkillDatabase.js

### Layer 3 (39 files)

- Sources/AetherRaidSimulatorMain.js
- Sources/AppData.js
- Sources/ArenaSimulatorMain.js
- Sources/AudioManager.js
- Sources/BattleContext.js
- Sources/BattleMap.js
- Sources/BattleMapSettings.js
- Sources/BattleSimulatorBase.js
- Sources/BeginningOfTurnSkillHandler.js
- Sources/CustomSkill.js
- Sources/DamageCalculationUtility.js
- Sources/DamageCalculator.js
- Sources/DamageCalculatorWrapper.js
- Sources/GlobalBattleContext.js
- Sources/HeroInfoConstants.js
- Sources/Main_ImageProcessing.js
- Sources/Main_MouseAndTouch.js
- Sources/Main_OriginalAi.js
- Sources/PostCombatSkillHander.js
- Sources/SettingManager.js
- Sources/Skill.js
- Sources/SkillEffect.js
- Sources/SkillEffectAliases.js
- Sources/SkillEffectBattleContext.js
- Sources/SkillEffectCore.js
- Sources/SkillEffectEnv.js
- Sources/SkillEffectField.js
- Sources/SkillEffectHooks.js
- Sources/SkillEffectUnit.js
- Sources/StatusCalcMain.js
- Sources/Structures.js
- Sources/SummonerDuelsSimulatorMain.js
- Sources/Table.js
- Sources/Tile.js
- Sources/Unit.js
- Sources/UnitBuilderMain.js
- Sources/UnitConstants.js
- Sources/UnitManager.js
- Sources/Utilities.js

### Layer 4 (8 files)

- Sources/DamageCalculatorMain.js
- Sources/HeroInfo.js
- Sources/HeroStatusClustererMain.js
- Sources/SampleSkillInfos.js
- Sources/SkillEffectRegistrar.js
- Sources/SkillImpl202408.js
- Sources/TestUtilities.js
- Sources/VueComponents.js

### Layer 5 (4 files)

- Sources/SampleHeroInfos.js
- Sources/SkillImpl.js
- Sources/SkillImpl202501.js
- Sources/SkillImpl202601.js

## 4. 副作用分類表

| ファイル | 分類 |
|---------|------|
| Sources/AetherRaidDefensePresets.js | pure-definition |
| Sources/AetherRaidSimulatorMain.js | global-assignment |
| Sources/AppData.js | global-assignment |
| Sources/ArenaSimulatorMain.js | global-assignment |
| Sources/AudioManager.js | pure-definition |
| Sources/BattleContext.js | pure-definition |
| Sources/BattleMap.js | initialization-root |
| Sources/BattleMapElement.js | pure-definition |
| Sources/BattleMapSettings.js | pure-definition |
| Sources/BattleSimulatorBase.js | global-assignment |
| Sources/BeginningOfTurnSkillHandler.js | pure-definition |
| Sources/Cell.js | pure-definition |
| Sources/CustomSkill.js | initialization-root |
| Sources/DamageCalculationUtility.js | initialization-root |
| Sources/DamageCalculator.js | pure-definition |
| Sources/DamageCalculatorMain.js | global-assignment |
| Sources/DamageCalculatorWrapper.js | pure-definition |
| Sources/GlobalBattleContext.js | pure-definition |
| Sources/GlobalDefinitions_Debug.js | global-constant |
| Sources/GlobalDefinitions.js | global-constant |
| Sources/HeroDatabase.js | pure-definition |
| Sources/HeroIconListerMain.js | global-mutable-state |
| Sources/HeroInfo.js | pure-definition |
| Sources/HeroInfoConstants.js | initialization-root |
| Sources/HeroStatusClustererMain.js | global-assignment |
| Sources/KeyRepeatHandler.js | pure-definition |
| Sources/Local.js | pure-definition |
| Sources/Logger.js | pure-definition |
| Sources/Main_ImageProcessing.js | pure-definition |
| Sources/Main_MouseAndTouch.js | global-assignment |
| Sources/Main_OriginalAi.js | pure-definition |
| Sources/PostCombatSkillHander.js | pure-definition |
| Sources/SampleHeroInfos.js | pure-definition |
| Sources/SampleSkillInfos.js | pure-definition |
| Sources/SettingManager.js | pure-definition |
| Sources/Skill.js | initialization-root |
| Sources/SkillConstants.js | initialization-root |
| Sources/SkillDatabase.js | pure-definition |
| Sources/SkillEffect.js | pure-definition |
| Sources/SkillEffectAliases.js | pure-definition |
| Sources/SkillEffectBattleContext.js | pure-definition |
| Sources/SkillEffectCore.js | pure-definition |
| Sources/SkillEffectEnv.js | pure-definition |
| Sources/SkillEffectField.js | pure-definition |
| Sources/SkillEffectHooks.js | pure-definition |
| Sources/SkillEffectRegistrar.js | pure-definition |
| Sources/SkillEffectUnit.js | pure-definition |
| Sources/SkillImpl.js | initialization-root |
| Sources/SkillImpl202408.js | initialization-root |
| Sources/SkillImpl202501.js | initialization-root |
| Sources/SkillImpl202601.js | initialization-root |
| Sources/StatusCalcMain.js | global-mutable-state |
| Sources/Structures.js | pure-definition |
| Sources/SummonerDuelsSimulatorMain.js | global-assignment |
| Sources/Table.js | pure-definition |
| Sources/TestUtilities.js | pure-definition |
| Sources/Tile.js | initialization-root |
| Sources/TurnSetting.js | pure-definition |
| Sources/Unit.js | pure-definition |
| Sources/UnitBuilderMain.js | global-assignment |
| Sources/UnitConstants.js | pure-definition |
| Sources/UnitManager.js | pure-definition |
| Sources/Utilities.js | pure-definition |
| Sources/VueComponents.js | initialization-root |

## 5. HTMLエントリポイント分類

| HTML | 分類 | JSファイル数 |
|------|------|------------|
| AetherRaidSimulator.html | 本番 | 47 |
| ArenaSimulator.html | 本番 | 47 |
| DamageCalculator.html | 本番 | 40 |
| HeroIconLister.html | 本番 | 10 |
| HeroStatusClusterer.html | ローカル/要確認 | 4 |
| StatusCalculator.html | 本番 | 12 |
| SummonerDuelsSimulator.html | 本番 | 47 |
| UnitBuilder.html | 本番 | 47 |

### AetherRaidSimulator.html

- GlobalDefinitions_Debug.js
- Cell.js
- Table.js
- Utilities.js
- Logger.js
- SkillConstants.js
- Skill.js
- BattleMapElement.js
- Tile.js
- Structures.js
- HeroInfoConstants.js
- HeroInfo.js
- UnitConstants.js
- BattleContext.js
- Unit.js
- UnitManager.js
- BattleMap.js
- BattleMapSettings.js
- GlobalBattleContext.js
- DamageCalculationUtility.js
- DamageCalculator.js
- PostCombatSkillHander.js
- DamageCalculatorWrapper.js
- BeginningOfTurnSkillHandler.js
- TurnSetting.js
- AudioManager.js
- AetherRaidDefensePresets.js
- SkillDatabase.js
- HeroDatabase.js
- SettingManager.js
- AppData.js
- Main_ImageProcessing.js
- Main_OriginalAi.js
- Main_MouseAndTouch.js
- BattleSimulatorBase.js
- AetherRaidSimulatorMain.js
- VueComponents.js
- SampleSkillInfos.js
- SampleHeroInfos.js
- Local.js
- https://code.jquery.com/jquery-3.3.1.slim.min.js
- https://cdnjs.cloudflare.com/ajax/libs/jquery/1.7.2/jquery.min.js
- https://fire-emblem.fun/js/jquery-3.7.0.min.js
- https://cdnjs.cloudflare.com/ajax/libs/select2/4.0.6-rc.0/js/select2.min.js
- https://cdnjs.cloudflare.com/ajax/libs/vue/2.5.13/vue.min.js
- https://unpkg.com/vuex@3.6.2/dist/vuex.min.js
- https://cdnjs.cloudflare.com/ajax/libs/jquery-cookie/1.4.1/jquery.cookie.js

### ArenaSimulator.html

- GlobalDefinitions_Debug.js
- Cell.js
- Table.js
- Utilities.js
- Logger.js
- SkillConstants.js
- Skill.js
- BattleMapElement.js
- Tile.js
- Structures.js
- HeroInfoConstants.js
- HeroInfo.js
- UnitConstants.js
- BattleContext.js
- Unit.js
- UnitManager.js
- BattleMap.js
- BattleMapSettings.js
- GlobalBattleContext.js
- DamageCalculationUtility.js
- DamageCalculator.js
- PostCombatSkillHander.js
- DamageCalculatorWrapper.js
- BeginningOfTurnSkillHandler.js
- TurnSetting.js
- AudioManager.js
- AetherRaidDefensePresets.js
- SkillDatabase.js
- HeroDatabase.js
- SettingManager.js
- AppData.js
- Main_ImageProcessing.js
- Main_OriginalAi.js
- Main_MouseAndTouch.js
- BattleSimulatorBase.js
- ArenaSimulatorMain.js
- VueComponents.js
- SampleSkillInfos.js
- SampleHeroInfos.js
- Local.js
- https://code.jquery.com/jquery-3.3.1.slim.min.js
- https://cdnjs.cloudflare.com/ajax/libs/jquery/1.7.2/jquery.min.js
- https://fire-emblem.fun/js/jquery-3.7.0.min.js
- https://cdnjs.cloudflare.com/ajax/libs/select2/4.0.6-rc.0/js/select2.min.js
- https://cdnjs.cloudflare.com/ajax/libs/vue/2.5.13/vue.min.js
- https://unpkg.com/vuex@3.6.2/dist/vuex.min.js
- https://cdnjs.cloudflare.com/ajax/libs/jquery-cookie/1.4.1/jquery.cookie.js

### DamageCalculator.html

- GlobalDefinitions_Debug.js
- Utilities.js
- Logger.js
- SkillConstants.js
- Skill.js
- BattleMapElement.js
- Tile.js
- BattleMap.js
- GlobalBattleContext.js
- Structures.js
- Table.js
- HeroInfoConstants.js
- HeroInfo.js
- UnitConstants.js
- BattleContext.js
- Unit.js
- UnitManager.js
- SkillDatabase.js
- HeroDatabase.js
- AudioManager.js
- DamageCalculationUtility.js
- DamageCalculator.js
- PostCombatSkillHander.js
- DamageCalculatorWrapper.js
- BeginningOfTurnSkillHandler.js
- AudioManager.js
- SampleSkillInfos.js
- SampleHeroInfos.js
- VueComponents.js
- KeyRepeatHandler.js
- DamageCalculatorMain.js
- Local.js
- https://code.jquery.com/jquery-3.3.1.slim.min.js
- https://fire-emblem.fun/js/jquery-3.7.0.min.js
- https://cdnjs.cloudflare.com/ajax/libs/select2/4.0.6-rc.0/js/select2.min.js
- https://ajax.googleapis.com/ajax/libs/jqueryui/1.12.1/jquery-ui.min.js
- https://cdnjs.cloudflare.com/ajax/libs/vue/2.5.13/vue.min.js
- https://unpkg.com/vuex@3.6.2/dist/vuex.min.js
- https://cdnjs.cloudflare.com/ajax/libs/lz-string/1.4.4/lz-string.min.js
- https://cdnjs.cloudflare.com/ajax/libs/Chart.js/2.1.4/Chart.bundle.min.js

### HeroIconLister.html

- GlobalDefinitions_Debug.js
- Utilities.js
- SkillConstants.js
- Skill.js
- HeroInfoConstants.js
- HeroInfo.js
- HeroDatabase.js
- HeroIconListerMain.js
- SampleHeroInfos.js
- Local.js

### HeroStatusClusterer.html

- https://cdnjs.cloudflare.com/ajax/libs/select2/4.0.6-rc.0/js/select2.min.js
- https://ajax.googleapis.com/ajax/libs/jqueryui/1.12.1/jquery-ui.min.js
- https://cdnjs.cloudflare.com/ajax/libs/vue/2.5.13/vue.min.js
- https://unpkg.com/vuex@3.6.2/dist/vuex.min.js

### StatusCalculator.html

- GlobalDefinitions_Debug.js
- Utilities.js
- SkillConstants.js
- Skill.js
- BattleMapElement.js
- HeroInfoConstants.js
- HeroInfo.js
- UnitConstants.js
- BattleContext.js
- Unit.js
- StatusCalcMain.js
- Local.js

### SummonerDuelsSimulator.html

- GlobalDefinitions_Debug.js
- Cell.js
- Table.js
- Utilities.js
- Logger.js
- SkillConstants.js
- Skill.js
- BattleMapElement.js
- Tile.js
- Structures.js
- HeroInfoConstants.js
- HeroInfo.js
- UnitConstants.js
- BattleContext.js
- Unit.js
- UnitManager.js
- BattleMap.js
- BattleMapSettings.js
- GlobalBattleContext.js
- DamageCalculationUtility.js
- DamageCalculator.js
- PostCombatSkillHander.js
- DamageCalculatorWrapper.js
- BeginningOfTurnSkillHandler.js
- TurnSetting.js
- AudioManager.js
- AetherRaidDefensePresets.js
- SkillDatabase.js
- HeroDatabase.js
- SettingManager.js
- AppData.js
- Main_ImageProcessing.js
- Main_OriginalAi.js
- Main_MouseAndTouch.js
- BattleSimulatorBase.js
- SummonerDuelsSimulatorMain.js
- VueComponents.js
- SampleSkillInfos.js
- SampleHeroInfos.js
- Local.js
- https://code.jquery.com/jquery-3.3.1.slim.min.js
- https://cdnjs.cloudflare.com/ajax/libs/jquery/1.7.2/jquery.min.js
- https://fire-emblem.fun/js/jquery-3.7.0.min.js
- https://cdnjs.cloudflare.com/ajax/libs/select2/4.0.6-rc.0/js/select2.min.js
- https://cdnjs.cloudflare.com/ajax/libs/vue/2.5.13/vue.min.js
- https://unpkg.com/vuex@3.6.2/dist/vuex.min.js
- https://cdnjs.cloudflare.com/ajax/libs/jquery-cookie/1.4.1/jquery.cookie.js

### UnitBuilder.html

- GlobalDefinitions_Debug.js
- Cell.js
- Table.js
- Utilities.js
- Logger.js
- SkillConstants.js
- Skill.js
- BattleMapElement.js
- Tile.js
- Structures.js
- HeroInfoConstants.js
- HeroInfo.js
- UnitConstants.js
- BattleContext.js
- Unit.js
- UnitManager.js
- BattleMap.js
- BattleMapSettings.js
- GlobalBattleContext.js
- DamageCalculationUtility.js
- DamageCalculator.js
- PostCombatSkillHander.js
- DamageCalculatorWrapper.js
- BeginningOfTurnSkillHandler.js
- TurnSetting.js
- AudioManager.js
- AetherRaidDefensePresets.js
- SkillDatabase.js
- HeroDatabase.js
- SettingManager.js
- AppData.js
- Main_ImageProcessing.js
- Main_OriginalAi.js
- Main_MouseAndTouch.js
- BattleSimulatorBase.js
- UnitBuilderMain.js
- VueComponents.js
- SampleSkillInfos.js
- SampleHeroInfos.js
- Local.js
- https://code.jquery.com/jquery-3.3.1.slim.min.js
- https://cdnjs.cloudflare.com/ajax/libs/jquery/1.7.2/jquery.min.js
- https://fire-emblem.fun/js/jquery-3.7.0.min.js
- https://cdnjs.cloudflare.com/ajax/libs/select2/4.0.6-rc.0/js/select2.min.js
- https://cdnjs.cloudflare.com/ajax/libs/vue/2.5.13/vue.min.js
- https://unpkg.com/vuex@3.6.2/dist/vuex.min.js
- https://cdnjs.cloudflare.com/ajax/libs/jquery-cookie/1.4.1/jquery.cookie.js

## 6. サマリー

- 解析ファイル数: 64
- 依存エッジ数: 474
- 循環依存グループ数: 1
- レイヤー数: 6
- HTMLエントリポイント数: 8
