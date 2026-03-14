from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import pandas as pd
import numpy as np

from data import fetch_stock_data
from models import run_isolation_forest, run_lstm_autoencoder
from mlflow_tracker import setup_mlflow, log_isolation_forest, log_lstm, get_recent_runs
from shap_explainer import get_shap_values, get_anomaly_explanation

app = FastAPI(title="StockSense API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173"],
    allow_methods=["*"],
    allow_headers=["*"],
)

setup_mlflow()

# ── Request Models ────────────────────────────────────────────────────────────

class AnalyseRequest(BaseModel):
    ticker: str
    period: str = "1y"
    contamination: float = 0.05

# ── Routes ────────────────────────────────────────────────────────────────────

@app.get("/")
def root():
    return {"message": "StockSense API is running"}

@app.post("/analyse")
def analyse(req: AnalyseRequest):
    try:
        df = fetch_stock_data(req.ticker, req.period)
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))

    # Run models
    df_if, if_model, if_scaler = run_isolation_forest(df, req.contamination)
    df_full, lstm_model, lstm_scaler, threshold = run_lstm_autoencoder(df_if)

    # Log to MLflow
    log_isolation_forest(df_full, req.ticker, req.contamination, if_model, if_scaler)
    log_lstm(df_full, req.ticker, seq_len=10, epochs=20, threshold=threshold)

    # SHAP
    shap_values, feature_importance = get_shap_values(df_full, if_model, if_scaler)

    # Build response
    df_full.index = df_full.index.astype(str)

    price_data = df_full[["Close", "Open", "High", "Low", "Volume"]].reset_index()
    price_data.columns = ["date", "close", "open", "high", "low", "volume"]

    anomalies_if = df_full[df_full["IF_Anomaly"] == 1][["Close", "IF_Score"]].reset_index()
    anomalies_if.columns = ["date", "close", "score"]

    anomalies_lstm = df_full[df_full["LSTM_Anomaly"] == 1][["Close", "LSTM_Error"]].reset_index()
    anomalies_lstm.columns = ["date", "close", "error"]

    return {
        "ticker":           req.ticker,
        "total_days":       len(df_full),
        "price_data":       price_data.to_dict(orient="records"),
        "anomalies_if":     anomalies_if.to_dict(orient="records"),
        "anomalies_lstm":   anomalies_lstm.to_dict(orient="records"),
        "feature_importance": feature_importance.to_dict(orient="records"),
        "if_anomaly_count": int(df_full["IF_Anomaly"].sum()),
        "lstm_anomaly_count": int(df_full["LSTM_Anomaly"].sum()),
    }

@app.get("/runs")
def get_runs():
    df = get_recent_runs(20)
    if df.empty:
        return {"runs": []}
    return {"runs": df.to_dict(orient="records")}

@app.get("/health")
def health():
    return {"status": "ok"}