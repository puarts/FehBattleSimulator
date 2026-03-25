import { describe, test, expect } from 'vitest';

describe('SkillImpl* ESM import completeness', () => {
    // 各SkillImplファイルの動的importが成功すること（ReferenceErrorが発生しないこと）
    test('SkillImpl202601.js can be dynamically imported without errors', async () => {
        await expect(import('../Sources/SkillImpl202601.js')).resolves.toBeDefined();
    });

    test('SkillImpl202501.js can be dynamically imported without errors', async () => {
        await expect(import('../Sources/SkillImpl202501.js')).resolves.toBeDefined();
    });

    test('SkillImpl202408.js can be dynamically imported without errors', async () => {
        await expect(import('../Sources/SkillImpl202408.js')).resolves.toBeDefined();
    });

    test('SkillImpl.js can be dynamically imported without errors', async () => {
        await expect(import('../Sources/SkillImpl.js')).resolves.toBeDefined();
    });
});
