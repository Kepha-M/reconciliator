const API_BASE_URL = "http://127.0.0.1:8000";

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
  const response = await fetch(`${API_BASE_URL}/bank-transactions`);
  if (!response.ok) {
    throw new Error("Failed to fetch bank transactions");
  }
  return response.json();
}

// Fetch ERP transactions
export async function getErpTransactions() {
  const response = await fetch(`${API_BASE_URL}/erp-transactions`);
  if (!response.ok) {
    throw new Error("Failed to fetch ERP transactions");
  }
  return response.json();
}
