# 📈 StockSense — AI-Powered Stock Anomaly Detection

![Python](https://img.shields.io/badge/Python-3.11-blue?style=flat-square&logo=python)
![FastAPI](https://img.shields.io/badge/FastAPI-0.135-green?style=flat-square&logo=fastapi)
![React](https://img.shields.io/badge/React-18-61DAFB?style=flat-square&logo=react)
![MLflow](https://img.shields.io/badge/MLflow-3.10-orange?style=flat-square&logo=mlflow)
![PyTorch](https://img.shields.io/badge/PyTorch-2.10-EE4C2C?style=flat-square&logo=pytorch)

> Institutional-grade stock anomaly detection using Isolation Forest + LSTM Autoencoder, with SHAP explainability and MLflow experiment tracking — served via a FastAPI backend and a React + lightweight-charts dashboard.

---

---

## 🧠 What It Does

StockSense analyses any stock ticker and flags **statistically anomalous trading days** — days where price movement, volatility, or volume deviate significantly from learned patterns. Two independent models are run in parallel and compared:

| Model | Approach | Best For |
|---|---|---|
| **Isolation Forest** | Tree-based outlier scoring | Sharp, sudden anomalies |
| **LSTM Autoencoder** | Sequence reconstruction error | Temporal pattern breaks |

SHAP values explain *why* each anomaly was flagged — which features (volatility, returns, Z-score) drove the detection.

---

## 🏗️ Architecture
```
stocksense/
├── backend/
│   ├── main.py              # FastAPI app — REST API
│   ├── data.py              # yfinance data fetching + feature engineering
│   ├── models.py            # Isolation Forest + LSTM Autoencoder
│   ├── mlflow_tracker.py    # Experiment logging + run history
│   └── shap_explainer.py    # SHAP feature importance
├── frontend/
│   └── src/
│       └── App.jsx          # React dashboard — candlestick charts + UI
└── README.md
```

---

## ⚙️ Features

- 🕯️ **OHLC Candlestick Charts** — TradingView-style via lightweight-charts
- 🔴 **Isolation Forest** — classical ML anomaly detection
- 🟠 **LSTM Autoencoder** — deep learning sequence anomaly detection
- 💡 **SHAP Explainability** — feature importance for every prediction
- 📊 **MLflow Tracking** — full experiment history, params, metrics
- ⚡ **FastAPI Backend** — async REST API with Pydantic validation
- 🎨 **Glassmorphism UI** — dark fintech dashboard built in React

---

## 🚀 Running Locally

### 1. Clone the repo
```bash
git clone https://github.com/GayathreVaidyanathan/stocksense.git
cd stocksense
```

### 2. Backend setup
```bash
python -m venv venv
venv\Scripts\activate        # Windows
pip install -r requirements.txt
cd backend
python -m uvicorn main:app --reload
```

### 3. Frontend setup
```bash
cd frontend
npm install
npm run dev
```

### 4. Open the app
- Frontend: http://localhost:5173
- API docs: http://localhost:8000/docs

---

## 📦 Tech Stack

**Backend**
- FastAPI + Uvicorn
- yfinance — real-time stock data
- scikit-learn — Isolation Forest
- PyTorch — LSTM Autoencoder
- SHAP — model explainability
- MLflow — experiment tracking
- Pandas / NumPy

**Frontend**
- React 18 + Vite
- lightweight-charts — candlestick charts
- Recharts — supporting visualisations
- Axios — API calls

---

## 📊 Feature Engineering

Raw OHLCV data is transformed into 6 features before model input:

| Feature | Description |
|---|---|
| `Returns` | Daily percentage price change |
| `Log_Returns` | Log-normalised returns |
| `Volatility` | 10-day rolling standard deviation |
| `Volume_Change` | Daily volume percentage change |
| `Price_Range` | (High - Low) / Close |
| `Z_Score` | 20-day rolling Z-score of close price |

---

## 🔬 MLflow Experiment Tracking

Every analysis run logs to MLflow:
- **Parameters:** ticker, model type, contamination rate, sequence length
- **Metrics:** anomaly count, anomaly rate, model scores
- **Artifacts:** trained Isolation Forest model

View the MLflow UI:
```bash
mlflow ui --backend-store-uri ./mlruns
```

---

## 👩‍💻 Author

**Gayathre Vaidyanathan**  
[GitHub](https://github.com/GayathreVaidyanathan) • [LinkedIn](https://linkedin.com/in/gayathre-vaidyanathan)
