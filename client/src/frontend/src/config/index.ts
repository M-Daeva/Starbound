const isDevelopment = import.meta.env.MODE === "development";

const baseURL = isDevelopment
  ? "http://localhost:4000"
  : "http://localhost:4000";

export { baseURL };
