#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const { extractSymbols, parseCode } = require('./lib/ast-extractor');
const { classifySideEffects } = require('./lib/side-effect-classifier');

function analyzeFile(filePath) {
    const code = fs.readFileSync(filePath, 'utf-8');
    try {
        const ast = parseCode(code);
        const { defines, references } = extractSymbols(code, ast);
        const sideEffectCategory = classifySideEffects(code, ast);
        return {
            file: path.relative(process.cwd(), filePath),
            defines,
            references,
            sideEffectCategory,
        };
    } catch (err) {
        return {
            file: path.relative(process.cwd(), filePath),
            error: err.message,
            defines: [],
            references: [],
            sideEffectCategory: null,
        };
    }
}

function main() {
    const args = process.argv.slice(2);
    let outputPath = null;
    const inputPaths = [];

    for (let i = 0; i < args.length; i++) {
        if (args[i] === '--output' && i + 1 < args.length) {
            outputPath = args[++i];
        } else {
            inputPaths.push(args[i]);
        }
    }

    if (inputPaths.length === 0) {
        console.error('Usage: node Tools/analyze-globals.js <file-or-dir> [--output <path>]');
        process.exit(1);
    }

    const results = [];
    for (const inputPath of inputPaths) {
        const resolved = path.resolve(inputPath);
        const stat = fs.statSync(resolved);
        if (stat.isDirectory()) {
            const files = fs.readdirSync(resolved)
                .filter(f => f.endsWith('.js'))
                .sort()
                .map(f => path.join(resolved, f));
            for (const file of files) {
                results.push(analyzeFile(file));
            }
        } else {
            results.push(analyzeFile(resolved));
        }
    }

    const output = JSON.stringify(results, null, 2);
    if (outputPath) {
        const dir = path.dirname(outputPath);
        if (!fs.existsSync(dir)) {
            fs.mkdirSync(dir, { recursive: true });
        }
        fs.writeFileSync(outputPath, output, 'utf-8');
        console.log(`Results written to ${outputPath} (${results.length} files)`);
    } else {
        console.log(output);
    }
}

main();
