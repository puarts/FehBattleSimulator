@echo off

set battle_simulator_filenames=GlobalDefinitions,Utilities,Logger,Skill,BattleMapElement,Tile,BattleMap,BattleMapSettings,Structures,Cell,Table,HeroInfo,Unit,UnitManager,GlobalBattleContext,DamageCalculationUtility,DamageCalculator,PostCombatSkillHander,DamageCalculatorWrapper,BeginningOfTurnSkillHandler,SkillDatabase,HeroDatabase,TurnSetting,AudioManager,AetherRaidDefensePresets,SettingManager,AppData,Main_ImageProcessing,Main_OriginalAi,Main_MouseAndTouch,BattleSimulatorBase,VueComponents


rem 飛空城シミュレーター
call %~dp0MergeSourcesAndCompress.bat FehBattleSimulator %battle_simulator_filenames%,AetherRaidSimulatorMain

rem 闘技場シミュレーター
call %~dp0MergeSourcesAndCompress.bat FehArenaSimulator %battle_simulator_filenames%,ArenaSimulatorMain

rem 英雄決闘シミュレーター
call %~dp0MergeSourcesAndCompress.bat FehSummonerDuelsSimulator %battle_simulator_filenames%,SummonerDuelsSimulatorMain

rem ステータス計算機
call %~dp0MergeSourcesAndCompress.bat FehStatusCalculator GlobalDefinitions,Utilities,Skill,BattleMapElement,HeroInfo,Unit,StatusCalcMain

rem ユニットビルダー
call %~dp0MergeSourcesAndCompress.bat FehUnitBuilder GlobalDefinitions,Cell,Table,Utilities,Logger, Skill,BattleMapElement,Tile, Structures,HeroInfo,Unit,UnitManager,BattleMap,BattleMapSettings,GlobalBattleContext,DamageCalculationUtility,DamageCalculator,PostCombatSkillHander,DamageCalculatorWrapper,BeginningOfTurnSkillHandler,TurnSetting,AudioManager,AetherRaidDefensePresets,SkillDatabase,HeroDatabase,SettingManager,AppData,Main_ImageProcessing,Main_OriginalAi,Main_MouseAndTouch,BattleSimulatorBase,UnitBuilderMain,VueComponents

rem ダメージ計算機
call %~dp0MergeSourcesAndCompress.bat FehDamageCalculator GlobalDefinitions,Utilities,Logger,Skill,BattleMapElement,Tile,BattleMap,GlobalBattleContext,Structures,Table,HeroInfo,Unit,UnitManager,SkillDatabase,HeroDatabase,DamageCalculationUtility,DamageCalculator,PostCombatSkillHander,DamageCalculatorWrapper,BeginningOfTurnSkillHandler,SampleSkillInfos,SampleHeroInfos,VueComponents,KeyRepeatHandler,DamageCalculatorMain

rem 英雄アイコンリスト
call %~dp0MergeSourcesAndCompress.bat FehHeroIconLister GlobalDefinitions,Utilities,Logger,Skill,HeroInfo,HeroIconListerMain,SampleHeroInfos

rem その他ツールで使うファイル
echo other files
set copyfiles=%battle_simulator_filenames% StatusCalcMain SampleSkillInfos SampleHeroInfos KeyRepeatHandler DamageCalculatorMain HeroStatusClustererMain
for %%n in (%copyfiles%) do (
    copy %~dp0Sources\%%n.js %destination%\%%n.js
)

rem HTMLファイル
echo html files
set trunk_root=%~dp0..\..\trunk
set root=%trunk_root%\Websites\puarts.com
set html_destination=%root%\blog\entries
set copyfiles=AetherRaidSimulator ArenaSimulator DamageCalculator SummonerDuelsSimulator UnitBuilder HeroIconLister
for %%n in (%copyfiles%) do (
    copy %~dp0Sources\%%n.html %html_destination%\%%n.html
)

pause
