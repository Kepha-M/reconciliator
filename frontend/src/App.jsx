import {Link, Routes, Route } from "react-router-dom";
import Dashboard from "./pages/Dashboard";
import Transactions from "./pages/Transactions";
import Reconciliation from "./pages/Reconciliation";
import Reports from "./pages/Reports";
import AuditLogs from "./pages/AuditLogs";

function App() {
  return (
    <div className="flex">
      {/* Page Content */}
      <main className="flex-1 p-6">
        <Routes>
          <Route path="/" element={<Dashboard />} />
          <Route path="/transactions" element={<Transactions />} />
          <Route path="/reconciliation" element={<Reconciliation />} />
          <Route path="/reports" element={<Reports />} />
          <Route path="/audit-logs" element={<AuditLogs />} />
        </Routes>
      </main>
    </div>
  );
}

export default App;
