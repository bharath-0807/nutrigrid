import {
  AlertTriangle, CheckCircle, Baby, Zap, Mail, Users
} from "lucide-react";
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, Legend, PieChart, Pie, Cell,
} from "recharts";
import { lmsZScore } from "../utils/lmsCalc";
import { GRADE_CFG, CHART_STYLES as CS } from "../data/clinicalConfig";
import { useState } from "react";

export default function Dashboard({ children, grades, stats, goDetail, user }) {
  const [mailStatus, setMailStatus] = useState("idle"); // idle | sending | sent

  const trendData = [
    { month: "Oct", normal: 18, gam: 6 },
    { month: "Nov", normal: 16, gam: 8 },
    { month: "Dec", normal: 15, gam: 9 },
    { month: "Jan", normal: 14, gam: 10 },
    { month: "Feb", normal: 13, gam: 11 },
    { month: "Mar", normal: stats.normal, gam: stats.sam + stats.mam },
  ];
  const gamRate = stats.total > 0 ? Math.round(((stats.sam + stats.mam) / stats.total) * 100) : 0;

  // Demographics
  const boyCount = children.filter(c => c.gender === "boys").length;
  const girlCount = children.filter(c => c.gender === "girls").length;
  const transCount = children.filter(c => c.gender === "transgender").length;
  const demoData = [
    { name: "Boys", value: boyCount, color: "#3B82F6" },
    { name: "Girls", value: girlCount, color: "#EC4899" },
    { name: "Transgender", value: transCount, color: "#8B5CF6" },
  ].filter(d => d.value > 0);

  const genderLabel = (g) => g === "boys" ? "Male" : g === "girls" ? "Female" : "Transgender";

  // Simulate sending monthly MPR email
  const handleSendMPR = () => {
    setMailStatus("sending");
    setTimeout(() => {
      setMailStatus("sent");
      setTimeout(() => setMailStatus("idle"), 4000);
    }, 2000);
  };

  return (
    <>
      {stats.sam > 0 && (
        <div className="alert-critical">
          <AlertTriangle size={18} color="#B03A2E" style={{ flexShrink: 0, marginTop: 1 }} />
          <div>
            <h4>SAM Alert — {stats.sam} Severe Acute Malnutrition Case{stats.sam > 1 ? "s" : ""} — NRC Referral Required</h4>
            <p>GAM rate: {gamRate}% · {stats.mam} MAM case{stats.mam !== 1 ? "s" : ""} on SNP · Immediate action per ICDS protocol</p>
          </div>
        </div>
      )}

      {stats.total === 0 && (
        <div style={{ background: "#F0F4F8", padding: 24, borderRadius: 8, textAlign: "center", marginBottom: 20 }}>
          <Baby size={32} color="#7A92A8" style={{ margin: "0 auto 12px" }} />
          <h3 style={{ margin: "0 0 8px 0", color: "#0D1B2A" }}>No Children Found</h3>
          <p style={{ margin: 0, color: "#3D5166", fontSize: 13 }}>Your Firestore database is currently empty for this Anganwadi.</p>
        </div>
      )}

      <div className="stat-grid">
        {[
          { label: "Total Registered", value: stats.total, Icon: Baby, col: "#00509E", bg: "#EBF3FB", top: "#00509E", note: `${boyCount}B · ${girlCount}G · ${transCount}T` },
          { label: "Normal", value: stats.normal, Icon: CheckCircle, col: "#1E8449", bg: "#E9F7EF", top: "#1E8449", note: "WAZ/HAZ ≥ −2 SD" },
          { label: "MAM Cases", value: stats.mam, Icon: AlertTriangle, col: "#CA6F1E", bg: "#FEF5E7", top: "#CA6F1E", note: "WAZ/HAZ −3 to −2" },
          { label: "SAM Cases", value: stats.sam, Icon: Zap, col: "#B03A2E", bg: "#FDEDEC", top: "#B03A2E", note: "WAZ/HAZ < −3 SD" },
        ].map((s) => (
          <div className="stat-card" key={s.label} style={{ borderTopColor: s.top }}>
            <div className="stat-top">
              <div>
                <div className="stat-value" style={{ color: s.col }}>{s.value}</div>
                <div className="stat-label">{s.label}</div>
              </div>
              <div className="stat-icon" style={{ background: s.bg }}>
                <s.Icon size={18} color={s.col} />
              </div>
            </div>
            <div className="stat-change" style={{ background: s.bg, color: s.col, fontFamily: "IBM Plex Mono", fontSize: 10 }}>
              {s.note}
            </div>
          </div>
        ))}
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 280px", gap: 14, marginBottom: 14 }}>
        <div className="card">
          <div className="card-header">
            <div>
              <div className="card-title">GAM Trend — 6 Months</div>
              <div className="card-subtitle">Global Acute Malnutrition vs Normal</div>
            </div>
          </div>
          <div className="card-body">
            <ResponsiveContainer width="100%" height={155}>
              <AreaChart data={trendData} margin={{ left: -20, right: 10 }}>
                <defs>
                  <linearGradient id="gn" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#1E8449" stopOpacity={0.15} />
                    <stop offset="95%" stopColor="#1E8449" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="gg" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#B03A2E" stopOpacity={0.15} />
                    <stop offset="95%" stopColor="#B03A2E" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke={CS.grid} />
                <XAxis dataKey="month" tick={CS.axis} />
                <YAxis tick={CS.axis} allowDecimals={false} />
                <Tooltip {...CS.tooltip} />
                <Legend wrapperStyle={{ fontSize: 12, fontFamily: "IBM Plex Sans" }} />
                <Area type="monotone" dataKey="normal" name="Normal" stroke="#1E8449" fill="url(#gn)" strokeWidth={2} />
                <Area type="monotone" dataKey="gam" name="GAM" stroke="#B03A2E" fill="url(#gg)" strokeWidth={2} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Demographics Pie Chart */}
        <div className="card">
          <div className="card-header">
            <div>
              <div className="card-title" style={{ display: "flex", alignItems: "center", gap: 6 }}>
                <Users size={14} /> Demographics
              </div>
              <div className="card-subtitle">Boys · Girls · Transgender</div>
            </div>
          </div>
          <div className="card-body" style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 8, paddingTop: 8 }}>
            <ResponsiveContainer width="100%" height={120}>
              <PieChart>
                <Pie data={demoData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={50} innerRadius={28} strokeWidth={2}>
                  {demoData.map((d, i) => <Cell key={i} fill={d.color} />)}
                </Pie>
                <Tooltip contentStyle={{ fontSize: 12, borderRadius: 8 }} />
              </PieChart>
            </ResponsiveContainer>
            <div style={{ display: "flex", gap: 14, flexWrap: "wrap", justifyContent: "center" }}>
              {demoData.map(d => (
                <div key={d.name} style={{ display: "flex", alignItems: "center", gap: 5, fontSize: 11.5, fontWeight: 600, color: "#334155" }}>
                  <div style={{ width: 10, height: 10, borderRadius: "50%", background: d.color }} />
                  {d.name}: {d.value}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Monthly MPR Email Button */}
      <div className="card" style={{ marginBottom: 14 }}>
        <div className="card-header">
          <div>
            <div className="card-title">Monthly Progress Report (MPR)</div>
            <div className="card-subtitle">Automated ICDS monthly report to Chief / CDPO</div>
          </div>
          <button
            className="btn-primary"
            onClick={handleSendMPR}
            disabled={mailStatus !== "idle"}
            style={{
              background: mailStatus === "sent" ? "#059669" : undefined,
              opacity: mailStatus === "sending" ? 0.7 : 1,
            }}
          >
            <Mail size={13} />
            {mailStatus === "idle" && "Send Monthly MPR"}
            {mailStatus === "sending" && "Sending..."}
            {mailStatus === "sent" && "MPR Sent Successfully!"}
          </button>
        </div>
        <div className="card-body" style={{ padding: "12px 20px" }}>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr 1fr", gap: 12, fontSize: 12.5 }}>
            <div style={{ background: "#F8FAFC", padding: "10px 14px", borderRadius: 8, border: "1px solid #E2E8F0" }}>
              <div style={{ color: "#7A92A8", fontSize: 10.5, fontWeight: 600, marginBottom: 4 }}>TOTAL CHILDREN</div>
              <div style={{ fontWeight: 800, color: "#0D1B2A", fontFamily: "IBM Plex Mono" }}>{stats.total}</div>
            </div>
            <div style={{ background: "#FDEDEC", padding: "10px 14px", borderRadius: 8, border: "1px solid #F1948A" }}>
              <div style={{ color: "#B03A2E", fontSize: 10.5, fontWeight: 600, marginBottom: 4 }}>SAM CASES</div>
              <div style={{ fontWeight: 800, color: "#B03A2E", fontFamily: "IBM Plex Mono" }}>{stats.sam}</div>
            </div>
            <div style={{ background: "#FEF5E7", padding: "10px 14px", borderRadius: 8, border: "1px solid #F0B27A" }}>
              <div style={{ color: "#CA6F1E", fontSize: 10.5, fontWeight: 600, marginBottom: 4 }}>MAM CASES</div>
              <div style={{ fontWeight: 800, color: "#CA6F1E", fontFamily: "IBM Plex Mono" }}>{stats.mam}</div>
            </div>
            <div style={{ background: "#E9F7EF", padding: "10px 14px", borderRadius: 8, border: "1px solid #82E0AA" }}>
              <div style={{ color: "#1E8449", fontSize: 10.5, fontWeight: 600, marginBottom: 4 }}>GAM RATE</div>
              <div style={{ fontWeight: 800, color: "#1E8449", fontFamily: "IBM Plex Mono" }}>{gamRate}%</div>
            </div>
          </div>
        </div>
      </div>

      <div className="card">
        <div className="card-header">
          <div>
            <div className="card-title">Priority Case Register</div>
            <div className="card-subtitle">
              {children.filter((c) => grades[c.id] !== "Normal").length} cases — SAM flagged for NRC referral
            </div>
          </div>
        </div>
        <div className="table-wrap">
          <table>
            <thead>
              <tr><th>ID</th><th>Child</th><th>Age</th><th>Block</th><th>Weight</th><th>Height</th><th>WAZ</th><th>HAZ</th><th>WHO Grade</th></tr>
            </thead>
            <tbody>
              {children
                .filter((c) => grades[c.id] !== "Normal")
                .sort((a, b) => (GRADE_CFG[grades[a.id]]?.priority ?? 9) - (GRADE_CFG[grades[b.id]]?.priority ?? 9))
                .map((child) => {
                  const last = child.records[child.records.length - 1];
                  const g = grades[child.id] ?? "Normal";
                  const cfg = GRADE_CFG[g];
                  const sexAtBirth = child.sexAtBirth || (child.gender === "transgender" ? "boys" : undefined);
                  const waz = lmsZScore(last.weight, last.month, child.gender, "weight", sexAtBirth);
                  const haz = lmsZScore(last.height, last.month, child.gender, "height", sexAtBirth);
                  return (
                    <tr key={child.id} onClick={() => goDetail(child)}>
                      <td style={{ fontFamily: "IBM Plex Mono", fontSize: 11, fontWeight: 700, color: "#00509E" }}>{child.nutrigridId || "—"}</td>
                      <td>
                        <div style={{ display: "flex", alignItems: "center", gap: 9 }}>
                          <div className="avatar" style={{ background: cfg.dot }}>{child.name?.[0]}</div>
                          <div>
                            <div style={{ fontWeight: 600, color: "#0D1B2A", fontSize: 13 }}>{child.name}</div>
                            <div style={{ fontSize: 11, color: "#7A92A8" }}>{genderLabel(child.gender)}</div>
                          </div>
                        </div>
                      </td>
                      <td style={{ fontFamily: "IBM Plex Mono", fontSize: 12 }}>{last.month}mo</td>
                      <td style={{ fontSize: 12, color: "#3D5166" }}>{child.village}</td>
                      <td style={{ fontFamily: "IBM Plex Mono", fontSize: 12, fontWeight: 600 }}>{last.weight} kg</td>
                      <td style={{ fontFamily: "IBM Plex Mono", fontSize: 12, fontWeight: 600 }}>{last.height} cm</td>
                      <td style={{ fontFamily: "IBM Plex Mono", fontSize: 12, fontWeight: 700, color: waz < -2 ? "#B03A2E" : "#1E8449" }}>{waz.toFixed(2)}</td>
                      <td style={{ fontFamily: "IBM Plex Mono", fontSize: 12, fontWeight: 700, color: haz < -2 ? "#B03A2E" : "#1E8449" }}>{haz.toFixed(2)}</td>
                      <td><span className={`chip ${cfg.chip}`}>{g}</span></td>
                    </tr>
                  );
                })}
              {children.filter((c) => grades[c.id] !== "Normal").length === 0 && (
                <tr>
                  <td colSpan={9} style={{ textAlign: "center", padding: 32, color: "#7A92A8" }}>
                    <CheckCircle size={20} color="#1E8449" style={{ margin: "0 auto 8px", display: "block" }} />
                    No SAM/MAM cases detected
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </>
  );
}
