@echo off

set battle_simulator_skill_effect_filenames=SkillEffectCore,SkillEffectEnv,SkillEffect,SkillEffectBattleContext,SkillEffectHooks
set battle_simulator_skill_impl_filenames=SkillEffectAliases,CustomSkill,SkillImpl,SkillImpl202408,SkillImpl202501
set battle_simulator_filenames=GlobalDefinitions,Utilities,Logger,SkillConstants,Skill,%battle_simulator_skill_effect_filenames%,BattleMapElement,Tile,BattleMap,BattleMapSettings,Structures,Cell,Table,HeroInfoConstants,HeroInfo,UnitConstants,BattleContext,Unit,UnitManager,GlobalBattleContext,DamageCalculationUtility,DamageCalculator,PostCombatSkillHander,DamageCalculatorWrapper,BeginningOfTurnSkillHandler,SkillDatabase,HeroDatabase,TurnSetting,AudioManager,AetherRaidDefensePresets,SettingManager,AppData,Main_ImageProcessing,Main_OriginalAi,Main_MouseAndTouch,BattleSimulatorBase,VueComponents,%battle_simulator_skill_impl_filenames%


rem 飛空城シミュレーター
call %~dp0MergeSourcesAndCompress.bat FehBattleSimulator %battle_simulator_filenames%,AetherRaidSimulatorMain

rem 闘技場シミュレーター
call %~dp0MergeSourcesAndCompress.bat FehArenaSimulator %battle_simulator_filenames%,ArenaSimulatorMain

rem 英雄決闘シミュレーター
call %~dp0MergeSourcesAndCompress.bat FehSummonerDuelsSimulator %battle_simulator_filenames%,SummonerDuelsSimulatorMain

rem ステータス計算機
call %~dp0MergeSourcesAndCompress.bat FehStatusCalculator GlobalDefinitions,Utilities,SkillConstants,Skill,%battle_simulator_skill_effect_filenames%,BattleMapElement,HeroInfoConstants,HeroInfo,UnitConstants,BattleContext,Unit,StatusCalcMain,%battle_simulator_skill_impl_filenames%

rem ユニットビルダー
call %~dp0MergeSourcesAndCompress.bat FehUnitBuilder GlobalDefinitions,Cell,Table,Utilities,Logger,SkillConstants,Skill,%battle_simulator_skill_effect_filenames%,BattleMapElement,Tile, Structures,HeroInfoConstants,HeroInfo,UnitConstants,BattleContext,Unit,UnitManager,BattleMap,BattleMapSettings,GlobalBattleContext,DamageCalculationUtility,DamageCalculator,PostCombatSkillHander,DamageCalculatorWrapper,BeginningOfTurnSkillHandler,TurnSetting,AudioManager,AetherRaidDefensePresets,SkillDatabase,HeroDatabase,SettingManager,AppData,Main_ImageProcessing,Main_OriginalAi,Main_MouseAndTouch,BattleSimulatorBase,UnitBuilderMain,VueComponents,%battle_simulator_skill_impl_filenames%

rem ダメージ計算機
call %~dp0MergeSourcesAndCompress.bat FehDamageCalculator GlobalDefinitions,Utilities,Logger,SkillConstants,Skill,%battle_simulator_skill_effect_filenames%,BattleMapElement,Tile,BattleMap,GlobalBattleContext,Structures,Table,HeroInfoConstants,HeroInfo,UnitConstants,BattleContext,Unit,UnitManager,SkillDatabase,HeroDatabase,DamageCalculationUtility,DamageCalculator,PostCombatSkillHander,DamageCalculatorWrapper,BeginningOfTurnSkillHandler,SampleSkillInfos,SampleHeroInfos,VueComponents,KeyRepeatHandler,DamageCalculatorMain,%battle_simulator_skill_impl_filenames%

rem 英雄アイコンリスト
call %~dp0MergeSourcesAndCompress.bat FehHeroIconLister GlobalDefinitions,Utilities,Logger,SkillConstants,Skill,%battle_simulator_skill_effect_filenames%,HeroInfoConstants,HeroInfo,HeroDatabase,HeroIconListerMain,SampleHeroInfos,%battle_simulator_skill_impl_filenames%

rem その他ツールで使うファイル
echo other files
set copyfiles=%battle_simulator_filenames% StatusCalcMain SampleSkillInfos SampleHeroInfos KeyRepeatHandler DamageCalculatorMain HeroStatusClustererMain

rem 多分今はコピー不要なので、一旦コピーしないでおく
REM for %%n in (%copyfiles%) do (
    REM copy %~dp0Sources\%%n.js %destination%\%%n.js
REM )

echo css files
set css_filenames=feh-battle-simulator
set copyfiles=%css_filenames%
for %%n in (%copyfiles%) do (
    copy %~dp0Sources\%%n.css %destination%\%%n.css
)

rem HTMLファイル
echo html files
set trunk_root=%~dp0..\..\trunk
set root=%trunk_root%\Websites\fire-emblem.fun
set html_destination=%root%\blog\entries
set copyfiles=AetherRaidSimulator ArenaSimulator DamageCalculator SummonerDuelsSimulator UnitBuilder HeroIconLister StatusCalculator
for %%n in (%copyfiles%) do (
    copy %~dp0Sources\%%n.html %html_destination%\%%n.html
)

pause
