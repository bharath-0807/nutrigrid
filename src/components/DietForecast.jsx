import { useState } from "react";
import { Brain, CheckCircle, Zap } from "lucide-react";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from "recharts";
import { lmsZScore, classifyChild } from "../utils/lmsCalc";
import { getRDA, calcNutrients, predictGrowth, getDietGaps } from "../utils/nutritionCalc";
import { ICMR_FOODS, FOOD_GROUPS } from "../data/icmrFoods";
import { GRADE_CFG, CHART_STYLES as CS } from "../data/clinicalConfig";

export default function DietForecast({ child, grade, onDietReady }) {
  const last = child.records[child.records.length - 1];
  const rda = getRDA(last.month);
  const [intake, setIntake] = useState([]);
  const [horizon, setHorizon] = useState(6);
  const [computed, setComputed] = useState(false);
  const [forecast, setForecast] = useState(null);
  const [gapResult, setGapResult] = useState(null);

  const addFood = (foodId) => { if (intake.find((i) => i.foodId === foodId)) return; setIntake((p) => [...p, { foodId, qty: 1 }]); setComputed(false); };
  const setQty = (foodId, qty) => { setIntake((p) => p.map((i) => (i.foodId === foodId ? { ...i, qty: Math.max(0.5, +qty) } : i))); setComputed(false); };
  const removeFood = (foodId) => { setIntake((p) => p.filter((i) => i.foodId !== foodId)); setComputed(false); };

  const handleCompute = () => {
    if (intake.length === 0) return;
    const { points, calAdequacy, velocityFactor } = predictGrowth(child, intake, horizon);
    const gd = getDietGaps(intake, last.month);
    setForecast({ points, calAdequacy, velocityFactor });
    setGapResult(gd);
    setComputed(true);
    if (onDietReady) onDietReady({ intake, horizon, forecast: { points, calAdequacy, velocityFactor } });
  };

  const nuts = intake.length > 0 ? calcNutrients(intake) : null;
  const tabStyle = (active) => ({ padding: "5px 14px", borderRadius: 3, border: active ? "none" : "1.5px solid #D0D9E4", cursor: "pointer", fontSize: 12, fontWeight: 600, fontFamily: "IBM Plex Sans,sans-serif", background: active ? "#00509E" : "transparent", color: active ? "#fff" : "#3D5166", transition: "all 0.15s" });

  return (
    <div>
      {/* ICMR RDA reference */}
      <div style={{ background: "#EBF3FB", border: "1px solid #C2DCF5", borderLeft: "4px solid #00509E", borderRadius: 6, padding: "11px 16px", marginBottom: 14, display: "flex", alignItems: "center", gap: 12, flexWrap: "wrap" }}>
        <Brain size={15} color="#00509E" />
        <div style={{ fontSize: 12.5, color: "#00509E", fontWeight: 600 }}>ICMR RDA for {last.month} months ({rda.label})</div>
        {[{ k: "Energy", v: `${rda.cal} kcal` }, { k: "Protein", v: `${rda.pro}g` }, { k: "Iron", v: `${rda.iron}mg` }, { k: "Vit-A", v: `${rda.vitA}mcg` }, { k: "Zinc", v: `${rda.zinc}mg` }].map((r) => (
          <div key={r.k} style={{ background: "#fff", border: "1px solid #C2DCF5", borderRadius: 3, padding: "3px 10px", fontSize: 11.5, fontFamily: "IBM Plex Mono", color: "#00509E", fontWeight: 700 }}>{r.k}: {r.v}</div>
        ))}
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14, marginBottom: 14 }}>
        {/* Food selection */}
        <div className="card">
          <div className="card-header"><div><div className="card-title">Step 1 — Enter Daily Food Intake</div><div className="card-subtitle">Select foods the child eats daily · ICMR food composition table</div></div></div>
          <div className="card-body" style={{ maxHeight: 360, overflowY: "auto" }}>
            {FOOD_GROUPS.map((grp) => (
              <div key={grp.label} style={{ marginBottom: 12 }}>
                <div style={{ fontSize: 10.5, fontWeight: 700, color: "#7A92A8", textTransform: "uppercase", letterSpacing: "0.8px", marginBottom: 6 }}>{grp.label}</div>
                <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
                  {grp.ids.map((id) => { const f = ICMR_FOODS.find((x) => x.id === id); const selected = intake.find((i) => i.foodId === id); return (
                    <button key={id} onClick={() => addFood(id)} style={{ padding: "4px 10px", borderRadius: 3, border: `1.5px solid ${selected ? "#00509E" : "#D0D9E4"}`, cursor: "pointer", fontSize: 11.5, fontWeight: selected ? 700 : 400, fontFamily: "IBM Plex Sans,sans-serif", background: selected ? "#EBF3FB" : "#fff", color: selected ? "#00509E" : "#3D5166", transition: "all 0.15s" }}>{f?.emoji} {f?.name.split("(")[0].trim()}</button>
                  ); })}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Quantity + nutrient meter */}
        <div className="card">
          <div className="card-header"><div><div className="card-title">Step 2 — Portions & Nutrient Meter</div><div className="card-subtitle">Adjust servings — live vs ICMR RDA</div></div></div>
          <div className="card-body">
            {intake.length === 0 ? (
              <div style={{ textAlign: "center", padding: "32px 0", color: "#7A92A8", fontSize: 13 }}><Zap size={22} color="#D0D9E4" style={{ margin: "0 auto 8px", display: "block" }} />Select foods from the left panel</div>
            ) : (<>
              {intake.map(({ foodId, qty }) => { const f = ICMR_FOODS.find((x) => x.id === foodId); return (
                <div key={foodId} style={{ display: "flex", alignItems: "center", gap: 8, padding: "6px 0", borderBottom: "1px solid #F0F4F8" }}>
                  <span style={{ fontSize: 16, flexShrink: 0 }}>{f?.emoji}</span>
                  <span style={{ flex: 1, fontSize: 12.5, fontWeight: 600, color: "#0D1B2A" }}>{f?.name.split("(")[0].trim()}</span>
                  <span style={{ fontSize: 10.5, color: "#7A92A8", flexShrink: 0 }}>{f?.unit}</span>
                  <input type="number" min="0.5" max="5" step="0.5" value={qty} onChange={(e) => setQty(foodId, e.target.value)} style={{ width: 52, padding: "3px 6px", border: "1.5px solid #D0D9E4", borderRadius: 3, fontSize: 12, fontFamily: "IBM Plex Mono", textAlign: "center" }} />
                  <button onClick={() => removeFood(foodId)} style={{ background: "none", border: "none", cursor: "pointer", color: "#B03A2E", fontSize: 15, padding: "0 2px", lineHeight: 1 }}>×</button>
                </div>); })}
              {nuts && (<div style={{ marginTop: 14 }}>
                {[{ k: "Energy", got: nuts.cal, need: rda.cal, unit: "kcal", col: "#00509E" }, { k: "Protein", got: nuts.pro, need: rda.pro, unit: "g", col: "#007B83" }, { k: "Iron", got: nuts.iron, need: rda.iron, unit: "mg", col: "#CA6F1E" }, { k: "Vit-A", got: nuts.vitA, need: rda.vitA, unit: "mcg", col: "#8E44AD" }, { k: "Zinc", got: nuts.zinc, need: rda.zinc, unit: "mg", col: "#1E8449" }].map((n) => {
                  const pct = Math.min(100, n.need > 0 ? (n.got / n.need) * 100 : 0); const ok = pct >= 85;
                  return (<div key={n.k} style={{ marginBottom: 8 }}>
                    <div style={{ display: "flex", justifyContent: "space-between", fontSize: 11.5, marginBottom: 3 }}><span style={{ fontWeight: 700, color: ok ? n.col : "#B03A2E" }}>{n.k}</span><span style={{ fontFamily: "IBM Plex Mono", fontSize: 11, color: ok ? "#1E8449" : "#B03A2E", fontWeight: 700 }}>{n.got}{n.unit} / {n.need}{n.unit} ({Math.round(pct)}%)</span></div>
                    <div style={{ background: "#EEF2F7", borderRadius: 2, height: 7, overflow: "hidden" }}><div style={{ height: "100%", borderRadius: 2, background: ok ? n.col : "#B03A2E", width: `${pct}%`, transition: "width 0.4s ease" }} /></div>
                  </div>); })}
              </div>)}
            </>)}
          </div>
        </div>
      </div>

      {/* Forecast controls */}
      <div className="card" style={{ marginBottom: 14 }}>
        <div className="card-header">
          <div><div className="card-title">Step 3 — Forecast Growth Trajectory</div><div className="card-subtitle">WHO growth velocity × diet adequacy → predicted WAZ</div></div>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <span style={{ fontSize: 12, color: "#7A92A8", fontWeight: 500 }}>Horizon:</span>
            {[3, 6].map((h) => (<button key={h} onClick={() => { setHorizon(h); setComputed(false); }} style={tabStyle(horizon === h)}>{h} months</button>))}
            <button className="btn-primary" onClick={handleCompute} disabled={intake.length === 0} style={{ opacity: intake.length === 0 ? 0.5 : 1, padding: "7px 18px" }}><Brain size={13} /> Predict</button>
          </div>
        </div>
        {!computed ? (
          <div style={{ padding: "40px 0", textAlign: "center", color: "#7A92A8", fontSize: 13 }}><Brain size={24} color="#D0D9E4" style={{ margin: "0 auto 10px", display: "block" }} />Add foods → click <strong>Predict</strong> to see {horizon}-month WAZ forecast</div>
        ) : forecast && (
          <div className="card-body">
            <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 10, marginBottom: 16 }}>
              {[
                { label: "Calorie Adequacy", val: `${Math.round(forecast.calAdequacy * 100)}%`, col: forecast.calAdequacy >= 0.85 ? "#1E8449" : "#B03A2E", bg: forecast.calAdequacy >= 0.85 ? "#E9F7EF" : "#FDEDEC" },
                { label: "Growth Factor", val: `${(forecast.velocityFactor * 100).toFixed(0)}%`, col: "#00509E", bg: "#EBF3FB" },
                { label: "Projected Grade", val: classifyChild(forecast.points[forecast.points.length - 1]["Current Diet WAZ"], lmsZScore(last.height, Math.min(last.month + horizon, 60), child.gender, "height")), col: GRADE_CFG[classifyChild(forecast.points[forecast.points.length - 1]["Current Diet WAZ"], lmsZScore(last.height, Math.min(last.month + horizon, 60), child.gender, "height"))]?.col ?? "#1E8449", bg: GRADE_CFG[classifyChild(forecast.points[forecast.points.length - 1]["Current Diet WAZ"], lmsZScore(last.height, Math.min(last.month + horizon, 60), child.gender, "height"))]?.bg ?? "#E9F7EF" },
              ].map((s) => (
                <div key={s.label} style={{ background: s.bg, borderRadius: 4, padding: "12px 14px", borderLeft: `3px solid ${s.col}`, textAlign: "center" }}>
                  <div style={{ fontFamily: "IBM Plex Mono", fontSize: 22, fontWeight: 700, color: s.col }}>{s.val}</div>
                  <div style={{ fontSize: 11, color: "#7A92A8", marginTop: 3, fontWeight: 500 }}>{s.label}</div>
                </div>))}
            </div>
            <ResponsiveContainer width="100%" height={220}>
              <LineChart data={forecast.points} margin={{ left: -10, right: 10 }}>
                <CartesianGrid strokeDasharray="3 3" stroke={CS.grid} /><XAxis dataKey="month" tick={CS.axis} /><YAxis tick={CS.axis} domain={["auto", "auto"]} /><Tooltip {...CS.tooltip} /><Legend wrapperStyle={{ fontSize: 12, fontFamily: "IBM Plex Sans" }} />
                <Line type="monotone" dataKey="SAM Threshold" stroke="#B03A2E" strokeDasharray="4 3" dot={false} strokeWidth={1.5} />
                <Line type="monotone" dataKey="MAM Threshold" stroke="#CA6F1E" strokeDasharray="4 3" dot={false} strokeWidth={1.5} />
                <Line type="monotone" dataKey="Current Diet WAZ" stroke="#CA6F1E" strokeWidth={2.5} dot={{ r: 4, fill: "#CA6F1E" }} />
                <Line type="monotone" dataKey="Optimal Diet WAZ" stroke="#1E8449" strokeWidth={2.5} dot={{ r: 4, fill: "#1E8449" }} strokeDasharray="6 2" />
              </LineChart>
            </ResponsiveContainer>
            <div style={{ marginTop: 12, fontSize: 11.5, color: "#7A92A8", fontStyle: "italic", textAlign: "center" }}>🟠 Current diet trajectory &nbsp;·&nbsp; 🟢 Optimal diet trajectory &nbsp;·&nbsp; Dashed = WHO thresholds</div>
          </div>
        )}
      </div>

      {/* Nutrient gap + food recommendations */}
      {computed && gapResult && (
        <div className="card" style={{ marginBottom: 14 }}>
          <div className="card-header"><div><div className="card-title">Nutrient Gap Analysis & Food Recommendations</div><div className="card-subtitle">Based on ICMR RDA · {rda.label} age group</div></div></div>
          <div className="card-body">
            {gapResult.gaps.length === 0 ? (
              <div style={{ background: "#E9F7EF", border: "1px solid #82E0AA", borderLeft: "4px solid #1E8449", borderRadius: 6, padding: "14px 18px", display: "flex", gap: 12, alignItems: "center" }}>
                <CheckCircle size={20} color="#1E8449" />
                <div><div style={{ fontWeight: 700, fontSize: 14, color: "#1E8449" }}>Excellent! All nutrient targets met</div><div style={{ fontSize: 12.5, color: "#1D6A3A", marginTop: 3 }}>Current diet adequately meets ICMR RDA. Continue this diet for sustained normal growth.</div></div>
              </div>
            ) : (<div>
              <div style={{ fontSize: 12.5, color: "#3D5166", marginBottom: 12, fontWeight: 500 }}>{gapResult.gaps.length} nutrient gap{gapResult.gaps.length > 1 ? "s" : ""} identified — add these foods to improve growth trajectory:</div>
              {gapResult.gaps.map((gap) => (
                <div key={gap.nutrient} style={{ background: gap.severity < 0.5 ? "#FDEDEC" : "#FEF5E7", border: `1px solid ${gap.severity < 0.5 ? "#F1948A" : "#F0B27A"}`, borderLeft: `4px solid ${gap.severity < 0.5 ? "#B03A2E" : "#CA6F1E"}`, borderRadius: 6, padding: "12px 16px", marginBottom: 10 }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 6 }}>
                    <span style={{ fontWeight: 700, fontSize: 13, color: gap.severity < 0.5 ? "#B03A2E" : "#CA6F1E" }}>{gap.nutrient} Deficiency</span>
                    <span style={{ fontFamily: "IBM Plex Mono", fontSize: 11.5, fontWeight: 700, color: gap.severity < 0.5 ? "#B03A2E" : "#CA6F1E" }}>{gap.got}{gap.unit} / {gap.need}{gap.unit} ({Math.round(gap.severity * 100)}%)</span>
                  </div>
                  <div style={{ fontSize: 12, color: "#3D5166" }}><strong>Add to diet:</strong> {gap.foods}</div>
                </div>))}
            </div>)}
          </div>
        </div>
      )}
    </div>
  );
}
