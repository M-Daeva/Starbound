declare class Timer {
    private period;
    private fn;
    private id;
    private isRunning;
    constructor(period: number, fn: () => void);
    start(): void;
    stop(): void;
    toggle(): void;
}
export default Timer;
