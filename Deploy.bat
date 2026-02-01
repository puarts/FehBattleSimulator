@echo off

rem --- 1. スキルエフェクト関連 ---
set ef=SkillEffectCore,SkillEffectEnv,SkillEffect,SkillEffectField,SkillEffectUnit
set ef=%ef%,SkillEffectBattleContext,SkillEffectHooks,SkillEffectRegistrar
set battle_simulator_skill_effect_filenames=%ef%

rem --- 2. スキル実装関連 ---
set im=SkillEffectAliases,CustomSkill,SkillImpl
set im=%im%,SkillImpl202408,SkillImpl202501,SkillImpl202601
set battle_simulator_skill_impl_filenames=%im%

rem --- 3. シミュレーター基本ファイル（カテゴリ別に継ぎ足し） ---
rem 基盤・ユーティリティ
set BF=GlobalDefinitions,Utilities,Logger,SkillConstants,Skill
rem マップ・構造
set BF=%BF%,BattleMapElement,Tile,BattleMap,BattleMapSettings,Structures,Cell,Table
rem ユニット・情報
set BF=%BF%,HeroInfoConstants,HeroInfo,UnitConstants,BattleContext,Unit,UnitManager,GlobalBattleContext
rem 計算ロジック
set BF=%BF%,DamageCalculationUtility,DamageCalculator,PostCombatSkillHander,DamageCalculatorWrapper
set BF=%BF%,BeginningOfTurnSkillHandler
rem データベース・設定
set BF=%BF%,SkillDatabase,HeroDatabase,TurnSetting,AudioManager,AetherRaidDefensePresets
set BF=%BF%,SettingManager,AppData
rem メイン処理・UI
set BF=%BF%,Main_ImageProcessing,Main_OriginalAi,Main_MouseAndTouch,BattleSimulatorBase,VueComponents

rem --- 4. 最終的な統合 ---
set battle_simulator_filenames=%BF%,%battle_simulator_skill_effect_filenames%,%battle_simulator_skill_impl_filenames%

rem 飛空城シミュレーター
call %~dp0MergeSourcesAndCompress.bat FehBattleSimulator %battle_simulator_filenames%,AetherRaidSimulatorMain

rem 闘技場シミュレーター
call %~dp0MergeSourcesAndCompress.bat FehArenaSimulator %battle_simulator_filenames%,ArenaSimulatorMain

rem 英雄決闘シミュレーター
call %~dp0MergeSourcesAndCompress.bat FehSummonerDuelsSimulator %battle_simulator_filenames%,SummonerDuelsSimulatorMain

rem ステータス計算機
call %~dp0MergeSourcesAndCompress.bat FehStatusCalculator GlobalDefinitions,Utilities,SkillConstants,Skill,BattleMapElement,HeroInfoConstants,HeroInfo,UnitConstants,BattleContext,Unit,StatusCalcMain,%battle_simulator_skill_effect_filenames%,%battle_simulator_skill_impl_filenames%

rem ユニットビルダー
call %~dp0MergeSourcesAndCompress.bat FehUnitBuilder GlobalDefinitions,Cell,Table,Utilities,Logger,SkillConstants,Skill,BattleMapElement,Tile, Structures,HeroInfoConstants,HeroInfo,UnitConstants,BattleContext,Unit,UnitManager,BattleMap,BattleMapSettings,GlobalBattleContext,DamageCalculationUtility,DamageCalculator,PostCombatSkillHander,DamageCalculatorWrapper,BeginningOfTurnSkillHandler,TurnSetting,AudioManager,AetherRaidDefensePresets,SkillDatabase,HeroDatabase,SettingManager,AppData,Main_ImageProcessing,Main_OriginalAi,Main_MouseAndTouch,BattleSimulatorBase,UnitBuilderMain,VueComponents,%battle_simulator_skill_effect_filenames%,%battle_simulator_skill_impl_filenames%

rem ダメージ計算機
call %~dp0MergeSourcesAndCompress.bat FehDamageCalculator GlobalDefinitions,Utilities,Logger,SkillConstants,Skill,BattleMapElement,Tile,BattleMap,GlobalBattleContext,Structures,Table,HeroInfoConstants,HeroInfo,UnitConstants,BattleContext,Unit,UnitManager,SkillDatabase,HeroDatabase,DamageCalculationUtility,DamageCalculator,PostCombatSkillHander,DamageCalculatorWrapper,BeginningOfTurnSkillHandler,AudioManager,SampleSkillInfos,SampleHeroInfos,VueComponents,KeyRepeatHandler,DamageCalculatorMain,%battle_simulator_skill_effect_filenames%,%battle_simulator_skill_impl_filenames%

rem 英雄アイコンリスト
call %~dp0MergeSourcesAndCompress.bat FehHeroIconLister GlobalDefinitions,Utilities,Logger,SkillConstants,Skill,HeroInfoConstants,HeroInfo,HeroDatabase,HeroIconListerMain,SampleHeroInfos,%battle_simulator_skill_effect_filenames%,%battle_simulator_skill_impl_filenames%

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
