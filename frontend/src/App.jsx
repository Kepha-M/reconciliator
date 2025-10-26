import {Link, Routes, Route } from "react-router-dom";
import Dashboard from "./pages/Dashboard";
import Transactions from "./pages/Transactions";
import AuditLogs from "./pages/AuditLogs";

function App() {
  return (
    <div className="flex">
      {/* Page Content */}
      <main className="flex-1 p-6">
        <Routes>
          <Route path="/" element={<Dashboard />} />
          <Route path="/transactions" element={<Transactions />} />
          <Route path="/audit-logs" element={<AuditLogs />} />
        </Routes>
      </main>
    </div>
  );
}

export default App;
