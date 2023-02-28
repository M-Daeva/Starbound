const devUrl = "https://localhost:4000";
const prodUrl = devUrl;
const isProduction = import.meta.env.MODE !== "development";

const baseURL = isProduction ? prodUrl : devUrl;

export { baseURL };
