declare function getEncryptionKey(): string | undefined;
declare function setEncryptionKey(value: string): Promise<string>;
export { getEncryptionKey, setEncryptionKey };
