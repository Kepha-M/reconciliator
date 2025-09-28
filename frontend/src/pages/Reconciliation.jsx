import { useState, useEffect } from "react";
import DashboardLayout from "../layouts/DashboardLayout";
import { getReconciliationHistory } from "../api";
import toast from "react-hot-toast";

export default function Reconciliation() {
  const [results, setResults] = useState({
    matches: [],
    unmatched_bank: [],
    unmatched_erp: [],
  });
  const [activeTab, setActiveTab] = useState("matches");

  // Fetch past results from DB on mount
  useEffect(() => {
    const fetchResults = async () => {
      try {
        const res = await getReconciliationHistory();
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

  return (
    <DashboardLayout>
      <div className="p-6 space-y-6">
        <h1 className="text-2xl font-bold text-brand">Reconciliation</h1>

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

        {/* Tabs */}
        <div className="flex space-x-4 border-b">
          <TabButton
            label={`Matches (${results.matches.length})`}
            active={activeTab === "matches"}
            onClick={() => setActiveTab("matches")}
          />
          <TabButton
            label={`Unmatched Bank (${results.unmatched_bank.length})`}
            active={activeTab === "unmatched_bank"}
            onClick={() => setActiveTab("unmatched_bank")}
          />
          <TabButton
            label={`Unmatched ERP (${results.unmatched_erp.length})`}
            active={activeTab === "unmatched_erp"}
            onClick={() => setActiveTab("unmatched_erp")}
          />
        </div>

        {/* Tab Content */}
        <div className="mt-4">
          {activeTab === "matches" && (
            <DataTable
              columns={["Bank Reference", "ERP Reference", "Amount", "Date"]}
              rows={results.matches.map((m) => [
                m.bank_reference ?? "-",
                m.erp_reference ?? "-",
                m.amount ?? "-",
                m.date ?? "-",
              ])}
            />
          )}

          {activeTab === "unmatched_bank" && (
            <DataSection
              title="Unmatched Bank"
              emptyMessage="All bank records matched"
              hasData={results.unmatched_bank.length > 0}
            >
              <DataTable
                columns={["Date", "Amount", "Reference"]}
                rows={results.unmatched_bank.map((t) => [
                  t.date,
                  t.amount,
                  t.bank_reference ?? "-",
                ])}
              />
            </DataSection>
          )}

          {activeTab === "unmatched_erp" && (
            <DataSection
              title="Unmatched ERP"
              emptyMessage="All ERP records matched"
              hasData={results.unmatched_erp.length > 0}
            >
              <DataTable
                columns={["Date", "Amount", "Reference"]}
                rows={results.unmatched_erp.map((t) => [
                  t.date,
                  t.amount,
                  t.erp_reference ?? "-",
                ])}
              />
            </DataSection>
          )}
        </div>
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

function TabButton({ label, active, onClick }) {
  return (
    <button
      onClick={onClick}
      className={`px-4 py-2 -mb-px border-b-2 transition ${
        active
          ? "border-brand text-brand font-semibold"
          : "border-transparent text-gray-500 hover:text-brand hover:border-gray-300"
      }`}
    >
      {label}
    </button>
  );
}

function DataSection({ title, emptyMessage, hasData, children }) {
  return (
    <div className="bg-white shadow rounded-xl p-4">
      <h2 className="font-semibold text-lg mb-2">{title}</h2>
      {hasData ? children : <p className="text-gray-500">{emptyMessage}</p>}
    </div>
  );
}

function DataTable({ columns, rows }) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full border-collapse text-sm">
        <thead className="bg-brand-light text-white">
          <tr>
            {columns.map((col, idx) => (
              <th key={idx} className="px-3 py-2 text-left font-medium">
                {col}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row, rIdx) => (
            <tr key={rIdx} className="border-b hover:bg-gray-50">
              {row.map((cell, cIdx) => (
                <td key={cIdx} className="px-3 py-2">
                  {cell}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
