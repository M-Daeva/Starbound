import { Request, Response } from "express";
import {
  _chainRegistryGetHandler,
  _updateChainRegistryGetHandler,
  _getActiveNetworksInfoGetHandler,
  _updateActiveNetworksInfoGetHandler,
  _getValidatorsGetHandler,
  _updateValidatorsGetHandler,
  _requestUserFundsGetHandler,
} from "../middleware/api";

async function updateChainRegistryGetHandler(_req: Request, res: Response) {
  let data = await _updateChainRegistryGetHandler();
  res.send(data);
}

async function chainRegistryGetHandler(_req: Request, res: Response) {
  let data = await _chainRegistryGetHandler();
  res.send(data);
}

async function updateActiveNetworksInfoGetHandler(
  _req: Request,
  res: Response
) {
  let data = await _updateActiveNetworksInfoGetHandler();
  res.send(data);
}

async function getActiveNetworksInfoGetHandler(_req: Request, res: Response) {
  let data = await _getActiveNetworksInfoGetHandler();
  res.send(data);
}

async function updateValidatorsGetHandler(_req: Request, res: Response) {
  let data = await _updateValidatorsGetHandler();
  res.send(data);
}

async function getValidatorsGetHandler(_req: Request, res: Response) {
  let data = await _getValidatorsGetHandler();
  res.send(data);
}

async function requestUserFundsGetHandler(req: Request, res: Response) {
  let { adresses } = req.query as unknown as {
    adresses: string[] | undefined;
  };
  if (!adresses) return;
  let data = await _requestUserFundsGetHandler(adresses);
  res.send(data);
}

export {
  updateChainRegistryGetHandler,
  chainRegistryGetHandler,
  updateActiveNetworksInfoGetHandler,
  getActiveNetworksInfoGetHandler,
  updateValidatorsGetHandler,
  getValidatorsGetHandler,
  requestUserFundsGetHandler,
};
