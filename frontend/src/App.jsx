import { useState, useEffect, useRef } from "react"
import axios from "axios"
import { createChart } from "lightweight-charts"
const API = "http://localhost:8000"

const POPULAR = ["AAPL", "TSLA", "GOOGL", "MSFT", "AMZN", "NVDA", "META", "RELIANCE.NS", "TCS.NS"]

function GlassCard({ children, style = {} }) {
  return (
    <div style={{
      background: "rgba(255,255,255,0.03)",
      border: "1px solid rgba(255,255,255,0.08)",
      borderRadius: 16,
      backdropFilter: "blur(12px)",
      padding: 24,
      ...style
    }}>{children}</div>
  )
}

function StatBadge({ label, value, color }) {
  return (
    <div style={{
      background: "rgba(255,255,255,0.04)",
      border: `1px solid ${color}33`,
      borderRadius: 12,
      padding: "12px 20px",
      textAlign: "center",
      minWidth: 120
    }}>
      <div style={{ fontSize: 22, fontWeight: 700, color }}>{value}</div>
      <div style={{ fontSize: 11, color: "#64748b", marginTop: 2, textTransform: "uppercase", letterSpacing: 1 }}>{label}</div>
    </div>
  )
}

function Spinner() {
  return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 16, padding: "60px 0" }}>
      <div style={{
        width: 48, height: 48, borderRadius: "50%",
        border: "3px solid rgba(124,58,237,0.2)",
        borderTop: "3px solid #7c3aed",
        animation: "spin 0.8s linear infinite"
      }} />
      <div style={{ color: "#64748b", fontSize: 14 }}>Running anomaly detection models...</div>
      <style>{`@keyframes spin { to { transform: rotate(360deg) } }`}</style>
    </div>
  )
}

function CandlestickChart({ priceData, anomaliesIf, anomaliesLstm }) {
  const chartRef = useRef(null)
  const containerRef = useRef(null)

  useEffect(() => {
    if (!containerRef.current || !priceData?.length) return

    const chart = createChart(containerRef.current, {
      width: containerRef.current.clientWidth,
      height: 420,
      layout: { background: { color: "transparent" }, textColor: "#94a3b8" },
      grid: { vertLines: { color: "rgba(255,255,255,0.04)" }, horzLines: { color: "rgba(255,255,255,0.04)" } },
      crosshair: { mode: 1 },
      rightPriceScale: { borderColor: "rgba(255,255,255,0.1)" },
      timeScale: { borderColor: "rgba(255,255,255,0.1)", timeVisible: true },
    })

    const candleSeries = chart.addCandlestickSeries({      upColor: "#22c55e",
      downColor: "#ef4444",
      borderUpColor: "#22c55e",
      borderDownColor: "#ef4444",
      wickUpColor: "#22c55e",
      wickDownColor: "#ef4444",
    })

    const candles = priceData.map(d => ({
      time: String(d.date).slice(0, 10),
      open: d.open, high: d.high, low: d.low, close: d.close
    })).sort((a, b) => a.time.localeCompare(b.time))

    candleSeries.setData(candles)

    // IF anomaly markers
    const ifMarkers = anomaliesIf.map(a => ({
      time: String(a.date).slice(0, 10),
      position: "aboveBar",
      color: "#ef4444",
      shape: "arrowDown",
      text: "IF"
    }))

    // LSTM anomaly markers
    const lstmMarkers = anomaliesLstm.map(a => ({
      time: String(a.date).slice(0, 10),
      position: "belowBar",
      color: "#f97316",
      shape: "arrowUp",
      text: "LSTM"
    }))

    const allMarkers = [...ifMarkers, ...lstmMarkers]
      .sort((a, b) => a.time.localeCompare(b.time))

    candleSeries.setMarkers(allMarkers)
    chart.timeScale().fitContent()
    chartRef.current = chart

    const handleResize = () => {
      chart.applyOptions({ width: containerRef.current.clientWidth })
    }
    window.addEventListener("resize", handleResize)
    return () => {
      window.removeEventListener("resize", handleResize)
      chart.remove()
    }
  }, [priceData, anomaliesIf, anomaliesLstm])

  return <div ref={containerRef} style={{ width: "100%", borderRadius: 12, overflow: "hidden" }} />
}

export default function App() {
  const [ticker, setTicker] = useState("AAPL")
  const [period, setPeriod] = useState("1y")
  const [loading, setLoading] = useState(false)
  const [data, setData] = useState(null)
  const [error, setError] = useState(null)
  const [tab, setTab] = useState("chart")
  const [runs, setRuns] = useState([])
  const [showSuggestions, setShowSuggestions] = useState(false)

  async function analyse() {
    setLoading(true)
    setError(null)
    setData(null)
    setShowSuggestions(false)
    try {
      const res = await axios.post(`${API}/analyse`, { ticker, period, contamination: 0.05 })
      setData(res.data)
      const runsRes = await axios.get(`${API}/runs`)
      setRuns(runsRes.data.runs)
      setTab("chart")
    } catch (e) {
      setError(e.response?.data?.detail || "Could not fetch data. Check the ticker and try again.")
    }
    setLoading(false)
  }

  const tabs = ["chart", "anomalies", "features", "mlflow"]

  return (
    <div style={{
      minHeight: "100vh",
      background: "linear-gradient(135deg, #0a0a14 0%, #0f0a1e 50%, #0a0f1e 100%)",
      color: "#e2e8f0",
      fontFamily: "'Inter', -apple-system, sans-serif"
    }}>
      {/* Ambient glow */}
      <div style={{
        position: "fixed", top: -200, left: "50%", transform: "translateX(-50%)",
        width: 800, height: 400, borderRadius: "50%",
        background: "radial-gradient(ellipse, rgba(124,58,237,0.12) 0%, transparent 70%)",
        pointerEvents: "none"
      }} />

      {/* Header */}
      <div style={{
        background: "rgba(255,255,255,0.02)",
        borderBottom: "1px solid rgba(255,255,255,0.06)",
        padding: "16px 40px",
        display: "flex", alignItems: "center", justifyContent: "space-between",
        backdropFilter: "blur(20px)",
        position: "sticky", top: 0, zIndex: 100
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <div style={{
            width: 36, height: 36, borderRadius: 10,
            background: "linear-gradient(135deg, #7c3aed, #4f46e5)",
            display: "flex", alignItems: "center", justifyContent: "center",
            fontSize: 18
          }}>📈</div>
          <div>
            <div style={{ fontSize: 18, fontWeight: 700, letterSpacing: "-0.5px" }}>
              Stock<span style={{ color: "#7c3aed" }}>Sense</span>
            </div>
            <div style={{ fontSize: 10, color: "#475569", letterSpacing: 2, textTransform: "uppercase" }}>Anomaly Detection</div>
          </div>
        </div>
        <div style={{ display: "flex", gap: 8 }}>
          {POPULAR.slice(0, 6).map(t => (
            <button key={t} onClick={() => { setTicker(t); }} style={{
              padding: "4px 12px", borderRadius: 6, border: "1px solid rgba(255,255,255,0.08)",
              background: ticker === t ? "rgba(124,58,237,0.2)" : "transparent",
              color: ticker === t ? "#a78bfa" : "#64748b",
              fontSize: 12, cursor: "pointer", transition: "all 0.2s"
            }}>{t}</button>
          ))}
        </div>
      </div>

      <div style={{ maxWidth: 1200, margin: "0 auto", padding: "32px 40px" }}>

        {/* Search Bar */}
        <GlassCard style={{ marginBottom: 24 }}>
          <div style={{ display: "flex", gap: 12, alignItems: "center", flexWrap: "wrap" }}>
            <div style={{ position: "relative", flex: 1, minWidth: 200 }}>
              <input
                value={ticker}
                onChange={e => { setTicker(e.target.value.toUpperCase()); setShowSuggestions(true) }}
                onFocus={() => setShowSuggestions(true)}
                onBlur={() => setTimeout(() => setShowSuggestions(false), 200)}
                onKeyDown={e => e.key === "Enter" && analyse()}
                placeholder="Enter ticker symbol..."
                style={{
                  width: "100%", padding: "12px 16px", borderRadius: 10,
                  border: "1px solid rgba(124,58,237,0.3)",
                  background: "rgba(124,58,237,0.05)",
                  color: "#e2e8f0", fontSize: 18, fontWeight: 600,
                  outline: "none", boxSizing: "border-box",
                  transition: "border-color 0.2s"
                }}
              />
              {showSuggestions && (
                <div style={{
                  position: "absolute", top: "100%", left: 0, right: 0, zIndex: 50,
                  background: "#1a1a2e", border: "1px solid rgba(255,255,255,0.1)",
                  borderRadius: 10, marginTop: 4, overflow: "hidden"
                }}>
                  {POPULAR.filter(t => t.includes(ticker) || ticker === "").map(t => (
                    <div key={t} onMouseDown={() => { setTicker(t); setShowSuggestions(false) }}
                      style={{
                        padding: "10px 16px", cursor: "pointer", fontSize: 14,
                        borderBottom: "1px solid rgba(255,255,255,0.05)",
                        transition: "background 0.1s"
                      }}
                      onMouseEnter={e => e.target.style.background = "rgba(124,58,237,0.15)"}
                      onMouseLeave={e => e.target.style.background = "transparent"}
                    >{t}</div>
                  ))}
                </div>
              )}
            </div>

            <select value={period} onChange={e => setPeriod(e.target.value)} style={{
              padding: "12px 16px", borderRadius: 10,
              border: "1px solid rgba(255,255,255,0.08)",
              background: "rgba(255,255,255,0.04)",
              color: "#e2e8f0", fontSize: 14, cursor: "pointer", outline: "none"
            }}>
              <option value="3mo">3 Months</option>
              <option value="6mo">6 Months</option>
              <option value="1y">1 Year</option>
              <option value="2y">2 Years</option>
            </select>

            <button onClick={analyse} disabled={loading} style={{
              padding: "12px 32px", borderRadius: 10,
              background: loading ? "rgba(124,58,237,0.4)" : "linear-gradient(135deg, #7c3aed, #4f46e5)",
              color: "white", border: "none", fontSize: 15, fontWeight: 600,
              cursor: loading ? "not-allowed" : "pointer",
              boxShadow: loading ? "none" : "0 0 20px rgba(124,58,237,0.4)",
              transition: "all 0.2s"
            }}>
              {loading ? "Analysing..." : "⚡ Analyse"}
            </button>
          </div>

          {/* Stats row */}
          {data && (
            <div style={{ display: "flex", gap: 12, marginTop: 20, flexWrap: "wrap" }}>
              <StatBadge label="Ticker" value={data.ticker} color="#a78bfa" />
              <StatBadge label="Trading Days" value={data.total_days} color="#60a5fa" />
              <StatBadge label="IF Anomalies" value={data.if_anomaly_count} color="#f87171" />
              <StatBadge label="LSTM Anomalies" value={data.lstm_anomaly_count} color="#fb923c" />
              <StatBadge label="IF Rate" value={`${((data.if_anomaly_count / data.total_days) * 100).toFixed(1)}%`} color="#34d399" />
            </div>
          )}
        </GlassCard>

        {error && (
          <div style={{
            marginBottom: 24, padding: "16px 20px",
            background: "rgba(239,68,68,0.1)", border: "1px solid rgba(239,68,68,0.3)",
            borderRadius: 12, color: "#fca5a5", display: "flex", alignItems: "center", gap: 10
          }}>❌ {error}</div>
        )}

        {loading && <GlassCard><Spinner /></GlassCard>}

        {data && !loading && (
          <GlassCard>
            {/* Tabs */}
            <div style={{ display: "flex", gap: 4, marginBottom: 24, borderBottom: "1px solid rgba(255,255,255,0.06)", paddingBottom: 0 }}>
              {tabs.map(t => (
                <button key={t} onClick={() => setTab(t)} style={{
                  padding: "10px 20px", border: "none", background: "none",
                  color: tab === t ? "#a78bfa" : "#475569",
                  borderBottom: tab === t ? "2px solid #7c3aed" : "2px solid transparent",
                  fontWeight: tab === t ? 600 : 400,
                  cursor: "pointer", fontSize: 14, transition: "all 0.2s",
                  textTransform: "capitalize"
                }}>{t === "mlflow" ? "MLflow Runs" : t.charAt(0).toUpperCase() + t.slice(1)}</button>
              ))}
            </div>

            {/* Chart Tab */}
            {tab === "chart" && (
              <div>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
                  <h3 style={{ margin: 0, fontSize: 16, color: "#a78bfa" }}>{data.ticker} — OHLC Candlestick with Anomaly Markers</h3>
                  <div style={{ display: "flex", gap: 16, fontSize: 12, color: "#64748b" }}>
                    <span>🔴 IF anomaly (above bar)</span>
                    <span>🟠 LSTM anomaly (below bar)</span>
                  </div>
                </div>
                <CandlestickChart
                  priceData={data.price_data}
                  anomaliesIf={data.anomalies_if}
                  anomaliesLstm={data.anomalies_lstm}
                />
              </div>
            )}

            {/* Anomalies Tab */}
            {tab === "anomalies" && (
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 24 }}>
                {[
                  { title: "🔴 Isolation Forest", data: data.anomalies_if, color: "#f87171", cols: ["date", "close", "score"] },
                  { title: "🟠 LSTM Autoencoder", data: data.anomalies_lstm, color: "#fb923c", cols: ["date", "close", "error"] }
                ].map(({ title, data: rows, color, cols }) => (
                  <div key={title}>
                    <h3 style={{ color, marginBottom: 12, fontSize: 15 }}>{title} — {rows.length} flagged</h3>
                    <div style={{ maxHeight: 420, overflowY: "auto", borderRadius: 10, border: "1px solid rgba(255,255,255,0.06)" }}>
                      <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
                        <thead>
                          <tr style={{ background: "rgba(255,255,255,0.04)", position: "sticky", top: 0 }}>
                            {["Date", "Close Price", cols[2].toUpperCase()].map(h => (
                              <th key={h} style={{ padding: "10px 14px", textAlign: "left", color: "#64748b", fontWeight: 500 }}>{h}</th>
                            ))}
                          </tr>
                        </thead>
                        <tbody>
                          {rows.map((r, i) => (
                            <tr key={i} style={{ borderBottom: "1px solid rgba(255,255,255,0.04)", transition: "background 0.1s" }}
                              onMouseEnter={e => e.currentTarget.style.background = "rgba(255,255,255,0.03)"}
                              onMouseLeave={e => e.currentTarget.style.background = "transparent"}
                            >
                              <td style={{ padding: "10px 14px" }}>{String(r.date).slice(0, 10)}</td>
                              <td style={{ padding: "10px 14px", fontWeight: 600 }}>${Number(r.close).toFixed(2)}</td>
                              <td style={{ padding: "10px 14px", color }}>{Number(r[cols[2]]).toFixed(4)}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Features Tab */}
            {tab === "features" && (
              <div>
                <h3 style={{ color: "#a78bfa", marginBottom: 20, fontSize: 15 }}>SHAP Feature Importance — Why did the model flag anomalies?</h3>
                {data.feature_importance.map((f, i) => {
                  const pct = (f.importance / data.feature_importance[0].importance) * 100
                  const colors = ["#7c3aed", "#6d28d9", "#5b21b6", "#4c1d95", "#3b0764", "#1e1b4b"]
                  return (
                    <div key={i} style={{ marginBottom: 18 }}>
                      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 8, fontSize: 14 }}>
                        <span style={{ color: "#cbd5e1", fontWeight: 500 }}>{f.feature}</span>
                        <span style={{ color: colors[i], fontWeight: 600 }}>{Number(f.importance).toFixed(4)}</span>
                      </div>
                      <div style={{ background: "rgba(255,255,255,0.06)", borderRadius: 6, height: 10, overflow: "hidden" }}>
                        <div style={{
                          background: `linear-gradient(90deg, ${colors[i]}, ${colors[i]}88)`,
                          height: "100%", borderRadius: 6,
                          width: `${pct}%`,
                          transition: "width 0.8s ease",
                          boxShadow: `0 0 8px ${colors[i]}66`
                        }} />
                      </div>
                    </div>
                  )
                })}
              </div>
            )}

            {/* MLflow Tab */}
            {tab === "mlflow" && (
              <div>
                <h3 style={{ color: "#a78bfa", marginBottom: 20, fontSize: 15 }}>Experiment Tracking — MLflow Runs</h3>
                <div style={{ borderRadius: 10, border: "1px solid rgba(255,255,255,0.06)", overflow: "hidden" }}>
                  <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
                    <thead>
                      <tr style={{ background: "rgba(255,255,255,0.04)" }}>
                        {["Run ID", "Model", "Ticker", "Anomalies", "Rate", "Timestamp"].map(h => (
                          <th key={h} style={{ padding: "12px 16px", textAlign: "left", color: "#64748b", fontWeight: 500 }}>{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {runs.map((r, i) => (
                        <tr key={i} style={{ borderBottom: "1px solid rgba(255,255,255,0.04)" }}
                          onMouseEnter={e => e.currentTarget.style.background = "rgba(255,255,255,0.03)"}
                          onMouseLeave={e => e.currentTarget.style.background = "transparent"}
                        >
                          <td style={{ padding: "12px 16px", color: "#475569", fontFamily: "monospace" }}>{r.run_id}</td>
                          <td style={{ padding: "12px 16px" }}>
                            <span style={{
                              padding: "3px 10px", borderRadius: 20, fontSize: 11,
                              background: r.model === "IsolationForest" ? "rgba(248,113,113,0.15)" : "rgba(251,146,60,0.15)",
                              color: r.model === "IsolationForest" ? "#f87171" : "#fb923c"
                            }}>{r.model}</span>
                          </td>
                          <td style={{ padding: "12px 16px", fontWeight: 600 }}>{r.ticker}</td>
                          <td style={{ padding: "12px 16px" }}>{r.n_anomalies}</td>
                          <td style={{ padding: "12px 16px", color: "#34d399" }}>{(r.anomaly_rate * 100).toFixed(1)}%</td>
                          <td style={{ padding: "12px 16px", color: "#475569" }}>{r.timestamp}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </GlassCard>
        )}

        {!data && !loading && !error && (
          <GlassCard style={{ textAlign: "center", padding: "60px 40px" }}>
            <div style={{ fontSize: 56, marginBottom: 16 }}>📊</div>
            <div style={{ fontSize: 20, fontWeight: 600, color: "#cbd5e1", marginBottom: 8 }}>
              Institutional-grade anomaly detection
            </div>
            <div style={{ color: "#475569", fontSize: 14, marginBottom: 24 }}>
              Isolation Forest + LSTM Autoencoder + SHAP Explainability + MLflow Tracking
            </div>
            <div style={{ display: "flex", gap: 8, justifyContent: "center", flexWrap: "wrap" }}>
              {POPULAR.map(t => (
                <button key={t} onClick={() => { setTicker(t); }} style={{
                  padding: "8px 16px", borderRadius: 8,
                  border: "1px solid rgba(124,58,237,0.3)",
                  background: "rgba(124,58,237,0.08)",
                  color: "#a78bfa", fontSize: 13, cursor: "pointer"
                }}>{t}</button>
              ))}
            </div>
          </GlassCard>
        )}
      </div>
    </div>
  )
}