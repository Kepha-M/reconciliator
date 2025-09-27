import { useState, useEffect } from "react";
import DashboardLayout from "../layouts/DashboardLayout";
import { uploadTransactionFile, getTransactions } from "../api";
import toast from "react-hot-toast";

export default function Transactions() {
  const [selectedFile, setSelectedFile] = useState(null);
  const [transactions, setTransactions] = useState([]);
  const [uploading, setUploading] = useState(false);

  const handleUpload = async () => {
    if (!selectedFile) {
      toast.error("Please select a file first.");
      return;
    }

    try {
      setUploading(true);
      const res = await uploadTransactionFile(selectedFile);

      // ✅ Show success toast
      toast.success(`${res.message} (${res.rows} rows)`);

      // ✅ Refresh table
      const data = await getTransactions();
      setTransactions(data.transactions);
    } catch (error) {
      console.error(error);
      toast.error("Upload failed!");
    } finally {
      setUploading(false);
      setSelectedFile(null);
    }
  };

  useEffect(() => {
    (async () => {
      try {
        const data = await getTransactions();
        setTransactions(data.transactions);
      } catch (err) {
        console.error(err);
      }
    })();
  }, []);

  return (
    <DashboardLayout>
      <div className="p-6">
        <h1 className="text-2xl font-bold text-brand">Transactions</h1>

        {/* File Upload */}
        <div className="flex items-center gap-4 my-4">
          <input
            type="file"
            accept=".csv,.xlsx"
            onChange={(e) => setSelectedFile(e.target.files[0])}
            className="border rounded-lg px-3 py-2"
          />
          <button
            onClick={handleUpload}
            disabled={uploading}
            className={`px-4 py-2 rounded-lg text-white ${
              uploading ? "bg-gray-400" : "bg-blue-600 hover:bg-blue-700"
            }`}
          >
            {uploading ? "Uploading..." : "Upload"}
          </button>
        </div>

        {/* Table */}
        <div className="overflow-x-auto bg-white shadow rounded-xl">
          <table className="w-full border-collapse">
            <thead className="bg-brand-light text-white">
              <tr>
                {["Date", "Transaction ID", "Description", "Debit", "Credit","Balance"].map(
                  (col, idx) => (
                    <th key={idx} className="px-4 py-2 text-left">
                      {col}
                    </th>
                  )
                )}
              </tr>
            </thead>
            <tbody>
              {transactions.length === 0 ? (
                <tr>
                  <td colSpan={5} className="text-center py-4 text-gray-500">
                    No transactions available
                  </td>
                </tr>
              ) : (
                transactions.map((t, idx) => (
                  <tr key={idx} className="border-b">
                    <td className="px-4 py-2">{t.TransactionID}</td>
                    <td className="px-4 py-2">{t.Date}</td>
                    <td className="px-4 py-2">{t.Description}</td>
                    <td className="px-4 py-2">{t.Debit}</td>
                    <td className="px-4 py-2">{t.Credit}</td>
                    <td className="px-4 py-2">{t.Balance}</td>
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
