import { useState } from "react";
import { API_BASE } from "../api/config";
import { useNavigate } from "react-router-dom";


export default function Register() {
  const [form, setForm] = useState({
    username: "",
    email: "",
    password: "",
  });
  
const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();

    await fetch(`${API_BASE}/auth/register`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });

   navigate("/login");
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100 p-4">
      <div className="w-full max-w-md bg-white shadow-xl rounded-2xl p-8">
        <h1 className="text-2xl font-bold text-center mb-6">Create Account</h1>

        <form onSubmit={handleSubmit} className="space-y-4">
          <input
            type="text"
            placeholder="Username"
            className="w-full border rounded-xl px-4 py-2 focus:ring-2 focus:ring-green-600"
            value={form.username}
            onChange={(e) => setForm({ ...form, username: e.target.value })}
          />

          <input
            type="email"
            placeholder="Email"
            className="w-full border rounded-xl px-4 py-2 focus:ring-2 focus:ring-green-600"
            value={form.email}
            onChange={(e) => setForm({ ...form, email: e.target.value })}
          />

          <input
            type="password"
            placeholder="Password"
            className="w-full border rounded-xl px-4 py-2 focus:ring-2 focus:ring-green-600"
            value={form.password}
            onChange={(e) => setForm({ ...form, password: e.target.value })}
          />

          <button
            type="submit"
            className="w-full bg-green-600 text-white py-2 rounded-xl font-semibold hover:bg-green-700 transition"
          >
            Register
          </button>
        </form>
      </div>
    </div>
  );
}
