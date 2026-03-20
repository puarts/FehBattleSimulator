import { execFileSync } from 'child_process';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

// When run via Vitest, __dirname equivalent is the Tests/ dir, so go up one level
const ROOT = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');
const SOURCES = path.join(ROOT, 'Sources');

describe('ESM Validation', () => {
    test('全ソースファイルが import または export 文を持つ', () => {
        const result = execFileSync('node', ['scripts/check-esm-coverage.mjs'], {
            cwd: ROOT,
            encoding: 'utf-8',
            timeout: 30000,
        });
        expect(result).toMatch(/^OK:/);
    });

    test('ネイティブESMエントリポイントがTDZエラーなしでロードされる', () => {
        let stdout;
        try {
            stdout = execFileSync('node', ['scripts/validate-esm.mjs'], {
                cwd: ROOT,
                encoding: 'utf-8',
                timeout: 60000,
            });
        } catch (err) {
            const stderr = err.stderr || '';
            if (/TDZ ERROR/.test(stderr) || /Cannot access '.+' before initialization/.test(stderr)) {
                throw new Error(`TDZ error detected:\n${stderr}`);
            }
            // Non-TDZ failures are acceptable (missing browser globals etc.)
            // But verify exit code is 0 (script uses exit(0) for non-TDZ errors)
            if (err.status === 1) {
                throw new Error(`validate-esm.mjs exited with code 1 (TDZ error):\n${stderr}`);
            }
            stdout = err.stdout || '';
        }
        expect(stdout).toMatch(/OK:/);
    });

    test('Unit ↔ DamageCalculator 循環依存がTDZエラーなしで初期化される', () => {
        let stdout;
        try {
            stdout = execFileSync('node', ['scripts/validate-esm-circular.mjs'], {
                cwd: ROOT,
                encoding: 'utf-8',
                timeout: 60000,
            });
        } catch (err) {
            const stderr = err.stderr || '';
            if (err.status === 1) {
                throw new Error(`Circular dependency TDZ error:\n${stderr}`);
            }
            stdout = err.stdout || '';
        }
        expect(stdout).toMatch(/OK:/);
    });

    describe('ビルド出力検証', () => {
        beforeAll(() => {
            execFileSync('node', ['scripts/build.mjs'], { cwd: ROOT, timeout: 120000 });
        });

        test('ビルド出力に import/export 行が残らない', () => {
            const distDir = path.join(ROOT, 'dist');
            const jsFiles = fs.readdirSync(distDir).filter(f => f.endsWith('.js'));
            expect(jsFiles.length).toBeGreaterThanOrEqual(7);

            for (const file of jsFiles) {
                const content = fs.readFileSync(path.join(distDir, file), 'utf-8');
                const lines = content.split('\n');
                const importLines = lines.filter(l => /^import /.test(l));
                const exportLines = lines.filter(l => /^export \{/.test(l));
                expect(importLines).toEqual([]);
                expect(exportLines).toEqual([]);
                expect(content.length).toBeGreaterThan(1000);
            }
        });

        test('ビルド出力ファイルが全7シミュレーター分生成される', () => {
            const distDir = path.join(ROOT, 'dist');
            const expectedFiles = [
                'FehBattleSimulator.js',
                'FehArenaSimulator.js',
                'FehSummonerDuelsSimulator.js',
                'FehStatusCalculator.js',
                'FehUnitBuilder.js',
                'FehDamageCalculator.js',
                'FehHeroIconLister.js',
            ];
            for (const file of expectedFiles) {
                const filePath = path.join(distDir, file);
                expect(fs.existsSync(filePath)).toBe(true);
            }
        });
    });
});
