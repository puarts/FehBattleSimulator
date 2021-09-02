/// @file
/// @brief KeyRepeatHandler クラスの定義です。

class KeyRepeatHandler {
    constructor() {
        this._keyRepeatTimeoutId = null;

        this.intervalReductionRate = 0.9;
        this.startKeyRepeatInterval = 250;
    }

    startKeyRepeat(incrementFunc) {
        this.__startKeyRepeat(incrementFunc, this.startKeyRepeatInterval);
    }

    __startKeyRepeat(incrementFunc, interval) {
        incrementFunc();
        this._keyRepeatTimeoutId = setTimeout(() => {
            this.__startKeyRepeat(incrementFunc, interval * this.intervalReductionRate);
        }, interval);
    }

    stopKeyRepeat() {
        clearTimeout(this._keyRepeatTimeoutId);
    }
}
