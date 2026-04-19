import { FileText } from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from "recharts";
import { CHART_STYLES as CS } from "../data/clinicalConfig";
import { generatePDF } from "../utils/pdfGenerator";

export default function Analytics({ children, grades, stats }) {
  const barData = [
    { name: "Normal", value: stats.normal, fill: "#1E8449" },
    { name: "MAM", value: stats.mam, fill: "#CA6F1E" },
    { name: "SAM", value: stats.sam, fill: "#B03A2E" },
  ];
  const vData = ["Block A", "Block B", "Block C"].map((v) => {
    const vc = children.filter((c) => c.village === v);
    return { name: v, Normal: vc.filter((c) => grades[c.id] === "Normal").length, MAM: vc.filter((c) => grades[c.id] === "MAM").length, SAM: vc.filter((c) => grades[c.id] === "SAM").length };
  });
  const gam = stats.sam + stats.mam;
  const gamRate = stats.total > 0 ? Math.round((gam / stats.total) * 100) : 0;

  return (
    <div className="analytics-grid" style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
      <div className="card" style={{ gridColumn: "1 / -1" }}>
        <div className="card-header"><div><div className="card-title">WHO Programme Indicators — March 2026</div><div className="card-subtitle">Coimbatore District ICDS · SAM/MAM/GAM vs WHO thresholds</div></div></div>
        <div className="card-body">
          <div className="who-indicators-grid" style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 12 }}>
            {[
              { label: "GAM Rate", value: `${gamRate}%`, sub: "SAM+MAM/Total", col: "#B03A2E", bg: "#FDEDEC", note: gamRate > 15 ? "WHO Emergency" : "Threshold: 15%" },
              { label: "SAM Rate", value: `${stats.total > 0 ? Math.round((stats.sam / stats.total) * 100) : 0}%`, sub: "Severe cases", col: "#B03A2E", bg: "#FDEDEC", note: "Emergency: >2%" },
              { label: "MAM Rate", value: `${stats.total > 0 ? Math.round((stats.mam / stats.total) * 100) : 0}%`, sub: "Moderate cases", col: "#CA6F1E", bg: "#FEF5E7", note: "Alert: >10%" },
              { label: "Coverage", value: `${stats.total}`, sub: "Assessed", col: "#00509E", bg: "#EBF3FB", note: "Target: 100%" },
            ].map((d) => (
              <div key={d.label} style={{ background: d.bg, borderRadius: 4, padding: "14px 16px", borderLeft: `3px solid ${d.col}` }}>
                <div style={{ fontFamily: "IBM Plex Mono", fontSize: 24, fontWeight: 700, color: d.col }}>{d.value}</div>
                <div style={{ fontSize: 12, fontWeight: 700, color: d.col, margin: "3px 0" }}>{d.label}</div>
                <div style={{ fontSize: 10.5, color: "#7A92A8" }}>{d.sub}</div>
                <div style={{ fontSize: 10, color: d.col, marginTop: 4, fontFamily: "IBM Plex Mono", background: "rgba(0,0,0,0.05)", padding: "2px 6px", borderRadius: 2, display: "inline-block" }}>{d.note}</div>
              </div>
            ))}
          </div>
        </div>
      </div>
      <div className="card">
        <div className="card-header"><div><div className="card-title">Grade Distribution</div></div></div>
        <div className="card-body">
          <ResponsiveContainer width="100%" height={150}>
            <BarChart data={barData} margin={{ left: -15, right: 10 }}>
              <CartesianGrid strokeDasharray="3 3" stroke={CS.grid} /><XAxis dataKey="name" tick={CS.axis} /><YAxis tick={CS.axis} allowDecimals={false} /><Tooltip {...CS.tooltip} />
              {barData.map((d, i) => <Bar key={i} dataKey="value" name={d.name} fill={d.fill} radius={[3, 3, 0, 0]} />)}
            </BarChart>
          </ResponsiveContainer>
          <div style={{ marginTop: 14 }}>
            {[{ label: "Normal", value: stats.normal, color: "#1E8449" }, { label: "MAM", value: stats.mam, color: "#CA6F1E" }, { label: "SAM", value: stats.sam, color: "#B03A2E" }].map((d) => (
              <div className="progress-wrap" key={d.label}>
                <div className="progress-label-row"><span style={{ fontWeight: 700, color: d.color, fontSize: 12 }}>{d.label}</span><span style={{ fontFamily: "IBM Plex Mono", fontSize: 11, color: "#3D5166", fontWeight: 600 }}>{d.value}/{stats.total} ({stats.total > 0 ? Math.round((d.value / stats.total) * 100) : 0}%)</span></div>
                <div className="progress-bar"><div className="progress-fill" style={{ background: d.color, width: `${stats.total > 0 ? (d.value / stats.total) * 100 : 0}%` }} /></div>
              </div>
            ))}
          </div>
        </div>
      </div>
      <div className="card">
        <div className="card-header"><div><div className="card-title">Block-wise SAM/MAM</div></div></div>
        <div className="card-body"> 
          <ResponsiveContainer width="100%" height={150}>
            <BarChart data={vData} margin={{ left: -15, right: 10 }}>
              <CartesianGrid strokeDasharray="3 3" stroke={CS.grid} /><XAxis dataKey="name" tick={CS.axis} /><YAxis tick={CS.axis} allowDecimals={false} /><Tooltip {...CS.tooltip} /><Legend wrapperStyle={{ fontSize: 11, fontFamily: "IBM Plex Sans" }} />
              <Bar dataKey="Normal" fill="#1E8449" radius={[3, 3, 0, 0]} /><Bar dataKey="MAM" fill="#CA6F1E" radius={[3, 3, 0, 0]} /><Bar dataKey="SAM" fill="#B03A2E" radius={[3, 3, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
          {["Block A", "Block B", "Block C"].map((v) => { const vc = children.filter((c) => c.village === v); const s = vc.filter((c) => grades[c.id] === "SAM").length; const m = vc.filter((c) => grades[c.id] === "MAM").length; return (
            <div key={v} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "9px 0", borderBottom: "1px solid #F0F4F8", fontSize: 12.5 }}>
              <div><div style={{ fontWeight: 600, color: "#0D1B2A" }}>{v}</div><div style={{ fontSize: 11, color: "#7A92A8" }}>{vc.length} registered</div></div>
              <div style={{ display: "flex", gap: 6 }}>{s > 0 && <span className="chip chip-sam">SAM:{s}</span>}{m > 0 && <span className="chip chip-mam">MAM:{m}</span>}{s === 0 && m === 0 && <span className="chip chip-normal">Normal</span>}</div>
            </div>); })}
        </div>
      </div>
      <div className="card" style={{ gridColumn: "1 / -1" }}>
        <div className="card-header">
          <div><div className="card-title">Monthly ICDS Report — March 2026</div><div className="card-subtitle">WHO LMS classification · Ready for CDPO submission</div></div>
        </div>
        <div className="card-body" style={{ display: "flex", gap: "12px", alignItems: "center" }}>
          <button className="btn-primary" onClick={() => generatePDF(children, grades, "all")}>
            <FileText size={14} /> Comprehensive Roster
          </button>
          <button className="btn-ghost" onClick={() => generatePDF(children, grades, 3)}>
            <FileText size={14} /> 0-3 Months Report
          </button>
          <button className="btn-ghost" onClick={() => generatePDF(children, grades, 6)}>
            <FileText size={14} /> 0-6 Months Report
          </button>
        </div>
      </div>
    </div>
  );
}
