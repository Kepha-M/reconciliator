import axios from "axios";

const API = axios.create({
  baseURL: "http://localhost:8000", // adjust if needed
});

// Attach token automatically
API.interceptors.request.use((config) => {
  const token = localStorage.getItem("token");
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Register user
export const registerRequest = (data) =>
  API.post("/auth/register", data);

// Login user
export const loginRequest = (data) =>
  API.post("/auth/login", data);

// Get current user
export const getMe = () => API.get("/auth/me");

export default API;