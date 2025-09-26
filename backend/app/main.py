transactions_db = []
from fastapi import FastAPI, UploadFile, File
from fastapi.middleware.cors import CORSMiddleware
import shutil
import pandas as pd 
import io

app = FastAPI()

# Allow CORS for frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.post("/upload-transactions")
async def upload_transactions(file: UploadFile = File(...)):
    try:
        # Read file into pandas
        contents = await file.read()
        if file.filename.endswith(".csv"):
            df = pd.read_csv(io.BytesIO(contents))
        elif file.filename.endswith(".xlsx"):
            df = pd.read_excel(io.BytesIO(contents))
        else:
            return {"error": "Unsupported file type"}

        # Normalize columns (example)
        df = df.rename(
            columns={
                "date": "Date",
                "account": "Account",
                "amount": "Amount",
                "reference": "Reference",
                "status": "Status",
            }
        )

        # Store in memory
        global transactions_db
        transactions_db = df.to_dict(orient="records")

        return {"message": "File uploaded successfully", "rows": len(transactions_db)}

    except Exception as e:
        return {"error": str(e)}


@app.get("/transactions")
async def get_transactions():
    return {"transactions": transactions_db}
# @app.get("/")
# def root():
#     return {"message": "Backend running 🚀"}

# @app.post("/upload-transactions")
# async def upload_transactions(file: UploadFile = File(...)):
#     upload_dir = "uploads"
#     os.makedirs(upload_dir, exist_ok=True)
#     file_path = os.path.join(upload_dir, file.filename)
#     with open(file_path, "wb") as buffer:
#         shutil.copyfileobj(file.file, buffer)
#     return {"filename": file.filename, "status": "uploaded successfully"}
