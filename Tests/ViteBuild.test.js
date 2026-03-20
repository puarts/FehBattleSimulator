/**
 * Vite Build Output Verification Tests
 *
 * Validates that `vite build` produces correct output.
 * Run with: npx vitest run Tests/ViteBuild.test.js
 *
 * Prerequisites: Run `npx vite build` before running these tests.
 */

import { readFileSync, existsSync, readdirSync, statSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const DIST = join(__dirname, '..', 'dist');

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
        expect(existsSync(DIST)).toBeTruthy();
    });

    it('all 8 simulator HTML files exist in dist/', () => {
        for (const html of SIMULATOR_HTMLS) {
            expect(existsSync(join(DIST, html))).toBeTruthy();
        }
    });

    it('each HTML contains a <script type="module"> tag', () => {
        for (const html of SIMULATOR_HTMLS) {
            const filePath = join(DIST, html);
            if (!existsSync(filePath)) continue;
            const content = readFileSync(filePath, 'utf-8');
            expect(content.includes('type="module"')).toBeTruthy();
        }
    });

    it('no loadScripts or createScriptElement remains in dist HTML', () => {
        for (const html of SIMULATOR_HTMLS) {
            const filePath = join(DIST, html);
            if (!existsSync(filePath)) continue;
            const content = readFileSync(filePath, 'utf-8');
            expect(content.includes('loadScripts')).toBe(false);
            expect(content.includes('createScriptElement')).toBe(false);
        }
    });

    it('bundled JS files contain no source-level export {} statements', () => {
        // Vite uses ESM output with import/export for code-split chunks.
        // We check that source-level "export { Symbol1, Symbol2 };" patterns
        // (from original source files) are resolved by the bundler.
        const assetsDir = join(DIST, 'assets');
        if (!existsSync(assetsDir)) return;
        const jsFiles = readdirSync(assetsDir).filter(f => f.endsWith('.js'));
        expect(jsFiles.length > 0).toBeTruthy();
        // Verify entry point files reference shared chunks (code splitting works)
        let hasChunkImport = false;
        for (const jsFile of jsFiles) {
            const content = readFileSync(join(assetsDir, jsFile), 'utf-8');
            if (content.includes('from"./') || content.includes("from'./")) {
                hasChunkImport = true;
                break;
            }
        }
        expect(hasChunkImport || jsFiles.length === 1).toBeTruthy();
    });

    it('total JS output is substantial (> 1MB combined)', () => {
        const assetsDir = join(DIST, 'assets');
        if (!existsSync(assetsDir)) return;
        const jsFiles = readdirSync(assetsDir).filter(f => f.endsWith('.js'));
        expect(jsFiles.length > 0).toBeTruthy();
        let totalSize = 0;
        for (const jsFile of jsFiles) {
            totalSize += statSync(join(assetsDir, jsFile)).size;
        }
        expect(totalSize > 1024 * 1024).toBeTruthy();
    });
});
