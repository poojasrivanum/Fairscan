# main.py — FairScan FastAPI backend
# Run with: uvicorn main:app --reload

import os
import io
import pandas as pd
from fastapi import FastAPI, UploadFile, File, Form, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import StreamingResponse, JSONResponse
from dotenv import load_dotenv

from bias_engine import analyze_bias
from gemini_explainer import explain_bias
from report_generator import generate_pdf

load_dotenv()

app = FastAPI(
    title="FairScan API",
    description="AI-powered bias detection for hiring, loans, and healthcare decisions.",
    version="1.0.0",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

SAMPLE_PATH = os.path.join(os.path.dirname(__file__), "sample_data", "hiring.csv")


@app.get("/")
def root():
    return {"status": "FairScan API running", "version": "1.0.0", "docs": "/docs"}


@app.get("/health")
def health():
    return {"status": "healthy"}


@app.get("/sample")
def analyze_sample():
    """
    Analyze the built-in hiring dataset.
    Powers the 'Try demo' button — no file upload needed.
    """
    try:
        df = pd.read_csv(SAMPLE_PATH)
        metrics = analyze_bias(df, outcome_col="hired")
        explanation = explain_bias(metrics)
        return {
        **metrics,
        "explanation": explanation.get("explanation"),
        "recommendations": explanation.get("recommendations", [])
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/analyze")
async def analyze_upload(
    file: UploadFile = File(...),
    outcome_col: str = Form(default="hired"),
):
    """
    Accept a CSV upload and return bias metrics + explanation.
    """
    if not file.filename.endswith(".csv"):
        raise HTTPException(status_code=400, detail="Only CSV files are supported.")

    contents = await file.read()
    try:
        df = pd.read_csv(io.StringIO(contents.decode("utf-8")))
    except Exception:
        raise HTTPException(status_code=400, detail="Could not parse CSV. Ensure it is valid UTF-8.")

    if len(df) < 30:
        raise HTTPException(status_code=400, detail="Dataset must have at least 30 rows.")

    if outcome_col not in df.columns:
        available = ", ".join(df.columns.tolist())
        raise HTTPException(
            status_code=400,
            detail=f"Outcome column '{outcome_col}' not found. Available columns: {available}",
        )

    try:
        metrics = analyze_bias(df, outcome_col=outcome_col)
        explanation = explain_bias(metrics)
        return {**metrics, "explanation": explanation}
    except ValueError as e:
        raise HTTPException(status_code=422, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Analysis failed: {str(e)}")


@app.post("/report")
async def download_report(payload: dict):
    """
    Generate and return a PDF audit report from the analysis results.
    """
    try:
        metrics = {k: v for k, v in payload.items() if k != "explanation"}
        explanation = payload.get("explanation", {})
        pdf_bytes = generate_pdf(metrics, explanation)
        return StreamingResponse(
            io.BytesIO(pdf_bytes),
            media_type="application/pdf",
            headers={"Content-Disposition": "attachment; filename=fairscan_audit_report.pdf"},
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Report generation failed: {str(e)}")

@app.post("/ask")
async def ask_ai(payload: dict):
    try:
        question = payload.get("question", "").lower()
        context = payload.get("context", {})

        score = context.get("bias_score", "unknown")
        severity = context.get("overall_severity", "unknown")

        # 🧠 Smart handling
        if "fix" in question:
            answer = "To reduce bias, you can rebalance your dataset, adjust decision thresholds, or remove features that correlate with protected attributes."

        elif "why" in question:
            answer = "The bias occurs because different groups receive significantly different outcome rates, which violates fairness thresholds like the 80% rule."

        elif "what" in question:
            answer = f"This dataset has a bias score of {score}, indicating {severity.lower()} risk of unfair outcomes across groups."

        elif "thank" in question:
            answer = "You're welcome! Let me know if you want help reducing bias."

        else:
            answer = f"The dataset shows imbalance across protected groups. Bias Score: {score}, Severity: {severity}."

        return {"answer": answer}

    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
@app.exception_handler(Exception)
async def global_exception_handler(request, exc):
    return JSONResponse(
        status_code=500,
        content={"detail": "Internal server error", "message": str(exc)},
    )


if __name__ == "__main__":
    import uvicorn
    print("\n🚀 FairScan API starting at http://localhost:8000")
    print("📖 API docs at http://localhost:8000/docs\n")
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)
