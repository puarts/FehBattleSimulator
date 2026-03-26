/**
 * filterImportExport - ESM import/export 文ストリップ関数
 *
 * 旧 vitest.setup.js の連結方式で使用されていた変換関数。
 * Phase 5 Section 01 で連結廃止の前準備としてここに退避された。
 *
 * JSソースコードの文字列から import/export 文を除去し、
 * 連結実行（vm.runInThisContext）可能な形式に変換する。
 *
 * - 単行 import 文を完全にスキップ
 * - 複数行 import 文を検出し、閉じるまでスキップ
 * - `export { ... }` 行をスキップ
 * - `export function/class/const/let/var` の `export` キーワードのみ除去
 */
export function filterImportExport(content) {
    const lines = content.split('\n');
    const result = [];
    let inMultiLineImport = false;
    for (const line of lines) {
        if (inMultiLineImport) {
            // Skip lines until we find the closing of the import statement
            if (/\bfrom\s+['"]/.test(line) || /^}\s*from\s+['"]/.test(line)) {
                inMultiLineImport = false;
            }
            continue;
        }
        if (/^import /.test(line)) {
            // Check if this is a complete single-line import
            if (/from\s+['"]/.test(line) || /^import\s+['"]/.test(line)) {
                continue; // single-line import, skip it
            }
            // Multi-line import starts here
            inMultiLineImport = true;
            continue;
        }
        if (/^export \{/.test(line)) {
            continue;
        }
        result.push(line.replace(/^export (function|class|const|let|var) /, '$1 '));
    }
    return result.join('\n');
}
