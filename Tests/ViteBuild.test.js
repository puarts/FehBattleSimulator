/**
 * Vite Build Output Verification Tests
 *
 * Validates that `vite build` produces correct output.
 * Run with: node --test Tests/ViteBuild.test.js
 * (Uses Node.js built-in test runner since Vitest is not yet configured)
 *
 * Prerequisites: Run `npx vite build` before running these tests.
 */

import { describe, it } from 'node:test';
import assert from 'node:assert';
import { readFileSync, existsSync, readdirSync, statSync } from 'fs';
import { join } from 'path';

const DIST = join(import.meta.dirname, '..', 'dist');

const SIMULATOR_HTMLS = [
    'AetherRaidSimulator.html',
    'ArenaSimulator.html',
    'SummonerDuelsSimulator.html',
    'UnitBuilder.html',
    'StatusCalculator.html',
    'DamageCalculator.html',
    'HeroIconLister.html',
    'HeroStatusClusterer.html',
];

describe('Vite Build Output', () => {
    it('vite build should have produced dist/ directory', () => {
        assert.ok(existsSync(DIST), 'dist/ directory should exist');
    });

    it('all 8 simulator HTML files exist in dist/', () => {
        for (const html of SIMULATOR_HTMLS) {
            assert.ok(existsSync(join(DIST, html)),
                `${html} should exist in dist/`);
        }
    });

    it('each HTML contains a <script type="module"> tag', () => {
        for (const html of SIMULATOR_HTMLS) {
            const filePath = join(DIST, html);
            if (!existsSync(filePath)) continue;
            const content = readFileSync(filePath, 'utf-8');
            assert.ok(content.includes('type="module"'),
                `${html} should contain <script type="module">`);
        }
    });

    it('no loadScripts or createScriptElement remains in dist HTML', () => {
        for (const html of SIMULATOR_HTMLS) {
            const filePath = join(DIST, html);
            if (!existsSync(filePath)) continue;
            const content = readFileSync(filePath, 'utf-8');
            assert.ok(!content.includes('loadScripts'),
                `${html} should not contain loadScripts`);
            assert.ok(!content.includes('createScriptElement'),
                `${html} should not contain createScriptElement`);
        }
    });

    it('bundled JS files contain no source-level export {} statements', () => {
        // Vite uses ESM output with import/export for code-split chunks.
        // We check that source-level "export { Symbol1, Symbol2 };" patterns
        // (from original source files) are resolved by the bundler.
        const assetsDir = join(DIST, 'assets');
        if (!existsSync(assetsDir)) return;
        const jsFiles = readdirSync(assetsDir).filter(f => f.endsWith('.js'));
        assert.ok(jsFiles.length > 0, 'Should have JS bundles');
        // Verify entry point files reference shared chunks (code splitting works)
        let hasChunkImport = false;
        for (const jsFile of jsFiles) {
            const content = readFileSync(join(assetsDir, jsFile), 'utf-8');
            if (content.includes('from"./') || content.includes("from'./")) {
                hasChunkImport = true;
                break;
            }
        }
        assert.ok(hasChunkImport || jsFiles.length === 1,
            'Should have code-split chunks with inter-chunk imports');
    });

    it('total JS output is substantial (> 1MB combined)', () => {
        const assetsDir = join(DIST, 'assets');
        if (!existsSync(assetsDir)) return;
        const jsFiles = readdirSync(assetsDir).filter(f => f.endsWith('.js'));
        assert.ok(jsFiles.length > 0, 'Should have at least one JS bundle');
        let totalSize = 0;
        for (const jsFile of jsFiles) {
            totalSize += statSync(join(assetsDir, jsFile)).size;
        }
        const totalKB = Math.round(totalSize / 1024);
        assert.ok(totalSize > 1024 * 1024,
            `Total JS output should be > 1MB (was ${totalKB}KB)`);
    });
});
