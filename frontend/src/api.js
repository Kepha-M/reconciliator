const API_BASE_URL = "http://127.0.0.1:8000/api";

// -------------------- Upload Bank Transactions File --------------------
export const uploadBankFile = async (bankFile) => {
  const formData = new FormData();
  formData.append("bank_file", bankFile);

  const response = await fetch(`${API_BASE_URL}/reconcile-bank-file/`, {
    method: "POST",
    body: formData,
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Upload failed: ${response.status} - ${error}`);
  }

  return response.json();
};

// -------------------- Fetch Bank Transactions --------------------
export async function getBankTransactions() {
  try {
    const response = await fetch(`${API_BASE_URL}/upload-files`, {
      method: "GET",
      headers: { "Content-Type": "application/json" },
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch bank transactions: ${response.status}`);
    }

    return await response.json();
  } catch (err) {
    console.error("Error fetching bank transactions:", err);
    throw err;
  }
}

// -------------------- Fetch ERP Transactions --------------------
export async function getErpTransactions() {
  try {
    const response = await fetch(`${API_BASE_URL}/transactions-erp`, {
      method: "GET",
      headers: { "Content-Type": "application/json" },
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch ERP transactions: ${response.status}`);
    }

    return await response.json();
  } catch (err) {
    console.error("Error fetching ERP transactions:", err);
    throw err;
  }
}

// -------------------- Fetch Reconciliation History --------------------
export const getReconciliationHistory = async () => {
  try {
    const res = await fetch(`${API_BASE_URL}/reconciliation-results`, {
      method: "GET",
      headers: { "Content-Type": "application/json" },
    });

    if (!res.ok) {
      throw new Error(`Failed to fetch reconciliation history: ${res.status}`);
    }

    return await res.json();
  } catch (err) {
    console.error("Error fetching reconciliation history:", err);
    throw err;
  }
};

// -------------------- Run Reconciliation --------------------
export const runReconciliation = async (bankTransactions, erpTransactions) => {
  if (!Array.isArray(bankTransactions) || !Array.isArray(erpTransactions)) {
    throw new Error("Bank and ERP transactions must be arrays.");
  }

  try {
    const response = await fetch(`${API_BASE_URL}/reconciliation`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        bank_data: bankTransactions,
        erp_data: erpTransactions,
      }),
    });

    if (!response.ok) {
      let errorMsg = `Reconciliation failed: ${response.status}`;
      try {
        const errorData = await response.json();
        errorMsg += ` - ${JSON.stringify(errorData)}`;
      } catch {}
      throw new Error(errorMsg);
    }

    return await response.json(); // { matched, unmatched_bank, unmatched_erp }
  } catch (err) {
    console.error("Error running reconciliation:", err);
    throw err;
  }
};
