import yfinance as yf
import pandas as pd
import numpy as np

def fetch_stock_data(ticker: str, period: str = "1y") -> pd.DataFrame:
    """Fetch historical stock data and engineer features."""
    stock = yf.Ticker(ticker)
    df = stock.history(period=period)
    
    if df.empty:
        raise ValueError(f"No data found for ticker: {ticker}")
    
    df = df[["Open", "High", "Low", "Close", "Volume"]].copy()
    
    # Feature engineering
    df["Returns"]        = df["Close"].pct_change()
    df["Log_Returns"]    = np.log(df["Close"] / df["Close"].shift(1))
    df["Volatility"]     = df["Returns"].rolling(window=10).std()
    df["MA_20"]          = df["Close"].rolling(window=20).mean()
    df["MA_50"]          = df["Close"].rolling(window=50).mean()
    df["Volume_Change"]  = df["Volume"].pct_change()
    df["Price_Range"]    = (df["High"] - df["Low"]) / df["Close"]
    df["Z_Score"]        = (df["Close"] - df["Close"].rolling(20).mean()) / df["Close"].rolling(20).std()
    
    df.dropna(inplace=True)
    return df