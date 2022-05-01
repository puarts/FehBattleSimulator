@echo off

set battle_simulator_filenames=GlobalDefinitions,Utilities,Logger,Skill,BattleMapElement,Tile,BattleMap,BattleMapSettings,Structures,Cell,Table,HeroInfo,Unit,UnitManager,GlobalBattleContext,DamageCalculationUtility,DamageCalculator,PostCombatSkillHander,DamageCalculatorWrapper,BeginningOfTurnSkillHandler,SkillDatabase,HeroDatabase,TurnSetting,AudioManager,AetherRaidDefensePresets,SettingManager,AppData,Main_ImageProcessing,Main_OriginalAi,Main_MouseAndTouch,BattleSimulatorBase,VueComponents

rem ����V�~�����[�^�[
call %~dp0MergeSourcesAndCompress.bat %battle_simulator_filenames%,Main FehBattleSimulator

rem �p�Y�����V�~�����[�^�[
call %~dp0MergeSourcesAndCompress.bat %battle_simulator_filenames%,SummonerDuelsSimulatorMain FehSummonerDuelsSimulator

rem �X�e�[�^�X�v�Z�@
call %~dp0MergeSourcesAndCompress.bat FehStatusCalculator GlobalDefinitions,Utilities,Skill,BattleMapElement,HeroInfo,Unit,StatusCalcMain

rem ���j�b�g�r���_�[
call %~dp0MergeSourcesAndCompress.bat FehUnitBuilder GlobalDefinitions,Cell,Table,Utilities,Logger, Skill,BattleMapElement,Tile, Structures,HeroInfo,Unit,UnitManager,BattleMap,BattleMapSettings,GlobalBattleContext,DamageCalculationUtility,DamageCalculator,PostCombatSkillHander,DamageCalculatorWrapper,BeginningOfTurnSkillHandler,TurnSetting,AudioManager,AetherRaidDefensePresets,SkillDatabase,HeroDatabase,SettingManager,AppData,Main_ImageProcessing,Main_OriginalAi,Main_MouseAndTouch,BattleSimulatorBase,Main,VueComponents

rem ���̑��c�[���Ŏg���t�@�C��
set copyfiles=%battle_simulator_filenames% StatusCalcMain SampleSkillInfos SampleHeroInfos KeyRepeatHandler DamageCalculatorMain HeroStatusClustererMain
for %%n in (%copyfiles%) do (
    copy %~dp0Sources\%%n.js %destination%\%%n.js
)

pause
