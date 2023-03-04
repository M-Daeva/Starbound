import { Request, Response } from "express";
declare function setEncryptionKey(req: Request, res: Response): Promise<void>;
export { setEncryptionKey };
