import React, { useState } from "react";
import toast from "react-hot-toast";
import { uploadBankFile } from "../api";

const Transactions = () => {
  const [bankFile, setBankFile] = useState(null);
  const [transactions, setTransactions] = useState([]);
  const [showReconcile, setShowReconcile] = useState(false);
  const [isReconciling, setIsReconciling] = useState(false);

  const handleUploadFile = async () => {
    if (!bankFile) {
      toast.error("Please select a bank file first.");
      return;
    }

    try {
      const res = await uploadBankFile(bankFile);
      const data = res.transactions || [];

      setTransactions(data);
      setShowReconcile(data.length > 0); // show Reconcile button when table has data
      toast.success("File uploaded successfully");
    } catch (err) {
      console.error("Upload failed:", err);
      toast.error("File upload failed. Please try again.");
    }
  };

  const handleReconcile = async () => {
    if (transactions.length === 0) {
      toast.error("No transactions available for reconciliation.");
      return;
    }

    try {
      setIsReconciling(true);
      // Here you can later call your backend reconciliation API
      // e.g., await runReconciliation(transactions);

      // Simulate delay for UX feedback
      await new Promise((resolve) => setTimeout(resolve, 2000));

      toast.success("Reconciliation completed successfully.");
    } catch (err) {
      console.error("Reconciliation failed:", err);
      toast.error("Reconciliation failed. Please check the logs.");
    } finally {
      setIsReconciling(false);
    }
  };

  return (
    <div className="p-6 bg-white rounded-lg shadow-lg">
      <h2 className="text-xl font-semibold mb-4">
        Bank File Upload & Transactions
      </h2>

      <div className="flex items-center gap-4 mb-4">
        <input
          type="file"
          accept=".csv, .xls, .xlsx"
          onChange={(e) => setBankFile(e.target.files[0])}
          className="border rounded p-2"
        />
        <button
          onClick={handleUploadFile}
          className="bg-indigo-600 text-white px-4 py-2 rounded hover:bg-indigo-700"
        >
          Upload File
        </button>
      </div>

      {/* Show Reconcile button only after data is loaded */}
      {showReconcile && (
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
            {isReconciling ? "Reconciling..." : "Reconcile"}
          </button>
        </div>
      )}

      {transactions.length > 0 && (
        <table className="min-w-full border mt-6">
          <thead>
            <tr className="bg-gray-100">
              {Object.keys(transactions[0]).map((col, i) => (
                <th key={i} className="border px-4 py-2 text-left">
                  {col.toUpperCase()}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {transactions.map((txn, idx) => (
              <tr key={idx} className="hover:bg-gray-50">
                {Object.keys(txn).map((col, i) => (
                  <td key={i} className="border px-4 py-2">
                    {txn[col] ?? "-"}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
};

export default Transactions;
