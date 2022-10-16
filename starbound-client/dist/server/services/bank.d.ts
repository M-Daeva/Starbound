import { Client, Wallet } from "./fakeSDK";
declare class Bank {
    private client;
    private timer;
    private users;
    constructor(seed: string);
    deposit(userClient: Client, value: number): Promise<void>;
    unbond(userClient: Client, value: number): void;
    claim(userClient: Client): void;
    provide(userClient: Client): void;
    withdraw(userClient: Client): void;
    borrow(userClient: Client, value: number): void;
    repay(userClient: Client, value: number): void;
    get wallet(): Wallet;
    init(): void;
    collectFloorPrices(): never[];
    calculateLTV(): number[];
    private updateState;
    private liquidate;
    private sendTX;
}
export default Bank;
