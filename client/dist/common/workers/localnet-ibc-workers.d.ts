declare function init(): Promise<{
    sgTransfer: () => Promise<void>;
    sgSwap: () => Promise<void>;
    cwDeposit: () => Promise<void>;
    cwMultiTransfer: () => Promise<void>;
} | undefined>;
export { init };
