// src/api.jsx
import API_BASE from "./config/api";

// =====================================================
// Token Helper
// =====================================================
const getToken = () => localStorage.getItem("token");

const authHeader = () => {
  const token = getToken();
  if (!token) throw new Error("User not authenticated. Token missing.");

  return {
    Authorization: `Bearer ${token}`,
  };
};

// =====================================================
// UPLOAD FILE (Dynamic Reconciliation Type)
// =====================================================
/**
 * Upload reconciliation file
 * reconType = bank | supplier | customer | general
 */
export const uploadBankFile = async (file, reconType = "bank") => {
  if (!file) throw new Error("No file provided.");

  const formData = new FormData();
  formData.append("file", file); // 🔥 Standardized parameter name for all modules

  try {
    const response = await fetch(`${API_BASE}/${reconType}/upload-file/`, {
      method: "POST",
      body: formData,
      headers: {
        ...authHeader(), // JWT only — do NOT set Content-Type for FormData
      },
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(
        `Upload failed (${response.status} ${response.statusText}): ${errorText}`
      );
    }

    return await response.json();
  } catch (error) {
    console.error("Upload failed:", error);
    throw error;
  }
};

// =====================================================
// RUN RECONCILIATION
// =====================================================
/**
 * Run reconciliation by type
 * reconType = bank | supplier | customer | general
 */
export async function reconcileBankRecords(uploadId, reconType = "bank") {
  if (!uploadId) throw new Error("uploadId is required.");

  try {
    const response = await fetch(
      `${API_BASE}/${reconType}/run/${uploadId}`,
      {
        method: "POST",
        headers: {
          ...authHeader(),
          "Content-Type": "application/json",
        },
      }
    );

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Reconciliation failed: ${errorText}`);
    }

    return await response.json();
  } catch (error) {
    console.error("Reconciliation error:", error);
    throw error;
  }
}

// =====================================================
// EXPORT FILES
// =====================================================
/**
 * Export results
 * format = csv | excel | pdf
 */
export const exportReconciliation = (uploadId, format, reconType = "bank") => {
  if (!uploadId) throw new Error("uploadId is required.");
  if (!format) throw new Error("format is required.");

  return `${API_BASE}/${reconType}/export-${format}?upload_id=${uploadId}`;
};
