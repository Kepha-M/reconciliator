import React, { useState } from "react";
import toast from "react-hot-toast";
import { API_BASE } from "../api/config";
import DashboardLayout from "../layouts/DashboardLayout";
import {
  uploadBankFile,
  reconcileBankRecords,
} from "../api";
import {
  Play,
  FileSpreadsheet,
  Table as TableIcon,
  FileText,
} from "lucide-react";

const Transactions = () => {
  const [bankFile, setBankFile] = useState(null);
  const [transactions, setTransactions] = useState([]);
  const [uploadId, setUploadId] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isReconciling, setIsReconciling] = useState(false);

  // ✅ Upload File
  const handleUploadFile = async () => {
    if (!bankFile) {
      toast.error("Please select a bank file first.");
      return;
    }

    setIsLoading(true);
    try {
      const res = await uploadBankFile(bankFile);
      setTransactions(res.records || []);
      setUploadId(res.upload_id);
      toast.success(`✅ File uploaded successfully. ${res.record_count} records loaded.`);
    } catch (err) {
      console.error("Upload failed:", err);
      toast.error("File upload failed. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  // ✅ Run Reconciliation
  const handleReconcile = async () => {
    if (!uploadId) {
      toast.error("Upload ID missing. Please re-upload the bank file before reconciling.");
      return;
    }

    setIsReconciling(true);
    try {
      const result = await reconcileBankRecords(uploadId);

      if (result.status === "success") {
        toast.success(
          `✅ Reconciliation complete — ${result.records_compared} records processed.
           Matched: ${result.matched}, Unmatched: ${result.unmatched}`
        );
      } else {
        toast.error("⚠️ Reconciliation did not complete successfully.");
      }
    } catch (err) {
      console.error("Reconciliation failed:", err);
      toast.error(
        err?.message?.includes("fetch")
          ? "Server not reachable. Ensure backend is running on port 8000."
          : err?.message || "Reconciliation failed. Check server logs."
      );
    } finally {
      setIsReconciling(false);
    }
  };

  // ✅ Export Handlers
 const handleExport = (format) => {
  if (!uploadId) {
    toast.error("Upload ID missing. Please re-run reconciliation.");
    return;
  }

  const url = `${API_BASE}/export-${format}?upload_id=${uploadId}`;
  window.open(url, "_blank");
};

  return (
    <DashboardLayout>
      <div className="p-6 bg-white rounded-lg shadow-lg">
        <h2 className="text-xl font-semibold mb-4 text-gray-800">
          Bank Upload & Reconciliation
        </h2>

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
              isLoading
                ? "bg-gray-400 cursor-not-allowed"
                : "bg-indigo-600 hover:bg-indigo-700"
            }`}
          >
            {isLoading ? "Uploading..." : "Upload File"}
          </button>
        </div>

        {/* Reconciliation & Export Buttons */}
        {transactions.length > 0 && (
          <div className="flex flex-wrap gap-3 mb-6">
            <button
              onClick={handleReconcile}
              disabled={isReconciling}
              className={`flex items-center gap-2 px-4 py-2 rounded text-white transition ${
                isReconciling
                  ? "bg-gray-400 cursor-not-allowed"
                  : "bg-green-600 hover:bg-green-700"
              }`}
            >
              <Play size={18} />
              {isReconciling ? "Reconciling..." : "Run Reconciliation"}
            </button>

            {/* Export Buttons */}
            <button
              onClick={() =>handleExport("csv")}
              className="flex items-center gap-2 px-4 py-2 rounded bg-blue-600 hover:bg-blue-700 text-white"
            >
              <FileSpreadsheet size={18} /> Export CSV
            </button>

            <button
              onClick={()=>handleExport("excel")}
              className="flex items-center gap-2 px-4 py-2 rounded bg-emerald-600 hover:bg-emerald-700 text-white"
            >
              <TableIcon size={18} /> Export Excel
            </button>

            <button
              onClick={()=>handleExport("pdf")}
              className="flex items-center gap-2 px-4 py-2 rounded bg-red-600 hover:bg-red-700 text-white"
            >
              <FileText size={18} /> Export PDF
            </button>
          </div>
        )}

        {/* Transactions Table */}
        {transactions.length > 0 && (
          <div className="overflow-x-auto">
            <table className="min-w-full border mt-4 text-sm">
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
