import { useState } from "react";
import DashboardLayout from "../layouts/DashboardLayout";
import { runReconciliation } from "../api";
import toast from "react-hot-toast";

export default function Reconciliation() {
  const [results, setResults] = useState({
    matches: [],
    unmatched_bank: [],
    unmatched_erp: [],
  });
  const [loading, setLoading] = useState(false);

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
      <div className="p-6">
        <h1 className="text-2xl font-bold text-brand">Reconciliation</h1>

        {/* Run Button */}
        <button
          onClick={handleReconcile}
          disabled={loading}
          className={`mt-4 px-4 py-2 rounded-lg text-white ${
            loading ? "bg-gray-400" : "bg-green-600 hover:bg-green-700"
          }`}
        >
          {loading ? "Reconciling..." : "Run Reconciliation"}
        </button>

        {/* Summary */}
        <div className="mt-6 grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-white shadow rounded-xl p-4 text-center">
            <h3 className="text-lg font-semibold">Matches</h3>
            <p className="text-2xl font-bold text-green-600">
              {results.matches.length}
            </p>
          </div>
          <div className="bg-white shadow rounded-xl p-4 text-center">
            <h3 className="text-lg font-semibold">Unmatched Bank</h3>
            <p className="text-2xl font-bold text-red-600">
              {results.unmatched_bank.length}
            </p>
          </div>
          <div className="bg-white shadow rounded-xl p-4 text-center">
            <h3 className="text-lg font-semibold">Unmatched ERP</h3>
            <p className="text-2xl font-bold text-red-600">
              {results.unmatched_erp.length}
            </p>
          </div>
        </div>

        {/* Matches Table */}
        <div className="mt-6 bg-white shadow rounded-xl p-4 overflow-x-auto">
          <h2 className="font-semibold text-lg mb-2">
            Matches ({results.matches.length})
          </h2>
          {results.matches.length === 0 ? (
            <p className="text-gray-500">No matches found</p>
          ) : (
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
                  <tr key={idx} className="border-b">
                    <td className="px-3 py-2">{m.bank?.date}</td>
                    <td className="px-3 py-2">{m.bank?.amount}</td>
                    <td className="px-3 py-2">{m.erp?.date}</td>
                    <td className="px-3 py-2">{m.erp?.amount}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        {/* Unmatched Bank */}
        <div className="mt-6 bg-white shadow rounded-xl p-4">
          <h2 className="font-semibold text-lg mb-2">
            Unmatched Bank ({results.unmatched_bank.length})
          </h2>
          {results.unmatched_bank.length === 0 ? (
            <p className="text-gray-500">All bank records matched</p>
          ) : (
            <ul className="list-disc pl-5">
              {results.unmatched_bank.map((t, idx) => (
                <li key={idx}>
                  {t.date} — {t.amount}
                </li>
              ))}
            </ul>
          )}
        </div>

        {/* Unmatched ERP */}
        <div className="mt-6 bg-white shadow rounded-xl p-4">
          <h2 className="font-semibold text-lg mb-2">
            Unmatched ERP ({results.unmatched_erp.length})
          </h2>
          {results.unmatched_erp.length === 0 ? (
            <p className="text-gray-500">All ERP records matched</p>
          ) : (
            <ul className="list-disc pl-5">
              {results.unmatched_erp.map((t, idx) => (
                <li key={idx}>
                  {t.date} — {t.amount}
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </DashboardLayout>
  );
}
