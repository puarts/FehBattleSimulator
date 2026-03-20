import { execFileSync } from 'child_process';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

// When run via Vitest, __dirname equivalent is the Tests/ dir, so go up one level
const ROOT = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');
const SOURCES = path.join(ROOT, 'Sources');

describe('ESM Validation', () => {
    // 旧validate-esm.mjs/check-esm-coverage.mjs はVite移行により不要（Viteがモジュール解決を担当）

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

    // 旧build.mjsのビルド出力検証はVite移行により不要（Viteが独自のバンドル出力を生成）
});
