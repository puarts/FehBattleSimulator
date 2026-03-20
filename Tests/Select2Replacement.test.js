import { describe, it, expect } from 'vitest';
import { readFileSync } from 'fs';
import { resolve } from 'path';

const vueComponentsPath = resolve(__dirname, '../Sources/VueComponents.js');
const vueComponentsSource = readFileSync(vueComponentsPath, 'utf-8');

// Helper: extract component source by name
function extractComponentSource(name) {
    const re = new RegExp(`app\\.component\\('${name}'`);
    const match = vueComponentsSource.match(re);
    if (!match) return '';
    const start = match.index;
    const rest = vueComponentsSource.substring(start + 1);
    const nextMatch = rest.match(/app\.component\s*\(/);
    const end = nextMatch ? start + 1 + nextMatch.index : vueComponentsSource.length;
    return vueComponentsSource.substring(start, end);
}

describe('Select2 Replacement Component', () => {
    const componentSource = extractComponentSource('select2');

    describe('Props interface', () => {
        it('should accept options, modelValue, fallbackValue, and isDebugMode props', () => {
            expect(componentSource).toContain('options');
            expect(componentSource).toContain('modelValue');
            expect(componentSource).toContain('fallbackValue');
            expect(componentSource).toContain('isDebugMode');
        });

        it('should have correct prop types', () => {
            // options: Array, required
            expect(componentSource).toMatch(/options\s*:\s*\{[^}]*type\s*:\s*Array/);
            expect(componentSource).toMatch(/options\s*:\s*\{[^}]*required\s*:\s*true/);

            // modelValue: Number|String
            expect(componentSource).toMatch(/modelValue\s*:\s*\{[^}]*type\s*:\s*\[Number,\s*String\]/);

            // fallbackValue: default -1
            expect(componentSource).toMatch(/fallbackValue\s*:\s*\{[^}]*default\s*:\s*-1/);

            // isDebugMode: Boolean, default false
            expect(componentSource).toMatch(/isDebugMode\s*:\s*\{[^}]*type\s*:\s*Boolean/);
            expect(componentSource).toMatch(/isDebugMode\s*:\s*\{[^}]*default\s*:\s*false/);
        });

        it('should emit update:modelValue event', () => {
            expect(componentSource).toMatch(/emits\s*:\s*\[.*'update:modelValue'/);
        });

        it('should accept value prop as alias for modelValue', () => {
            expect(componentSource).toMatch(/value\s*:\s*\{[^}]*type\s*:\s*\[Number,\s*String\]/);
        });

        it('should emit input event for backward compatibility', () => {
            expect(componentSource).toMatch(/emits\s*:\s*\[.*'input'/);
            expect(componentSource).toMatch(/\$emit\s*\(\s*'input'/);
        });
    });

    describe('No jQuery dependency', () => {
        it('should not use jQuery $ function', () => {
            // The select2 component should not contain $( which indicates jQuery usage
            const jqueryPattern = /\$\(\s*this\.\$el\s*\)/g;
            const matches = componentSource.match(jqueryPattern);
            expect(matches).toBeNull();
        });

        it('should not call .select2() jQuery plugin', () => {
            const select2PluginPattern = /\.select2\s*\(/g;
            const matches = componentSource.match(select2PluginPattern);
            expect(matches).toBeNull();
        });

        it('should not use $.trim or $.extend', () => {
            expect(componentSource).not.toMatch(/\$\.trim/);
            expect(componentSource).not.toMatch(/\$\.extend/);
        });
    });

    describe('Template structure', () => {
        it('should render a searchable dropdown (not bare <select>)', () => {
            // Old component used template: '<select></select>'
            // New component should have a richer template with search input
            expect(componentSource).not.toMatch(/template\s*:\s*['"]<select><\/select>['"]/);
        });

        it('should have a text input for search', () => {
            expect(componentSource).toMatch(/type="text"|type='text'|<input/);
        });
    });

    describe('Search filtering', () => {
        it('should have multi-word search logic', () => {
            // Must split by spaces and match all keywords
            expect(componentSource).toMatch(/split\s*\(/);
            expect(componentSource).toMatch(/every\s*\(/);
        });

        it('should handle fullwidth spaces', () => {
            // Must convert fullwidth spaces (U+3000) to regular spaces
            expect(componentSource).toMatch(/\\u3000|　/);
        });

        it('should be case-insensitive', () => {
            expect(componentSource).toMatch(/toLowerCase\s*\(\)/);
        });
    });

    describe('Value parsing', () => {
        it('should parse numeric string values to integers', () => {
            expect(componentSource).toMatch(/parseInt/);
        });
    });

    describe('fallbackValue behavior', () => {
        it('should reference fallbackValue when value not in options', () => {
            expect(componentSource).toMatch(/fallbackValue/);
            // Should check if current value exists in options
            expect(componentSource).toMatch(/some\s*\(/);
        });
    });

    describe('Debug mode', () => {
        it('should add invalid value marker in debug mode', () => {
            expect(componentSource).toMatch(/isDebugMode/);
            expect(componentSource).toMatch(/不正な値|invalid/i);
        });

        it('should apply invalid-value CSS class', () => {
            expect(componentSource).toMatch(/invalid-value/);
        });
    });

    describe('Lifecycle', () => {
        it('should use Vue 3 beforeUnmount (not beforeDestroy)', () => {
            expect(componentSource).not.toMatch(/beforeDestroy/);
        });
    });
});

describe('CDN cleanup', () => {
    const htmlFiles = [
        'ArenaSimulator.html',
        'AetherRaidSimulator.html',
        'SummonerDuelsSimulator.html',
        'UnitBuilder.html',
        'DamageCalculator.html',
        'HeroStatusClusterer.html',
    ];

    for (const file of htmlFiles) {
        it(`should not contain select2 CDN links in ${file}`, () => {
            const filePath = resolve(__dirname, '../Sources', file);
            const content = readFileSync(filePath, 'utf-8');
            expect(content).not.toMatch(/select2\.min\.css/);
            expect(content).not.toMatch(/select2\.min\.js/);
        });
    }

    it('should not contain jQuery select2 initialization in VueComponents.js', () => {
        expect(vueComponentsSource).not.toMatch(/\.select2\s*\(/);
    });
});

describe('CSS cleanup', () => {
    it('should not contain .select2-container or .select2-results CSS rules', () => {
        const cssPath = resolve(__dirname, '../Sources/feh-battle-simulator.css');
        const cssContent = readFileSync(cssPath, 'utf-8');
        expect(cssContent).not.toMatch(/\.select2-container/);
        expect(cssContent).not.toMatch(/\.select2-results/);
        expect(cssContent).not.toMatch(/\.select2-selection/);
    });

    it('should retain .invalid-value CSS class', () => {
        const cssPath = resolve(__dirname, '../Sources/feh-battle-simulator.css');
        const cssContent = readFileSync(cssPath, 'utf-8');
        expect(cssContent).toMatch(/\.invalid-value/);
    });
});
