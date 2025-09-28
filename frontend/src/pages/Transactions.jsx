import { useState, useEffect } from "react";
import DashboardLayout from "../layouts/DashboardLayout";
import { uploadFiles, getBankTransactions, getErpTransactions, runReconciliation, getReconciliationHistory } from "../api";
import toast from "react-hot-toast";

export default function Transactions() {
  const [bankFile, setBankFile] = useState(null);
  const [erpFile, setErpFile] = useState(null);
  const [bankTransactions, setBankTransactions] = useState([]);
  const [erpTransactions, setErpTransactions] = useState([]);
  const [uploading, setUploading] = useState(false);
  const [reconRunning, setReconRunning] = useState(false);

  // Reconciliation results
  const [matched, setMatched] = useState([]);
  const [unmatchedBank, setUnmatchedBank] = useState([]);
  const [unmatchedERP, setUnmatchedERP] = useState([]);

  // Fetch existing transactions on load
  useEffect(() => {
    (async () => {
      try {
        const bankData = await getBankTransactions();
        const erpData = await getErpTransactions();
        setBankTransactions(bankData);
        setErpTransactions(erpData);
      } catch (err) {
        console.error("Error fetching transactions:", err);
      }
    })();
  }, []);

  // -------------------- Upload files --------------------
  const handleUpload = async () => {
    if (!bankFile || !erpFile) {
      toast.error("Please select both files.");
      return;
    }

    try {
      setUploading(true);
      const res = await uploadFiles(bankFile, erpFile);
      toast.success(`Uploaded successfully (Bank: ${res.bank_rows} rows, ERP: ${res.erp_rows} rows)`);

      // Update tables after upload
      setBankTransactions(res.bank_data || []);
      setErpTransactions(res.erp_data || []);
    } catch (error) {
      console.error("Upload failed:", error);
      toast.error("Upload failed!");
    } finally {
      setUploading(false);
    }
  };

  // -------------------- Delete transaction --------------------
  const handleDeleteTransaction = (type, index) => {
    if (type === "bank") {
      setBankTransactions((prev) => prev.filter((_, i) => i !== index));
    } else {
      setErpTransactions((prev) => prev.filter((_, i) => i !== index));
    }
  };

  // -------------------- Run Reconciliation --------------------
  const handleRunReconciliation = async () => {
    if (bankTransactions.length === 0 || erpTransactions.length === 0) {
      toast.error("No transactions available for reconciliation.");
      return;
    }

    try {
      setReconRunning(true);
      const res = await runReconciliation(bankTransactions, erpTransactions);
      toast.success("Reconciliation completed!");

      // Update results tables
      setMatched(res.matched || []);
      setUnmatchedBank(res.unmatched_bank || []);
      setUnmatchedERP(res.unmatched_erp || []);

      console.log("Reconciliation results:", res);
    } catch (err) {
      console.error("Reconciliation failed:", err);
      toast.error("Reconciliation failed!");
    } finally {
      setReconRunning(false);
    }
  };

  return (
    <DashboardLayout>
      <div className="p-6">
        <h1 className="text-2xl font-bold text-brand">Upload Files</h1>

        {/* File Upload */}
        <div className="flex flex-col gap-4 my-4">
          Bank Transactions:
          <input
            type="file"
            accept=".csv,.xlsx"
            onChange={(e) => setBankFile(e.target.files[0])}
            className="border rounded-lg px-3 py-2"
          />
          ERP Transactions:
          <input
            type="file"
            accept=".csv,.xlsx"
            onChange={(e) => setErpFile(e.target.files[0])}
            className="border rounded-lg px-3 py-2"
          />
          <button
            onClick={handleUpload}
            disabled={uploading}
            className={`px-4 py-2 rounded-lg text-white ${uploading ? "bg-gray-400" : "bg-blue-600 hover:bg-blue-700"}`}
          >
            {uploading ? "Uploading..." : "Upload Both (Bank + ERP) Files"}
          </button>
        </div>

        {/* Run Reconciliation Button */}
        <div className="my-4">
          <button
            onClick={handleRunReconciliation}
            disabled={reconRunning}
            className={`px-4 py-2 rounded-lg text-white ${reconRunning ? "bg-gray-400" : "bg-green-600 hover:bg-green-700"}`}
          >
            {reconRunning ? "Running..." : "Run Reconciliation"}
          </button>
        </div>

        {/* Transactions Tables */}
        <TransactionTable
          title="Bank Transactions"
          columns={["Date", "TransactionID", "Description", "Amount", "Balance"]}
          data={bankTransactions}
          type="bank"
          onDelete={handleDeleteTransaction}
        />

        <TransactionTable
          title="ERP Transactions"
          columns={["Date", "VoucherNo", "Account", "Amount", "Reference"]}
          data={erpTransactions}
          type="erp"
          onDelete={handleDeleteTransaction}
        />

        {/* Reconciliation Results Tables */}
        <TransactionTable
          title="Matched Transactions"
          columns={["bank_reference", "erp_reference", "Date", "Amount"]}
          data={matched}
          type="matched"
        />
        <TransactionTable
          title="Unmatched Bank Transactions"
          columns={["bank_reference", "Date", "Amount"]}
          data={unmatchedBank}
          type="unmatched_bank"
        />
        <TransactionTable
          title="Unmatched ERP Transactions"
          columns={["erp_reference", "Date", "Amount"]}
          data={unmatchedERP}
          type="unmatched_erp"
        />
      </div>
    </DashboardLayout>
  );
}

// -------------------- Reusable Transaction Table Component --------------------
function TransactionTable({ title, columns, data, type, onDelete }) {
  return (
    <div className="mt-8">
      <h2 className="text-xl font-semibold mb-2">{title}</h2>
      <div className="overflow-x-auto bg-white shadow rounded-xl">
        <table className="w-full border-collapse">
          <thead className="bg-brand-light text-white">
            <tr>
              {columns.map((col) => (
                <th key={col} className="px-4 py-2 text-left">{col}</th>
              ))}
              {onDelete && <th className="px-4 py-2 text-left">Actions</th>}
            </tr>
          </thead>
          <tbody>
            {data.length === 0 ? (
              <tr>
                <td colSpan={columns.length + (onDelete ? 1 : 0)} className="text-center py-4 text-gray-500">
                  No transactions available
                </td>
              </tr>
            ) : (
              data.map((t, idx) => (
                <tr key={idx} className="border-b">
                  {columns.map((col) => (
                    <td key={col} className="px-4 py-2">{t[col] ?? t[col.toLowerCase()] ?? ""}</td>
                  ))}
                  {onDelete && (
                    <td className="px-4 py-2">
                      <button onClick={() => onDelete(type, idx)} className="text-red-600 hover:underline">
                        Delete
                      </button>
                    </td>
                  )}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
