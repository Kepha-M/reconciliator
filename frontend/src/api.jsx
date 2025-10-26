// src/api.jsx
const BASE_URL = "http://localhost:8000/api"; // Update if backend runs elsewhere

/**
 * Upload bank file and get parsed records (no reconciliation yet)
 * Backend route: POST /reconciliation/upload-bank-file
 */
export async function uploadBankFile(file) {
  const formData = new FormData();
  formData.append("bank_file", file);

  const response = await fetch(`${BASE_URL}/upload-bank-file`, {
    method: "POST",
    body: formData,
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`File upload failed: ${errorText}`);
  }

  return await response.json();
}


export async function deleteBankRecord(recordId) {
  const response = await fetch(`${BASE_URL}/delete-bank-record/${recordId}`, {
    method: "DELETE",
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Delete failed: ${errorText}`);
  }

  return await response.json();
}

/**
 * Submit all verified transactions for reconciliation
 * Backend route: POST /reconciliation/run
 */

export async function reconcileBankRecords(uploadId) {
  if (!uploadId) throw new Error("uploadId is required for reconciliation.");

  const response = await fetch(`${BASE_URL}/run/${uploadId}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Reconciliation failed: ${errorText}`);
  }

  return await response.json();
}
