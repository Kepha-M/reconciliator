from fastapi import FastAPI, UploadFile, File
from fastapi.middleware.cors import CORSMiddleware
import pandas as pd
import io

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
            "bank_rows": len(bank_data),
            "erp_rows": len(erp_data),
        }

    except Exception as e:
        return {"error": str(e)}


@app.get("/bank-transactions")
async def get_bank_transactions():
    return {"transactions": bank_data}


@app.get("/erp-transactions")
async def get_erp_transactions():
    return {"transactions": erp_data}
