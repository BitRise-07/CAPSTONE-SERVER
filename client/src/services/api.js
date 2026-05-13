import axios from "axios";

export const API_URL = import.meta.env.VITE_API_URL || "http://localhost:4000/api/v1";

const api = axios.create({ baseURL: API_URL, withCredentials: true });

api.interceptors.request.use((config) => {
  const token = localStorage.getItem("fraud_token");
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

export default api;
