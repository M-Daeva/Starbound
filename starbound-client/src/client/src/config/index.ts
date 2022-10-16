const isDevelopment = import.meta.env.MODE === "development";

const baseURL = isDevelopment
  ? "http://localhost:3000"
  : "https://nft-pawnshop.herokuapp.com";

export { baseURL };
