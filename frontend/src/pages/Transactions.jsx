import { useState } from "react";
import DashboardLayout from "../layouts/DashboardLayout";
import { uploadFiles, runReconciliation } from "../api";
import toast from "react-hot-toast";

// Import icons
import {
  Upload,
  Play,
  Banknote,
  FileSpreadsheet,
  Table as TableIcon,
  ChevronDown,
  ChevronUp,
} from "lucide-react";

export default function Transactions() {
  const [bankFile, setBankFile] = useState(null);
  const [erpFile, setErpFile] = useState(null);
  const [bankTransactions, setBankTransactions] = useState([]);
  const [erpTransactions, setErpTransactions] = useState([]);
  const [uploading, setUploading] = useState(false);
  const [reconRunning, setReconRunning] = useState(false);

  const [matched, setMatched] = useState([]);
  const [unmatchedBank, setUnmatchedBank] = useState([]);
  const [unmatchedERP, setUnmatchedERP] = useState([]);

  // -------------------- Upload files --------------------
  const handleUpload = async () => {
    if (!bankFile || !erpFile) {
      toast.error("Please select both files.");
      return;
    }

    try {
      setUploading(true);
      const res = await uploadFiles(bankFile, erpFile);
      toast.success(
        `Uploaded successfully (Bank: ${res.bank_rows} rows, ERP: ${res.erp_rows} rows)`
      );

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

      setMatched(res.matched || []);
      setUnmatchedBank(res.unmatched_bank || []);
      setUnmatchedERP(res.unmatched_erp || []);
    } catch (err) {
      console.error("Reconciliation failed:", err);
      toast.error("Reconciliation failed!");
    } finally {
      setReconRunning(false);
    }
  };

  return (
    <DashboardLayout>
      <div className="p-6 space-y-8">
        {/* Header */}
        <div className="text-center">
          <h1 className="text-3xl font-bold text-gray-800 flex items-center justify-center gap-2">
            <TableIcon className="w-8 h-8 text-blue-600" />
            Transactions Management
          </h1>
          <p className="text-gray-500 mt-1">
            Upload, view, and reconcile your transactions
          </p>
        </div>

        {/* Upload Section */}
        <div className="bg-white p-6 rounded-xl shadow space-y-4">
          <h2 className="text-xl font-semibold text-gray-700 flex items-center gap-2">
            <Upload className="w-5 h-5 text-blue-600" />
            Upload Files
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-gray-600 font-medium mb-2">
                <Banknote className="inline w-4 h-4 mr-1 text-green-600" />
                Bank Transactions:
              </label>
              <input
                type="file"
                accept=".csv,.xlsx"
                onChange={(e) => setBankFile(e.target.files[0])}
                className="w-full border rounded-lg px-3 py-2 focus:ring focus:ring-blue-200"
              />
            </div>
            <div>
              <label className="block text-gray-600 font-medium mb-2">
                <FileSpreadsheet className="inline w-4 h-4 mr-1 text-indigo-600" />
                ERP Transactions:
              </label>
              <input
                type="file"
                accept=".csv,.xlsx"
                onChange={(e) => setErpFile(e.target.files[0])}
                className="w-full border rounded-lg px-3 py-2 focus:ring focus:ring-blue-200"
              />
            </div>
          </div>
          <button
            onClick={handleUpload}
            disabled={uploading}
            className={`w-full md:w-auto flex items-center justify-center gap-2 px-6 py-3 rounded-lg text-white font-medium ${
              uploading
                ? "bg-gray-400 cursor-not-allowed"
                : "bg-blue-600 hover:bg-blue-700"
            }`}
          >
            <Upload className="w-5 h-5" />
            {uploading ? "Uploading..." : "Upload Both Files"}
          </button>
        </div>

        {/* Run Reconciliation */}
        {(bankTransactions.length > 0 || erpTransactions.length > 0) && (
          <div className="bg-white p-6 rounded-xl shadow text-center">
            <button
              onClick={handleRunReconciliation}
              disabled={reconRunning}
              className={`flex items-center justify-center gap-2 px-6 py-3 rounded-lg text-white font-semibold ${
                reconRunning
                  ? "bg-gray-400 cursor-not-allowed"
                  : "bg-green-600 hover:bg-green-700"
              }`}
            >
              <Play className="w-5 h-5" />
              {reconRunning ? "Running..." : "Run Reconciliation"}
            </button>
          </div>
        )}

        {/* Accordion Tables */}
        {bankTransactions.length > 0 && (
          <AccordionTable
            title="Bank Transactions"
            icon={<Banknote className="w-5 h-5 text-green-600" />}
            columns={["Date", "TransactionID", "Description", "Amount", "Balance"]}
            data={bankTransactions}
            type="bank"
            onDelete={handleDeleteTransaction}
          />
        )}

        {erpTransactions.length > 0 && (
          <AccordionTable
            title="ERP Transactions"
            icon={<FileSpreadsheet className="w-5 h-5 text-indigo-600" />}
            columns={["Date", "VoucherNo", "Account", "Amount", "Reference"]}
            data={erpTransactions}
            type="erp"
            onDelete={handleDeleteTransaction}
          />
        )}

        {(matched.length > 0 || unmatchedBank.length > 0 || unmatchedERP.length > 0) && (
          <div className="space-y-6">
            {matched.length > 0 && (
              <AccordionTable
                title="Matched Transactions"
                icon={<TableIcon className="w-5 h-5 text-blue-600" />}
                columns={["bank_reference", "erp_reference", "Date", "Amount"]}
                data={matched}
                type="matched"
              />
            )}
            {unmatchedBank.length > 0 && (
              <AccordionTable
                title="Unmatched Bank Transactions"
                icon={<Banknote className="w-5 h-5 text-red-600" />}
                columns={["bank_reference", "Date", "Amount"]}
                data={unmatchedBank}
                type="unmatched_bank"
              />
            )}
            {unmatchedERP.length > 0 && (
              <AccordionTable
                title="Unmatched ERP Transactions"
                icon={<FileSpreadsheet className="w-5 h-5 text-orange-600" />}
                columns={["erp_reference", "Date", "Amount"]}
                data={unmatchedERP}
                type="unmatched_erp"
              />
            )}
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}

// -------------------- Accordion + Table --------------------
function AccordionTable({ title, icon, columns, data, type, onDelete }) {
  const [open, setOpen] = useState(true);

  return (
    <div className="bg-white rounded-xl shadow">
      {/* Accordion Header */}
      <button
        onClick={() => setOpen(!open)}
        className="w-full flex justify-between items-center px-6 py-4 text-left border-b"
      >
        <h2 className="text-lg font-semibold flex items-center gap-2">
          {icon}
          {title} <span className="text-gray-500 text-sm">({data.length})</span>
        </h2>
        {open ? <ChevronUp className="w-5 h-5 text-gray-500" /> : <ChevronDown className="w-5 h-5 text-gray-500" />}
      </button>

      {/* Accordion Content */}
      {open && (
        <div className="overflow-x-auto p-4">
          <table className="w-full border-collapse text-sm">
            <thead className="bg-blue-600 text-white">
              <tr>
                {columns.map((col) => (
                  <th key={col} className="px-4 py-2 text-left font-medium uppercase tracking-wide">
                    {col}
                  </th>
                ))}
                {onDelete && <th className="px-4 py-2">Actions</th>}
              </tr>
            </thead>
            <tbody>
              {data.length === 0 ? (
                <tr>
                  <td
                    colSpan={columns.length + (onDelete ? 1 : 0)}
                    className="text-center py-4 text-gray-500"
                  >
                    No transactions available
                  </td>
                </tr>
              ) : (
                data.map((t, idx) => (
                  <tr key={idx} className="border-b hover:bg-gray-50 transition-colors">
                    {columns.map((col) => (
                      <td key={col} className="px-4 py-2">
                        {t[col] ?? t[col.toLowerCase()] ?? ""}
                      </td>
                    ))}
                    {onDelete && (
                      <td className="px-4 py-2">
                        <button
                          onClick={() => onDelete(type, idx)}
                          className="text-red-600 hover:underline text-sm"
                        >
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
      )}
    </div>
  );
}
