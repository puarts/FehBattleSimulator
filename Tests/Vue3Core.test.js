import { createApp } from 'vue';
import fs from 'fs';
import path from 'path';

const ROOT = path.resolve(__dirname, '..');
const SOURCES = path.join(ROOT, 'Sources');

describe('D.1 Vue 3 Installation', () => {
    test('import { createApp } from vue resolves successfully', () => {
        expect(typeof createApp).toBe('function');
    });

    test('Vue 3 runtime compiler build is configured via alias', () => {
        const configContent = fs.readFileSync(
            path.resolve(ROOT, 'vite.config.js'), 'utf-8'
        );
        expect(configContent).toContain('vue.esm-bundler.js');
    });

    test('CDN Vue 2 script tags are removed from all HTML files', () => {
        const htmlFiles = fs.readdirSync(SOURCES).filter(f => f.endsWith('.html'));
        for (const file of htmlFiles) {
            const content = fs.readFileSync(path.join(SOURCES, file), 'utf-8');
            expect(content).not.toContain('vue/2.5.13');
            expect(content).not.toContain('vue.min.js');
        }
    });

    test('CDN Vuex script tags are removed from all HTML files', () => {
        const htmlFiles = fs.readdirSync(SOURCES).filter(f => f.endsWith('.html'));
        for (const file of htmlFiles) {
            const content = fs.readFileSync(path.join(SOURCES, file), 'utf-8');
            expect(content).not.toContain('vuex@3.6.2');
            expect(content).not.toContain('vuex.min.js');
        }
    });
});

describe('D.2 Vue Instance Migration', () => {
    test('createApp() creates a Vue application successfully', () => {
        const app = createApp({ data() { return { msg: 'hello' }; } });
        expect(app).toBeDefined();
        expect(typeof app.mount).toBe('function');
    });
});

describe('D.6 Breaking Changes Elimination', () => {
    test('Vue.set and $set are not used in source code', () => {
        const jsFiles = fs.readdirSync(SOURCES).filter(f => f.endsWith('.js'));
        for (const file of jsFiles) {
            const content = fs.readFileSync(path.join(SOURCES, file), 'utf-8');
            const lines = content.split('\n').filter(l => !l.trim().startsWith('//'));
            const activeContent = lines.join('\n');
            expect(activeContent).not.toMatch(/Vue\.set\s*\(/);
            expect(activeContent).not.toMatch(/\.\$set\s*\(/);
        }
    });

    test('$delete is not used in source code', () => {
        const jsFiles = fs.readdirSync(SOURCES).filter(f => f.endsWith('.js'));
        for (const file of jsFiles) {
            const content = fs.readFileSync(path.join(SOURCES, file), 'utf-8');
            const lines = content.split('\n').filter(l => !l.trim().startsWith('//'));
            expect(lines.join('\n')).not.toMatch(/\.\$delete\s*\(/);
        }
    });

    test('beforeDestroy hook is not used', () => {
        const jsFiles = fs.readdirSync(SOURCES).filter(f => f.endsWith('.js'));
        for (const file of jsFiles) {
            const content = fs.readFileSync(path.join(SOURCES, file), 'utf-8');
            const lines = content.split('\n').filter(l => !l.trim().startsWith('//'));
            expect(lines.join('\n')).not.toMatch(/\bbeforeDestroy\s*[\({]/);
        }
    });

    test('$children is not used in source code', () => {
        const jsFiles = fs.readdirSync(SOURCES).filter(f => f.endsWith('.js'));
        for (const file of jsFiles) {
            const content = fs.readFileSync(path.join(SOURCES, file), 'utf-8');
            const lines = content.split('\n').filter(l => !l.trim().startsWith('//'));
            expect(lines.join('\n')).not.toMatch(/\.\$children/);
        }
    });
});
