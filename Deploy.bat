@echo off

rem --- 1. �X�L���G�t�F�N�g�֘A ---
set ef=skill-dsl\SkillEffectCore,skill-dsl\SkillEffectEnv,skill-dsl\SkillEffect,skill-dsl\SkillEffectField,skill-dsl\SkillEffectUnit
set ef=%ef%,skill-dsl\SkillEffectBattleContext,skill-dsl\SkillEffectHooks,skill-dsl\SkillEffectRegistrar
set battle_simulator_skill_effect_filenames=%ef%

rem --- 2. �X�L�������֘A ---
set im=skill-dsl\SkillEffectAliases,skill-impl\CustomSkill,skill-impl\SkillImpl
set im=%im%,skill-impl\SkillImpl202408,skill-impl\SkillImpl202501,skill-impl\SkillImpl202601
set battle_simulator_skill_impl_filenames=%im%

rem --- 3. �V�~�����[�^�[��{�t�@�C���i�J�e�S���ʂɌp�������j ---
rem ��ՁE���[�e�B���e�B
set BF=core\GlobalDefinitions,core\Utilities,core\Logger,data\SkillConstants,data\Skill
rem �}�b�v�E�\��
set BF=%BF%,map\BattleMapElement,map\Tile,map\BattleMap,map\BattleMapSettings,map\Structures,map\Cell,map\Table
rem ���j�b�g�E���
set BF=%BF%,data\HeroInfoConstants,data\HeroInfo,data\UnitConstants,unit\BattleContext,unit\UnitContext,unit\Unit,unit\UnitUtility,unit\UnitManager,unit\GlobalBattleContext
rem �v�Z���W�b�N
set BF=%BF%,combat\DamageCalculationUtility,combat\DamageCalculator,combat\PostCombatSkillHander,combat\PerformanceProfile,combat\ScopedTileChanger,combat\DamageCalculatorWrapper
set BF=%BF%,combat\DamageCalculatorWrapper_InitSkillEffectDict_AtkDef,combat\DamageCalculatorWrapper_InitSkillEffectDict_Unit
set BF=%BF%,combat\DamageCalculatorWrapper_ApplySkillEffects
set BF=%BF%,combat\DamageCalculatorWrapper_Spur
set BF=%BF%,combat\DamageCalculatorWrapper_FollowupAndCounter
set BF=%BF%,combat\BeginningOfTurnSkillHandler
rem �f�[�^�x�[�X�E�ݒ�
set BF=%BF%,database\SkillDatabase,database\HeroDatabase,unit\TurnSetting,app\AudioManager,database\AetherRaidDefensePresets
set BF=%BF%,app\SettingManager,app\AppData
rem ���C�������EUI
set BF=%BF%,app\Main_ImageProcessing,app\Main_OriginalAi,app\Main_MouseAndTouch,app\MapOperations,app\SettingsPersistence,app\BattleSimulatorBase,app\VueComponents

rem --- 4. �ŏI�I�ȓ��� ---
set battle_simulator_filenames=%BF%,%battle_simulator_skill_effect_filenames%,%battle_simulator_skill_impl_filenames%

rem ����V�~�����[�^�[
call %~dp0MergeSourcesAndCompress.bat FehBattleSimulator %battle_simulator_filenames%,pages\AetherRaidSimulatorMain

rem ���Z��V�~�����[�^�[
call %~dp0MergeSourcesAndCompress.bat FehArenaSimulator %battle_simulator_filenames%,pages\ArenaSimulatorMain

rem �p�Y�����V�~�����[�^�[
call %~dp0MergeSourcesAndCompress.bat FehSummonerDuelsSimulator %battle_simulator_filenames%,pages\SummonerDuelsSimulatorMain

rem �X�e�[�^�X�v�Z�@
call %~dp0MergeSourcesAndCompress.bat FehStatusCalculator core\GlobalDefinitions,core\Utilities,data\SkillConstants,data\Skill,map\BattleMapElement,data\HeroInfoConstants,data\HeroInfo,data\UnitConstants,unit\BattleContext,unit\UnitContext,unit\Unit,unit\UnitUtility,pages\StatusCalcMain,%battle_simulator_skill_effect_filenames%,%battle_simulator_skill_impl_filenames%

rem ���j�b�g�r���_�[
call %~dp0MergeSourcesAndCompress.bat FehUnitBuilder core\GlobalDefinitions,map\Cell,map\Table,core\Utilities,core\Logger,data\SkillConstants,data\Skill,map\BattleMapElement,map\Tile,map\Structures,data\HeroInfoConstants,data\HeroInfo,data\UnitConstants,unit\BattleContext,unit\UnitContext,unit\Unit,unit\UnitUtility,unit\UnitManager,map\BattleMap,map\BattleMapSettings,unit\GlobalBattleContext,combat\DamageCalculationUtility,combat\DamageCalculator,combat\PostCombatSkillHander,combat\PerformanceProfile,combat\ScopedTileChanger,combat\DamageCalculatorWrapper,combat\DamageCalculatorWrapper_InitSkillEffectDict_AtkDef,combat\DamageCalculatorWrapper_InitSkillEffectDict_Unit,combat\DamageCalculatorWrapper_ApplySkillEffects,combat\DamageCalculatorWrapper_Spur,combat\DamageCalculatorWrapper_FollowupAndCounter,combat\BeginningOfTurnSkillHandler,unit\TurnSetting,app\AudioManager,database\AetherRaidDefensePresets,database\SkillDatabase,database\HeroDatabase,app\SettingManager,app\AppData,app\Main_ImageProcessing,app\Main_OriginalAi,app\Main_MouseAndTouch,app\MapOperations,app\SettingsPersistence,app\BattleSimulatorBase,pages\UnitBuilderMain,app\VueComponents,%battle_simulator_skill_effect_filenames%,%battle_simulator_skill_impl_filenames%

rem �_���[�W�v�Z�@
call %~dp0MergeSourcesAndCompress.bat FehDamageCalculator core\GlobalDefinitions,core\Utilities,core\Logger,data\SkillConstants,data\Skill,map\BattleMapElement,map\Tile,map\BattleMap,unit\GlobalBattleContext,map\Structures,map\Table,data\HeroInfoConstants,data\HeroInfo,data\UnitConstants,unit\BattleContext,unit\UnitContext,unit\Unit,unit\UnitUtility,unit\UnitManager,database\SkillDatabase,database\HeroDatabase,combat\DamageCalculationUtility,combat\DamageCalculator,combat\PostCombatSkillHander,combat\PerformanceProfile,combat\ScopedTileChanger,combat\DamageCalculatorWrapper,combat\DamageCalculatorWrapper_InitSkillEffectDict_AtkDef,combat\DamageCalculatorWrapper_InitSkillEffectDict_Unit,combat\DamageCalculatorWrapper_ApplySkillEffects,combat\DamageCalculatorWrapper_Spur,combat\DamageCalculatorWrapper_FollowupAndCounter,combat\BeginningOfTurnSkillHandler,app\AudioManager,database\SampleSkillInfos,database\SampleHeroInfos,app\VueComponents,core\KeyRepeatHandler,pages\DamageCalculatorMain,%battle_simulator_skill_effect_filenames%,%battle_simulator_skill_impl_filenames%

rem �p�Y�A�C�R�����X�g
call %~dp0MergeSourcesAndCompress.bat FehHeroIconLister core\GlobalDefinitions,core\Utilities,core\Logger,data\SkillConstants,data\Skill,data\HeroInfoConstants,data\HeroInfo,database\HeroDatabase,pages\HeroIconListerMain,database\SampleHeroInfos,%battle_simulator_skill_effect_filenames%,%battle_simulator_skill_impl_filenames%

rem ���̑��c�[���Ŏg���t�@�C��
echo other files
set copyfiles=%battle_simulator_filenames% pages\StatusCalcMain database\SampleSkillInfos database\SampleHeroInfos core\KeyRepeatHandler pages\DamageCalculatorMain pages\HeroStatusClustererMain

rem �������̓R�s�[�s�v�Ȃ̂ŁA��U�R�s�[���Ȃ��ł���
REM for %%n in (%copyfiles%) do (
    REM copy %~dp0Sources\%%n.js %destination%\%%n.js
REM )

echo css files
set css_filenames=feh-battle-simulator
set copyfiles=%css_filenames%
for %%n in (%copyfiles%) do (
    copy %~dp0Sources\%%n.css %destination%\%%n.css
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
