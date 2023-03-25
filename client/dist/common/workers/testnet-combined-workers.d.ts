import { QueryPoolsAndUsersResponse } from "../codegen/Starbound.types";
declare function init(): Promise<{
    queryBalance: () => Promise<void>;
    sgGrantStakeAuth: () => Promise<void>;
    cwSwap: () => Promise<void>;
    sgDelegateFrom: () => Promise<void>;
    sgUpdatePoolList: () => Promise<void>;
    cwQueryPoolsAndUsers: () => Promise<QueryPoolsAndUsersResponse>;
    cwDepositAlice: () => Promise<void>;
    cwDepositBob: () => Promise<void>;
    cwWithdrawAlice: () => Promise<void>;
    cwMockUpdatePoolsAndUsers: () => Promise<void>;
    cwQueryUser: () => Promise<void>;
    cwTransfer: () => Promise<void>;
    sgTransfer: () => Promise<void>;
} | undefined>;
export { init };
