/**
 * Section 01: Vite Setup verification tests
 *
 * These tests verify that Vite is properly installed and configured.
 * Compatible with both Node.js built-in test runner and Vitest.
 */

import { readFileSync, existsSync } from 'fs';
import { join } from 'path';
import { fileURLToPath } from 'url';

const ROOT = join(fileURLToPath(import.meta.url), '../..');

describe('A.1 package.json dependencies', () => {
    const pkg = JSON.parse(readFileSync(join(ROOT, 'package.json'), 'utf-8'));

    it('should have vite in devDependencies', () => {
        expect(pkg.devDependencies.vite).toBeTruthy();
    });

    it('should have @vitejs/plugin-vue in devDependencies', () => {
        expect(pkg.devDependencies['@vitejs/plugin-vue']).toBeTruthy();
    });
});

describe('A.2 vite.config.js', () => {
    it('should exist at project root', () => {
        expect(existsSync(join(ROOT, 'vite.config.js'))).toBe(true);
    });

    it('should set root to Sources', () => {
        const content = readFileSync(join(ROOT, 'vite.config.js'), 'utf-8');
        expect(content.includes("root:") && content.includes("Sources")).toBe(true);
    });

    it('should configure build.outDir to ../dist', () => {
        const content = readFileSync(join(ROOT, 'vite.config.js'), 'utf-8');
        expect(content.includes("outDir") && content.includes("../dist")).toBe(true);
    });

    it('should list all 8 HTML entry points in rollupOptions.input', () => {
        const content = readFileSync(join(ROOT, 'vite.config.js'), 'utf-8');
        const expectedHtmlFiles = [
            'AetherRaidSimulator',
            'ArenaSimulator',
            'SummonerDuelsSimulator',
            'UnitBuilder',
            'StatusCalculator',
            'DamageCalculator',
            'HeroIconLister',
            'HeroStatusClusterer',
        ];
        for (const name of expectedHtmlFiles) {
            expect(content.includes(name)).toBe(true);
        }
    });

    it('should set build.target to es2015', () => {
        const content = readFileSync(join(ROOT, 'vite.config.js'), 'utf-8');
        expect(content.includes('es2015')).toBe(true);
    });

    it('should include comment or placeholder for Vue 3 runtime compiler alias', () => {
        const content = readFileSync(join(ROOT, 'vite.config.js'), 'utf-8');
        expect(content.includes('vue/dist/vue.esm-bundler') || content.includes('esm-bundler')).toBe(true);
    });
});
