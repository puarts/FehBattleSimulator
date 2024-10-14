/**
 * @abstract
 */
class LoggerBase {
    static LOG_LEVEL = Object.freeze({
        OFF: 1,
        FATAL: 2,
        ERROR: 3,
        WARN: 4,
        INFO: 5,
        DEBUG: 6,
        TRACE: 7,
        TRACE2: 8,
        TRACE3: 9,
        TRACE4: 10,
        TRACE5: 11,
        ALL: 12
    });

    static LOG_LEVEL_MAP = ObjectUtil.makeMapFromObj(this.LOG_LEVEL);

    static levelStr(level) {
        return this.LOG_LEVEL_MAP.get(level);
    }

    /**
     * ログレベルの重要度を比較する
     * @param level1
     * @param level2
     * @returns {number} 正: level1が重要なログ、負: level2が重要なログ
     */
    static compPriority(level1, level2) {
        return level2 - level1;
    }

    constructor() {
        this.isLogEnabled = false;
        this._logLevel = LoggerBase.LOG_LEVEL.OFF;
    }

    set logLevel(level) {
        console.log(`set log: ${level}`);
        this._logLevel = level;
    }

    /**
     * @abstract
     * @returns {string}
     */
    get log() {
        return "";
    }

    /**
     * @abstract
     * @returns {string}
     */
    get simpleLog() {
        return "";
    }

    /**
     * @abstract
     */
    clearLog() {
    }

    /**
     * @abstract
     * @param {string} log
     */
    writeSimpleLog(log) {
    }

    /**
     * @abstract
     * @param {string} log
     */
    writeLog(log) {
    }

    /**
     * @abstract
     * @param {string} log
     */
    writeDebugLog(log) {
    }

    /**
     * @abstract
     * @param {string} log
     */
    trace(log) {
    }

    trace2(log) {
    }

    /**
     *
     * @abstract
     * @param {string} log
     */
    trace3(log) {
    }

    /**
     *
     * @abstract
     * @param {string} log
     */
    trace4(log) {
    }

    /**
     *
     * @abstract
     * @param {string} log
     */
    trace5(log) {
    }

    _shouldLog(level) {
        if (!this.isLogEnabled) {
            return false;
        }
        return LoggerBase.compPriority(level, this._logLevel) >= 0;
    }
}

class SimpleLogger extends LoggerBase {
    constructor() {
        super();
        this._rawLog = "";
    }

    get log() {
        return this._rawLog;
    }

    get simpleLog() {
        return this._rawLog;
    }

    clearLog() {
        this._rawLog = "";
    }

    writeSimpleLog(log) {
        if (!this._shouldLog(LoggerBase.LOG_LEVEL.INFO)) return;
        this._rawLog += `${log}\n`;
    }

    writeLog(log) {
        if (!this._shouldLog(LoggerBase.LOG_LEVEL.INFO)) return;
        this._rawLog += `${log}\n`;
    }

    writeDebugLog(log) {
        if (!this._shouldLog(LoggerBase.LOG_LEVEL.DEBUG)) return;
        this._rawLog += `${log}\n`;
    }

    trace(log) {
        if (!this._shouldLog(LoggerBase.LOG_LEVEL.TRACE)) return;
        this._rawLog += `${log}\n`;
    }

    trace2(log) {
        if (!this._shouldLog(LoggerBase.LOG_LEVEL.TRACE2)) return;
        this._rawLog += `${log}\n`;
    }

    trace3(log) {
        if (!this._shouldLog(LoggerBase.LOG_LEVEL.TRACE3)) return;
        this._rawLog += `${log}\n`;
    }

    trace4(log) {
        if (!this._shouldLog(LoggerBase.LOG_LEVEL.TRACE4)) return;
        this._rawLog += `${log}\n`;
    }

    trace5(log) {
        if (!this._shouldLog(LoggerBase.LOG_LEVEL.TRACE5)) return;
        this._rawLog += `${log}\n`;
    }
}

class HtmlLogger extends LoggerBase {
    constructor() {
        super();

        this._log = "";
        this._simpleLog = "";
        this.isLogEnabled = true;
    }

    get log() {
        return this._log;
    }

    get simpleLog() {
        return this._simpleLog.substring(0, this._simpleLog.length - "<br/>".length);
    }

    clearLog() {
        this._log = "";
        this._simpleLog = "";
    }

    writeSimpleLog(log) {
        if (!this._shouldLog(LoggerBase.LOG_LEVEL.INFO)) return;
        this._simpleLog += `${log}<br/>`;
    }

    writeLog(log) {
        if (!this._shouldLog(LoggerBase.LOG_LEVEL.INFO)) return;
        this._log += `<span class="log-info">${log}</span><br/>`;
    }

    writeDebugLog(log) {
        if (!this._shouldLog(LoggerBase.LOG_LEVEL.DEBUG)) return;
        this._log += `<span class="log-debug">${log}</span><br/>`;
    }

    trace(log) {
        if (!this._shouldLog(LoggerBase.LOG_LEVEL.TRACE)) return;
        this._log += `<span class="log-trace">${log}</span><br/>`;
    }

    trace2(log) {
        if (!this._shouldLog(LoggerBase.LOG_LEVEL.TRACE2)) return;
        this._log += `<span class="log-trace2">${log}</span><br/>`;
    }

    trace3(log) {
        if (!this._shouldLog(LoggerBase.LOG_LEVEL.TRACE3)) return;
        this._log += `<span class="log-trace3">${log}</span><br/>`;
    }

    trace4(log) {
        if (!this._shouldLog(LoggerBase.LOG_LEVEL.TRACE4)) return;
        this._log += `<span class="log-trace4">${log}</span><br/>`;
    }

    trace5(log) {
        if (!this._shouldLog(LoggerBase.LOG_LEVEL.TRACE5)) return;
        this._log += `<span class="log-trace5">${log}</span><br/>`;
    }
}

class ConsoleLogger extends LoggerBase {
    // 黒背景用のスタイル
    static BLACK_BG_STYLES = new Map([
        [LoggerBase.LOG_LEVEL.FATAL, 'color: #FF6B6B; font-weight: bold;'],
        [LoggerBase.LOG_LEVEL.ERROR, 'color: #FF5252; font-weight: bold;'],
        [LoggerBase.LOG_LEVEL.WARN, 'color: #FFC107; font-weight: bold;'],
        [LoggerBase.LOG_LEVEL.INFO, 'color: #64B5F6;'],
        [LoggerBase.LOG_LEVEL.DEBUG, 'color: #81C784;'],
        [LoggerBase.LOG_LEVEL.TRACE, 'color: #888888;'],
        [LoggerBase.LOG_LEVEL.TRACE2, 'color: #777777;'],
        [LoggerBase.LOG_LEVEL.TRACE3, 'color: #666666;'],
        [LoggerBase.LOG_LEVEL.TRACE4, 'color: #555555;'],
        [LoggerBase.LOG_LEVEL.TRACE5, 'color: #444444;'],
    ]);

    // 白背景用のスタイル
    static WHITE_BG_STYLES = new Map([
        [LoggerBase.LOG_LEVEL.FATAL, 'color: darkred; font-weight: bold;'],
        [LoggerBase.LOG_LEVEL.ERROR, 'color: red; font-weight: bold;'],
        [LoggerBase.LOG_LEVEL.WARN, 'color: orange; font-weight: bold;'],
        [LoggerBase.LOG_LEVEL.INFO, 'color: blue;'],
        [LoggerBase.LOG_LEVEL.DEBUG, 'color: green;'],
        [LoggerBase.LOG_LEVEL.TRACE, 'color: #888888;'],
        [LoggerBase.LOG_LEVEL.TRACE2, 'color: #999999;'],
        [LoggerBase.LOG_LEVEL.TRACE3, 'color: #aaaaaa;'],
        [LoggerBase.LOG_LEVEL.TRACE4, 'color: #bbbbbb;'],
        [LoggerBase.LOG_LEVEL.TRACE5, 'color: #cccccc;'],
    ]);

    static logWithLevel(level, message, styles) {
        let levelStr = LoggerBase.levelStr(level);
        let paddedLevel = levelStr.padEnd(5);
        console.log(`[%c${paddedLevel}%c] ` + message, styles.get(level), '');
    }

    clearLog() {
        // console.clear();
    }

    get log() {
        return "";
    }

    get simpleLog() {
        return "";
    }

    writeDebugLog(log) {
    }

    writeLog(log) {
    }

    writeSimpleLog(log) {
    }
}
