/**
 * @abstract
 */
class LoggerBase {
    static LOG_LEVEL = Object.freeze({
        OFF: 1,
        FATAL: 2,
        ERROR: 3,
        WARN: 4,
        NOTICE: 5,
        INFO: 6,
        DEBUG: 7,
        TRACE: 8,
        TRACE2: 9,
        TRACE3: 10,
        TRACE4: 11,
        TRACE5: 12,
        ALL: 13
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

    /**
     * @abstract
     * @param {string} log
     */
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

/**
 * @template T
 */
class GroupLog {
    /**
     * @param {number} level
     * @param {T|null} log
     */
    constructor(level, log) {
        /** @type {number} */
        this.level = level;
        /** @type {T|null} */
        this.log = log;
        /** @type {GroupLog<T>[]} */
        this.children = [];
    }
    get levelStr() { return LoggerBase.levelStr(this.level); }
}

/**
 * @template T
 */
class GroupLogger {
    constructor() {
        /** @type {GroupLog<T>} */
        this.rootLog = new GroupLog(-1, null);
        /** @type {GroupLog<T>} */
        this.currentLog = this.rootLog;
        /** @type {GroupLog<T>[]} */
        this._stack = [this.rootLog]; // ルートを積んで開始
    }

    clearLog() {
        this.rootLog = new GroupLog(-1, null);
        this.currentLog = this.rootLog;
        this._stack = [this.rootLog];
    }

    /** 現在グループの直下 */
    get logs() { return this.currentLog.children; }

    /** ルート直下（トップレベル） */
    get rootLogs() { return this.rootLog.children; }

    /**
     * グループを開く
     * @param {number} level
     * @param {T} log
     * @returns {GroupLog<T>} 新規グループ
     */
    group(level, log) {
        const g = new GroupLog(level, log);
        this.currentLog.children.push(g);
        this._stack.push(g);
        this.currentLog = g;
        return g;
    }

    /** グループを閉じる（ルートでは何もしない） */
    groupEnd() {
        if (this._stack.length > 1) {
            this._stack.pop();
            this.currentLog = this._stack[this._stack.length - 1];
        }
    }

    /**
     * 共通 push
     * @param {number} level
     * @param {T} log
     * @returns {GroupLog<T>}
     */
    push(level, log) {
        const item = new GroupLog(level, log);
        this.currentLog.children.push(item);
        return item;
    }

    // 以下は薄いラッパー
    /** @param {T} log */ fatal(log){ return this.push(LoggerBase.LOG_LEVEL.FATAL, log); }
    /** @param {T} log */ error(log){ return this.push(LoggerBase.LOG_LEVEL.ERROR, log); }
    /** @param {T} log */ warn(log){ return this.push(LoggerBase.LOG_LEVEL.WARN, log); }
    /** @param {T} log */ notice(log){ return this.push(LoggerBase.LOG_LEVEL.NOTICE, log); }
    /** @param {T} log */ info(log){ return this.push(LoggerBase.LOG_LEVEL.INFO, log); }
    /** @param {T} log */ debug(log){ return this.push(LoggerBase.LOG_LEVEL.DEBUG, log); }
    /** @param {T} log */ trace(log){ return this.push(LoggerBase.LOG_LEVEL.TRACE, log); }
    /** @param {T} log */ trace2(log){ return this.push(LoggerBase.LOG_LEVEL.TRACE2, log); }
    /** @param {T} log */ trace3(log){ return this.push(LoggerBase.LOG_LEVEL.TRACE3, log); }
    /** @param {T} log */ trace4(log){ return this.push(LoggerBase.LOG_LEVEL.TRACE4, log); }
    /** @param {T} log */ trace5(log){ return this.push(LoggerBase.LOG_LEVEL.TRACE5, log); }

    withGroup(level, log, fn) {
        this.group(level, log);
        try {
            return fn();
        } finally {
            this.groupEnd();
        }
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
        return this._simpleLog.substring(0, this._simpleLog.length);
    }

    clearLog() {
        this._log = "";
        this._simpleLog = "";
    }

    writeSimpleLog(log) {
        if (!this._shouldLog(LoggerBase.LOG_LEVEL.INFO)) return;
        this._simpleLog += `<div class="damage-log-info">${log}</div>`;
    }

    writeLog(log) {
        if (!this._shouldLog(LoggerBase.LOG_LEVEL.INFO)) return;
        this._log += `<div class="damage-log-info">${log}</div>`;
    }

    writeDebugLog(log) {
        if (!this._shouldLog(LoggerBase.LOG_LEVEL.DEBUG)) return;
        this._log += `<div class="damage-log-debug">${log}</div>`;
    }

    trace(log) {
        if (!this._shouldLog(LoggerBase.LOG_LEVEL.TRACE)) return;
        this._log += `<div class="damage-log-trace">${log}</div>`;
    }

    trace2(log) {
        if (!this._shouldLog(LoggerBase.LOG_LEVEL.TRACE2)) return;
        this._log += `<div class="damage-log-trace2">${log}</div>`;
    }

    trace3(log) {
        if (!this._shouldLog(LoggerBase.LOG_LEVEL.TRACE3)) return;
        this._log += `<div class="damage-log-trace3">${log}</div>`;
    }

    trace4(log) {
        if (!this._shouldLog(LoggerBase.LOG_LEVEL.TRACE4)) return;
        this._log += `<div class="damage-log-trace4">${log}</div>`;
    }

    trace5(log) {
        if (!this._shouldLog(LoggerBase.LOG_LEVEL.TRACE5)) return;
        this._log += `<div class="damage-log-trace5">${log}</div>`;
    }
}

class ConsoleLogger extends LoggerBase {
    // 黒背景用のスタイル
    static BLACK_BG_STYLES = new Map([
        [LoggerBase.LOG_LEVEL.FATAL, 'color: #FF6B6B; font-weight: bold;'],
        [LoggerBase.LOG_LEVEL.ERROR, 'color: #FF5252; font-weight: bold;'],
        [LoggerBase.LOG_LEVEL.WARN, 'color: #FFC107; font-weight: bold;'],
        [LoggerBase.LOG_LEVEL.NOTICE, 'color: #64B5F6; font-weight: bold;'],
        [LoggerBase.LOG_LEVEL.INFO, 'color: #81C784;'],
        [LoggerBase.LOG_LEVEL.DEBUG, 'color: #888888;'],
        [LoggerBase.LOG_LEVEL.TRACE, 'color: #777777;'],
        [LoggerBase.LOG_LEVEL.TRACE2, 'color: #666666;'],
        [LoggerBase.LOG_LEVEL.TRACE3, 'color: #555555;'],
        [LoggerBase.LOG_LEVEL.TRACE4, 'color: #444444;'],
        [LoggerBase.LOG_LEVEL.TRACE5, 'color: #333333;'],
    ]);

    // 白背景用のスタイル
    static WHITE_BG_STYLES = new Map([
        [LoggerBase.LOG_LEVEL.FATAL, 'color: darkred; font-weight: bold;'],
        [LoggerBase.LOG_LEVEL.ERROR, 'color: red; font-weight: bold;'],
        [LoggerBase.LOG_LEVEL.WARN, 'color: orange; font-weight: bold;'],
        [LoggerBase.LOG_LEVEL.NOTICE, 'color: blue; font-weight: bold;'],
        [LoggerBase.LOG_LEVEL.INFO, 'color: green;'],
        [LoggerBase.LOG_LEVEL.DEBUG, 'color: #888888;'],
        [LoggerBase.LOG_LEVEL.TRACE, 'color: #999999;'],
        [LoggerBase.LOG_LEVEL.TRACE2, 'color: #aaaaaa;'],
        [LoggerBase.LOG_LEVEL.TRACE3, 'color: #bbbbbb;'],
        [LoggerBase.LOG_LEVEL.TRACE4, 'color: #cccccc;'],
        [LoggerBase.LOG_LEVEL.TRACE5, 'color: #dddddd;'],
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
