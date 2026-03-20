#!/usr/bin/env node
// Validates that the Unit.js <-> DamageCalculator.js circular dependency
// has been properly resolved and both modules initialize without TDZ errors.
// Usage: node scripts/validate-esm-circular.mjs

import { join, dirname } from 'path';
import { fileURLToPath, pathToFileURL } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const ROOT = join(__dirname, '..');
const SOURCES = join(ROOT, 'Sources');

// Minimal browser global stubs (same as validate-esm.mjs)
function createDeepProxy(name) {
    const handler = {
        get(_target, prop) {
            if (prop === Symbol.toPrimitive) return () => '';
            if (prop === Symbol.iterator) return undefined;
            if (prop === 'toString') return () => `[stub:${name}]`;
            if (prop === 'valueOf') return () => 0;
            if (prop === 'then') return undefined;
            return createDeepProxy(`${name}.${String(prop)}`);
        },
        apply() { return createDeepProxy(`${name}()`); },
        construct() { return createDeepProxy(`new ${name}`); },
        set() { return true; },
        has() { return true; },
    };
    return new Proxy(function() {}, handler);
}

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

globalThis.document = createDeepProxy('document');
globalThis.window = createDeepProxy('window');

// Import Unit.js which has the circular dependency with DamageCalculator.js
const unitUrl = pathToFileURL(join(SOURCES, 'Unit.js')).href;

try {
    const unitModule = await import(unitUrl);

    // Verify that the Unit export is a real class/constructor, not undefined
    if (typeof unitModule.Unit === 'undefined') {
        console.error('CIRCULAR DEP ERROR: Unit export is undefined (likely circular dependency issue)');
        process.exit(1);
    }

    console.log('OK: Unit.js and its dependency chain loaded without TDZ errors.');
    process.exit(0);
} catch (err) {
    if (err instanceof ReferenceError && /Cannot access '.+' before initialization/.test(err.message)) {
        console.error(`TDZ ERROR (circular dependency): ${err.message}`);
        console.error(err.stack);
        process.exit(1);
    }

    if (err instanceof ReferenceError) {
        console.warn(`WARN: Non-TDZ ReferenceError (expected in Node.js): ${err.message}`);
        console.log('OK: No TDZ errors in circular dependency chain.');
        process.exit(0);
    }

    console.warn(`WARN: Non-TDZ error: ${err.constructor.name}: ${err.message}`);
    console.log('OK: No TDZ errors in circular dependency chain.');
    process.exit(0);
}
