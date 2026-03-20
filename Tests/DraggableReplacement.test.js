import { describe, it, expect } from 'vitest';
import { readFileSync } from 'fs';
import { resolve } from 'path';

const vueComponentsPath = resolve(__dirname, '../Sources/VueComponents.js');
const vueComponentsSource = readFileSync(vueComponentsPath, 'utf-8');

describe('Vue.Draggable Replacement', () => {
    describe('CDN removal', () => {
        const htmlFiles = [
            'ArenaSimulator.html',
            'AetherRaidSimulator.html',
            'SummonerDuelsSimulator.html',
            'UnitBuilder.html',
        ];

        for (const file of htmlFiles) {
            it(`should not have SortableJS CDN script in ${file}`, () => {
                const filePath = resolve(__dirname, '../Sources', file);
                const content = readFileSync(filePath, 'utf-8');
                expect(content).not.toMatch(/sortablejs@.*Sortable\.min\.js/);
                expect(content).not.toMatch(/cdn\.jsdelivr\.net\/npm\/sortablejs/);
            });
        }

        for (const file of htmlFiles) {
            it(`should not have Vue.Draggable CDN script in ${file}`, () => {
                const filePath = resolve(__dirname, '../Sources', file);
                const content = readFileSync(filePath, 'utf-8');
                expect(content).not.toMatch(/vuedraggable/);
            });
        }
    });

    describe('draggable component registration', () => {
        it('should register draggable component via app.component()', () => {
            expect(vueComponentsSource).toMatch(/app\.component\(\s*['"]draggable['"]/);
        });

        it('should import VueDraggable from vue-draggable-plus', () => {
            expect(vueComponentsSource).toMatch(/import\s+.*VueDraggable.*from\s+['"]vue-draggable-plus['"]/);
        });

        it('should register VueDraggable as the draggable component', () => {
            expect(vueComponentsSource).toMatch(/app\.component\(\s*['"]draggable['"],\s*VueDraggable\s*\)/);
        });
    });

    describe('package.json', () => {
        it('should have vue-draggable-plus as a dependency', () => {
            const pkgPath = resolve(__dirname, '../package.json');
            const pkg = JSON.parse(readFileSync(pkgPath, 'utf-8'));
            const allDeps = { ...pkg.dependencies, ...pkg.devDependencies };
            expect(allDeps).toHaveProperty('vue-draggable-plus');
        });

        it('should not have sortablejs as a direct dependency', () => {
            const pkgPath = resolve(__dirname, '../package.json');
            const pkg = JSON.parse(readFileSync(pkgPath, 'utf-8'));
            const allDeps = { ...pkg.dependencies, ...pkg.devDependencies };
            expect(allDeps).not.toHaveProperty('sortablejs');
        });
    });

    describe('enemyUnitSorted handler safety', () => {
        it('should filter non-element nodes in enemyUnitSorted', () => {
            const bsPath = resolve(__dirname, '../Sources/BattleSimulatorBase.js');
            const bsSource = readFileSync(bsPath, 'utf-8');
            expect(bsSource).toMatch(/nodeType.*ELEMENT_NODE|ELEMENT_NODE.*nodeType/);
        });
    });

    describe('v-model binding for array synchronization', () => {
        const htmlFiles = [
            'ArenaSimulator.html',
            'AetherRaidSimulator.html',
            'SummonerDuelsSimulator.html',
        ];

        for (const file of htmlFiles) {
            it(`should use v-model on draggable in ${file}`, () => {
                const filePath = resolve(__dirname, '../Sources', file);
                const content = readFileSync(filePath, 'utf-8');
                // All draggable elements should have v-model binding
                const draggableMatches = content.match(/<draggable/g);
                const vModelMatches = content.match(/<draggable[^>]*v-model="/g);
                expect(draggableMatches).not.toBeNull();
                expect(vModelMatches).not.toBeNull();
                expect(vModelMatches.length).toBe(draggableMatches.length);
            });
        }
    });
});
