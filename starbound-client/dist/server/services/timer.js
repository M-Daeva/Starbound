"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
class Timer {
    constructor(period, fn) {
        this.period = period;
        this.fn = fn;
        this.id = setTimeout(() => { }, 0);
        this.isRunning = false;
    }
    start() {
        if (this.isRunning)
            return;
        this.isRunning = true;
        this.id = setInterval(this.fn, this.period);
    }
    stop() {
        if (!this.isRunning)
            return;
        this.isRunning = false;
        clearInterval(this.id);
    }
    toggle() {
        this.isRunning ? this.stop() : this.start();
    }
}
exports.default = Timer;
