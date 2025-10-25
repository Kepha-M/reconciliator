import pandas as pd
from sqlalchemy.orm import Session

def perform_reconciliation(bank_df: pd.DataFrame, db: Session):
    """
    Compare ERP (from DB) and Bank transaction records, and return reconciliation results.
    """

    # --- Step 1: Load ERP transactions from DB ---
    query = """
        SELECT transaction_id AS "TransactionID",
               amount AS "Amount",
               date AS "Date"
        FROM erp_transactions
    """

    # Use proper connection from session
    with db.connection() as conn:
        erp_df = pd.read_sql(query, conn)

    # --- Step 2: Validate column existence ---
    required_columns = ["TransactionID", "Amount", "Date"]

    for col in required_columns:
        if col not in bank_df.columns:
            raise ValueError(f"Missing required column '{col}' in uploaded bank file.")
        if col not in erp_df.columns:
            raise ValueError(f"Missing required column '{col}' in ERP dataset.")

    # --- Step 3: Normalize data ---
    bank_df["TransactionID"] = bank_df["TransactionID"].astype(str).str.strip().str.upper()
    erp_df["TransactionID"] = erp_df["TransactionID"].astype(str).str.strip().str.upper()

    bank_df["Date"] = pd.to_datetime(bank_df["Date"], errors="coerce")
    erp_df["Date"] = pd.to_datetime(erp_df["Date"], errors="coerce")

    bank_df["Amount"] = pd.to_numeric(bank_df["Amount"], errors="coerce").round(2)
    erp_df["Amount"] = pd.to_numeric(erp_df["Amount"], errors="coerce").round(2)

    # --- Step 4: Compare datasets ---
    comparison = pd.merge(
        erp_df,
        bank_df,
        on=required_columns,
        how="outer",
        indicator=True
    )

    # --- Step 5: Assign reconciliation status ---
    def classify(row):
        if row["_merge"] == "both":
            return "✅ Match"
        elif row["_merge"] == "left_only":
            return "⚠️ Missing in Bank"
        elif row["_merge"] == "right_only":
            return "⚠️ Missing in ERP"
        return "❌ Undefined"

    comparison["Status"] = comparison.apply(classify, axis=1)

    # --- Step 6: Structure results ---
    results = []
    for _, row in comparison.iterrows():
        results.append({
            "TransactionID": row.get("TransactionID"),
            "Amount": row.get("Amount"),
            "Date": row["Date"].strftime("%Y-%m-%d") if pd.notnull(row["Date"]) else None,
            "Status": row["Status"]
        })

    return results
