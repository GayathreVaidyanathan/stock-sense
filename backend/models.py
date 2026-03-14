import numpy as np
import pandas as pd
from sklearn.ensemble import IsolationForest
from sklearn.preprocessing import StandardScaler
import torch
import torch.nn as nn

FEATURES = ["Returns", "Log_Returns", "Volatility", "Volume_Change", "Price_Range", "Z_Score"]

# ── Isolation Forest ──────────────────────────────────────────────────────────

def run_isolation_forest(df: pd.DataFrame, contamination: float = 0.05):
    scaler = StandardScaler()
    X = scaler.fit_transform(df[FEATURES])
    
    model = IsolationForest(contamination=contamination, random_state=42, n_estimators=100)
    preds = model.fit_predict(X)
    scores = model.decision_function(X)
    
    df = df.copy()
    df["IF_Anomaly"] = (preds == -1).astype(int)
    df["IF_Score"]   = -scores  # higher = more anomalous
    return df, model, scaler

# ── LSTM Autoencoder ──────────────────────────────────────────────────────────

class LSTMAutoencoder(nn.Module):
    def __init__(self, input_size, hidden_size=32, num_layers=2):
        super().__init__()
        self.encoder = nn.LSTM(input_size, hidden_size, num_layers, batch_first=True)
        self.decoder = nn.LSTM(hidden_size, input_size, num_layers, batch_first=True)

    def forward(self, x):
        _, (h, c) = self.encoder(x)
        # repeat hidden state across sequence length
        seq_len = x.size(1)
        h_repeated = h[-1].unsqueeze(1).repeat(1, seq_len, 1)
        out, _ = self.decoder(h_repeated)
        return out

def run_lstm_autoencoder(df: pd.DataFrame, seq_len: int = 10, epochs: int = 20, threshold_pct: float = 95):
    scaler = StandardScaler()
    X_scaled = scaler.fit_transform(df[FEATURES])

    # Build sequences
    sequences = []
    for i in range(len(X_scaled) - seq_len):
        sequences.append(X_scaled[i:i+seq_len])
    X_tensor = torch.tensor(np.array(sequences), dtype=torch.float32)

    model = LSTMAutoencoder(input_size=len(FEATURES))
    optimizer = torch.optim.Adam(model.parameters(), lr=0.001)
    criterion = nn.MSELoss()

    model.train()
    for epoch in range(epochs):
        optimizer.zero_grad()
        output = model(X_tensor)
        loss = criterion(output, X_tensor)
        loss.backward()
        optimizer.step()

    # Reconstruction errors
    model.eval()
    with torch.no_grad():
        output = model(X_tensor)
        errors = ((output - X_tensor) ** 2).mean(dim=(1, 2)).numpy()

    threshold = np.percentile(errors, threshold_pct)
    anomalies = (errors > threshold).astype(int)

    # Align with original df (sequences start at index seq_len)
    df = df.copy()
    df["LSTM_Anomaly"] = 0
    df["LSTM_Error"]   = 0.0
    df.iloc[seq_len:seq_len + len(anomalies), df.columns.get_loc("LSTM_Anomaly")] = anomalies
    df.iloc[seq_len:seq_len + len(errors),    df.columns.get_loc("LSTM_Error")]   = errors

    return df, model, scaler, threshold