import { describe, it, expect } from 'vitest';
import fs from 'fs';
import path from 'path';

const SOURCES = path.resolve(__dirname, '..', 'Sources');

const HTML_FILES = [
    'AetherRaidSimulator.html',
    'ArenaSimulator.html',
    'SummonerDuelsSimulator.html',
    'UnitBuilder.html',
    'StatusCalculator.html',
    'DamageCalculator.html',
    'HeroIconLister.html',
    'HeroStatusClusterer.html',
];

const ENTRY_POINTS = {
    'AetherRaidSimulator.html': 'AetherRaidSimulatorMain.js',
    'ArenaSimulator.html': 'ArenaSimulatorMain.js',
    'SummonerDuelsSimulator.html': 'SummonerDuelsSimulatorMain.js',
    'UnitBuilder.html': 'UnitBuilderMain.js',
    'StatusCalculator.html': 'StatusCalcMain.js',
    'DamageCalculator.html': 'DamageCalculatorMain.js',
    'HeroIconLister.html': 'HeroIconListerMain.js',
    'HeroStatusClusterer.html': 'HeroStatusClustererMain.js',
};

describe('HTML files cleanup', () => {
    for (const htmlFile of HTML_FILES) {
        describe(htmlFile, () => {
            let content;

            beforeAll(() => {
                content = fs.readFileSync(path.join(SOURCES, htmlFile), 'utf-8');
            });

            it('loadScripts 関数が残っていないこと', () => {
                expect(content).not.toMatch(/function\s+loadScripts/);
            });

            it('createScriptElement 関数が残っていないこと', () => {
                expect(content).not.toMatch(/function\s+createScriptElement/);
            });

            it('SKILL_EFFECT_FILES / SKILL_IMPL_FILES の参照が残っていないこと', () => {
                expect(content).not.toContain('SKILL_EFFECT_FILES');
                expect(content).not.toContain('SKILL_IMPL_FILES');
            });

            it('Local.js の script タグが残っていないこと', () => {
                expect(content).not.toMatch(/<script[^>]*src=["'].*Local\.js["']/);
            });

            it(`<script type="module" src="./${ENTRY_POINTS[htmlFile]}"> が存在すること`, () => {
                const entryPoint = ENTRY_POINTS[htmlFile];
                expect(content).toContain(`<script type="module" src="./${entryPoint}">`);
            });
        });
    }
});
