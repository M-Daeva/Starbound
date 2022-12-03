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
  updateUserFunds as _updateUserFunds,
  getUserFunds as _getUserFunds,
  updatePoolsAndUsers as _updatePoolsAndUsers,
  getPoolsAndUsers as _getPoolsAndUsers,
  filterChainRegistry as _filterChainRegistry,
  updateAll as _updateAll,
  getAll as _getAll,
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

async function updateUserFunds(_req: Request, res: Response) {
  let data = await _updateUserFunds();
  res.send(data);
}

async function getUserFunds(req: Request, res: Response) {
  let { userOsmoAddress } = req.query as unknown as {
    userOsmoAddress: string | undefined;
  };
  if (!userOsmoAddress) return;
  let data = await _getUserFunds(userOsmoAddress);
  res.send(data);
}

async function updatePoolsAndUsers(_req: Request, res: Response) {
  let data = await _updatePoolsAndUsers();
  res.send(data);
}

async function getPoolsAndUsers(_req: Request, res: Response) {
  let data = await _getPoolsAndUsers();
  res.send(data);
}

async function filterChainRegistry(_req: Request, res: Response) {
  let data = await _filterChainRegistry();
  res.send(data);
}

async function updateAll(_req: Request, res: Response) {
  let data = await _updateAll();
  res.send(data);
}

async function getAll(req: Request, res: Response) {
  let { userOsmoAddress } = req.query as unknown as {
    userOsmoAddress: string | undefined;
  };
  if (!userOsmoAddress) return;
  let data = await _getAll(userOsmoAddress);
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
  updateUserFunds,
  getUserFunds,
  updatePoolsAndUsers,
  getPoolsAndUsers,
  filterChainRegistry,
  updateAll,
  getAll,
};
