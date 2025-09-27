const API_BASE_URL = "http://127.0.0.1:8000/api";

// Upload both Bank + ERP files
export async function uploadFiles(bankFile, erpFile) {
  const formData = new FormData();
  formData.append("bank_file", bankFile);
  formData.append("erp_file", erpFile);

  const response = await fetch(`${API_BASE_URL}/upload-files`, {
    method: "POST",
    body: formData,
  });

  if (!response.ok) {
    throw new Error(`Upload failed: ${response.statusText}`);
  }

  return response.json();
}

// Fetch bank transactions
export async function getBankTransactions() {
  const response = await fetch(`${API_BASE_URL}/transactions-bank`, {
  method: "POST",
  headers: {
    "Content-Type": "application/json",
  },
  body: JSON.stringify({ /* payload if any */ })
});
  if (!response.ok) {
    throw new Error("Failed to fetch bank transactions");
  }
  return response.json();
}

// Fetch ERP transactions
export async function getErpTransactions() {
  const response = await fetch(`${API_BASE_URL}/transactions-erp`);
  if (!response.ok) {
    throw new Error("Failed to fetch ERP transactions");
  }
  return response.json();
}

// // Run reconciliation
// export async function reconcileTransactions() {
//   const response = await fetch(`${API_BASE_URL}/reconciliation`);
//   if (!response.ok) {
//     throw new Error("Failed to reconcile transactions");
//   }
//   return response.json();
// }
// ReconciliationHistory
export const getReconciliationHistory = async () => {
  const res = await fetch(`${API_BASE_URL}/reconciliation-history`);
  return res.json();
};
// 🔹 Run reconciliation
export async function runReconciliation() {
  const response = await fetch(`${API_BASE_URL}/reconciliation`, {
    method: "POST",
  });

  if (!response.ok) {
    throw new Error("Reconciliation failed");
  }

  return response.json();
}