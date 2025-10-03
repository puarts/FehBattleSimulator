/**
 * @abstract
 */
class LoggerBase {
    static LogLevel = Object.freeze({
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

    static LOG_LEVEL_MAP = ObjectUtil.makeMapFromObj(this.LogLevel);

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
        this._logLevel = LoggerBase.LogLevel.OFF;
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
     * @param {boolean} isGroup
     */
    constructor(level, log, isGroup = false) {
        /** @type {number} */
        this.level = level;
        /** @type {T|null} */
        this.log = log;
        /** @type {GroupLog<T>[]} */
        this.children = [];
        /** @type {boolean} */
        this.isGroup = isGroup;
    }

    get levelStr() {
        return LoggerBase.levelStr(this.level);
    }

    hasLeaf(level) {
        if (this.level <= level && !this.isGroup) {
            return true;
        }
        for (let child of this.children) {
            if (child.hasLeaf(level)) {
                return true;
            }
        }
        return false;
    }

    matches(text) {
        const keywords = text.replace(/\u3000/g, ' ').toLowerCase().split(/\s+/);
        if (!this.log) { return false; }
        return keywords.every(keyword => this.log.matches?.(keyword));
    }
}

/**
 * @template T
 */
class GroupLogger {
    constructor() {
        /** @type {GroupLog<T>} */
        this.rootLog = new GroupLog(-1, null, true);
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
    get logs() {
        return this.currentLog.children;
    }

    /** ルート直下（トップレベル） */
    get rootLogs() {
        return this.rootLog.children;
    }

    /**
     * グループを開く
     * @param {number} level
     * @param {T} log
     * @returns {GroupLog<T>} 新規グループ
     */
    group(level, log) {
        const g = new GroupLog(level, log, true);
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
    /** @param {T} log */ fatal(log) {
        return this.push(LoggerBase.LogLevel.FATAL, log);
    }

    /** @param {T} log */ error(log) {
        return this.push(LoggerBase.LogLevel.ERROR, log);
    }

    /** @param {T} log */ warn(log) {
        return this.push(LoggerBase.LogLevel.WARN, log);
    }

    /** @param {T} log */ notice(log) {
        return this.push(LoggerBase.LogLevel.NOTICE, log);
    }

    /** @param {T} log */ info(log) {
        return this.push(LoggerBase.LogLevel.INFO, log);
    }

    /** @param {T} log */ debug(log) {
        return this.push(LoggerBase.LogLevel.DEBUG, log);
    }

    /** @param {T} log */ trace(log) {
        return this.push(LoggerBase.LogLevel.TRACE, log);
    }

    /** @param {T} log */ trace2(log) {
        return this.push(LoggerBase.LogLevel.TRACE2, log);
    }

    /** @param {T} log */ trace3(log) {
        return this.push(LoggerBase.LogLevel.TRACE3, log);
    }

    /** @param {T} log */ trace4(log) {
        return this.push(LoggerBase.LogLevel.TRACE4, log);
    }

    /** @param {T} log */ trace5(log) {
        return this.push(LoggerBase.LogLevel.TRACE5, log);
    }

    withGroup(level, log, fn) {
        this.group(level, log);
        try {
            return fn();
        } finally {
            this.groupEnd();
        }
    }

    /**
     * ツリーを剪定して、predicate にヒットしたノードとその祖先だけを残す
     * ただし「マッチしたノード自身の配下」は剪定せず **全て残す**。
     * @template T
     * @param {GroupLog<T>} root
     * @param {(node: GroupLog<T>) => boolean} predicate
     * @param {"with-matching-descendants"|"self-only"} mode  // selfMatch には無視される
     * @returns {GroupLog<T> | null}
     */
    static filterGroupTree(root, predicate, mode = "with-matching-descendants") {
        // フィルタ無しの深いクローン
        function cloneSubtree(node) {
            const copy = new GroupLog(node.level, node.log, node.isGroup);
            copy.children = node.children.map(cloneSubtree);
            return copy;
        }

        function visit(node) {
            const keptChildren = node.children.map(visit).filter(Boolean);
            const selfMatch = predicate(node);

            if (selfMatch) {
                // マッチしたノードは配下を「そのまま」全て残す
                // （mode は無視して、剪定せずクローン）
                return cloneSubtree(node);
            }

            if (keptChildren.length > 0) {
                // 自身は非ヒットだが、子にヒットがあるので祖先として残す
                const copy = new GroupLog(node.level, node.log, node.isGroup);
                copy.children = keptChildren;
                return copy;
            }

            // どちらも該当なし → 落とす
            return null;
        }
        return visit(root);
    }

    /**
     * インスタンスの rootLog を条件で剪定した新しい木を返す
     * @param {(node: GroupLog<T>) => boolean} predicate
     * @param {"with-matching-descendants"|"self-only"} mode
     * @returns {GroupLog<T> | null}
     */
    filteredRoot(predicate, mode = "with-matching-descendants") {
        return GroupLogger.filterGroupTree(this.rootLog, predicate, mode);
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
        if (!this._shouldLog(LoggerBase.LogLevel.INFO)) return;
        this._rawLog += `${log}\n`;
    }

    writeLog(log) {
        if (!this._shouldLog(LoggerBase.LogLevel.INFO)) return;
        this._rawLog += `${log}\n`;
    }

    writeDebugLog(log) {
        if (!this._shouldLog(LoggerBase.LogLevel.DEBUG)) return;
        this._rawLog += `${log}\n`;
    }

    trace(log) {
        if (!this._shouldLog(LoggerBase.LogLevel.TRACE)) return;
        this._rawLog += `${log}\n`;
    }

    trace2(log) {
        if (!this._shouldLog(LoggerBase.LogLevel.TRACE2)) return;
        this._rawLog += `${log}\n`;
    }

    trace3(log) {
        if (!this._shouldLog(LoggerBase.LogLevel.TRACE3)) return;
        this._rawLog += `${log}\n`;
    }

    trace4(log) {
        if (!this._shouldLog(LoggerBase.LogLevel.TRACE4)) return;
        this._rawLog += `${log}\n`;
    }

    trace5(log) {
        if (!this._shouldLog(LoggerBase.LogLevel.TRACE5)) return;
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
        if (!this._shouldLog(LoggerBase.LogLevel.INFO)) return;
        this._simpleLog += `<div class="damage-log-info">${log}</div>`;
    }

    writeLog(log) {
        if (!this._shouldLog(LoggerBase.LogLevel.INFO)) return;
        this._log += `<div class="damage-log-info">${log}</div>`;
    }

    writeDebugLog(log) {
        if (!this._shouldLog(LoggerBase.LogLevel.DEBUG)) return;
        this._log += `<div class="damage-log-debug">${log}</div>`;
    }

    trace(log) {
        if (!this._shouldLog(LoggerBase.LogLevel.TRACE)) return;
        this._log += `<div class="damage-log-trace">${log}</div>`;
    }

    trace2(log) {
        if (!this._shouldLog(LoggerBase.LogLevel.TRACE2)) return;
        this._log += `<div class="damage-log-trace2">${log}</div>`;
    }

    trace3(log) {
        if (!this._shouldLog(LoggerBase.LogLevel.TRACE3)) return;
        this._log += `<div class="damage-log-trace3">${log}</div>`;
    }

    trace4(log) {
        if (!this._shouldLog(LoggerBase.LogLevel.TRACE4)) return;
        this._log += `<div class="damage-log-trace4">${log}</div>`;
    }

    trace5(log) {
        if (!this._shouldLog(LoggerBase.LogLevel.TRACE5)) return;
        this._log += `<div class="damage-log-trace5">${log}</div>`;
    }
}

class ConsoleLogger extends LoggerBase {
    // 黒背景用のスタイル
    static BLACK_BG_STYLES = new Map([
        [LoggerBase.LogLevel.FATAL, 'color: #FF6B6B; font-weight: bold;'],
        [LoggerBase.LogLevel.ERROR, 'color: #FF5252; font-weight: bold;'],
        [LoggerBase.LogLevel.WARN, 'color: #FFC107; font-weight: bold;'],
        [LoggerBase.LogLevel.NOTICE, 'color: #64B5F6; font-weight: bold;'],
        [LoggerBase.LogLevel.INFO, 'color: #81C784;'],
        [LoggerBase.LogLevel.DEBUG, 'color: #888888;'],
        [LoggerBase.LogLevel.TRACE, 'color: #777777;'],
        [LoggerBase.LogLevel.TRACE2, 'color: #666666;'],
        [LoggerBase.LogLevel.TRACE3, 'color: #555555;'],
        [LoggerBase.LogLevel.TRACE4, 'color: #444444;'],
        [LoggerBase.LogLevel.TRACE5, 'color: #333333;'],
    ]);

    // 白背景用のスタイル
    static WHITE_BG_STYLES = new Map([
        [LoggerBase.LogLevel.FATAL, 'color: darkred; font-weight: bold;'],
        [LoggerBase.LogLevel.ERROR, 'color: red; font-weight: bold;'],
        [LoggerBase.LogLevel.WARN, 'color: orange; font-weight: bold;'],
        [LoggerBase.LogLevel.NOTICE, 'color: blue; font-weight: bold;'],
        [LoggerBase.LogLevel.INFO, 'color: green;'],
        [LoggerBase.LogLevel.DEBUG, 'color: #888888;'],
        [LoggerBase.LogLevel.TRACE, 'color: #999999;'],
        [LoggerBase.LogLevel.TRACE2, 'color: #aaaaaa;'],
        [LoggerBase.LogLevel.TRACE3, 'color: #bbbbbb;'],
        [LoggerBase.LogLevel.TRACE4, 'color: #cccccc;'],
        [LoggerBase.LogLevel.TRACE5, 'color: #dddddd;'],
    ]);

    static logWithLevel(level, message, styles) {
        let levelStr = LoggerBase.levelStr(level);
        let paddedLevel = levelStr.padEnd(5);
        console.log(`[%c${paddedLevel}%c] ` + message, styles.get(level), '');
    }

    static group(level, message, styles = ConsoleLogger.BLACK_BG_STYLES) {
        let levelStr = LoggerBase.levelStr(level);
        let paddedLevel = levelStr.padEnd(5);
        console.group(`[%c${paddedLevel}%c] ` + message, styles.get(level), '');
    }

    static groupEnd() {
        console.groupEnd();
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

const DetailLevel = Object.freeze({
    SIMPLE: 0,
    NORMAL: 10,
    DETAIL: 20,
    VERBOSE: 30,
    FULL: 40,
});

// ラベル定義は配列で保持して凍結（順序も明示）
const _entries = Object.freeze([
    [DetailLevel.SIMPLE, '簡易'],
    [DetailLevel.NORMAL, '通常'],
    [DetailLevel.DETAIL, '詳細'],
    [DetailLevel.VERBOSE, '詳細+'],
    [DetailLevel.FULL, '完全'],
]);

// 参照用の読み取り構造を生成（公開は get 経由にすると安心）
const _labels = new Map(_entries);
const _labelsRev = new Map(_entries.map(([k, v]) => [v, k]));

// レベル配列（数値昇順を保証）
const _levels = Object.freeze(_entries.map(([k]) => k).sort((a, b) => a - b));

const DetailLabels = Object.freeze({
    get(level, fallback = '') {
        return _labels.get(level) ?? fallback;
    },
    has(level) {
        return _labels.has(level);
    },
    // 必要なら entries/keys/values の読み取りメソッドを用意
});

const DetailUtils = Object.freeze({
    levels: _levels, // すでに凍結済みの配列

    labelOf(level, fallback = '') {
        return _labels.get(level) ?? fallback;
    },

    parseLabel(label) {
        return _labelsRev.get(label); // 見つからなければ undefined
    },

    clamp(level) {
        if (!Number.isFinite(level)) return _levels[0];
        if (level <= _levels[0]) return _levels[0];
        if (level >= _levels[_levels.length - 1]) return _levels[_levels.length - 1];
        // 刻みに合わせて丸めたい場合（例: 10刻み）
        // return Math.round(level / 10) * 10;
        return level;
    },

    next(level) {
        const i = _levels.indexOf(level);
        return i >= 0 && i < _levels.length - 1 ? _levels[i + 1] : level;
    },

    prev(level) {
        const i = _levels.indexOf(level);
        return i > 0 ? _levels[i - 1] : level;
    },

    // ある詳細度以上か？
    atLeast(level, min) {
        return level >= min;
    },

    atMost(level, max) {
        return level <= max;
    },

    getOptions() {
        return _entries.map(([value, label]) => ({text: label, value}));
    },
});
