const devUrl = "https://localhost:4000";
const prodUrl = "https://praetor.ingress.provider.moonbys.cloud:31125";
const isProduction = import.meta.env.MODE !== "development";

const baseURL = isProduction ? prodUrl : devUrl;

export { baseURL };
