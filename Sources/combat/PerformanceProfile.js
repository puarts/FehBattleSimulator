
class PerformanceProfile {
    constructor() {
        this.elaspedMilliseconds = {};
        this.isEnabled = true;
    }

    addElaspedMilliseconds(name, ms) {
        if (name in this.elaspedMilliseconds) {
            this.elaspedMilliseconds[name] += ms;
        }
        else {
            this.elaspedMilliseconds[name] = ms;
        }
    }

    profile(name, func) {
        if (this.isEnabled) {
            const startTime = performance.now();
            const result = func();
            this.addElaspedMilliseconds(name, performance.now() - startTime);
            return result;
        }
        else {
            return func();
        }
    }
}
