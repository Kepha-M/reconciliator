import React, { useContext } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Bell, LogOut, User, Mail, Phone, MapPin } from "lucide-react";
import { AuthContext } from "../context/AuthContext";

export default function DashboardLayout({ children }) {
  const { user, logoutUser } = useContext(AuthContext);
  const navigate = useNavigate();

  const handleLogout = () => {
    logoutUser();
    navigate("/login");
  };

  return (
    <div className="flex min-h-screen bg-gray-100">
      {/* Sidebar */}
      <aside className="w-60 bg-purple-700 text-white flex flex-col p-4 justify-between">
        
        <div>
          <nav className="flex flex-col gap-3 mt-10">
            <Link
              to="/dashboard"
              className="hover:bg-white/10 px-3 py-2 rounded-md transition"
            >
              Dashboard
            </Link>

            <Link
              to="/transactions"
              className="hover:bg-white/10 px-3 py-2 rounded-md transition"
            >
              Transactions
            </Link>

            <Link
              to="/audit-logs"
              className="hover:bg-white/10 px-3 py-2 rounded-md transition"
            >
              Audit Logs
            </Link>
          </nav>
        </div>

        {/* Footer Contact Details */}
        <div className="border-t border-white/20 pt-4 mt-8 text-sm space-y-3">
          <div className="flex items-center gap-2">
            <Mail size={16} className="text-white/80" />
            <span>thecloud79@gmail.com</span>
          </div>

          <div className="flex items-center gap-2">
            <Phone size={16} className="text-white/80" />
            <span>+254 707 362 926</span>
          </div>

          <div className="flex items-center gap-2">
            <MapPin size={16} className="text-white/80" />
            <span>Nairobi, Kenya</span>
          </div>
        </div>
      </aside>

      {/* Main Section */}
      <div className="flex-1 flex flex-col">
        
        {/* Topbar */}
        <header className="w-full bg-white shadow flex items-center justify-between px-6 py-4">
          
          {/* Branding */}
          <h1 className="text-xl font-bold text-purple-700">
            Recon App
          </h1>

          {/* Right Controls */}
          <div className="flex items-center gap-6">
            
            {/* Notifications */}
            <button className="relative hover:text-purple-700 transition">
              <Bell size={20} />
            </button>

            {/* Username */}
            <div className="flex items-center gap-2 text-gray-700">
              <User size={18} className="text-purple-700" />
              <span className="font-medium">
                {user?.username || "User"}
              </span>
            </div>

            {/* Logout */}
            <button
              onClick={handleLogout}
              className="flex items-center gap-2 bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg transition"
            >
              <LogOut size={16} />
              Logout
            </button>
          </div>
        </header>

        {/* Page Content */}
        <main className="flex-1 p-6">
          {children}
        </main>
      </div>
    </div>
  );
}
