/**
 * Tests for jQuery removal (Section 11)
 *
 * Verifies that all jQuery and jQuery UI CDN references have been removed
 * from HTML files, and that no jQuery API calls remain in JS source code.
 */

import { describe, it, expect } from 'vitest';
import fs from 'fs';
import path from 'path';

const SOURCES_DIR = path.resolve(__dirname, '../Sources');

const HTML_FILES = [
    'AetherRaidSimulator.html',
    'ArenaSimulator.html',
    'SummonerDuelsSimulator.html',
    'UnitBuilder.html',
    'DamageCalculator.html',
    'StatusCalculator.html',
    'HeroIconLister.html',
    'HeroStatusClusterer.html',
];

const JS_FILES = fs.readdirSync(SOURCES_DIR).filter(f => f.endsWith('.js'));

// Helper: strip HTML comments from content
function stripHtmlComments(content) {
    return content.replace(/<!--[\s\S]*?-->/g, '');
}

// Helper: strip JS single-line comments
function stripJsLineComments(content) {
    return content.split('\n').map(line => {
        // Remove // comments but preserve URLs (://)
        return line.replace(/(?<![:"'])\/\/(?![\/:]).*/g, '');
    }).join('\n');
}

describe('jQuery CDN removal', () => {
    HTML_FILES.forEach(file => {
        const filePath = path.join(SOURCES_DIR, file);
        if (!fs.existsSync(filePath)) return;
        const content = stripHtmlComments(fs.readFileSync(filePath, 'utf-8'));

        it(`${file} should not contain jQuery CDN script tags`, () => {
            // No active <script> tags referencing jquery (case insensitive)
            const scriptTags = content.match(/<script[^>]*src="[^"]*jquery[^"]*"[^>]*>/gi) || [];
            expect(scriptTags).toEqual([]);
        });

        it(`${file} should not contain jQuery UI CDN script/link tags`, () => {
            const jqueryUiTags = content.match(/<(?:script|link)[^>]*(?:jquery-ui|jqueryui)[^>]*>/gi) || [];
            expect(jqueryUiTags).toEqual([]);
        });

        it(`${file} should not contain jQuery preconnect hints`, () => {
            const preconnect = content.match(/<link[^>]*preconnect[^>]*jquery[^>]*>/gi) || [];
            expect(preconnect).toEqual([]);
        });
    });
});

describe('jQuery API removal from JS', () => {
    it('should have no $() or jQuery() calls in any JS file', () => {
        const violations = [];
        for (const file of JS_FILES) {
            const content = stripJsLineComments(
                fs.readFileSync(path.join(SOURCES_DIR, file), 'utf-8')
            );
            const lines = content.split('\n');
            lines.forEach((line, i) => {
                // Match $( but not ${ (template literals) or $. (money)
                if (/\$\s*\(/.test(line) || /jQuery\s*\(/.test(line)) {
                    violations.push(`${file}:${i + 1}: ${line.trim()}`);
                }
            });
        }
        expect(violations).toEqual([]);
    });

    it('should have no $.fn or $.ajax references in any JS file', () => {
        const violations = [];
        for (const file of JS_FILES) {
            const content = stripJsLineComments(
                fs.readFileSync(path.join(SOURCES_DIR, file), 'utf-8')
            );
            const lines = content.split('\n');
            lines.forEach((line, i) => {
                if (/\$\.fn/.test(line) || /\$\.ajax/.test(line)) {
                    violations.push(`${file}:${i + 1}: ${line.trim()}`);
                }
            });
        }
        expect(violations).toEqual([]);
    });

    it('should have no .dialog() calls in JS files', () => {
        const violations = [];
        for (const file of JS_FILES) {
            const content = stripJsLineComments(
                fs.readFileSync(path.join(SOURCES_DIR, file), 'utf-8')
            );
            const lines = content.split('\n');
            lines.forEach((line, i) => {
                if (/\.dialog\s*\(/.test(line)) {
                    violations.push(`${file}:${i + 1}: ${line.trim()}`);
                }
            });
        }
        expect(violations).toEqual([]);
    });

    it('should have no .progressbar() calls in JS files', () => {
        const violations = [];
        for (const file of JS_FILES) {
            const content = stripJsLineComments(
                fs.readFileSync(path.join(SOURCES_DIR, file), 'utf-8')
            );
            const lines = content.split('\n');
            lines.forEach((line, i) => {
                if (/\.progressbar\s*\(/.test(line)) {
                    violations.push(`${file}:${i + 1}: ${line.trim()}`);
                }
            });
        }
        expect(violations).toEqual([]);
    });
});

describe('jQuery API removal from HTML inline scripts', () => {
    HTML_FILES.forEach(file => {
        const filePath = path.join(SOURCES_DIR, file);
        if (!fs.existsSync(filePath)) return;

        it(`${file} should not contain $() calls in inline scripts`, () => {
            const content = stripHtmlComments(fs.readFileSync(filePath, 'utf-8'));
            // Extract inline script blocks
            const scriptBlocks = content.match(/<script(?:\s[^>]*)?>[\s\S]*?<\/script>/gi) || [];
            // Also check @click and other Vue event handlers
            const vueHandlers = content.match(/@(?:click|change|input)\s*=\s*"[^"]*"/gi) || [];

            const violations = [];
            for (const block of scriptBlocks) {
                // Skip external script tags
                if (/src\s*=/.test(block.split('>')[0])) continue;
                const lines = block.split('\n');
                lines.forEach((line, i) => {
                    const stripped = line.replace(/\/\/.*$/, '');
                    if (/\$\s*\(/.test(stripped) || /\.dialog\s*\(/.test(stripped)) {
                        violations.push(`${file} script:${i + 1}: ${line.trim()}`);
                    }
                });
            }
            for (const handler of vueHandlers) {
                if (/\$\s*\(/.test(handler) || /\.dialog\s*\(/.test(handler)) {
                    violations.push(`${file} handler: ${handler}`);
                }
            }
            expect(violations).toEqual([]);
        });
    });
});

describe('LZ-String npm migration', () => {
    it('should not have LZ-String CDN script tags in any HTML file', () => {
        const violations = [];
        for (const file of HTML_FILES) {
            const filePath = path.join(SOURCES_DIR, file);
            if (!fs.existsSync(filePath)) continue;
            const content = stripHtmlComments(fs.readFileSync(filePath, 'utf-8'));
            if (/<script[^>]*lz-string[^>]*>/i.test(content)) {
                violations.push(file);
            }
        }
        expect(violations).toEqual([]);
    });

    it('should import LZString from npm package in source files that use it', () => {
        const lzStringUsers = ['AppData.js', 'Unit.js', 'UnitBuilderMain.js', 'SettingManager.js'];
        for (const file of lzStringUsers) {
            const content = fs.readFileSync(path.join(SOURCES_DIR, file), 'utf-8');
            if (/LZString\./.test(content)) {
                expect(content).toMatch(/import\s+LZString\s+from\s+['"]lz-string['"]/);
            }
        }
    });

    it('should compress and decompress data correctly', async () => {
        const LZString = (await import('lz-string')).default;
        const testData = 'Hello, FEH Battle Simulator! 日本語テスト 🎮';

        // EncodedURIComponent roundtrip
        const compressed = LZString.compressToEncodedURIComponent(testData);
        expect(LZString.decompressFromEncodedURIComponent(compressed)).toBe(testData);

        // Base64 roundtrip
        const compressedB64 = LZString.compressToBase64(testData);
        expect(LZString.decompressFromBase64(compressedB64)).toBe(testData);

        // UTF16 roundtrip
        const compressedUtf16 = LZString.compressToUTF16(testData);
        expect(LZString.decompressFromUTF16(compressedUtf16)).toBe(testData);
    });
});

describe('CropperJS npm migration', () => {
    it('should not have CropperJS CDN script/link tags in any HTML file', () => {
        const violations = [];
        for (const file of HTML_FILES) {
            const filePath = path.join(SOURCES_DIR, file);
            if (!fs.existsSync(filePath)) continue;
            const content = stripHtmlComments(fs.readFileSync(filePath, 'utf-8'));
            if (/<(?:script|link)[^>]*cropperjs[^>]*>/i.test(content)) {
                violations.push(file);
            }
        }
        expect(violations).toEqual([]);
    });

    it('should import Cropper from npm package in Main_ImageProcessing.js', () => {
        const content = fs.readFileSync(path.join(SOURCES_DIR, 'Main_ImageProcessing.js'), 'utf-8');
        expect(content).toMatch(/import\s+Cropper\s+from\s+['"]cropperjs['"]/);
    });
});

describe('Font Awesome migration', () => {
    it('should not have Font Awesome CDN link tags in any HTML file', () => {
        const violations = [];
        for (const file of HTML_FILES) {
            const filePath = path.join(SOURCES_DIR, file);
            if (!fs.existsSync(filePath)) continue;
            const content = stripHtmlComments(fs.readFileSync(filePath, 'utf-8'));
            if (/<link[^>]*font-?awesome[^>]*>/i.test(content)) {
                violations.push(file);
            }
        }
        expect(violations).toEqual([]);
    });
});

describe('Select2 CDN removal (verified from Section 09)', () => {
    it('should not have Select2 CDN tags in any HTML file', () => {
        const violations = [];
        for (const file of HTML_FILES) {
            const filePath = path.join(SOURCES_DIR, file);
            if (!fs.existsSync(filePath)) continue;
            const content = stripHtmlComments(fs.readFileSync(filePath, 'utf-8'));
            if (/<(?:script|link)[^>]*select2[^>]*>/i.test(content)) {
                violations.push(file);
            }
        }
        expect(violations).toEqual([]);
    });
});
