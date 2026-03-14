import shap
import numpy as np
import pandas as pd
from sklearn.ensemble import IsolationForest
from sklearn.preprocessing import StandardScaler

FEATURES = ["Returns", "Log_Returns", "Volatility", "Volume_Change", "Price_Range", "Z_Score"]

def get_shap_values(df: pd.DataFrame, model: IsolationForest, scaler: StandardScaler):
    """Compute SHAP values for Isolation Forest predictions."""
    X = scaler.transform(df[FEATURES])
    
    explainer = shap.TreeExplainer(model)
    shap_values = explainer.shap_values(X)
    
    # Mean absolute SHAP per feature
    mean_shap = np.abs(shap_values).mean(axis=0)
    feature_importance = pd.DataFrame({
        "feature":    FEATURES,
        "importance": mean_shap
    }).sort_values("importance", ascending=False)
    
    return shap_values, feature_importance

def get_anomaly_explanation(df: pd.DataFrame, shap_values: np.ndarray, idx: int):
    """Explain why a specific row was flagged as anomalous."""
    row_shap = shap_values[idx]
    explanation = pd.DataFrame({
        "feature": FEATURES,
        "value":   df[FEATURES].iloc[idx].values.round(4),
        "shap":    row_shap.round(4)
    }).sort_values("shap", key=abs, ascending=False)
    return explanation