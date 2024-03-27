@echo off

set battle_simulator_filenames=GlobalDefinitions,Utilities,Logger,SkillConstants,Skill,SkillImpl,BattleMapElement,Tile,BattleMap,BattleMapSettings,Structures,Cell,Table,HeroInfoConstants,HeroInfo,UnitConstants,BattleContext,Unit,UnitManager,GlobalBattleContext,DamageCalculationUtility,DamageCalculator,PostCombatSkillHander,DamageCalculatorWrapper,BeginningOfTurnSkillHandler,SkillDatabase,HeroDatabase,TurnSetting,AudioManager,AetherRaidDefensePresets,SettingManager,AppData,Main_ImageProcessing,Main_OriginalAi,Main_MouseAndTouch,BattleSimulatorBase,VueComponents


rem ����V�~�����[�^�[
call %~dp0MergeSourcesAndCompress.bat FehBattleSimulator %battle_simulator_filenames%,AetherRaidSimulatorMain

rem ���Z��V�~�����[�^�[
call %~dp0MergeSourcesAndCompress.bat FehArenaSimulator %battle_simulator_filenames%,ArenaSimulatorMain

rem �p�Y�����V�~�����[�^�[
call %~dp0MergeSourcesAndCompress.bat FehSummonerDuelsSimulator %battle_simulator_filenames%,SummonerDuelsSimulatorMain

rem �X�e�[�^�X�v�Z�@
call %~dp0MergeSourcesAndCompress.bat FehStatusCalculator GlobalDefinitions,Utilities,SkillConstants,Skill,SkillImpl,BattleMapElement,HeroInfoConstants,HeroInfo,UnitConstants,BattleContext,Unit,StatusCalcMain

rem ���j�b�g�r���_�[
call %~dp0MergeSourcesAndCompress.bat FehUnitBuilder GlobalDefinitions,Cell,Table,Utilities,Logger,SkillConstants,Skill,SkillImpl,BattleMapElement,Tile, Structures,HeroInfoConstants,HeroInfo,UnitConstants,BattleContext,Unit,UnitManager,BattleMap,BattleMapSettings,GlobalBattleContext,DamageCalculationUtility,DamageCalculator,PostCombatSkillHander,DamageCalculatorWrapper,BeginningOfTurnSkillHandler,TurnSetting,AudioManager,AetherRaidDefensePresets,SkillDatabase,HeroDatabase,SettingManager,AppData,Main_ImageProcessing,Main_OriginalAi,Main_MouseAndTouch,BattleSimulatorBase,UnitBuilderMain,VueComponents

rem �_���[�W�v�Z�@
call %~dp0MergeSourcesAndCompress.bat FehDamageCalculator GlobalDefinitions,Utilities,Logger,SkillConstants,Skill,SkillImpl,BattleMapElement,Tile,BattleMap,GlobalBattleContext,Structures,Table,HeroInfoConstants,HeroInfo,UnitConstants,BattleContext,Unit,UnitManager,SkillDatabase,HeroDatabase,DamageCalculationUtility,DamageCalculator,PostCombatSkillHander,DamageCalculatorWrapper,BeginningOfTurnSkillHandler,SampleSkillInfos,SampleHeroInfos,VueComponents,KeyRepeatHandler,DamageCalculatorMain

rem �p�Y�A�C�R�����X�g
call %~dp0MergeSourcesAndCompress.bat FehHeroIconLister GlobalDefinitions,Utilities,Logger,SkillConstants,Skill,SkillImpl,HeroInfoConstants,HeroInfo,HeroDatabase,HeroIconListerMain,SampleHeroInfos

rem ���̑��c�[���Ŏg���t�@�C��
echo other files
set copyfiles=%battle_simulator_filenames% StatusCalcMain SampleSkillInfos SampleHeroInfos KeyRepeatHandler DamageCalculatorMain HeroStatusClustererMain
for %%n in (%copyfiles%) do (
    copy %~dp0Sources\%%n.js %destination%\%%n.js
)

rem HTML�t�@�C��
echo html files
set trunk_root=%~dp0..\..\trunk
set root=%trunk_root%\Websites\fire-emblem.fun
set html_destination=%root%\blog\entries
set copyfiles=AetherRaidSimulator ArenaSimulator DamageCalculator SummonerDuelsSimulator UnitBuilder HeroIconLister StatusCalculator
for %%n in (%copyfiles%) do (
    copy %~dp0Sources\%%n.html %html_destination%\%%n.html
)

pause
