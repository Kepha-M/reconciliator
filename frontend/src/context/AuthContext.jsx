import { createContext, useState, useEffect } from "react";
import axios from "axios";

// Environment variable for backend URL
const API_BASE = import.meta.env.VITE_API_BASE;

// Create context with default values to avoid null errors
export const AuthContext = createContext({
  user: null,
  loading: true,
  registerUser: async () => {},
  loginUser: async () => {},
  logoutUser: () => {},
});

export default function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  // Load user if token exists
  useEffect(() => {
    const fetchUser = async () => {
      const token = localStorage.getItem("token");
      if (!token) {
        setLoading(false);
        return;
      }

      try {
        const { data } = await axios.get(`${API_BASE}/auth/me`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        setUser(data);
      } catch (err) {
        localStorage.removeItem("token");
        setUser(null);
      } finally {
        setLoading(false);
      }
    };

    fetchUser();
  }, []);

  // Register user
  const registerUser = async (formData) => {
    try {
      const res = await axios.post(`${API_BASE}/auth/register`, formData);
      return res.data;
    } catch (error) {
      console.error("Registration failed:", error.response?.data || error.message);
      throw error;
    }
  };

  // Login user
  const loginUser = async (formData) => {
    try {
      // Adjust this according to your backend login expectation (form vs JSON)
      const res = await axios.post(
        `${API_BASE}/auth/login`,
        new URLSearchParams({
          username: formData.email, // or formData.username if backend expects username
          password: formData.password,
        }),
        { headers: { "Content-Type": "application/x-www-form-urlencoded" } }
      );

      const token = res.data.access_token;
      localStorage.setItem("token", token);

      // Fetch user after login
      const { data: userData } = await axios.get(`${API_BASE}/auth/me`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setUser(userData);

      return userData;
    } catch (error) {
      console.error("Login failed:", error.response?.data || error.message);
      throw error;
    }
  };

  // Logout user
  const logoutUser = () => {
    localStorage.removeItem("token");
    setUser(null);
  };

  return (
    <AuthContext.Provider
      value={{ user, loading, registerUser, loginUser, logoutUser }}
    >
      {children}
    </AuthContext.Provider>
  );
}
