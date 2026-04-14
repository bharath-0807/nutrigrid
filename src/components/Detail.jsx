import { useState } from "react";
import { ArrowLeft, FileText, Activity, TrendingUp, MapPin, ClipboardList, AlertTriangle, CheckCircle } from "lucide-react";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from "recharts";
import { lmsZScore, classifyChild, getGrowthVelocity, buildChartData, getOptimalTarget } from "../utils/lmsCalc";
import { generateChildPDF } from "../utils/pdfGenerator";
import { GRADE_CFG, CLINICAL_RECS, CHART_STYLES as CS } from "../data/clinicalConfig";
import DietForecast from "./DietForecast";

export default function Detail({ child, grades, setScreen }) {
  const [mainTab, setMainTab] = useState("growth");
  const [chartTab, setChartTab] = useState("weight");
  const [dietData, setDietData] = useState(null);

  if (!child) return null;
  const last = child.records[child.records.length - 1];
  const waz = lmsZScore(last.weight, last.month, child.gender, "weight");
  const haz = lmsZScore(last.height, last.month, child.gender, "height");
  const g = grades[child.id] ?? "Normal";
  const cfg = GRADE_CFG[g];
  const data = buildChartData(child, chartTab);
  const vel = getGrowthVelocity(child.records, chartTab);

  const MAIN_TABS = [
    { id: "growth", label: "📈 Growth & History" },
    { id: "diet", label: "🥗 Diet & Forecast" },
  ];

  return (
    <>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16, flexWrap: "wrap", gap: 8 }}>
        <button className="btn-ghost" onClick={() => setScreen("children")}><ArrowLeft size={13} /> Back to Registry</button>
        <button className="btn-primary" onClick={() => generateChildPDF(child, g, waz, haz, dietData)}><FileText size={13} /> Download Child Report {dietData ? "(+Diet)" : ""}</button>
      </div>

      <div className="detail-header">
        <div className="detail-avatar">{child.gender === "boys" ? "👦" : "👧"}</div>
        <div style={{ flex: 1 }}>
          <div style={{ fontWeight: 700, fontSize: 20, color: "#fff" }}>{child.name}</div>
          <div style={{ fontSize: 12.5, color: "rgba(255,255,255,0.65)", marginTop: 5, display: "flex", gap: 14, flexWrap: "wrap" }}>
            <span>{last.month} months</span><span>·</span>
            <span>{child.gender === "boys" ? "Male" : "Female"}</span><span>·</span>
            <span style={{ display: "flex", alignItems: "center", gap: 3 }}><MapPin size={10} />{child.village}</span>
          </div>
        </div>
        <div style={{ textAlign: "right" }}>
          <span className={`chip ${cfg.chip}`} style={{ fontSize: 12.5, padding: "5px 14px" }}>{g}</span>
          <div style={{ fontSize: 11, color: "rgba(255,255,255,0.5)", marginTop: 6, fontFamily: "IBM Plex Mono" }}>{cfg.full}</div>
        </div>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14, marginBottom: 14 }}>
        <div className="clinical-card" style={{ background: cfg.bg, borderColor: cfg.border, borderLeftColor: cfg.col }}>
          {g === "Normal" ? <CheckCircle size={20} color={cfg.col} /> : <AlertTriangle size={20} color={cfg.col} />}
          <div>
            <div style={{ fontWeight: 700, fontSize: 14, color: cfg.col }}>{cfg.full}</div>
            <div style={{ fontSize: 12, color: "#3D5166", marginTop: 4, fontFamily: "IBM Plex Mono" }}>WAZ: {waz.toFixed(3)}  ·  HAZ: {haz.toFixed(3)}</div>
            {vel && <div style={{ fontSize: 11, color: "#7A92A8", marginTop: 3 }}>Velocity: {vel} {chartTab === "weight" ? "kg" : "cm"}/month</div>}
          </div>
        </div>
        <div className="metric-grid" style={{ margin: 0 }}>
          <div className="metric-card" style={{ position: "relative" }}>
            <Activity size={14} color="#00509E" />
            <div className="metric-value" style={{ color: "#00509E" }}>{last.weight}<span style={{ fontSize: 13, fontWeight: 400 }}> kg</span></div>
            <div className="metric-label">Current Weight</div>
            <div style={{ marginTop: 8, fontSize: 11, color: "#7A92A8", background: "#f8fafc", padding: "4px 8px", borderRadius: 4, display: "inline-block", border: "1px dashed #cbd5e1" }}>
              WHO Ideal Target: <strong>{getOptimalTarget(last.month, child.gender, "weight").toFixed(1)} kg</strong>
            </div>
          </div>
          <div className="metric-card" style={{ position: "relative" }}>
            <TrendingUp size={14} color="#007B83" />
            <div className="metric-value" style={{ color: "#007B83" }}>{last.height}<span style={{ fontSize: 13, fontWeight: 400 }}> cm</span></div>
            <div className="metric-label">Current Height</div>
            <div style={{ marginTop: 8, fontSize: 11, color: "#7A92A8", background: "#f8fafc", padding: "4px 8px", borderRadius: 4, display: "inline-block", border: "1px dashed #cbd5e1" }}>
              WHO Ideal Target: <strong>{getOptimalTarget(last.month, child.gender, "height").toFixed(1)} cm</strong>
            </div>
          </div>
        </div>
      </div>

      <div style={{ display: "flex", gap: 6, marginBottom: 14, borderBottom: "2px solid #E8EDF3", paddingBottom: 0 }}>
        {MAIN_TABS.map((t) => (
          <button key={t.id} onClick={() => setMainTab(t.id)}
            style={{ padding: "9px 20px", border: "none", borderBottom: mainTab === t.id ? "3px solid #00509E" : "3px solid transparent", cursor: "pointer", fontSize: 13, fontWeight: mainTab === t.id ? 700 : 500, fontFamily: "IBM Plex Sans,sans-serif", background: "transparent", color: mainTab === t.id ? "#00509E" : "#7A92A8", transition: "all 0.15s", marginBottom: -2 }}>
            {t.label}
          </button>
        ))}
      </div>

      {mainTab === "growth" && (
        <>
          <div className="card" style={{ marginBottom: 14 }}>
            <div className="card-header"><div className="card-title">Anthropometric History</div></div>
            <div className="table-wrap">
              <table>
                <thead><tr><th>Visit</th><th>Weight</th><th>Height</th><th>WAZ</th><th>HAZ</th><th>WHO Grade</th></tr></thead>
                <tbody>
                  {child.records.map((r, i) => {
                    const rW = lmsZScore(r.weight, r.month, child.gender, "weight");
                    const rH = lmsZScore(r.height, r.month, child.gender, "height");
                    const rG = classifyChild(rW, rH), rC = GRADE_CFG[rG];
                    return (
                      <tr key={i}>
                        <td style={{ fontFamily: "IBM Plex Mono", fontWeight: 600, color: "#0D1B2A" }}>{r.month} mo</td>
                        <td style={{ fontFamily: "IBM Plex Mono" }}>{r.weight} kg</td>
                        <td style={{ fontFamily: "IBM Plex Mono" }}>{r.height} cm</td>
                        <td style={{ fontFamily: "IBM Plex Mono", fontWeight: 700, color: rW < -2 ? "#B03A2E" : "#1E8449" }}>{rW.toFixed(3)}</td>
                        <td style={{ fontFamily: "IBM Plex Mono", fontWeight: 700, color: rH < -2 ? "#B03A2E" : "#1E8449" }}>{rH.toFixed(3)}</td>
                        <td><span className={`chip ${rC.chip}`}>{rG}</span></td>
                      </tr>);
                  })}
                </tbody>
              </table>
            </div>
          </div>

          <div className="card" style={{ marginBottom: 14 }}>
            <div className="card-header">
              <div><div className="card-title">Growth Chart vs WHO Reference</div><div className="card-subtitle">LMS-derived curves · Median, −2SD, −3SD</div></div>
              <div style={{ display: "flex", gap: 6 }}>
                {["weight", "height"].map((t) => (
                  <button key={t} onClick={() => setChartTab(t)} style={{ padding: "6px 16px", borderRadius: 3, border: chartTab === t ? "none" : "1.5px solid #D0D9E4", cursor: "pointer", fontSize: 12.5, fontWeight: 600, fontFamily: "IBM Plex Sans,sans-serif", background: chartTab === t ? "#00509E" : "transparent", color: chartTab === t ? "#fff" : "#3D5166" }}>
                    {t === "weight" ? "WAZ" : "HAZ"}
                  </button>))}
              </div>
            </div>
            <div className="card-body">
              <ResponsiveContainer width="100%" height={240}>
                <LineChart data={data} margin={{ left: -10, right: 10 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke={CS.grid} />
                  <XAxis dataKey="age" tick={CS.axis} /><YAxis tick={CS.axis} />
                  <Tooltip {...CS.tooltip} /><Legend wrapperStyle={{ fontSize: 12, fontFamily: "IBM Plex Sans" }} />
                  <Line type="monotone" dataKey="Median" stroke="#1E8449" strokeDasharray="6 3" dot={false} strokeWidth={1.5} />
                  <Line type="monotone" dataKey="-2SD" stroke="#CA6F1E" strokeDasharray="4 3" dot={false} strokeWidth={1.5} />
                  <Line type="monotone" dataKey="-3SD" stroke="#B03A2E" strokeDasharray="3 3" dot={false} strokeWidth={1.5} />
                  <Line type="monotone" dataKey="Child" stroke="#00509E" strokeWidth={2.5} dot={{ fill: "#00509E", r: 4, strokeWidth: 0 }} connectNulls={false} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="ai-box">
            <div className="ai-box-title"><ClipboardList size={12} /> Clinical Protocol — {g} ({cfg.full})</div>
            <ul>{CLINICAL_RECS[g]?.map((r, i) => <li key={i}>{r}</li>)}</ul>
            <div style={{ marginTop: 12, fontSize: 11, color: "#7A92A8", borderTop: "1px solid #C2DCF5", paddingTop: 10, fontFamily: "IBM Plex Mono" }}>
              WHO LMS Box-Cox · WAZ:{waz.toFixed(3)} HAZ:{haz.toFixed(3)} · {cfg.full} · WHO Child Growth Standards 2006
            </div>
          </div>
        </>
      )}

      {mainTab === "diet" && <DietForecast child={child} grade={g} onDietReady={setDietData} />}
    </>
  );
}
