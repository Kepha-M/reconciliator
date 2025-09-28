// src/pages/Reports.jsx
import { useEffect, useState } from "react";
import DashboardLayout from "../layouts/DashboardLayout";
import { FileSpreadsheet, RefreshCw, Download, FileDown } from "lucide-react";
import toast from "react-hot-toast";
import { jsPDF } from "jspdf"; // ✅ named import
import autoTable from "jspdf-autotable"; // ✅ proper import
import { getReconciliationHistory } from "../api";

export default function Reports() {
  const [results, setResults] = useState({
    matches: [],
    unmatched_bank: [],
    unmatched_erp: [],
  });
  const [loading, setLoading] = useState(false);

  // Normalize API response
  const normalizeResponse = (data) => {
    if (!data) return { matches: [], unmatched_bank: [], unmatched_erp: [] };

    if (
      typeof data === "object" &&
      !Array.isArray(data) &&
      (data.matches || data.unmatched_bank || data.unmatched_erp)
    ) {
      return {
        matches: Array.isArray(data.matches) ? data.matches : [],
        unmatched_bank: Array.isArray(data.unmatched_bank)
          ? data.unmatched_bank
          : [],
        unmatched_erp: Array.isArray(data.unmatched_erp) ? data.unmatched_erp : [],
      };
    }

    if (Array.isArray(data)) {
      return {
        matches: data.filter((r) => r.result_type === "matched"),
        unmatched_bank: data.filter((r) => r.result_type === "unmatched_bank"),
        unmatched_erp: data.filter((r) => r.result_type === "unmatched_erp"),
      };
    }

    return { matches: [], unmatched_bank: [], unmatched_erp: [] };
  };

  const fetchResults = async () => {
    try {
      setLoading(true);
      const res = await getReconciliationHistory();
      const normalized = normalizeResponse(res);
      setResults(normalized);
    } catch (err) {
      console.error("Failed to fetch reports:", err);
      toast.error("Failed to load reports");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchResults();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const formatDate = (d) => {
    if (!d) return "-";
    if (typeof d === "string") return d.split("T")[0];
    if (d instanceof Date) return d.toISOString().slice(0, 10);
    return String(d);
  };

  const exportCSV = () => {
    const rows = [
      ["Type", "Bank Ref", "ERP Ref", "Amount", "Date"],
      ...results.matches.map((r) => [
        "Match",
        r.bank_reference || "-",
        r.erp_reference || "-",
        r.amount ?? "-",
        formatDate(r.date),
      ]),
      ...results.unmatched_bank.map((r) => [
        "Unmatched Bank",
        r.bank_reference || "-",
        r.erp_reference || "-",
        r.amount ?? "-",
        formatDate(r.date),
      ]),
      ...results.unmatched_erp.map((r) => [
        "Unmatched ERP",
        r.bank_reference || "-",
        r.erp_reference || "-",
        r.amount ?? "-",
        formatDate(r.date),
      ]),
    ];

    const csvContent =
      "data:text/csv;charset=utf-8," +
      rows
        .map((e) =>
          e.map((c) => `"${String(c).replace(/"/g, '""')}"`).join(",")
        )
        .join("\n");

    const link = document.createElement("a");
    link.href = encodeURI(csvContent);
    link.download = `reconciliation_report_${new Date()
      .toISOString()
      .slice(0, 10)}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    toast.success("Report exported as CSV");
  };

  const exportPDF = () => {
    const doc = new jsPDF({ unit: "pt", format: "a4" });
    doc.setFontSize(14);
    doc.text("Reconciliation Report", 40, 50);

    const rows = [
      ...results.matches.map((r) => [
        "Match",
        r.bank_reference || "-",
        r.erp_reference || "-",
        r.amount ?? "-",
        formatDate(r.date),
      ]),
      ...results.unmatched_bank.map((r) => [
        "Unmatched Bank",
        r.bank_reference || "-",
        r.erp_reference || "-",
        r.amount ?? "-",
        formatDate(r.date),
      ]),
      ...results.unmatched_erp.map((r) => [
        "Unmatched ERP",
        r.bank_reference || "-",
        r.erp_reference || "-",
        r.amount ?? "-",
        formatDate(r.date),
      ]),
    ];

    // ✅ use autoTable plugin explicitly
    autoTable(doc, {
      startY: 80,
      head: [["Type", "Bank Ref", "ERP Ref", "Amount", "Date"]],
      body: rows,
      styles: { fontSize: 10 },
      headStyles: { fillColor: [34, 197, 94] },
      alternateRowStyles: { fillColor: [245, 245, 245] },
    });

    doc.save(
      `reconciliation_report_${new Date().toISOString().slice(0, 10)}.pdf`
    );
    toast.success("Report exported as PDF");
  };

  return (
    <DashboardLayout>
      <div className="p-6 space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold text-brand flex items-center gap-3">
            <FileSpreadsheet className="w-7 h-7 text-green-600" />
            Reconciliation Reports
          </h1>

          <div className="flex gap-3">
            <button
              onClick={fetchResults}
              disabled={loading}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-white ${
                loading ? "bg-gray-400" : "bg-blue-600 hover:bg-blue-700"
              }`}
            >
              <RefreshCw className="w-4 h-4" />
              {loading ? "Refreshing..." : "Refresh"}
            </button>

            <button
              onClick={exportCSV}
              className="flex items-center gap-2 px-4 py-2 rounded-lg bg-green-600 hover:bg-green-700 text-white"
            >
              <Download className="w-4 h-4" />
              Export CSV
            </button>

            <button
              onClick={exportPDF}
              className="flex items-center gap-2 px-4 py-2 rounded-lg bg-red-600 hover:bg-red-700 text-white"
            >
              <FileDown className="w-4 h-4" />
              Export PDF
            </button>
          </div>
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

        {/* Table View */}
        <div className="bg-white shadow rounded-xl p-4 overflow-x-auto">
          <h2 className="font-semibold text-lg mb-3">Detailed Results</h2>
          <table className="w-full border-collapse">
            <thead className="bg-brand-light text-white">
              <tr>
                <th className="px-3 py-2 text-left">Type</th>
                <th className="px-3 py-2 text-left">Bank Ref</th>
                <th className="px-3 py-2 text-left">ERP Ref</th>
                <th className="px-3 py-2 text-left">Amount</th>
                <th className="px-3 py-2 text-left">Date</th>
              </tr>
            </thead>
            <tbody>
              {["matches", "unmatched_bank", "unmatched_erp"].map((type) =>
                results[type].map((r) => (
                  <tr
                    key={`${type}-${r.id}`}
                    className="border-b hover:bg-gray-50"
                  >
                    <td className="px-3 py-2 capitalize">
                      {type.replace("_", " ")}
                    </td>
                    <td className="px-3 py-2">{r.bank_reference || "-"}</td>
                    <td className="px-3 py-2">{r.erp_reference || "-"}</td>
                    <td className="px-3 py-2">{r.amount ?? "-"}</td>
                    <td className="px-3 py-2">{formatDate(r.date)}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </DashboardLayout>
  );
}

function SummaryCard({ title, count, color = "text-gray-800" }) {
  return (
    <div className="bg-white shadow rounded-xl p-4 text-center">
      <h3 className="text-lg font-semibold">{title}</h3>
      <p className={`text-2xl font-bold ${color}`}>{count}</p>
    </div>
  );
}
