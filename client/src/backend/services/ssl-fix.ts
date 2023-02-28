import https from "https";
import E from "../config";

// "Error: self-signed certificate" fix
// https://github.com/axios/axios/issues/535#issuecomment-599971219
export default (() => {
  if (!E.IS_PRODUCTION) {
    https.globalAgent.options.rejectUnauthorized = false;
  }
})();
