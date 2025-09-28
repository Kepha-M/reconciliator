import { useState, useEffect } from "react";
import DashboardLayout from "../layouts/DashboardLayout";
import { runReconciliation, getReconciliationHistory } from "../api"; // new API method
import toast from "react-hot-toast";

export default function Reconciliation() {
  const [results, setResults] = useState({
    matches: [],
    unmatched_bank: [],
    unmatched_erp: [],
  });
  const [loading, setLoading] = useState(false);

  // Fetch past results from DB on mount
  useEffect(() => {
    const fetchResults = async () => {
      try {
        const res = await getReconciliationHistory();
        console.log(res);
        setResults({
          matches: res.matches || [],
          unmatched_bank: res.unmatched_bank || [],
          unmatched_erp: res.unmatched_erp || [],
        });
      } catch (err) {
        console.error(err);
        toast.error("Failed to load reconciliation results");
      }
    };
    fetchResults();
  }, []);

  const handleReconcile = async () => {
    try {
      setLoading(true);
      const res = await runReconciliation();
      setResults({
        matches: res.matches || [],
        unmatched_bank: res.unmatched_bank || [],
        unmatched_erp: res.unmatched_erp || [],
      });
      toast.success(
        `Reconciliation complete: ${res.matches?.length || 0} matches`
      );
    } catch (err) {
      console.error(err);
      toast.error("Reconciliation failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <DashboardLayout>
      <div className="p-6 space-y-6">
        <div className="flex justify-between items-center">
          <h1 className="text-2xl font-bold text-brand">Reconciliation</h1>
          <button
            onClick={handleReconcile}
            disabled={loading}
            className={`px-4 py-2 rounded-lg text-white transition ${
              loading
                ? "bg-gray-400 cursor-not-allowed"
                : "bg-green-600 hover:bg-green-700"
            }`}
          >
            {loading ? "Reconciling..." : "Run Reconciliation"}
          </button>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <SummaryCard
            title="Matches"
            count={results.matches.length}
            color="text-green-600"
          />
          <SummaryCard
            title="Unmatched Bank"
            count={results.unmatched_bank.length}
            color="text-red-600"
          />
          <SummaryCard
            title="Unmatched ERP"
            count={results.unmatched_erp.length}
            color="text-red-600"
          />
        </div>

        {/* Matches Table */}
        <DataSection
          title={`Matches (${results.matches.length})`}
          emptyMessage="No matches found"
        >
          {results.matches.length > 0 && (
            <table className="w-full border-collapse">
              <thead className="bg-brand-light text-white">
                <tr>
                  <th className="px-3 py-2 text-left">Bank Date</th>
                  <th className="px-3 py-2 text-left">Bank Amount</th>
                  <th className="px-3 py-2 text-left">ERP Date</th>
                  <th className="px-3 py-2 text-left">ERP Amount</th>
                </tr>
              </thead>
              <tbody>
                {results.matches.map((m, idx) => (
                  <tr key={idx} className="border-b hover:bg-gray-50">
                    <td className="px-3 py-2">{m.bank?.date}</td>
                    <td className="px-3 py-2">{m.bank?.amount}</td>
                    <td className="px-3 py-2">{m.erp?.date}</td>
                    <td className="px-3 py-2">{m.erp?.amount}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </DataSection>

        {/* Unmatched Bank */}
        <DataSection
          title={`Unmatched Bank (${results.unmatched_bank.length})`}
          emptyMessage="All bank records matched"
        >
          <ul className="list-disc pl-5 space-y-1">
            {results.unmatched_bank.map((t, idx) => (
              <li key={idx}>
                {t.date} — <span className="font-semibold">{t.amount}</span>
              </li>
            ))}
          </ul>
        </DataSection>

        {/* Unmatched ERP */}
        <DataSection
          title={`Unmatched ERP (${results.unmatched_erp.length})`}
          emptyMessage="All ERP records matched"
        >
          <ul className="list-disc pl-5 space-y-1">
            {results.unmatched_erp.map((t, idx) => (
              <li key={idx}>
                {t.date} — <span className="font-semibold">{t.amount}</span>
              </li>
            ))}
          </ul>
        </DataSection>
      </div>
    </DashboardLayout>
  );
}

/* --- Reusable Components --- */
function SummaryCard({ title, count, color }) {
  return (
    <div className="bg-white shadow rounded-xl p-4 text-center">
      <h3 className="text-lg font-semibold">{title}</h3>
      <p className={`text-2xl font-bold ${color}`}>{count}</p>
    </div>
  );
}

function DataSection({ title, emptyMessage, children }) {
  return (
    <div className="bg-white shadow rounded-xl p-4">
      <h2 className="font-semibold text-lg mb-2">{title}</h2>
      {children && children.length > 0 ? (
        children
      ) : (
        <p className="text-gray-500">{emptyMessage}</p>
      )}
    </div>
  );
}
