const API_BASE_URL = "http://127.0.0.1:8000"; // FastAPI backend

export async function uploadTransactionFile(file) {
  const formData = new FormData();
  formData.append("file", file);

  const response = await fetch(`${API_BASE_URL}/upload-transactions`, {
    method: "POST",
    body: formData,
  });

  if (!response.ok) {
    throw new Error(`Upload failed: ${response.statusText}`);
  }

  return await response.json(); // ✅ ensure parsed JSON
}

export async function getTransactions() {
  const response = await fetch(`${API_BASE_URL}/transactions`);
  if (!response.ok) {
    throw new Error("Failed to fetch transactions");
  }
  return await response.json(); // ✅ ensure parsed JSON
}
