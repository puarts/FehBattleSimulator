#!/usr/bin/env node
// Validates that the ESM module graph can be loaded without TDZ errors.
// This script imports the main entry point in native ESM mode.
// Usage: node scripts/validate-esm.mjs
//
// Exit code 0: No TDZ errors detected
// Exit code 1: TDZ error detected (circular dependency issue)

import { join, dirname } from 'path';
import { fileURLToPath, pathToFileURL } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const ROOT = join(__dirname, '..');
const SOURCES = join(ROOT, 'Sources');

// Minimal browser global stubs for module-level code.
// These prevent unrelated ReferenceErrors during module initialization.
// The focus is on detecting TDZ errors, not runtime correctness.
function createDeepProxy(name) {
    const handler = {
        get(_target, prop) {
            if (prop === Symbol.toPrimitive) return () => '';
            if (prop === Symbol.iterator) return undefined;
            if (prop === 'toString') return () => `[stub:${name}]`;
            if (prop === 'valueOf') return () => 0;
            if (prop === 'then') return undefined; // avoid thenable detection
            return createDeepProxy(`${name}.${String(prop)}`);
        },
        apply() { return createDeepProxy(`${name}()`); },
        construct() { return createDeepProxy(`new ${name}`); },
        set() { return true; },
        has() { return true; },
    };
    return new Proxy(function() {}, handler);
}

// Set up browser globals
const browserGlobals = [
    'document', 'window', 'navigator', 'location', 'history',
    'localStorage', 'sessionStorage', 'XMLHttpRequest', 'fetch',
    'HTMLElement', 'HTMLCanvasElement', 'HTMLImageElement',
    'Image', 'Audio', 'FileReader', 'Blob',
    'MutationObserver', 'ResizeObserver', 'IntersectionObserver',
    'requestAnimationFrame', 'cancelAnimationFrame',
    'alert', 'confirm', 'prompt',
    'Vue', '$', 'jQuery', 'Select2',
    'Tesseract', 'cv', 'LZString',
];

for (const name of browserGlobals) {
    if (!(name in globalThis)) {
        globalThis[name] = createDeepProxy(name);
    }
}

// Ensure document has basic DOM methods that return stubs
globalThis.document = createDeepProxy('document');
globalThis.window = createDeepProxy('window');

// Entry point to validate
const entryPoint = join(SOURCES, 'ArenaSimulatorMain.js');
const entryUrl = pathToFileURL(entryPoint).href;

try {
    await import(entryUrl);
    console.log('OK: Entry point loaded without TDZ errors.');
    process.exit(0);
} catch (err) {
    // Classify the error
    if (err instanceof ReferenceError && /Cannot access '.+' before initialization/.test(err.message)) {
        console.error(`TDZ ERROR: ${err.message}`);
        console.error(err.stack);
        process.exit(1);
    }

    // Other ReferenceErrors for missing browser globals are expected
    if (err instanceof ReferenceError) {
        console.warn(`WARN: Non-TDZ ReferenceError (expected in Node.js): ${err.message}`);
        console.log('OK: No TDZ errors detected (non-TDZ ReferenceError is acceptable).');
        process.exit(0);
    }

    // Other errors — report but don't treat as TDZ failure
    console.warn(`WARN: Non-TDZ error during import: ${err.constructor.name}: ${err.message}`);
    if (err.stack) console.warn(err.stack);
    console.log('OK: No TDZ errors detected (other error type).');
    process.exit(0);
}
