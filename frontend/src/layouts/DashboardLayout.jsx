import React from "react";
import { Link } from "react-router-dom";
import { Mail, Phone, MapPin } from "lucide-react";

export default function DashboardLayout({ children }) {
  return (
    <div className="flex min-h-screen">
      {/* Sidebar */}
      <aside className="w-64 bg-brand text-white flex flex-col justify-between p-4">
        <div>
          <h2 className="text-xl font-bold mb-6">Recon App</h2>
          <nav className="flex flex-col gap-3">
            <Link
              to="/"
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
          </nav>
        </div>

        {/* Contact Section */}
        <div className="border-t border-white/20 mt-6 pt-4 text-sm space-y-2">
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

      {/* Main content */}
      <main className="flex-1 bg-gray-50 p-6">{children}</main>
    </div>
  );
}
