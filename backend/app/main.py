from fastapi import FastAPI, UploadFile, File
from fastapi.middleware.cors import CORSMiddleware
import pandas as pd
import io
from app import storage
from app.routes import reconciliation
app = FastAPI()

# In-memory storage
bank_data = []
erp_data = []

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Register reconciliation routes
app.include_router(reconciliation.router, prefix="/api", tags=["reconciliation"])
@app.post("/upload-files")
async def upload_files(
    bank_file: UploadFile = File(...),
    erp_file: UploadFile = File(...)
):
    try:
        # --- Parse bank file ---
        bank_contents = await bank_file.read()
        if bank_file.filename.endswith(".csv"):
            bank_df = pd.read_csv(io.BytesIO(bank_contents))
        elif bank_file.filename.endswith(".xlsx"):
            bank_df = pd.read_excel(io.BytesIO(bank_contents))
        else:
            return {"error": "Unsupported bank file type"}

        # --- Parse ERP file ---
        erp_contents = await erp_file.read()
        if erp_file.filename.endswith(".csv"):
            erp_df = pd.read_csv(io.BytesIO(erp_contents))
        elif erp_file.filename.endswith(".xlsx"):
            erp_df = pd.read_excel(io.BytesIO(erp_contents))
        else:
            return {"error": "Unsupported ERP file type"}

        # Save globally
        global bank_data, erp_data
        bank_data = bank_df.to_dict(orient="records")
        erp_data = erp_df.to_dict(orient="records")

        return {
            "message": "Files uploaded successfully",
            "bank_rows": len(storage.bank_data),
            "erp_rows": len(storage.erp_data),
        }

    except Exception as e:
        return {"error": str(e)}


@app.get("/bank-transactions")
async def get_bank_transactions():
    return {"transactions": bank_data}


@app.get("/erp-transactions")
async def get_erp_transactions():
    return {"transactions": erp_data}

@app.post("/reconcile")
async def reconcile():
    """Compare Bank vs ERP transactions and return matched/unmatched results."""
    try:
        bank_df = pd.DataFrame(storage.bank_data)
        erp_df = pd.DataFrame(storage.erp_data)

        if bank_df.empty or erp_df.empty:
            return {"error": "Both files must be uploaded before reconciliation."}

        # Perform reconciliation on TransactionID + Amount
        merged = pd.merge(
            bank_df, erp_df,
            on=["TransactionID", "Debit", "Credit"],
            how="outer",
            indicator=True,
            suffixes=("_Bank", "_ERP")
        )

        matched = merged[merged["_merge"] == "both"].to_dict(orient="records")
        bank_only = merged[merged["_merge"] == "left_only"].to_dict(orient="records")
        erp_only = merged[merged["_merge"] == "right_only"].to_dict(orient="records")

        return {
            "matched": matched,
            "bank_only": bank_only,
            "erp_only": erp_only
        }

    except Exception as e:
        return {"error": str(e)}
    
    # Debug route: check what’s in memory
@app.get("/debug-storage")
def debug_storage():
    return {
        "bank_data_count": len(storage.bank_data),
        "erp_data_count": len(storage.erp_data),
        "sample_bank": storage.bank_data[:5],
        "sample_erp": storage.erp_data[:5],
    }