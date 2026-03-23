import { describe, it, expect } from 'vitest';
import { execFileSync } from 'child_process';

describe('Phase 5 Baseline', () => {
    // ベースライン: madge --circularが0件であることのスナップショット
    it('madge --circular reports no circular dependencies', { timeout: 30000 }, () => {
        // Phase 4で循環依存ゼロを達成済み。Phase 5を通じてこの状態を維持する。
        let output = '';
        let exitCode = 0;
        try {
            output = execFileSync('npx', ['madge', '--circular', '--no-color', 'Sources/'], {
                cwd: process.cwd(),
                encoding: 'utf-8',
                timeout: 30000,
                stdio: ['pipe', 'pipe', 'pipe'],
            });
        } catch (e) {
            exitCode = e.status || 1;
            output = e.stdout || e.stderr || '';
        }
        expect(exitCode, `Circular dependencies found:\n${output}`).toBe(0);
    });

    // ベースライン: filterImportExportがexport * from構文を処理できないことの確認
    it('filterImportExport does not handle re-export syntax', () => {
        // vitest.setup.jsのfilterImportExport正規表現の動作を検証
        // export * from './x.js' は /^export \{/ にマッチしない
        const reExportLine = "export * from './SkillEffect.js';";
        const exportNamedReExportLine = "export { Foo } from './SkillEffect.js';";

        // 現在のフィルタロジック再現
        const isFilteredByImport = /^import /.test(reExportLine);
        const isFilteredByExport = /^export \{/.test(reExportLine);
        // export * from は除去されない
        expect(isFilteredByImport || isFilteredByExport).toBe(false);

        // export { Foo } from './x.js' は /^export \{/ にマッチする（除去される）が、
        // from句が残らないことを確認（現在のフィルタは行全体を除去するので問題なし）
        const isNamedReExportFiltered = /^export \{/.test(exportNamedReExportLine);
        expect(isNamedReExportFiltered).toBe(true);
    });
});
