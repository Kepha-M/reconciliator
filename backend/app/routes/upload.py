from fastapi import APIRouter, UploadFile, File
import pandas as pd

router = APIRouter()

@router.post("/upload-files")
async def upload_files(bank_file: UploadFile = File(...), erp_file: UploadFile = File(...)):
    results = {}

    # --- Process Bank File ---
    if bank_file.filename.endswith(".csv"):
        bank_df = pd.read_csv(bank_file.file)
    elif bank_file.filename.endswith((".xls", ".xlsx")):
        bank_df = pd.read_excel(bank_file.file)
    else:
        return {"error": "Unsupported bank file format"}

    results["bank_rows"] = len(bank_df)
    # Return as dict for frontend table display
    results["bank_data"] = bank_df.to_dict(orient="records")

    # --- Process ERP File ---
    if erp_file.filename.endswith(".csv"):
        erp_df = pd.read_csv(erp_file.file)
    elif erp_file.filename.endswith((".xls", ".xlsx")):
        erp_df = pd.read_excel(erp_file.file)
    else:
        return {"error": "Unsupported ERP file format"}

    results["erp_rows"] = len(erp_df)
    results["erp_data"] = erp_df.to_dict(orient="records")

    return {"message": "Files processed successfully", **results}
