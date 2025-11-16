import { createContext, useState, useEffect } from "react";
import axios from "axios";

export const AuthContext = createContext();

 function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  // Load user on mount if token exists
  useEffect(() => {
    const fetchUser = async () => {
      const token = localStorage.getItem("token");
      if (!token) {
        setLoading(false);
        return;
      }

      try {
        const { data } = await axios.get("http://localhost:8000/auth/me", {
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
  const registerUser = async (data) => {
    try {
      const res = await axios.post("http://localhost:8000/auth/register", data);
      return res.data;
    } catch (error) {
      console.error("Registration failed", error);
      throw error;
    }
  };

  // Login user
  const loginUser = async (data) => {
    try {
      const res = await axios.post(
        "http://localhost:8000/auth/login",
        new URLSearchParams({
          username: data.email,
          password: data.password,
        }),
        { headers: { "Content-Type": "application/x-www-form-urlencoded" } }
      );

      const token = res.data.access_token;
      localStorage.setItem("token", token);

      // Fetch user after login
      const { data: userData } = await axios.get("http://localhost:8000/auth/me", {
        headers: { Authorization: `Bearer ${token}` },
      });
      setUser(userData);
    } catch (error) {
      console.error("Login failed", error.response?.data || error.message);
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

export default AuthProvider