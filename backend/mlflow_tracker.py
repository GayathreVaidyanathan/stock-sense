import mlflow
import mlflow.sklearn
import pandas as pd
import numpy as np

def setup_mlflow(experiment_name: str = "StockSense"):
    mlflow.set_tracking_uri("./mlruns")
    mlflow.set_experiment(experiment_name)

def log_isolation_forest(df: pd.DataFrame, ticker: str, contamination: float, model, scaler):
    with mlflow.start_run(run_name=f"IsolationForest_{ticker}"):
        # Params
        mlflow.log_param("ticker",        ticker)
        mlflow.log_param("model",         "IsolationForest")
        mlflow.log_param("contamination", contamination)

        # Metrics
        n_anomalies = df["IF_Anomaly"].sum()
        anomaly_rate = n_anomalies / len(df)
        avg_score = df["IF_Score"].mean()
        max_score = df["IF_Score"].max()

        mlflow.log_metric("n_anomalies",  int(n_anomalies))
        mlflow.log_metric("anomaly_rate", round(float(anomaly_rate), 4))
        mlflow.log_metric("avg_if_score", round(float(avg_score), 4))
        mlflow.log_metric("max_if_score", round(float(max_score), 4))

        # Model
        mlflow.sklearn.log_model(model, "isolation_forest_model")

        run_id = mlflow.active_run().info.run_id
    return run_id

def log_lstm(df: pd.DataFrame, ticker: str, seq_len: int, epochs: int, threshold: float):
    with mlflow.start_run(run_name=f"LSTM_Autoencoder_{ticker}"):
        # Params
        mlflow.log_param("ticker",   ticker)
        mlflow.log_param("model",    "LSTM_Autoencoder")
        mlflow.log_param("seq_len",  seq_len)
        mlflow.log_param("epochs",   epochs)

        # Metrics
        n_anomalies = df["LSTM_Anomaly"].sum()
        anomaly_rate = n_anomalies / len(df)
        avg_error = df["LSTM_Error"].mean()

        mlflow.log_metric("n_anomalies",  int(n_anomalies))
        mlflow.log_metric("anomaly_rate", round(float(anomaly_rate), 4))
        mlflow.log_metric("threshold",    round(float(threshold), 6))
        mlflow.log_metric("avg_lstm_error", round(float(avg_error), 6))

        run_id = mlflow.active_run().info.run_id
    return run_id

def get_recent_runs(n: int = 10) -> pd.DataFrame:
    setup_mlflow()
    client = mlflow.tracking.MlflowClient()
    experiment = client.get_experiment_by_name("StockSense")
    if experiment is None:
        return pd.DataFrame()
    
    runs = client.search_runs(
        experiment_ids=[experiment.experiment_id],
        max_results=n,
        order_by=["start_time DESC"]
    )
    
    if not runs:
        return pd.DataFrame()

    records = []
    for run in runs:
        records.append({
            "run_id":       run.info.run_id[:8],
            "model":        run.data.params.get("model", ""),
            "ticker":       run.data.params.get("ticker", ""),
            "n_anomalies":  run.data.metrics.get("n_anomalies", 0),
            "anomaly_rate": run.data.metrics.get("anomaly_rate", 0),
            "timestamp":    pd.to_datetime(run.info.start_time, unit="ms").strftime("%Y-%m-%d %H:%M"),
        })
    return pd.DataFrame(records)