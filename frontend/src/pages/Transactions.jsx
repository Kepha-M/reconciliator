import { useState, useEffect } from "react";
import DashboardLayout from "../layouts/DashboardLayout";
import { uploadFiles, getBankTransactions, getErpTransactions } from "../api";
import toast from "react-hot-toast";

export default function Transactions() {
  const [bankFile, setBankFile] = useState(null);
  const [erpFile, setErpFile] = useState(null);
  const [bankTransactions, setBankTransactions] = useState([]);
  const [erpTransactions, setErpTransactions] = useState([]);
  const [uploading, setUploading] = useState(false);

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

      // ✅ Refresh tables after upload
      const bankData = await getBankTransactions();
      const erpData = await getErpTransactions();
      setBankTransactions(bankData.transactions);
      setErpTransactions(erpData.transactions);
    } catch (error) {
      console.error(error);
      toast.error("Upload failed!");
    } finally {
      setUploading(false);
    }
  };

  // Fetch existing data when component loads
  useEffect(() => {
    (async () => {
      try {
        const bankData = await getBankTransactions();
        const erpData = await getErpTransactions();
        setBankTransactions(bankData.transactions);
        setErpTransactions(erpData.transactions);
      } catch (err) {
        console.error(err);
      }
    })();
  }, []);

  return (
    <DashboardLayout>
      <div className="p-6">
        <h1 className="text-2xl font-bold text-brand">Upload Files</h1>

        {/* File Upload */}
        <div className="flex flex-col gap-4 my-4">
          <input
            type="file"
            accept=".csv,.xlsx"
            onChange={(e) => setBankFile(e.target.files[0])}
            className="border rounded-lg px-3 py-2"
          />
          <input
            type="file"
            accept=".csv,.xlsx"
            onChange={(e) => setErpFile(e.target.files[0])}
            className="border rounded-lg px-3 py-2"
          />
          <button
            onClick={handleUpload}
            disabled={uploading}
            className={`px-4 py-2 rounded-lg text-white ${
              uploading ? "bg-gray-400" : "bg-blue-600 hover:bg-blue-700"
            }`}
          >
            {uploading ? "Uploading..." : "Upload Both (Bank + ERP) Files"}
          </button>
        </div>

        {/* Bank Transactions Table */}
        <div className="mt-8">
          <h2 className="text-xl font-semibold mb-2">Bank Transactions</h2>
          <div className="overflow-x-auto bg-white shadow rounded-xl">
            <table className="w-full border-collapse">
              <thead className="bg-brand-light text-white">
                <tr>
                  {["Date", "TransactionID", "Description", "Amount", "Balance"].map(
                    (col, idx) => (
                      <th key={idx} className="px-4 py-2 text-left">
                        {col}
                      </th>
                    )
                  )}
                </tr>
              </thead>
              <tbody>
                {bankTransactions.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="text-center py-4 text-gray-500">
                      No bank transactions available
                    </td>
                  </tr>
                ) : (
                  bankTransactions.map((t, idx) => (
                    <tr key={idx} className="border-b">
                      <td className="px-4 py-2">{t.Date}</td>
                      <td className="px-4 py-2">{t.TransactionID}</td>
                      <td className="px-4 py-2">{t.Description}</td>
                      <td className="px-4 py-2">{t.Amount}</td>
                      <td className="px-4 py-2">{t.Balance}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* ERP Transactions Table */}
        <div className="mt-8">
          <h2 className="text-xl font-semibold mb-2">ERP Transactions</h2>
          <div className="overflow-x-auto bg-white shadow rounded-xl">
            <table className="w-full border-collapse">
              <thead className="bg-brand-light text-white">
                <tr>
                  {["Date", "VoucherNo", "Account", "Amount", "Reference"].map(
                    (col, idx) => (
                      <th key={idx} className="px-4 py-2 text-left">
                        {col}
                      </th>
                    )
                  )}
                </tr>
              </thead>
              <tbody>
                {erpTransactions.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="text-center py-4 text-gray-500">
                      No ERP transactions available
                    </td>
                  </tr>
                ) : (
                  erpTransactions.map((t, idx) => (
                    <tr key={idx} className="border-b">
                      <td className="px-4 py-2">{t.Date}</td>
                      <td className="px-4 py-2">{t.VoucherNo}</td>
                      <td className="px-4 py-2">{t.Account}</td>
                      <td className="px-4 py-2">{t.Amount}</td>
                      <td className="px-4 py-2">{t.Reference}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
