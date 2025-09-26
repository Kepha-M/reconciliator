import React from "react";
import { Link } from "react-router-dom";

export default function DashboardLayout({ children }) {
  return (
    <div className="flex min-h-screen">
      <aside className="w-64 bg-brand text-white p-4 space-y-4">
        <h2 className="text-xl font-bold">Recon App</h2>
        <nav className="flex flex-col gap-2">
          <Link to="/">Dashboard</Link>
          <Link to="/transactions">Transactions</Link>
          <Link to="/reconciliation">Reconciliation</Link>
          <Link to="/reports">Reports</Link>
          <Link to="/audit-logs">Audit Logs</Link>
        </nav>
      </aside>
      <main className="flex-1 bg-gray-50 p-6">{children}</main>
    </div>
  );
}
