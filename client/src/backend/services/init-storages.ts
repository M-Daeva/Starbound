import { l, createRequest } from "../../common/utils";
import { BASE_URL } from "../envs";
import { ROUTES as API_ROUTES } from "../routes/api";

const req = createRequest({ baseURL: BASE_URL + "/api" });

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
