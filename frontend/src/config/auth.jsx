import axios from "axios";
import API_BASE from "./api"

API_BASE.interceptors.request.use((config) => {
  const token = localStorage.getItem("token");
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Register user
export const registerRequest = (data) =>
  API_BASE.post("/auth/register", data);

// Login user
export const loginRequest = (data) =>
  API_BASE.post("/auth/login", data);

// Get current user
export const getMe = () => API_BASE.get("/auth/me");

export default API_BASE;