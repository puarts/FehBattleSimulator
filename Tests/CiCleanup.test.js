/**
 * Tests for CI cleanup (Section 12)
 *
 * Verifies that the CI pipeline has been updated to use Vitest/Vite,
 * obsolete files have been removed, and package.json is correct.
 */

import { describe, it, expect } from 'vitest';
import fs from 'fs';
import path from 'path';

const ROOT_DIR = path.resolve(__dirname, '..');

describe('CI pipeline (workflow file)', () => {
    const workflowPath = path.join(ROOT_DIR, '.github/workflows/jekyll.yml');
    const content = fs.readFileSync(workflowPath, 'utf-8');

    it('should not reference create_tests.sh', () => {
        expect(content).not.toMatch(/create_tests\.sh/);
    });

    it('should not reference run_tests.sh', () => {
        expect(content).not.toMatch(/run_tests\.sh/);
    });

    it('should contain npm test step', () => {
        expect(content).toMatch(/npm test/);
    });

    it('should contain a build step', () => {
        expect(content).toMatch(/npm run build|vite build/);
    });
});

describe('Obsolete files removed', () => {
    const obsoleteFiles = [
        'scripts/build.mjs',
        'create_tests.sh',
        'run_tests.sh',
        'jest.config.js',
        'jest.setup.js',
        'scripts/validate-esm.mjs',
        'scripts/check-esm-coverage.mjs',
    ];

    obsoleteFiles.forEach(file => {
        it(`${file} should not exist`, () => {
            expect(fs.existsSync(path.join(ROOT_DIR, file))).toBe(false);
        });
    });
});

describe('package.json configuration', () => {
    const pkg = JSON.parse(fs.readFileSync(path.join(ROOT_DIR, 'package.json'), 'utf-8'));

    it('should not have jest in devDependencies', () => {
        expect(pkg.devDependencies).not.toHaveProperty('jest');
    });

    it('should not have jest-environment-jsdom in devDependencies', () => {
        expect(pkg.devDependencies).not.toHaveProperty('jest-environment-jsdom');
    });

    it('scripts.test should contain vitest (not jest)', () => {
        expect(pkg.scripts.test).toMatch(/vitest/);
        expect(pkg.scripts.test).not.toMatch(/\bjest\b/);
    });

    it('scripts.build should contain vite build (not build.mjs)', () => {
        expect(pkg.scripts.build).toMatch(/vite build/);
        expect(pkg.scripts.build).not.toMatch(/build\.mjs/);
    });

    it('should have vitest in devDependencies', () => {
        expect(pkg.devDependencies).toHaveProperty('vitest');
    });

    it('should have vite in devDependencies', () => {
        expect(pkg.devDependencies).toHaveProperty('vite');
    });
});
