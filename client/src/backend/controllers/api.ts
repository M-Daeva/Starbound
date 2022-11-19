import { Request, Response } from "express";
import {
  updateChainRegistry as _updateChainRegistry,
  getChainRegistry as _getChainRegistry,
  updateIbcChannels as _updateIbcChannels,
  getIbcChannnels as _getIbcChannnels,
  updatePools as _updatePools,
  getPools as _getPools,
  updateValidators as _updateValidators,
  getValidators as _getValidators,
  getUserFunds as _getUserFunds,
  filterChainRegistry as _filterChainRegistry,
} from "../middleware/api";

async function updateChainRegistry(_req: Request, res: Response) {
  let data = await _updateChainRegistry();
  res.send(data);
}

async function getChainRegistry(_req: Request, res: Response) {
  let data = await _getChainRegistry();
  res.send(data);
}

async function updateIbcChannels(_req: Request, res: Response) {
  let data = await _updateIbcChannels();
  res.send(data);
}

async function getIbcChannnels(_req: Request, res: Response) {
  let data = await _getIbcChannnels();
  res.send(data);
}

async function updatePools(_req: Request, res: Response) {
  let data = await _updatePools();
  res.send(data);
}

async function getPools(_req: Request, res: Response) {
  let data = await _getPools();
  res.send(data);
}

async function updateValidators(_req: Request, res: Response) {
  let data = await _updateValidators();
  res.send(data);
}

async function getValidators(_req: Request, res: Response) {
  let data = await _getValidators();
  res.send(data);
}

async function getUserFunds(req: Request, res: Response) {
  let { adresses } = req.query as unknown as {
    adresses: string[] | undefined;
  };
  if (!adresses) return;
  let data = await _getUserFunds(adresses);
  res.send(data);
}

async function filterChainRegistry(_req: Request, res: Response) {
  let data = await _filterChainRegistry();
  res.send(data);
}

export {
  updateChainRegistry,
  getChainRegistry,
  updateIbcChannels,
  getIbcChannnels,
  updatePools,
  getPools,
  updateValidators,
  getValidators,
  getUserFunds,
  filterChainRegistry,
};
