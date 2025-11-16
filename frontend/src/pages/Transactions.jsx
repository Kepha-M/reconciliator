import React, { useState } from "react";
import toast from "react-hot-toast";
import { API_BASE } from "../api/config";
import DashboardLayout from "../layouts/DashboardLayout";
import { uploadBankFile, reconcileBankRecords } from "../api";
import { Play, FileSpreadsheet, Table as TableIcon, FileText } from "lucide-react";

// ===========================
// Reusable Metric Card
// ===========================
const MetricCard = ({ title, value, color = "text-gray-900" }) => (
  <div className="flex-1 min-w-[200px] p-4 bg-white shadow rounded-lg border border-gray-200">
    <h3 className="text-gray-600 text-sm font-medium">{title}</h3>
    <p className={`text-2xl font-bold ${color}`}>{value}</p>
  </div>
);

const Transactions = () => {
  // ===========================
  // State
  // ===========================
  const [bankFile, setBankFile] = useState(null);
  const [transactions, setTransactions] = useState([]);
  const [uploadId, setUploadId] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isReconciling, setIsReconciling] = useState(false);
  const [reconType, setReconType] = useState("bank");

  // ===========================
  // Computed Metrics
  // ===========================
  const matchedCount = transactions.filter(t => t.Status === "Matched").length;
  const unmatchedCount = transactions.filter(t => t.Status === "Unmatched").length;

  // ===========================
  // Handlers
  // ===========================
  const handleUploadFile = async () => {
    if (!bankFile) return toast.error("Please select a file first.");
    setIsLoading(true);

    try {
      const res = await uploadBankFile(bankFile, reconType);
      setTransactions(res.records || []);
      setUploadId(res.upload_id);
      toast.success(`File uploaded — ${res.record_count} records loaded.`);
    } catch (err) {
      console.error("Upload failed:", err);
      toast.error("File upload failed. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleReconcile = async () => {
    if (!uploadId) return toast.error("Upload ID missing. Please upload a file first.");
    setIsReconciling(true);

    try {
      const result = await reconcileBankRecords(uploadId, reconType);
      if (result.status === "success") {
        toast.success(
          `Reconciliation complete — ${result.records_compared} processed. Matched: ${result.matched}, Unmatched: ${result.unmatched}`
        );
        setTransactions(result.records || transactions);
      } else {
        toast.error("Reconciliation did not complete successfully.");
      }
    } catch (err) {
      console.error("Reconciliation failed:", err);
      toast.error(
        err?.message?.includes("fetch")
          ? "Server unreachable. Ensure backend is running."
          : err?.message || "Reconciliation failed."
      );
    } finally {
      setIsReconciling(false);
    }
  };

  const handleExport = async (format) => {
    if (!uploadId) return toast.error("Upload ID missing. Please re-run reconciliation.");

    const url = `${API_BASE}/${reconType}/export?upload_id=${uploadId}&format=${format}`;
    try {
      const token = localStorage.getItem("token");
      const res = await fetch(url, { headers: { Authorization: `Bearer ${token}` } });

      if (res.status === 401) {
        toast.error("Session expired. Redirecting to login...");
        localStorage.removeItem("token");
        return setTimeout(() => (window.location.href = "/login"), 1500);
      }

      if (!res.ok) return toast.error(`Export failed: ${res.statusText}`);

      const blob = await res.blob();
      const downloadUrl = window.URL.createObjectURL(blob);
      const link = document.createElement("a");

      let ext = format === "excel" ? "xlsx" : format === "pdf" ? "pdf" : "csv";
      link.href = downloadUrl;
      link.download = `${reconType}_${uploadId}.${ext}`;
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(downloadUrl);
    } catch (err) {
      console.error("Export failed:", err);
      toast.error("Export failed. Check console for details.");
    }
  };

  // ===========================
  // JSX Render
  // ===========================
  return (
    <DashboardLayout>
      <h1 className="text-2xl font-bold text-brand">Reconciliations</h1>
      <p className="mb-6">Welcome to the intelligent reconciliation engine.</p>

      <div className="p-6 bg-white rounded-lg shadow-lg">

        {/* Reconciliation Type Selector */}
        <div className="mb-6">
          <label className="block font-semibold text-gray-700 mb-2">Reconciliation Type</label>
          <select
            value={reconType}
            onChange={(e) => setReconType(e.target.value)}
            className="border rounded p-2 w-full sm:w-64"
          >
            <option value="bank">Bank Reconciliation</option>
            <option value="supplier">Supplier Reconciliation</option>
            <option value="customer">Customer Reconciliation</option>
            <option value="general">General Ledger Reconciliation</option>
          </select>
        </div>

        {/* Upload Section */}
        <div className="flex flex-col sm:flex-row items-center gap-4 mb-4">
          <input
            type="file"
            accept=".csv, .xls, .xlsx"
            onChange={(e) => setBankFile(e.target.files[0])}
            className="border rounded p-2 w-full sm:w-auto"
          />
          <button
            onClick={handleUploadFile}
            disabled={isLoading}
            className={`flex items-center gap-2 px-4 py-2 rounded text-white transition ${
              isLoading ? "bg-gray-400 cursor-not-allowed" : "bg-indigo-600 hover:bg-indigo-700"
            }`}
          >
            {isLoading ? "Uploading..." : "Upload File"}
          </button>
        </div>

        {/* Summary Cards & Export */}
        {transactions.length > 0 && (
          <div className="flex flex-col gap-4 mb-6">

            {/* Summary Cards */}
            <div className="flex flex-wrap gap-4 mb-4">
              <MetricCard title="Total Transactions" value={transactions.length} />
              <MetricCard title="Total Matched" value={matchedCount} color="text-green-600" />
              <MetricCard title="Total Unmatched" value={unmatchedCount} color="text-red-600" />
            </div>

            {/* Export Buttons */}
                <div className="flex flex-wrap justify-end gap-2">
                <button
                  onClick={() => handleExport("csv")}
                  className="flex items-center gap-1 px-2 py-1 rounded bg-blue-600 hover:bg-blue-700 text-white text-sm"
                >
                  <FileSpreadsheet size={16} /> CSV
                </button>
                <button
                  onClick={() => handleExport("excel")}
                  className="flex items-center gap-1 px-2 py-1 rounded bg-emerald-600 hover:bg-emerald-700 text-white text-sm"
                >
                  <TableIcon size={16} /> Excel
                </button>
                <button
                  onClick={() => handleExport("pdf")}
                  className="flex items-center gap-1 px-2 py-1 rounded bg-red-600 hover:bg-red-700 text-white text-sm"
                >
                  <FileText size={16} /> PDF
                </button>
              </div>

          </div>
        )}

        {/* Transactions Table */}
        {transactions.length > 0 && (
          <div className="overflow-x-auto mt-4">
            <table className="min-w-full border text-sm">
              <thead>
                <tr className="bg-gray-100 text-gray-700">
                  <th className="border px-4 py-2">#</th>
                  <th className="border px-4 py-2">Transaction ID</th>
                  <th className="border px-4 py-2">Amount</th>
                  <th className="border px-4 py-2">Date</th>
                  <th className="border px-4 py-2">Status</th>
                </tr>
              </thead>
              <tbody>
                {transactions.map((txn, idx) => (
                  <tr key={txn.id || idx} className="hover:bg-gray-50">
                    <td className="border px-4 py-2">{idx + 1}</td>
                    <td className="border px-4 py-2">{txn.TransactionID}</td>
                    <td className="border px-4 py-2">{txn.Amount}</td>
                    <td className="border px-4 py-2">{txn.Date}</td>
                    <td className="border px-4 py-2">{txn.Status}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

      </div>
    </DashboardLayout>
  );
};

export default Transactions;
