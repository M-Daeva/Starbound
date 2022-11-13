import { Request, Response } from "express";
import {
  _chainRegistryGetHandler,
  _updateChainRegistryGetHandler,
} from "../middleware/api";

async function updateChainRegistryGetHandler(_req: Request, res: Response) {
  let data = await _updateChainRegistryGetHandler();
  res.send(data);
}

async function chainRegistryGetHandler(_req: Request, res: Response) {
  let data = _chainRegistryGetHandler();
  res.send(data);
}

export { chainRegistryGetHandler, updateChainRegistryGetHandler };
