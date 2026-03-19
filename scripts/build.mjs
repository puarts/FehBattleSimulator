#!/usr/bin/env node
// =============================================================================
// Phase 1: Deploy.bat の結合 + JSMin を置き換える Node.js ビルドスクリプト
// Deploy.bat と同じファイルリスト・結合順序で HTML 別に 1 ファイルを出力する
// =============================================================================

import { readFileSync, writeFileSync, mkdirSync, existsSync, copyFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const ROOT = join(__dirname, '..');
const SOURCES = join(ROOT, 'Sources');
const DIST = join(ROOT, 'dist');

// ---------------------------------------------------------------------------
// Deploy.bat と同じファイルリスト定義
// ---------------------------------------------------------------------------

// スキルエフェクト関連
const SKILL_EFFECT_FILES = [
    'SkillEffectCore', 'SkillEffectEnv', 'SkillEffect', 'SkillEffectField', 'SkillEffectUnit',
    'SkillEffectBattleContext', 'SkillEffectHooks', 'SkillEffectRegistrar',
];

// スキル実装関連
const SKILL_IMPL_FILES = [
    'SkillEffectAliases', 'CustomSkill', 'SkillImpl',
    'SkillImpl202408', 'SkillImpl202501', 'SkillImpl202601',
];

// シミュレーター基本ファイル（カテゴリ別に継承される）
const BASE_FILES = [
    // 基盤・ユーティリティ
    'GlobalDefinitions', 'Utilities', 'Logger', 'SkillConstants', 'Skill',
    // マップ・構造
    'BattleMapElement', 'Tile', 'BattleMap', 'BattleMapSettings', 'Structures', 'Cell', 'Table',
    // ユニット・情報
    'HeroInfoConstants', 'HeroInfo', 'UnitConstants', 'BattleContext', 'Unit', 'UnitManager', 'GlobalBattleContext',
    // 計算ロジック
    'DamageCalculationUtility', 'DamageCalculator', 'PostCombatSkillHander', 'DamageCalculatorWrapper',
    'BeginningOfTurnSkillHandler',
    // データベース・設定
    'SkillDatabase', 'HeroDatabase', 'TurnSetting', 'AudioManager', 'AetherRaidDefensePresets',
    'SettingManager', 'AppData',
    // メイン処理・UI
    'Main_ImageProcessing', 'Main_OriginalAi', 'Main_MouseAndTouch', 'BattleSimulatorBase', 'VueComponents',
];

// 全シミュレーター共通ファイル
const BATTLE_SIMULATOR_FILES = [...BASE_FILES, ...SKILL_EFFECT_FILES, ...SKILL_IMPL_FILES];

// ---------------------------------------------------------------------------
// 各シミュレーターのビルド定義（Deploy.bat と同じ構成）
// ---------------------------------------------------------------------------
const BUILDS = {
    FehBattleSimulator: [
        ...BATTLE_SIMULATOR_FILES,
        'AetherRaidSimulatorMain',
    ],
    FehArenaSimulator: [
        ...BATTLE_SIMULATOR_FILES,
        'ArenaSimulatorMain',
    ],
    FehSummonerDuelsSimulator: [
        ...BATTLE_SIMULATOR_FILES,
        'SummonerDuelsSimulatorMain',
    ],
    FehStatusCalculator: [
        'GlobalDefinitions', 'Utilities', 'SkillConstants', 'Skill', 'BattleMapElement',
        'HeroInfoConstants', 'HeroInfo', 'UnitConstants', 'BattleContext', 'Unit',
        'StatusCalcMain',
        ...SKILL_EFFECT_FILES, ...SKILL_IMPL_FILES,
    ],
    FehUnitBuilder: [
        'GlobalDefinitions', 'Cell', 'Table', 'Utilities', 'Logger', 'SkillConstants', 'Skill',
        'BattleMapElement', 'Tile', 'Structures',
        'HeroInfoConstants', 'HeroInfo', 'UnitConstants', 'BattleContext', 'Unit', 'UnitManager',
        'BattleMap', 'BattleMapSettings', 'GlobalBattleContext',
        'DamageCalculationUtility', 'DamageCalculator', 'PostCombatSkillHander', 'DamageCalculatorWrapper',
        'BeginningOfTurnSkillHandler',
        'TurnSetting', 'AudioManager', 'AetherRaidDefensePresets',
        'SkillDatabase', 'HeroDatabase', 'SettingManager', 'AppData',
        'Main_ImageProcessing', 'Main_OriginalAi', 'Main_MouseAndTouch',
        'BattleSimulatorBase', 'UnitBuilderMain', 'VueComponents',
        ...SKILL_EFFECT_FILES, ...SKILL_IMPL_FILES,
    ],
    FehDamageCalculator: [
        'GlobalDefinitions', 'Utilities', 'Logger', 'SkillConstants', 'Skill',
        'BattleMapElement', 'Tile', 'BattleMap', 'GlobalBattleContext', 'Structures', 'Table',
        'HeroInfoConstants', 'HeroInfo', 'UnitConstants', 'BattleContext', 'Unit', 'UnitManager',
        'SkillDatabase', 'HeroDatabase',
        'DamageCalculationUtility', 'DamageCalculator', 'PostCombatSkillHander', 'DamageCalculatorWrapper',
        'BeginningOfTurnSkillHandler',
        'AudioManager', 'SampleSkillInfos', 'SampleHeroInfos',
        'VueComponents', 'KeyRepeatHandler', 'DamageCalculatorMain',
        ...SKILL_EFFECT_FILES, ...SKILL_IMPL_FILES,
    ],
    FehHeroIconLister: [
        'GlobalDefinitions', 'Utilities', 'Logger', 'SkillConstants', 'Skill',
        'HeroInfoConstants', 'HeroInfo', 'HeroDatabase', 'HeroIconListerMain',
        'SampleHeroInfos',
        ...SKILL_EFFECT_FILES, ...SKILL_IMPL_FILES,
    ],
};

// ---------------------------------------------------------------------------
// ビルド実行
// ---------------------------------------------------------------------------

function mergeFiles(fileNames) {
    const parts = [];
    for (const name of fileNames) {
        const filePath = join(SOURCES, `${name}.js`);
        if (!existsSync(filePath)) {
            console.warn(`WARNING: ${filePath} was not found`);
            continue;
        }
        parts.push(readFileSync(filePath, 'utf-8'));
    }
    // Deploy.bat (type コマンド) と同じく、ファイル内容をそのまま連結
    return parts.join('');
}

async function build() {
    mkdirSync(DIST, { recursive: true });

    const minify = process.argv.includes('--minify');
    let terserMinify;
    if (minify) {
        const terser = await import('terser');
        terserMinify = terser.minify;
    }

    for (const [name, files] of Object.entries(BUILDS)) {
        const merged = mergeFiles(files);
        const outputPath = join(DIST, `${name}.js`);

        if (minify && terserMinify) {
            const result = await terserMinify(merged);
            writeFileSync(outputPath, result.code);
        } else {
            writeFileSync(outputPath, merged);
        }

        const sizeMB = (readFileSync(outputPath).length / 1024 / 1024).toFixed(2);
        console.log(`  ${name}.js (${sizeMB} MB)`);
    }

    // CSS コピー
    const cssSource = join(SOURCES, 'feh-battle-simulator.css');
    if (existsSync(cssSource)) {
        copyFileSync(cssSource, join(DIST, 'feh-battle-simulator.css'));
        console.log('  feh-battle-simulator.css');
    }

    console.log(`\nBuild complete: ${Object.keys(BUILDS).length} files -> dist/`);
}

build().catch(err => {
    console.error('Build failed:', err);
    process.exit(1);
});
