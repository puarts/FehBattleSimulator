import { describe, it, expect } from 'vitest';
import { execFileSync } from 'child_process';

describe('Missing imports resolution', () => {
    it('madge --circular reports no circular dependencies', { timeout: 30000 }, () => {
        // madge outputs results to stderr, capture both
        let output = '';
        try {
            output = execFileSync('npx', ['madge', '--circular', '--no-color', 'Sources/'], {
                cwd: process.cwd(),
                encoding: 'utf-8',
                timeout: 30000,
                stdio: ['pipe', 'pipe', 'pipe'],
            });
        } catch (e) {
            // madge exits with code 1 when cycles found, output is in stderr
            output = (e.stderr || '') + (e.stdout || '');
        }
        expect(output).not.toContain('Found');
    });
});
