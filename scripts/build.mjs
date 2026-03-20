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

/**
 * import/export 行を除去するフィルタ。
 * ESM化で追加される import/export 文を結合出力から除去し、
 * グローバルスコープ前提の結合モードとの互換性を維持する。
 *
 * @param {string} content - ファイル内容
 * @returns {string} フィルタ適用後の内容
 */
// Keep in sync with Tests/BuildFilter.test.js
function filterImportExport(content) {
    return content
        .split('\n')
        .filter(line => !(/^import /.test(line) || /^export \{/.test(line)))
        .join('\n');
}

function mergeFiles(fileNames) {
    const parts = [];
    for (const name of fileNames) {
        const filePath = join(SOURCES, `${name}.js`);
        if (!existsSync(filePath)) {
            console.warn(`WARNING: ${filePath} was not found`);
            continue;
        }
        parts.push(filterImportExport(readFileSync(filePath, 'utf-8')));
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

    // --deploy: Deploy.bat と同じデプロイ先にコピー
    if (process.argv.includes('--deploy')) {
        await deploy();
    }
}

// ---------------------------------------------------------------------------
// デプロイ（Deploy.bat の後半と同じ処理）
// ---------------------------------------------------------------------------

const HTML_FILES = [
    'AetherRaidSimulator', 'ArenaSimulator', 'DamageCalculator',
    'SummonerDuelsSimulator', 'UnitBuilder', 'HeroIconLister', 'StatusCalculator',
];

async function deploy() {
    // Deploy.bat: set trunk_root=%~dp0..\..\trunk
    const trunkRoot = join(ROOT, '..', '..', 'trunk');
    const siteRoot = join(trunkRoot, 'Websites', 'fire-emblem.fun');
    const jsDestination = join(siteRoot, 'AetherRaidTacticsBoard', 'Release2');
    const htmlDestination = join(siteRoot, 'blog', 'entries');

    if (!existsSync(trunkRoot)) {
        console.error(`ERROR: trunk directory not found: ${trunkRoot}`);
        console.error('Deploy requires the trunk directory at ../../trunk relative to the project root.');
        process.exit(1);
    }

    mkdirSync(jsDestination, { recursive: true });
    mkdirSync(htmlDestination, { recursive: true });

    // JS ファイルをデプロイ先にコピー
    console.log('\nDeploying JS files...');
    for (const name of Object.keys(BUILDS)) {
        const src = join(DIST, `${name}.js`);
        const dest = join(jsDestination, `${name}.js`);
        copyFileSync(src, dest);
        console.log(`  ${dest}`);
    }

    // CSS ファイルをデプロイ先にコピー
    console.log('Deploying CSS files...');
    const cssSrc = join(DIST, 'feh-battle-simulator.css');
    if (existsSync(cssSrc)) {
        const cssDest = join(jsDestination, 'feh-battle-simulator.css');
        copyFileSync(cssSrc, cssDest);
        console.log(`  ${cssDest}`);
    }

    // HTML ファイルをデプロイ先にコピー
    console.log('Deploying HTML files...');
    for (const name of HTML_FILES) {
        const src = join(SOURCES, `${name}.html`);
        const dest = join(htmlDestination, `${name}.html`);
        if (existsSync(src)) {
            copyFileSync(src, dest);
            console.log(`  ${dest}`);
        } else {
            console.warn(`  WARNING: ${src} not found`);
        }
    }

    console.log('\nDeploy complete.');
}

build().catch(err => {
    console.error('Build failed:', err);
    process.exit(1);
});
