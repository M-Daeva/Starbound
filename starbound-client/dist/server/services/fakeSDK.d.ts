interface BalanceItem {
    denom: string;
    value: number;
}
interface Wallet {
    address: string;
    balance: BalanceItem[];
    nft: {
        collection: string;
        id: number;
    }[];
}
declare enum Denom {
    STCOIN = "axlusdc",
    COIN = "luna"
}
declare enum Collection {
    GALACTIC_PUNKS = "GalacticPunks"
}
declare class Client {
    wallet: Wallet;
    constructor(seed: string);
    static isAdressUsed(address: string): boolean;
    static getWallet(address: string): Promise<Wallet>;
    static getBalance(address: string, token: string): Promise<number>;
    private updateBalance;
    sendToken(address: string, token: string, value: number): Promise<void>;
}
declare namespace Utils {
    function getQuantityByDenom(balance: BalanceItem[], denom: Denom): number;
}
export { Client, Wallet, Denom, Collection, Utils, BalanceItem };
