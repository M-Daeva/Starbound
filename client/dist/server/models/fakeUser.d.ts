interface Unbonding {
    amount: number;
    unbondDate: Date;
}
interface Collateral {
    collection: string;
    id: number;
}
interface User {
    walletAddress: string;
    deposit: number;
    unbondings: Unbonding[];
    collaterals: Collateral[];
    loan: number;
}
export default User;
