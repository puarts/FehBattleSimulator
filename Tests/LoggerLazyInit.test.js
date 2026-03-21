import { describe, test, expect } from 'vitest';
import { LoggerBase, SimpleLogger } from '../Sources/Logger.js';

describe('Logger lazy init', () => {
    test('LOG_LEVEL_MAP returns correct Map with value->name mapping', () => {
        const map = LoggerBase.LOG_LEVEL_MAP;
        expect(map).toBeInstanceOf(Map);
        expect(map.get(1)).toBe('OFF');
        expect(map.get(2)).toBe('FATAL');
        expect(map.get(3)).toBe('ERROR');
        expect(map.get(7)).toBe('DEBUG');
        expect(map.get(13)).toBe('ALL');
    });

    test('LOG_LEVEL_MAP returns same instance on multiple accesses (cached)', () => {
        const map1 = LoggerBase.LOG_LEVEL_MAP;
        const map2 = LoggerBase.LOG_LEVEL_MAP;
        expect(map1).toBe(map2);
    });

    test('levelStr works correctly', () => {
        expect(LoggerBase.levelStr(1)).toBe('OFF');
        expect(LoggerBase.levelStr(13)).toBe('ALL');
    });

    test('SimpleLogger writeLog works after lazy init change', () => {
        const logger = new SimpleLogger();
        logger.isLogEnabled = true;
        logger._logLevel = LoggerBase.LogLevel.ALL;
        logger.writeLog('test message');
        expect(logger.log).toContain('test message');
    });
});
