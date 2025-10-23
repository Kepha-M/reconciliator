# app/utils/reconciliation_logic.py
import pandas as pd
from app.models.models import ResultType

def perform_reconciliation(bank_df: pd.DataFrame, erp_df: pd.DataFrame, db):
    required_bank = {"Date", "TransactionID", "Debit", "Credit", "BankReference"}
    required_erp = {"Date", "EntryID", "Debit", "Credit", "InvoiceRef"}

    if not required_bank.issubset(bank_df.columns):
        raise ValueError(f"Bank file missing: {required_bank - set(bank_df.columns)}")
    if not required_erp.issubset(erp_df.columns):
        raise ValueError(f"ERP file missing: {required_erp - set(erp_df.columns)}")

    # Normalize and compute amount
    bank_df["amount"] = bank_df["Debit"].fillna(0) - bank_df["Credit"].fillna(0)
    erp_df["amount"] = erp_df["Debit"].fillna(0) - erp_df["Credit"].fillna(0)

    # Convert date columns to proper datetime
    bank_df["Date"] = pd.to_datetime(bank_df["Date"], errors="coerce")
    erp_df["Date"] = pd.to_datetime(erp_df["Date"], errors="coerce")

    # First pass: Match by Reference + Amount
    merged = pd.merge(
        bank_df,
        erp_df,
        how="outer",
        left_on=["BankReference", "amount"],
        right_on=["InvoiceRef", "amount"],
        suffixes=("_bank", "_erp"),
        indicator=True
    )

    results = []

    for _, row in merged.iterrows():
        if row["_merge"] == "both":
            results.append({
                "result_type": ResultType.matched,
                "bank_reference": row.get("BankReference"),
                "erp_reference": row.get("InvoiceRef"),
                "date": row.get("Date_bank") or row.get("Date_erp"),
                "amount": row["amount"]
            })
        elif row["_merge"] == "left_only":
            results.append({
                "result_type": ResultType.unmatched_bank,
                "bank_reference": row.get("BankReference"),
                "erp_reference": None,
                "date": row.get("Date_bank"),
                "amount": row["amount"]
            })
        elif row["_merge"] == "right_only":
            results.append({
                "result_type": ResultType.unmatched_erp,
                "bank_reference": None,
                "erp_reference": row.get("InvoiceRef"),
                "date": row.get("Date_erp"),
                "amount": row["amount"]
            })

    # Second pass (optional): attempt date+amount match for remaining unmatched
    unmatched_bank = bank_df[~bank_df["BankReference"].isin(merged["BankReference"].dropna())]
    unmatched_erp = erp_df[~erp_df["InvoiceRef"].isin(merged["InvoiceRef"].dropna())]

    second_pass = pd.merge(
        unmatched_bank,
        unmatched_erp,
        how="inner",
        on=["Date", "amount"],
        suffixes=("_bank", "_erp")
    )

    for _, row in second_pass.iterrows():
        results.append({
            "result_type": ResultType.matched,
            "bank_reference": row.get("BankReference"),
            "erp_reference": row.get("InvoiceRef"),
            "date": row.get("Date"),
            "amount": row["amount"]
        })

    return results
