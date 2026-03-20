import { describe, it, expect } from 'vitest';
import { readFileSync } from 'fs';
import { resolve } from 'path';

const vueComponentsPath = resolve(__dirname, '../Sources/VueComponents.js');
const vueComponentsSource = readFileSync(vueComponentsPath, 'utf-8');

// Helper: extract component source by name (between its app.component call and the next one)
function extractComponentSource(name) {
    const re = new RegExp(`app\\.component\\('${name}'`);
    const match = vueComponentsSource.match(re);
    if (!match) return '';
    const start = match.index;
    // Find the next app.component( or end of file
    const rest = vueComponentsSource.substring(start + 1);
    const nextMatch = rest.match(/app\.component\s*\(/);
    const end = nextMatch ? start + 1 + nextMatch.index : vueComponentsSource.length;
    return vueComponentsSource.substring(start, end);
}

describe('Vue 3 Component Migration - Static Analysis', () => {
    it('should not contain Vue.component() calls', () => {
        const matches = vueComponentsSource.match(/Vue\.component\s*\(/g);
        expect(matches).toBeNull();
    });

    // 32 components registered via app.component() inside initVueComponents()
    it('should use app.component() for all 32 registrations', () => {
        const matches = vueComponentsSource.match(/app\.component\s*\(/g);
        expect(matches).not.toBeNull();
        expect(matches.length).toBe(32);
    });

    it('should not contain Vue 2 deprecated APIs', () => {
        // $set
        const setMatches = vueComponentsSource.match(/this\.\$set\s*\(|Vue\.set\s*\(/g);
        expect(setMatches).toBeNull();

        // $delete
        const deleteMatches = vueComponentsSource.match(/this\.\$delete\s*\(|Vue\.delete\s*\(/g);
        expect(deleteMatches).toBeNull();

        // beforeDestroy
        const destroyMatches = vueComponentsSource.match(/beforeDestroy\s*[:(]/g);
        expect(destroyMatches).toBeNull();

        // $children
        const childrenMatches = vueComponentsSource.match(/this\.\$children/g);
        expect(childrenMatches).toBeNull();
    });

    it('should not contain Vue 2 model option', () => {
        const modelMatches = vueComponentsSource.match(/model\s*:\s*\{\s*prop\s*:/g);
        expect(modelMatches).toBeNull();
    });

    it('should not contain Vuex references', () => {
        const vuexMapState = vueComponentsSource.match(/Vuex\.mapState/g);
        expect(vuexMapState).toBeNull();

        const storeDispatch = vueComponentsSource.match(/\$store\.dispatch/g);
        expect(storeDispatch).toBeNull();

        const mapStateShim = vueComponentsSource.match(/mapStateShim/g);
        expect(mapStateShim).toBeNull();
    });

    it('select2 component should use modelValue and beforeUnmount', () => {
        const select2Source = extractComponentSource('select2');
        expect(select2Source.length).toBeGreaterThan(0);

        expect(select2Source).toContain('modelValue');
        expect(select2Source).toContain("update:modelValue");
        expect(select2Source).toContain('beforeUnmount');
        expect(select2Source).not.toContain('beforeDestroy');
    });

    it('should use Pinia mapState instead of Vuex', () => {
        expect(vueComponentsSource).toContain("import { mapState, mapActions } from 'pinia'");
        expect(vueComponentsSource).toContain("import { useMainStore } from './store.js'");

        const piniaMapState = vueComponentsSource.match(/mapState\(useMainStore/g);
        expect(piniaMapState).not.toBeNull();
        expect(piniaMapState.length).toBeGreaterThanOrEqual(16);
    });

    it('log-node should use $refs instead of $children', () => {
        const logNodeSource = extractComponentSource('log-node');
        expect(logNodeSource.length).toBeGreaterThan(0);

        expect(logNodeSource).toContain('$refs.childNodes');
        expect(logNodeSource).not.toContain('$children');
    });
});

describe('Vue 2 API removal - Other source files', () => {
    it('BattleSimulatorBase.js should not contain $set or Vue.set', () => {
        const source = readFileSync(resolve(__dirname, '../Sources/BattleSimulatorBase.js'), 'utf-8');
        // Ignore commented-out lines
        const activeLines = source.split('\n').filter(l => !l.trim().startsWith('//'));
        const activeSource = activeLines.join('\n');
        expect(activeSource).not.toMatch(/this\.\$set\s*\(/);
        expect(activeSource).not.toMatch(/Vue\.set\s*\(/);
    });

    it('CustomSkill.js should not contain $set or Vue.set', () => {
        const source = readFileSync(resolve(__dirname, '../Sources/CustomSkill.js'), 'utf-8');
        const activeLines = source.split('\n').filter(l => !l.trim().startsWith('//'));
        const activeSource = activeLines.join('\n');
        expect(activeSource).not.toMatch(/vm\.\$set\s*\(/);
        expect(activeSource).not.toMatch(/Vue\.set\s*\(/);
    });
});
