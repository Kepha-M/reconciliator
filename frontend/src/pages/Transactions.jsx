import React, { useState } from "react";
import toast from "react-hot-toast";
import {
  uploadBankFile,
  deleteBankRecord,
  reconcileBankRecords,
} from "../api";

const Transactions = () => {
  const [bankFile, setBankFile] = useState(null);
  const [transactions, setTransactions] = useState([]);
  const [uploadId, setUploadId] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isReconciling, setIsReconciling] = useState(false);

  // ✅ Handle file upload
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
      toast.success(`File uploaded successfully. ${res.record_count} records loaded.`);
    } catch (err) {
      console.error("Upload failed:", err);
      toast.error("File upload failed. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };


  // ✅ Handle reconciliation process
const handleReconcile = async () => {
  if (!uploadId) {
    toast.error("Upload ID missing. Please re-upload the bank file before reconciling.");
    return;
  }

  setIsReconciling(true);
  try {
    const result = await reconcileBankRecords(uploadId);

    // Enhanced success notification
    if (result.status === "success") {
      toast.success(
        `✅ Reconciliation completed — ${result.records_compared} records processed. 
        Matched: ${result.matched}, Unmatched: ${result.unmatched}`
      );
      console.log("Reconciliation Results:", result);
    } else {
      toast.error("⚠️ Reconciliation did not complete successfully. Please verify data integrity.");
    }

  } catch (err) {
    console.error("Reconciliation failed:", err);

    // Parse and display a more informative message if possible
    const errorMessage =
      err?.message?.includes("fetch") 
        ? "Server not reachable. Ensure backend is running on port 8000."
        : err?.message || "Reconciliation failed. Check server logs.";

    toast.error(errorMessage);
  } finally {
    setIsReconciling(false);
  }
};


  return (
    <div className="p-6 bg-white rounded-lg shadow-lg">
      <h2 className="text-xl font-semibold mb-4 text-gray-800">
        Bank Upload & Reconciliation
      </h2>

      {/* Upload Section */}
      <div className="flex items-center gap-4 mb-4">
        <input
          type="file"
          accept=".csv, .xls, .xlsx"
          onChange={(e) => setBankFile(e.target.files[0])}
          className="border rounded p-2"
        />
        <button
          onClick={handleUploadFile}
          disabled={isLoading}
          className={`px-4 py-2 rounded text-white ${
            isLoading
              ? "bg-gray-400 cursor-not-allowed"
              : "bg-indigo-600 hover:bg-indigo-700"
          }`}
        >
          {isLoading ? "Uploading..." : "Upload File"}
        </button>
      </div>

      {/* Reconcile Button */}
      {transactions.length > 0 && (
        <div className="mb-4">
          <button
            onClick={handleReconcile}
            disabled={isReconciling}
            className={`px-4 py-2 rounded text-white ${
              isReconciling
                ? "bg-gray-400 cursor-not-allowed"
                : "bg-green-600 hover:bg-green-700"
            }`}
          >
            {isReconciling ? "Reconciling..." : "Run Reconciliation"}
          </button>
        </div>
      )}

      {/* Transactions Table */}
      {transactions.length > 0 && (
        <div className="overflow-x-auto">
          <table className="min-w-full border mt-6">
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
                <tr key={txn.id} className="hover:bg-gray-50">
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
  );
};

export default Transactions;
