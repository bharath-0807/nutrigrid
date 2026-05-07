import { useState } from "react";
import { ArrowLeft, FileText, Activity, TrendingUp, MapPin, ClipboardList, AlertTriangle, CheckCircle, User, Utensils, Clock, UserCheck, Syringe, Heart, TrendingDown } from "lucide-react";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from "recharts";
import { lmsZScore, classifyChild, getGrowthVelocity, buildChartData, getOptimalTarget } from "../utils/lmsCalc";
import { generateChildPDF } from "../utils/pdfGenerator";
import { GRADE_CFG, CLINICAL_RECS, CHART_STYLES as CS } from "../data/clinicalConfig";
import DietForecast from "./DietForecast";
import ZScoreCurve from "./ZScoreCurve";

export default function Detail({ child, grades, setScreen }) {
  const [mainTab, setMainTab] = useState("growth");
  const [chartTab, setChartTab] = useState("weight");
  const [dietData, setDietData] = useState(null);

  if (!child) return null;
  const last = child.records[child.records.length - 1];
  const sexAtBirth = child.sexAtBirth || (child.gender === "transgender" ? "boys" : undefined);
  const waz = lmsZScore(last.weight, last.month, child.gender, "weight", sexAtBirth);
  const haz = lmsZScore(last.height, last.month, child.gender, "height", sexAtBirth);
  const g = grades[child.id] ?? "Normal";
  const cfg = GRADE_CFG[g];
  const data = buildChartData(child, chartTab);
  const vel = getGrowthVelocity(child.records, chartTab);

  // Delta comparisons
  const prev = child.records.length >= 2 ? child.records[child.records.length - 2] : null;
  const weightDelta = prev ? (last.weight - prev.weight).toFixed(1) : null;
  const heightDelta = prev ? (last.height - prev.height).toFixed(1) : null;

  const genderLabel = child.gender === "boys" ? "Male" : child.gender === "girls" ? "Female" : "Transgender";

  // Growth history line chart data (weight/height over time)
  const growthLineData = child.records.map((r) => ({
    age: `${r.month}mo`,
    Weight: r.weight,
    Height: r.height,
  }));

  const MAIN_TABS = [
    { id: "growth", label: "Growth & History", icon: TrendingUp },
    { id: "medical", label: "Medical & Vaccine", icon: Heart },
    { id: "diet", label: "Diet & Forecast", icon: Utensils },
  ];

  return (
    <>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16, flexWrap: "wrap", gap: 8 }}>
        <button className="btn-ghost" onClick={() => setScreen("children")}><ArrowLeft size={13} /> Back to Register</button>
        <button className="btn-primary" onClick={() => generateChildPDF(child, g, waz, haz, dietData)}><FileText size={13} /> Download Child Report {dietData ? "(+Diet)" : ""}</button>
      </div>

      {/* HEADER */}
      <div className="detail-header" style={{ background: "#0F172A", padding: 24, borderRadius: 16, marginBottom: 16, display: "flex", alignItems: "center", gap: 16, flexWrap: "wrap" }}>
        <div className="detail-avatar" style={{ width: 48, height: 48, borderRadius: "50%", background: "rgba(255,255,255,0.1)", display: "flex", alignItems: "center", justifyContent: "center" }}><User size={24} color="#fff" /></div>
        <div style={{ flex: 1, minWidth: 200 }}>
          <div style={{ fontWeight: 800, fontSize: 24, color: "#fff", fontFamily: "var(--font-heading)" }}>{child.name}</div>
          <div style={{ fontSize: 13, color: "rgba(255,255,255,0.7)", marginTop: 6, display: "flex", gap: 14, flexWrap: "wrap", fontWeight: 500 }}>
            <span style={{ fontFamily: "IBM Plex Mono", fontWeight: 700, color: "#60A5FA" }}>{child.nutrigridId || "—"}</span><span>·</span>
            <span>{last.month} months</span><span>·</span>
            <span style={{ color: child.gender === "transgender" ? "#C4B5FD" : "rgba(255,255,255,0.7)" }}>{genderLabel}</span><span>·</span>
            <span style={{ display: "flex", alignItems: "center", gap: 4 }}><MapPin size={12} />{child.village}</span>
          </div>
        </div>
        <div style={{ textAlign: "right" }}>
          <span className={`chip ${cfg.chip}`} style={{ fontSize: 13, padding: "6px 16px" }}>{g}</span>
          <div style={{ fontSize: 11, color: "rgba(255,255,255,0.5)", marginTop: 8, fontFamily: "IBM Plex Mono", fontWeight: 500 }}>{cfg.full}</div>
        </div>
      </div>

      {/* Z-SCORE CURVES */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14, marginBottom: 16 }}>
        <ZScoreCurve zScore={waz} type="Weight Distribution (WAZ)" />
        <ZScoreCurve zScore={haz} type="Height Distribution (HAZ)" />
      </div>

      {/* METRICS WITH DELTAS */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14, marginBottom: 14 }}>
        <div className="clinical-card" style={{ background: cfg.bg, borderColor: cfg.border, borderLeftColor: cfg.col }}>
          {g === "Normal" ? <CheckCircle size={20} color={cfg.col} /> : <AlertTriangle size={20} color={cfg.col} />}
          <div>
            <div style={{ fontWeight: 700, fontSize: 14, color: cfg.col }}>{cfg.full}</div>
            <div style={{ fontSize: 12, color: "#3D5166", marginTop: 4, fontFamily: "IBM Plex Mono" }}>WAZ: {waz.toFixed(3)}  ·  HAZ: {haz.toFixed(3)}</div>
            {vel && <div style={{ fontSize: 11, color: "#7A92A8", marginTop: 3 }}>Velocity: {vel} {chartTab === "weight" ? "kg" : "cm"}/month</div>}
          </div>
        </div>
        <div className="metric-grid" style={{ margin: 0, display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
          <div className="metric-card" style={{ position: "relative" }}>
            <Activity size={14} color="#00509E" />
            <div className="metric-value" style={{ color: "#00509E" }}>{last.weight}<span style={{ fontSize: 13, fontWeight: 400 }}> kg</span></div>
            <div className="metric-label">Current Weight</div>
            {weightDelta !== null && (
              <div style={{ marginTop: 6, fontSize: 12, fontWeight: 700, color: parseFloat(weightDelta) >= 0 ? "#059669" : "#DC2626", display: "flex", alignItems: "center", gap: 4 }}>
                {parseFloat(weightDelta) >= 0 ? <TrendingUp size={13} /> : <TrendingDown size={13} />}
                {parseFloat(weightDelta) >= 0 ? "+" : ""}{weightDelta} kg
                <span style={{ fontWeight: 500, fontSize: 10, color: "#7A92A8" }}>vs prev</span>
              </div>
            )}
            <div style={{ marginTop: 6, fontSize: 11, color: "#7A92A8", background: "#f8fafc", padding: "4px 8px", borderRadius: 4, display: "inline-block", border: "1px dashed #cbd5e1" }}>
              WHO Ideal: <strong>{getOptimalTarget(last.month, child.gender, "weight", sexAtBirth).toFixed(1)} kg</strong>
            </div>
          </div>
          <div className="metric-card" style={{ position: "relative" }}>
            <TrendingUp size={14} color="#007B83" />
            <div className="metric-value" style={{ color: "#007B83" }}>{last.height}<span style={{ fontSize: 13, fontWeight: 400 }}> cm</span></div>
            <div className="metric-label">Current Height</div>
            {heightDelta !== null && (
              <div style={{ marginTop: 6, fontSize: 12, fontWeight: 700, color: parseFloat(heightDelta) >= 0 ? "#059669" : "#DC2626", display: "flex", alignItems: "center", gap: 4 }}>
                {parseFloat(heightDelta) >= 0 ? <TrendingUp size={13} /> : <TrendingDown size={13} />}
                {parseFloat(heightDelta) >= 0 ? "+" : ""}{heightDelta} cm
                <span style={{ fontWeight: 500, fontSize: 10, color: "#7A92A8" }}>vs prev</span>
              </div>
            )}
            <div style={{ marginTop: 6, fontSize: 11, color: "#7A92A8", background: "#f8fafc", padding: "4px 8px", borderRadius: 4, display: "inline-block", border: "1px dashed #cbd5e1" }}>
              WHO Ideal: <strong>{getOptimalTarget(last.month, child.gender, "height", sexAtBirth).toFixed(1)} cm</strong>
            </div>
          </div>
        </div>
      </div>

      {/* TABS */}
      <div style={{ display: "flex", gap: 6, marginBottom: 14, borderBottom: "2px solid #E8EDF3", paddingBottom: 0 }}>
        {MAIN_TABS.map((t) => (
          <button key={t.id} onClick={() => setMainTab(t.id)}
            style={{ display: "flex", alignItems: "center", gap: 8, padding: "10px 24px", border: "none", borderBottom: mainTab === t.id ? "3px solid #00509E" : "3px solid transparent", cursor: "pointer", fontSize: 13.5, fontWeight: mainTab === t.id ? 700 : 500, fontFamily: "var(--font-heading)", background: "transparent", color: mainTab === t.id ? "#00509E" : "#7A92A8", transition: "all 0.15s", marginBottom: -2 }}>
            <t.icon size={16} />
            {t.label}
          </button>
        ))}
      </div>

      {mainTab === "growth" && (
        <>
          {/* GROWTH LINE CHART */}
          <div className="card" style={{ marginBottom: 14 }}>
            <div className="card-header">
              <div>
                <div className="card-title">Growth History — Date-wise Tracking</div>
                <div className="card-subtitle">Weight & Height progression over checkup visits</div>
              </div>
            </div>
            <div className="card-body">
              <ResponsiveContainer width="100%" height={200}>
                <LineChart data={growthLineData} margin={{ left: -10, right: 10 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke={CS.grid} />
                  <XAxis dataKey="age" tick={CS.axis} />
                  <YAxis tick={CS.axis} />
                  <Tooltip {...CS.tooltip} />
                  <Legend wrapperStyle={{ fontSize: 12, fontFamily: "IBM Plex Sans" }} />
                  <Line type="monotone" dataKey="Weight" stroke="#00509E" strokeWidth={2.5} dot={{ fill: "#00509E", r: 5, strokeWidth: 0 }} name="Weight (kg)" />
                  <Line type="monotone" dataKey="Height" stroke="#007B83" strokeWidth={2.5} dot={{ fill: "#007B83", r: 5, strokeWidth: 0 }} name="Height (cm)" />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* ANTHROPOMETRIC HISTORY TABLE WITH AUDIT TRAIL */}
          <div className="card" style={{ marginBottom: 14 }}>
            <div className="card-header"><div className="card-title">Anthropometric History</div></div>
            <div className="table-wrap">
              <table>
                <thead><tr><th>Visit</th><th>Weight</th><th>Δ</th><th>Height</th><th>Δ</th><th>WAZ</th><th>HAZ</th><th>WHO Grade</th><th>Entered By</th><th>Timestamp</th></tr></thead>
                <tbody>
                  {child.records.map((r, i) => {
                    const rW = lmsZScore(r.weight, r.month, child.gender, "weight", sexAtBirth);
                    const rH = lmsZScore(r.height, r.month, child.gender, "height", sexAtBirth);
                    const rG = classifyChild(rW, rH), rC = GRADE_CFG[rG];
                    const prevRec = i > 0 ? child.records[i - 1] : null;
                    const wDelta = prevRec ? (r.weight - prevRec.weight).toFixed(1) : "—";
                    const hDelta = prevRec ? (r.height - prevRec.height).toFixed(1) : "—";
                    return (
                      <tr key={i}>
                        <td style={{ fontFamily: "IBM Plex Mono", fontWeight: 600, color: "#0D1B2A" }}>{r.month} mo</td>
                        <td style={{ fontFamily: "IBM Plex Mono" }}>{r.weight} kg</td>
                        <td style={{ fontFamily: "IBM Plex Mono", fontSize: 11, fontWeight: 700, color: wDelta !== "—" ? (parseFloat(wDelta) >= 0 ? "#059669" : "#DC2626") : "#94A3B8" }}>
                          {wDelta !== "—" ? (parseFloat(wDelta) >= 0 ? "+" : "") + wDelta : wDelta}
                        </td>
                        <td style={{ fontFamily: "IBM Plex Mono" }}>{r.height} cm</td>
                        <td style={{ fontFamily: "IBM Plex Mono", fontSize: 11, fontWeight: 700, color: hDelta !== "—" ? (parseFloat(hDelta) >= 0 ? "#059669" : "#DC2626") : "#94A3B8" }}>
                          {hDelta !== "—" ? (parseFloat(hDelta) >= 0 ? "+" : "") + hDelta : hDelta}
                        </td>
                        <td style={{ fontFamily: "IBM Plex Mono", fontWeight: 700, color: rW < -2 ? "#B03A2E" : "#1E8449" }}>{rW.toFixed(3)}</td>
                        <td style={{ fontFamily: "IBM Plex Mono", fontWeight: 700, color: rH < -2 ? "#B03A2E" : "#1E8449" }}>{rH.toFixed(3)}</td>
                        <td><span className={`chip ${rC.chip}`}>{rG}</span></td>
                        <td style={{ fontSize: 11, color: "#475569" }}>
                          <div style={{ display: "flex", alignItems: "center", gap: 4 }}><UserCheck size={11} />{r.enteredBy || "—"}</div>
                        </td>
                        <td style={{ fontSize: 10, color: "#94A3B8", fontFamily: "IBM Plex Mono" }}>
                          <div style={{ display: "flex", alignItems: "center", gap: 4 }}><Clock size={10} />{r.updatedAt ? new Date(r.updatedAt).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" }) : "—"}</div>
                        </td>
                      </tr>);
                  })}
                </tbody>
              </table>
            </div>
          </div>

          {/* WHO REFERENCE CHART */}
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

      {mainTab === "medical" && (
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
          {/* Medical Conditions */}
          <div className="card">
            <div className="card-header">
              <div>
                <div className="card-title" style={{ display: "flex", alignItems: "center", gap: 6 }}><Heart size={14} color="#E11D48" /> Medical Conditions</div>
              </div>
            </div>
            <div className="card-body">
              {(child.medicalConditions && child.medicalConditions.length > 0) ? (
                <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
                  {child.medicalConditions.map((cond, i) => (
                    <span key={i} style={{
                      padding: "6px 14px", borderRadius: 20, fontSize: 12.5, fontWeight: 600,
                      background: cond === "None" ? "#ECFDF5" : "#FFF1F2",
                      color: cond === "None" ? "#059669" : "#E11D48",
                      border: `1px solid ${cond === "None" ? "#A7F3D0" : "#FECDD3"}`,
                    }}>
                      {cond}
                    </span>
                  ))}
                </div>
              ) : (
                <div style={{ color: "#94A3B8", fontSize: 13 }}>No medical conditions recorded</div>
              )}
            </div>
          </div>

          {/* Vaccination */}
          <div className="card">
            <div className="card-header">
              <div>
                <div className="card-title" style={{ display: "flex", alignItems: "center", gap: 6 }}><Syringe size={14} color="#00509E" /> Vaccination Status</div>
              </div>
            </div>
            <div className="card-body">
              {child.vaccinationStatus ? (
                <div style={{
                  padding: "12px 18px", borderRadius: 10, fontSize: 14, fontWeight: 700,
                  background: child.vaccinationStatus === "Fully Vaccinated" ? "#ECFDF5" : "#FFFBEB",
                  color: child.vaccinationStatus === "Fully Vaccinated" ? "#059669" : "#D97706",
                  border: `1.5px solid ${child.vaccinationStatus === "Fully Vaccinated" ? "#A7F3D0" : "#FDE68A"}`,
                  display: "flex", alignItems: "center", gap: 8,
                }}>
                  {child.vaccinationStatus === "Fully Vaccinated" ? <CheckCircle size={18} /> : <AlertTriangle size={18} />}
                  {child.vaccinationStatus}
                </div>
              ) : (
                <div style={{ color: "#94A3B8", fontSize: 13 }}>No vaccination data recorded</div>
              )}
            </div>
          </div>

          {/* Audit Info */}
          <div className="card" style={{ gridColumn: "1 / -1" }}>
            <div className="card-header">
              <div>
                <div className="card-title" style={{ display: "flex", alignItems: "center", gap: 6 }}><Clock size={14} color="#7A92A8" /> Audit Trail</div>
              </div>
            </div>
            <div className="card-body">
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 14, fontSize: 13 }}>
                <div style={{ background: "#F8FAFC", padding: "12px 16px", borderRadius: 8, border: "1px solid #E2E8F0" }}>
                  <div style={{ color: "#7A92A8", fontSize: 10.5, fontWeight: 600, marginBottom: 4 }}>NUTRIGRID ID</div>
                  <div style={{ fontWeight: 800, color: "#00509E", fontFamily: "IBM Plex Mono", fontSize: 15 }}>{child.nutrigridId || "—"}</div>
                </div>
                <div style={{ background: "#F8FAFC", padding: "12px 16px", borderRadius: 8, border: "1px solid #E2E8F0" }}>
                  <div style={{ color: "#7A92A8", fontSize: 10.5, fontWeight: 600, marginBottom: 4 }}>LAST EDITED BY</div>
                  <div style={{ fontWeight: 700, color: "#0D1B2A", display: "flex", alignItems: "center", gap: 6 }}><UserCheck size={13} />{last.enteredBy || "—"}</div>
                </div>
                <div style={{ background: "#F8FAFC", padding: "12px 16px", borderRadius: 8, border: "1px solid #E2E8F0" }}>
                  <div style={{ color: "#7A92A8", fontSize: 10.5, fontWeight: 600, marginBottom: 4 }}>LAST UPDATED</div>
                  <div style={{ fontWeight: 700, color: "#0D1B2A", display: "flex", alignItems: "center", gap: 6 }}>
                    <Clock size={13} />{last.updatedAt ? new Date(last.updatedAt).toLocaleString("en-IN", { day: "2-digit", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" }) : "—"}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {mainTab === "diet" && <DietForecast child={child} grade={g} onDietReady={setDietData} />}
    </>
  );
}
