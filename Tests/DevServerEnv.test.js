import { describe, it, expect } from 'vitest';
import fs from 'fs';
import path from 'path';

const ROOT = path.resolve(__dirname, '..');

describe('.env files', () => {
    it('.env.development が存在し VITE_DATA_SOURCE=local を定義していること', () => {
        const envPath = path.join(ROOT, '.env.development');
        expect(fs.existsSync(envPath)).toBe(true);
        const content = fs.readFileSync(envPath, 'utf-8');
        expect(content).toContain('VITE_DATA_SOURCE=local');
    });

    it('.env.production が存在し VITE_DATA_SOURCE=remote を定義していること', () => {
        const envPath = path.join(ROOT, '.env.production');
        expect(fs.existsSync(envPath)).toBe(true);
        const content = fs.readFileSync(envPath, 'utf-8');
        expect(content).toContain('VITE_DATA_SOURCE=remote');
    });
});
