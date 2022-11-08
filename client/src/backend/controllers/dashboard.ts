import express from "express";
import { getData } from "../middleware/dashboard";

const getHandler = (_req: express.Request, res: express.Response): void => {
  res.send(getData());
};

export { getHandler };
