
class LoggerBase {
    constructor() {
        this.isLogEnabled = false;
    }
    get log() {
        return "";
    }
    get simpleLog() {
        return "";
    }

    clearLog() {
    }

    writeSimpleLog(log) {
    }

    writeLog(log) {
    }

    writeDebugLog(log) {
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
        if (!this.isLogEnabled) {
            return;
        }
        this._rawLog += log + "\n";
    }

    writeLog(log) {
        if (!this.isLogEnabled) {
            return;
        }
        this._rawLog += log + "\n";
    }
    writeDebugLog(log) {
        if (!this.isLogEnabled) {
            return;
        }
        this._rawLog += log + "\n";
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
        if (!this.isLogEnabled) {
            return;
        }

        this._simpleLog += `${log}<br/>`;
    }

    writeLog(log) {
        if (!this.isLogEnabled) {
            return;
        }
        this._log += "<span style='font-size:10px; color:#000000'>" + log + "</span><br/>";
    }
    writeDebugLog(log) {
        if (!this.isLogEnabled) {
            return;
        }
        this._log += `<span style='font-size:10px; color:#666666'>${log}</span><br/>`;
    }
}
