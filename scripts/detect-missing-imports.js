#!/usr/bin/env node

/**
 * 不足import検出スクリプト
 *
 * Sources/ 配下の各 .js ファイルを解析し、
 * ファイル内で使用されているが import されていないシンボルを検出する。
 *
 * Usage:
 *   node scripts/detect-missing-imports.js [--file Sources/Foo.js] [--json] [--suggest]
 *
 * Options:
 *   --file <path>   特定のファイルのみ解析
 *   --json          JSON形式で出力
 *   --suggest       import文の提案も出力
 */

import fs from 'fs';
import path from 'path';

const SOURCES_DIR = path.resolve('Sources');

// ブラウザ/Node.js/Vitest のグローバルに存在するシンボル（false positive除外用）
const BUILTIN_GLOBALS = new Set([
    // JavaScript builtins
    'Object', 'Array', 'Map', 'Set', 'WeakMap', 'WeakSet', 'Promise', 'Proxy',
    'Reflect', 'Symbol', 'BigInt', 'Number', 'String', 'Boolean', 'RegExp',
    'Error', 'TypeError', 'RangeError', 'ReferenceError', 'SyntaxError',
    'JSON', 'Math', 'Date', 'Intl', 'console', 'parseInt', 'parseFloat',
    'isNaN', 'isFinite', 'undefined', 'null', 'NaN', 'Infinity',
    'encodeURIComponent', 'decodeURIComponent', 'encodeURI', 'decodeURI',
    'setTimeout', 'clearTimeout', 'setInterval', 'clearInterval',
    'queueMicrotask', 'structuredClone', 'atob', 'btoa',
    'ArrayBuffer', 'DataView', 'Float32Array', 'Float64Array',
    'Int8Array', 'Int16Array', 'Int32Array', 'Uint8Array', 'Uint16Array', 'Uint32Array',
    'globalThis', 'eval',
    // DOM / Browser APIs
    'window', 'document', 'navigator', 'location', 'history',
    'localStorage', 'sessionStorage', 'fetch', 'XMLHttpRequest',
    'HTMLElement', 'HTMLDivElement', 'HTMLInputElement', 'HTMLSelectElement',
    'HTMLButtonElement', 'HTMLImageElement', 'HTMLCanvasElement', 'HTMLDialogElement',
    'Element', 'Node', 'NodeList', 'Event', 'CustomEvent', 'MouseEvent',
    'KeyboardEvent', 'DragEvent', 'TouchEvent', 'PointerEvent',
    'MutationObserver', 'IntersectionObserver', 'ResizeObserver',
    'URL', 'URLSearchParams', 'FormData', 'Blob', 'File', 'FileReader',
    'Image', 'Audio', 'CanvasRenderingContext2D', 'requestAnimationFrame',
    'cancelAnimationFrame', 'getComputedStyle', 'alert', 'confirm', 'prompt',
    'performance', 'AbortController', 'AbortSignal', 'Headers', 'Request', 'Response',
    // Vue
    'Vue', 'createApp', 'ref', 'reactive', 'computed', 'watch', 'watchEffect',
    'onMounted', 'onUnmounted', 'nextTick', 'defineComponent', 'h',
    // Pinia
    'defineStore', 'createPinia',
    // LZString (loaded via script tag or import)
    'LZString',
    // Test globals
    'describe', 'it', 'test', 'expect', 'beforeEach', 'afterEach', 'beforeAll', 'afterAll', 'vi',
]);

// キーワード・予約語
const JS_KEYWORDS = new Set([
    'if', 'else', 'for', 'while', 'do', 'switch', 'case', 'break', 'continue',
    'return', 'throw', 'try', 'catch', 'finally', 'new', 'delete', 'typeof',
    'instanceof', 'in', 'of', 'void', 'this', 'super', 'class', 'extends',
    'function', 'var', 'let', 'const', 'import', 'export', 'default', 'from',
    'as', 'async', 'await', 'yield', 'static', 'get', 'set', 'true', 'false',
    'with', 'debugger',
]);

/**
 * ファイルから export されているシンボル名を抽出する
 */
function extractExports(filePath) {
    const content = fs.readFileSync(filePath, 'utf-8');
    const exports = new Set();

    // export { Foo, Bar, Baz };
    const namedExportRe = /export\s*\{([^}]+)\}/g;
    let match;
    while ((match = namedExportRe.exec(content)) !== null) {
        const symbols = match[1].split(',').map(s => {
            const parts = s.trim().split(/\s+as\s+/);
            return parts[parts.length - 1].trim();
        }).filter(s => s.length > 0);
        symbols.forEach(s => exports.add(s));
    }

    // export class Foo / export function foo / export const foo
    const inlineExportRe = /export\s+(?:class|function|const|let|var)\s+(\w+)/g;
    while ((match = inlineExportRe.exec(content)) !== null) {
        exports.add(match[1]);
    }

    return exports;
}

/**
 * ファイルから import されているシンボル名を抽出する
 */
function extractImports(content) {
    const imported = new Set();

    // import { Foo, Bar } from './Module.js';
    const namedImportRe = /import\s*\{([^}]+)\}\s*from\s*['"][^'"]+['"]/g;
    let match;
    while ((match = namedImportRe.exec(content)) !== null) {
        const symbols = match[1].split(',').map(s => {
            const parts = s.trim().split(/\s+as\s+/);
            return parts[parts.length - 1].trim();
        }).filter(s => s.length > 0);
        symbols.forEach(s => imported.add(s));
    }

    // import Foo from './Module.js'; (default import)
    const defaultImportRe = /import\s+(\w+)\s+from\s*['"][^'"]+['"]/g;
    while ((match = defaultImportRe.exec(content)) !== null) {
        if (match[1] !== 'type') {
            imported.add(match[1]);
        }
    }

    return imported;
}

/**
 * ファイル内でローカルに定義されているシンボルを抽出する
 */
function extractLocalDefinitions(content) {
    const locals = new Set();

    // class Foo, function foo, const/let/var foo
    const defRe = /(?:class|function)\s+(\w+)|(?:const|let|var)\s+(\w+)/g;
    let match;
    while ((match = defRe.exec(content)) !== null) {
        const name = match[1] || match[2];
        if (name) locals.add(name);
    }

    // Destructuring: const { a, b } = ...
    const destructRe = /(?:const|let|var)\s*\{([^}]+)\}/g;
    while ((match = destructRe.exec(content)) !== null) {
        const symbols = match[1].split(',').map(s => {
            const parts = s.trim().split(/\s*:\s*/);
            return parts[parts.length - 1].trim();
        }).filter(s => s.length > 0 && /^\w+$/.test(s));
        symbols.forEach(s => locals.add(s));
    }

    // Function parameters (rough extraction for named functions)
    const funcParamRe = /function\s+\w+\s*\(([^)]*)\)/g;
    while ((match = funcParamRe.exec(content)) !== null) {
        const params = match[1].split(',').map(s => s.trim().split(/\s*=\s*/)[0].trim())
            .filter(s => /^\w+$/.test(s));
        params.forEach(s => locals.add(s));
    }

    return locals;
}

/**
 * コメントと文字列リテラルを除去したコンテンツを返す
 */
function stripCommentsAndStrings(content) {
    // 文字列リテラルを空文字に置換
    let result = content.replace(/`[^`]*`/gs, '""');
    result = result.replace(/'(?:[^'\\]|\\.)*'/g, '""');
    result = result.replace(/"(?:[^"\\]|\\.)*"/g, '""');

    // コメントを除去
    result = result.replace(/\/\/[^\n]*/g, '');
    result = result.replace(/\/\*[\s\S]*?\*\//g, '');

    return result;
}

/**
 * ファイル内で参照されている PascalCase / UPPER_SNAKE_CASE の識別子を抽出する
 * （クラス名、定数名、enum名 — importが必要になりやすいもの）
 */
function extractReferencedSymbols(content) {
    const stripped = stripCommentsAndStrings(content);
    const symbols = new Set();

    // PascalCase identifiers (class names, enum-like objects)
    const pascalRe = /\b([A-Z][a-zA-Z0-9_]*)\b/g;
    let match;
    while ((match = pascalRe.exec(stripped)) !== null) {
        symbols.add(match[1]);
    }

    // UPPER_SNAKE_CASE identifiers (constants, DSL nodes)
    const upperRe = /\b([A-Z][A-Z0-9_]{2,})\b/g;
    while ((match = upperRe.exec(stripped)) !== null) {
        symbols.add(match[1]);
    }

    // Also catch camelCase functions that start with known prefixes
    const camelRe = /\b((?:get|set|is|has|can|create|make|calc|apply|init)[A-Z]\w*)\b/g;
    while ((match = camelRe.exec(stripped)) !== null) {
        symbols.add(match[1]);
    }

    return symbols;
}

/**
 * Sources/ ディレクトリの全 .js ファイルからエクスポートマップを構築する
 * @returns {Map<string, string>} シンボル名 → ファイルパス（相対）
 */
function buildExportMap() {
    const exportMap = new Map();
    const files = fs.readdirSync(SOURCES_DIR).filter(f => f.endsWith('.js'));

    for (const file of files) {
        const filePath = path.join(SOURCES_DIR, file);
        const exports = extractExports(filePath);
        for (const sym of exports) {
            if (!exportMap.has(sym)) {
                exportMap.set(sym, `./${file}`);
            }
        }
    }

    return exportMap;
}

/**
 * 単一ファイルの不足importを検出する
 */
function detectMissingImports(filePath, exportMap) {
    const content = fs.readFileSync(filePath, 'utf-8');
    const imported = extractImports(content);
    const locals = extractLocalDefinitions(content);
    const referenced = extractReferencedSymbols(content);

    const fileName = path.basename(filePath);
    const missing = [];

    for (const sym of referenced) {
        // Skip if already imported, locally defined, builtin, or keyword
        if (imported.has(sym) || locals.has(sym) || BUILTIN_GLOBALS.has(sym) || JS_KEYWORDS.has(sym)) {
            continue;
        }

        // Skip if this symbol is exported from the same file (self-reference)
        const exportSource = exportMap.get(sym);
        if (exportSource && path.basename(exportSource.replace('./', '')) === fileName) {
            continue;
        }

        // Skip single-letter or very short identifiers
        if (sym.length <= 2) {
            continue;
        }

        if (exportSource) {
            missing.push({ symbol: sym, source: exportSource });
        }
    }

    // Deduplicate and sort
    const seen = new Set();
    return missing.filter(m => {
        const key = `${m.symbol}:${m.source}`;
        if (seen.has(key)) return false;
        seen.add(key);
        return true;
    }).sort((a, b) => a.source.localeCompare(b.source) || a.symbol.localeCompare(b.symbol));
}

/**
 * import文の提案を生成する
 */
function generateImportSuggestions(missingImports) {
    // Group by source
    const bySource = new Map();
    for (const { symbol, source } of missingImports) {
        if (!bySource.has(source)) {
            bySource.set(source, []);
        }
        bySource.get(source).push(symbol);
    }

    const suggestions = [];
    for (const [source, symbols] of bySource) {
        suggestions.push(`import { ${symbols.join(', ')} } from '${source}';`);
    }
    return suggestions;
}

// Main
function main() {
    const args = process.argv.slice(2);
    const jsonOutput = args.includes('--json');
    const suggest = args.includes('--suggest');
    const fileIdx = args.indexOf('--file');
    const targetFile = fileIdx !== -1 ? args[fileIdx + 1] : null;

    const exportMap = buildExportMap();

    if (targetFile) {
        // Single file mode
        const missing = detectMissingImports(targetFile, exportMap);
        if (jsonOutput) {
            console.log(JSON.stringify({ file: targetFile, missing, count: missing.length }, null, 2));
        } else {
            console.log(`\n${targetFile}: ${missing.length} missing imports`);
            if (suggest) {
                const suggestions = generateImportSuggestions(missing);
                suggestions.forEach(s => console.log(`  ${s}`));
            } else {
                missing.forEach(m => console.log(`  ${m.symbol} from ${m.source}`));
            }
        }
        return;
    }

    // All files mode
    const files = fs.readdirSync(SOURCES_DIR)
        .filter(f => f.endsWith('.js'))
        .map(f => path.join(SOURCES_DIR, f));

    const results = [];
    let totalMissing = 0;

    for (const filePath of files) {
        const missing = detectMissingImports(filePath, exportMap);
        if (missing.length > 0) {
            results.push({ file: path.relative('.', filePath), missing, count: missing.length });
            totalMissing += missing.length;
        }
    }

    results.sort((a, b) => b.count - a.count);

    if (jsonOutput) {
        console.log(JSON.stringify({ total: totalMissing, files: results }, null, 2));
    } else {
        console.log(`\n=== 不足import検出結果 ===`);
        console.log(`合計: ${totalMissing} 件 / ${results.length} ファイル\n`);
        for (const { file, missing, count } of results) {
            console.log(`${file}: ${count} missing imports`);
            if (suggest) {
                const suggestions = generateImportSuggestions(missing);
                suggestions.forEach(s => console.log(`  ${s}`));
            } else {
                missing.forEach(m => console.log(`  ${m.symbol} from ${m.source}`));
            }
            console.log();
        }
    }
}

main();
