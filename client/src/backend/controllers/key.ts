import { Request, Response } from "express";
import { setEncryptionKey as _setEncryptionKey } from "../middleware/key";

async function setEncryptionKey(req: Request, res: Response) {
  const { encryptionKey } = req.body as unknown as {
    encryptionKey: string | undefined;
  };
  if (!encryptionKey) return;

  const data = await _setEncryptionKey(encryptionKey);
  res.send(data);
}

export { setEncryptionKey };
