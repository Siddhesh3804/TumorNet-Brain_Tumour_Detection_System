import axios from "axios";

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || "/",
  headers: { "Content-Type": "application/json" },
});

api.interceptors.response.use(
  (response) => response,
  (error) =>
    Promise.reject(
      error.response?.data || { message: "Unable to connect to the server" },
    ),
);

export const login = (credentials) =>
  api.post("/login", credentials).then((response) => response.data);

export const register = (details) =>
  api.post("/register", details).then((response) => response.data);
