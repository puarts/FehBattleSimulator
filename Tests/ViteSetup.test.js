/**
 * Section 01: Vite Setup verification tests
 *
 * These tests verify that Vite is properly installed and configured.
 * Run with: node --test Tests/ViteSetup.test.js
 * (Uses Node.js built-in test runner since Vitest is not yet configured)
 */

import { describe, it } from 'node:test';
import assert from 'node:assert';
import { readFileSync, existsSync } from 'fs';
import { join } from 'path';

const ROOT = join(import.meta.dirname, '..');

describe('A.1 package.json dependencies', () => {
    const pkg = JSON.parse(readFileSync(join(ROOT, 'package.json'), 'utf-8'));

    it('should have vite in devDependencies', () => {
        assert.ok(pkg.devDependencies.vite, 'vite should be in devDependencies');
    });

    it('should have @vitejs/plugin-vue in devDependencies', () => {
        assert.ok(pkg.devDependencies['@vitejs/plugin-vue'],
            '@vitejs/plugin-vue should be in devDependencies');
    });
});

describe('A.2 vite.config.js', () => {
    it('should exist at project root', () => {
        assert.ok(existsSync(join(ROOT, 'vite.config.js')),
            'vite.config.js should exist at project root');
    });

    it('should set root to Sources', async () => {
        const content = readFileSync(join(ROOT, 'vite.config.js'), 'utf-8');
        assert.ok(content.includes("root:") && content.includes("Sources"),
            'vite.config.js should set root to Sources directory');
    });

    it('should configure build.outDir to ../dist', async () => {
        const content = readFileSync(join(ROOT, 'vite.config.js'), 'utf-8');
        assert.ok(content.includes("outDir") && content.includes("../dist"),
            'vite.config.js should set outDir to ../dist');
    });

    it('should list all 8 HTML entry points in rollupOptions.input', async () => {
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
            assert.ok(content.includes(name),
                `vite.config.js should reference ${name}`);
        }
    });

    it('should set build.target to es2015', async () => {
        const content = readFileSync(join(ROOT, 'vite.config.js'), 'utf-8');
        assert.ok(content.includes('es2015'),
            'vite.config.js should set build target to es2015');
    });

    it('should include comment or placeholder for Vue 3 runtime compiler alias', async () => {
        const content = readFileSync(join(ROOT, 'vite.config.js'), 'utf-8');
        assert.ok(content.includes('vue/dist/vue.esm-bundler') || content.includes('esm-bundler'),
            'vite.config.js should have a placeholder for Vue 3 runtime compiler alias');
    });
});
