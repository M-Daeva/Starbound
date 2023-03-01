import { l, createRequest } from "../common/utils";
import E from "./config";
import { ROUTES as API_ROUTES } from "./routes/api";
import "./services/ssl-fix";

const req = createRequest({ baseURL: E.BASE_URL + "/api" });

async function initStorages() {
  try {
    const t = Date.now();
    const res = await req.get(API_ROUTES.updateAll);
    const delta = (Date.now() - t) / 1e3;
    const minutes = Math.floor(delta / 60);
    const seconds = Math.floor(delta % 60);
    l("\n", res, "\n");
    l("\n", `${minutes} minutes ${seconds} seconds`, "\n");
  } catch (error) {
    l(error);
  }
}

initStorages();