// const names must be unchanged as its values are updating by "npm run set-urls"
const devUrl = "http://localhost:4000";
const prodUrl = "https://starbound.fun";
const isProduction = import.meta.env.MODE !== "development";

const baseURL = isProduction ? prodUrl : devUrl;

export { baseURL };
