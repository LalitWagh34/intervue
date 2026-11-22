import axios from "axios";
import { getSessionToken } from "./auth";

export const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || "http://localhost:3000/api",
  withCredentials: true,
});

api.interceptors.request.use((config) => {
  try {
    const token = getSessionToken();
    if (token) {
      config.headers = config.headers || {};
      config.headers.Authorization = `Bearer ${token}`;
    }
  } catch {}
  return config;
});
