import { useEffect, useState } from "react";
import { getReconciliationHistory } from "../api";

export default function ReconciliationHistory() {
  const [history, setHistory] = useState([]);

  useEffect(() => {
    const fetchHistory = async () => {
      const data = await getReconciliationHistory();
      setHistory(data);
    };
    fetchHistory();
  }, []);

  return (
    <div className="p-6 space-y-4">
      <h1 className="text-2xl font-bold text-brand">Reconciliation History</h1>
      {history.length === 0 ? (
        <p className="text-gray-500">No past reconciliations found.</p>
      ) : (
        <div className="grid gap-4">
          {history.map((rec) => (
            <div
              key={rec.id}
              className="bg-white shadow rounded-xl p-4 hover:shadow-md transition"
            >
              <p className="text-sm text-gray-500">
                {new Date(rec.created_at).toLocaleString()}
              </p>
              <p className="font-medium">
                ✅ Matches: {rec.results.matches.length}, ❌ Bank:{" "}
                {rec.results.unmatched_bank.length}, ⚠️ ERP:{" "}
                {rec.results.unmatched_erp.length}
              </p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
