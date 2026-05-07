import { useState, useMemo } from "react";
import { AlertTriangle, FileText, Download, ExternalLink, Brain, GitPullRequest, Zap, Target } from "lucide-react";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend, ReferenceLine } from "recharts";
import { getOptimalTarget, getWHOThresholds } from "../utils/lmsCalc";
import { CHART_STYLES as CS } from "../data/clinicalConfig";
import ZScoreCurve from "./ZScoreCurve";

const REFERENCE_DOCS = [
  {
    title: "WHO MGRS Technical Report",
    subtitle: "Multicentre Growth Reference Study Methodology & Standards",
    type: "Clinical Protocol",
    url: "https://www.who.int/tools/child-growth-standards/standards",
    color: "#00509E",
    bg: "#EBF3FB"
  },
  {
    title: "ICMR-NIN Dietary Allowances",
    subtitle: "RDA for Indians (2020) — Nutrition & Dietetics Protocol",
    type: "Nutrition Guideline",
    url: "https://main.icmr.nic.in/sites/default/files/guidelines/Nutrient_Requirements_for_Indians_2020_new.pdf",
    color: "#CA6F1E",
    bg: "#FEF5E7"
  },
  {
    title: "UNICEF MUAC Manual",
    subtitle: "Mid-Upper Arm Circumference measuring for SAM detection",
    type: "Field Manual",
    url: "https://www.unicef.org/media/105491/file/Mid-Upper%20Arm%20Circumference%20(MUAC)%20Measuring%20Tapes.pdf",
    color: "#1E8449",
    bg: "#E9F7EF"
  }
];

export default function ClinicalDocs() {
  const [metric, setMetric] = useState("weight");
  const [gender, setGender] = useState("boys");

  // Generate the 0-60 months WHO reference data for charts
  const chartData = useMemo(() => {
    const rows = [];
    for (let m = 0; m <= 60; m += 3) {
      rows.push({
        month: m,
        Median: parseFloat(getOptimalTarget(m, gender, metric).toFixed(2)),
        "MAM (−2SD)": parseFloat(getWHOThresholds(m, gender, metric, -2).toFixed(2)),
        "SAM (−3SD)": parseFloat(getWHOThresholds(m, gender, metric, -3).toFixed(2)),
      });
    }
    return rows;
  }, [gender, metric]);

  return (
    <div className="dashboard-content" style={{ paddingBottom: 60 }}>
      {/* HEADER */}
      <div className="page-title-bar" style={{ marginBottom: 24, padding: "24px 32px", background: "linear-gradient(135deg, #0F172A, #1E293B)", borderRadius: 16, color: "#fff" }}>
        <div>
          <h1 className="page-title" style={{ display: "flex", alignItems: "center", gap: 10, color: "#fff", borderBottom: "none" }}>
            <Brain size={28} color="#60A5FA" /> Science & Evidence
          </h1>
          <div className="page-subtitle" style={{ color: "rgba(255,255,255,0.7)", fontSize: 14 }}>The clinical logic, problem statement, and solution architecture of NutriGrid</div>
        </div>
      </div>

      {/* SECTION 1: PROBLEM VS SOLUTION */}
      <h3 style={{ fontSize: 18, color: "#0D1B2A", marginBottom: 16, display: "flex", alignItems: "center", gap: 8 }}>
        <GitPullRequest size={20} color="#00509E" /> The Invisible Malnutrition Crisis
      </h3>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, marginBottom: 32 }}>
        <div style={{ background: "#FFF1F2", border: "1px solid #FECDD3", borderRadius: 12, padding: 24 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 12 }}>
            <AlertTriangle size={20} color="#E11D48" />
            <span style={{ fontSize: 16, fontWeight: 800, color: "#9F1239" }}>Current Problem</span>
          </div>
          <p style={{ fontSize: 13.5, color: "#9F1239", lineHeight: 1.6, marginBottom: 12 }}>
            Currently, Anganwadi workers manually look up a child's weight/height on complex wall charts. This physical lookup is highly prone to human error, meaning severely acute malnourished (SAM) children slip through the cracks and are not sent to Medical Centres.
          </p>
          <ul style={{ fontSize: 13, color: "#9F1239", paddingLeft: 20 }}>
            <li>Manual calculation errors</li>
            <li>Lack of real-time multi-level data</li>
            <li>No statistical precision (No Z-Score derivation)</li>
          </ul>
        </div>
        
        <div style={{ background: "#ECFDF5", border: "1px solid #A7F3D0", borderRadius: 12, padding: 24 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 12 }}>
            <Target size={20} color="#059669" />
            <span style={{ fontSize: 16, fontWeight: 800, color: "#065F46" }}>Our Solution</span>
          </div>
          <p style={{ fontSize: 13.5, color: "#065F46", lineHeight: 1.6, marginBottom: 12 }}>
            NutriGrid replaces wall charts with the official <strong>WHO Box-Cox LMS statistical algorithm</strong>. The worker simply enters numbers, and the app instantly calculates exact Standard Deviations (Z-Scores) with 100% precision.
          </p>
          <ul style={{ fontSize: 13, color: "#065F46", paddingLeft: 20 }}>
            <li>Zero manual calculation errors</li>
            <li>Instant PDF evidence generation for ICDS reports</li>
            <li>Automatic clinical classification into SAM / MAM zones</li>
          </ul>
        </div>
      </div>

      {/* SECTION 2: WHAT IS A Z-SCORE? */}
      <div className="card" style={{ marginBottom: 32 }}>
        <div className="card-header" style={{ background: "#F8FAFC" }}>
          <div>
            <div className="card-title">What is a Z-Score?</div>
            <div className="card-subtitle">Understanding the Standard Normal Distribution</div>
          </div>
        </div>
        <div className="card-body" style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 24, alignItems: "center" }}>
          <div>
            <p style={{ fontSize: 14, color: "#334155", lineHeight: 1.7, marginBottom: 16 }}>
              A <strong>Z-Score</strong> is a statistical measurement that describes a value's relationship to the mean (average) of a group of values. It is measured in terms of <strong>Standard Deviations</strong> from the mean.
            </p>
            <p style={{ fontSize: 14, color: "#334155", lineHeight: 1.7, marginBottom: 16 }}>
              The World Health Organization studied thousands of healthy children globally to establish the "Ideal Median". When a child is born, their weight should naturally fall within the middle of the bell curve.
            </p>
            
            <div style={{ display: "flex", flexDirection: "column", gap: 12, marginTop: 24 }}>
              <div style={{ padding: "10px 16px", background: "#ECFDF5", borderLeft: "4px solid #10B981", borderRadius: 6, fontSize: 13, color: "#065F46" }}>
                <strong>Normal Zone (+2 to -2 SD):</strong> ~95% of healthy global population falls here.
              </div>
              <div style={{ padding: "10px 16px", background: "#FFFBEB", borderLeft: "4px solid #F59E0B", borderRadius: 6, fontSize: 13, color: "#92400E" }}>
                <strong>MAM Alert (-2 to -3 SD):</strong> The bottom 2.3% of the population. Moderate Malnutrition.
              </div>
              <div style={{ padding: "10px 16px", background: "#FFF1F2", borderLeft: "4px solid #E11D48", borderRadius: 6, fontSize: 13, color: "#9F1239" }}>
                <strong>SAM Crisis (&lt; -3 SD):</strong> The bottom 0.1% of the population. Severe Malnutrition.
              </div>
            </div>
          </div>
          <div>
            <ZScoreCurve zScore={-2.5} type="Example: Child with -2.5 Z-Score" />
          </div>
        </div>
      </div>

      {/* SECTION 2.5: EXACT Z-SCORE SCALE */}
      <h3 style={{ fontSize: 18, color: "#0D1B2A", marginBottom: 16, display: "flex", alignItems: "center", gap: 8 }}>
        <Target size={20} color="#00509E" /> Exact Z-Score Scale (Reviewer Reference)
      </h3>
      <div style={{ background: "#fff", border: "1px solid #E2E8F0", borderRadius: 12, padding: "20px 24px", marginBottom: 32, boxShadow: "0 2px 8px rgba(0,0,0,0.03)" }}>
        <p style={{ fontSize: 13.5, color: "#475569", marginBottom: 20, lineHeight: 1.6 }}>
          Use this exact mapping scale to explain what a specific Z-Score value means according to the <strong>WHO Child Growth Standards</strong>.
        </p>
        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          <div style={{ display: "grid", gridTemplateColumns: "130px 1fr", gap: 20, padding: "14px 16px", background: "#ECFDF5", borderRadius: 8, border: "1px solid #A7F3D0", alignItems: "center" }}>
            <div style={{ fontWeight: 800, color: "#065F46", fontSize: 14, fontFamily: "'IBM Plex Mono', monospace" }}>-2.0 to +2.0</div>
            <div style={{ fontSize: 13.5, color: "#065F46" }}><strong style={{ color: "#059669" }}>NORMAL (e.g., Z-score 1.0 or -1.5):</strong> Perfect, healthy condition. The child falls safely within the 95% global median.</div>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "130px 1fr", gap: 20, padding: "14px 16px", background: "#FFFBEB", borderRadius: 8, border: "1px solid #FDE68A", alignItems: "center" }}>
            <div style={{ fontWeight: 800, color: "#92400E", fontSize: 14, fontFamily: "'IBM Plex Mono', monospace" }}>-3.0 to -2.0</div>
            <div style={{ fontSize: 13.5, color: "#92400E" }}><strong style={{ color: "#D97706" }}>MAM (e.g., Z-score -2.5):</strong> Moderate Acute Malnutrition. Requires enrollment in supplementary feeding programs.</div>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "130px 1fr", gap: 20, padding: "14px 16px", background: "#FFF1F2", borderRadius: 8, border: "1px solid #FECDD3", alignItems: "center" }}>
            <div style={{ fontWeight: 800, color: "#9F1239", fontSize: 14, fontFamily: "'IBM Plex Mono', monospace" }}>&lt; -3.0</div>
            <div style={{ fontSize: 13.5, color: "#9F1239" }}><strong style={{ color: "#E11D48" }}>SAM (e.g., Z-score -3.5):</strong> Severe Acute Malnutrition. Clinical emergency requiring hospitalization at an NRC.</div>
          </div>
        </div>
      </div>

      {/* SECTION 3: PROTOCOL CARDS */}
      <h3 style={{ fontSize: 18, color: "#0D1B2A", marginBottom: 16, display: "flex", alignItems: "center", gap: 8 }}>
        <Zap size={20} color="#00509E" /> Clinical Classifications & Action Plans
      </h3>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 16, marginBottom: 32 }}>
        <div style={{ background: "#fff", border: "1px solid #E2E8F0", borderTop: "4px solid #E11D48", borderRadius: 12, padding: 20, boxShadow: "0 2px 8px rgba(0,0,0,0.03)" }}>
          <h4 style={{ fontSize: 16, fontWeight: 800, color: "#0F172A", marginBottom: 8 }}>SAM</h4>
          <div style={{ fontSize: 12, fontWeight: 700, color: "#E11D48", marginBottom: 16 }}>Severe Acute Malnutrition</div>
          <p style={{ fontSize: 13, color: "#475569", lineHeight: 1.6, marginBottom: 16 }}>
            Defined by a Weight-for-Height (WAZ) Z-Score below -3 SD. This indicates a highly vulnerable child suffering from severe muscle wasting.
          </p>
          <div style={{ padding: "10px", background: "#F8FAFC", borderRadius: 8, fontSize: 12, color: "#334155" }}>
            <strong>Action:</strong> Immediate referral to Nutritional Rehabilitation Centre (NRC) & start RUTF diet.
          </div>
        </div>
        <div style={{ background: "#fff", border: "1px solid #E2E8F0", borderTop: "4px solid #F59E0B", borderRadius: 12, padding: 20, boxShadow: "0 2px 8px rgba(0,0,0,0.03)" }}>
          <h4 style={{ fontSize: 16, fontWeight: 800, color: "#0F172A", marginBottom: 8 }}>MAM</h4>
          <div style={{ fontSize: 12, fontWeight: 700, color: "#F59E0B", marginBottom: 16 }}>Moderate Acute Malnutrition</div>
          <p style={{ fontSize: 13, color: "#475569", lineHeight: 1.6, marginBottom: 16 }}>
            Defined by a Z-Score between -3 SD and -2 SD. The child is at high risk of deteriorating into SAM without immediate intervention.
          </p>
          <div style={{ padding: "10px", background: "#F8FAFC", borderRadius: 8, fontSize: 12, color: "#334155" }}>
            <strong>Action:</strong> Enroll in Supplementary Nutrition Programme (SNP) & increase caloric intake.
          </div>
        </div>
        <div style={{ background: "#fff", border: "1px solid #E2E8F0", borderTop: "4px solid #0F172A", borderRadius: 12, padding: 20, boxShadow: "0 2px 8px rgba(0,0,0,0.03)" }}>
          <h4 style={{ fontSize: 16, fontWeight: 800, color: "#0F172A", marginBottom: 8 }}>GAM</h4>
          <div style={{ fontSize: 12, fontWeight: 700, color: "#0F172A", marginBottom: 16 }}>Global Acute Malnutrition</div>
          <p style={{ fontSize: 13, color: "#475569", lineHeight: 1.6, marginBottom: 16 }}>
            GAM is the combined total rate of SAM + MAM in a population. It is used by the UN and WHO to classify regional food emergencies.
          </p>
          <div style={{ padding: "10px", background: "#F8FAFC", borderRadius: 8, fontSize: 12, color: "#334155" }}>
            <strong>Threshold:</strong> A GAM rate over 15% indicates a critical public health emergency.
          </div>
        </div>
      </div>

      {/* OFFICIAL PROOFS */}
      <h3 style={{ fontSize: 16, color: "#0D1B2A", marginBottom: 12, display: "flex", alignItems: "center", gap: 8 }}>
        <FileText size={18} color="#00509E" /> Official Medical Proofs
      </h3>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))", gap: 16, marginBottom: 32 }}>
        {REFERENCE_DOCS.map((doc, i) => (
          <a key={i} href={doc.url} target="_blank" rel="noopener noreferrer"
            style={{
              textDecoration: "none", background: "#fff", border: "1px solid #E8EDF3",
              borderRadius: 10, padding: 16, display: "flex", gap: 14,
              transition: "all 0.2s", boxShadow: "0 2px 8px rgba(0,0,0,0.03)"
            }}
            onMouseOver={(e) => { e.currentTarget.style.transform = "translateY(-2px)"; e.currentTarget.style.boxShadow = "0 8px 16px rgba(0,0,0,0.08)"; }}
            onMouseOut={(e) => { e.currentTarget.style.transform = "none"; e.currentTarget.style.boxShadow = "0 2px 8px rgba(0,0,0,0.03)"; }}
          >
            <div style={{ width: 44, height: 44, borderRadius: 8, background: doc.bg, color: doc.color, display: "flex", alignItems: "center", justifyContent: "center" }}>
              <Download size={20} />
            </div>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 10.5, fontWeight: 700, color: doc.color, textTransform: "uppercase", letterSpacing: 0.5, marginBottom: 4 }}>{doc.type}</div>
              <div style={{ fontSize: 14, fontWeight: 700, color: "#0D1B2A", marginBottom: 2 }}>{doc.title}</div>
              <div style={{ fontSize: 11.5, color: "#7A92A8", lineHeight: 1.4 }}>{doc.subtitle}</div>
            </div>
            <div style={{ alignSelf: "center", color: "#A0B5C9" }}>
              <ExternalLink size={18} />
            </div>
          </a>
        ))}
      </div>

      {/* WHO REFERENCE CHARTS (REPLACING THE NUMERICAL TABLE) */}
      <div className="card">
        <div className="card-header" style={{ flexWrap: "wrap", gap: 16 }}>
          <div>
            <div className="card-title">WHO Growth Reference Curves (0–60 Months)</div>
            <div className="card-subtitle">Dynamic LMS-derived Median, −2SD (MAM), and −3SD (SAM) curves</div>
          </div>
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
            <div style={{ display: "flex", background: "#f1f5f9", borderRadius: 6, padding: 3 }}>
              <button onClick={() => setGender("boys")}
                style={{ padding: "6px 14px", border: "none", borderRadius: 4, fontSize: 12.5, fontWeight: 600, cursor: "pointer", background: gender === "boys" ? "#fff" : "transparent", color: gender === "boys" ? "#0f172a" : "#64748b", boxShadow: gender === "boys" ? "0 1px 3px rgba(0,0,0,0.1)" : "none" }}>Boys</button>
              <button onClick={() => setGender("girls")}
                style={{ padding: "6px 14px", border: "none", borderRadius: 4, fontSize: 12.5, fontWeight: 600, cursor: "pointer", background: gender === "girls" ? "#fff" : "transparent", color: gender === "girls" ? "#0f172a" : "#64748b", boxShadow: gender === "girls" ? "0 1px 3px rgba(0,0,0,0.1)" : "none" }}>Girls</button>
            </div>
            <div style={{ display: "flex", background: "#f1f5f9", borderRadius: 6, padding: 3 }}>
              <button onClick={() => setMetric("weight")}
                style={{ padding: "6px 14px", border: "none", borderRadius: 4, fontSize: 12.5, fontWeight: 600, cursor: "pointer", background: metric === "weight" ? "#fff" : "transparent", color: metric === "weight" ? "#0f172a" : "#64748b", boxShadow: metric === "weight" ? "0 1px 3px rgba(0,0,0,0.1)" : "none" }}>Weight (WAZ)</button>
              <button onClick={() => setMetric("height")}
                style={{ padding: "6px 14px", border: "none", borderRadius: 4, fontSize: 12.5, fontWeight: 600, cursor: "pointer", background: metric === "height" ? "#fff" : "transparent", color: metric === "height" ? "#0f172a" : "#64748b", boxShadow: metric === "height" ? "0 1px 3px rgba(0,0,0,0.1)" : "none" }}>Height (HAZ)</button>
            </div>
          </div>
        </div>

        <div className="card-body">
          {/* LEGEND */}
          <div style={{ background: "#f8fafc", padding: "12px 20px", borderBottom: "1px solid #e2e8f0", fontSize: 12, color: "#475569", display: "flex", alignItems: "center", gap: 16, marginBottom: 16, borderRadius: 8 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 6 }}><div style={{ width: 16, height: 3, background: "#1E8449", borderRadius: 2 }} /> <strong>Median (Ideal)</strong></div>
            <div style={{ display: "flex", alignItems: "center", gap: 6 }}><div style={{ width: 16, height: 3, background: "#CA6F1E", borderRadius: 2 }} /> <strong>MAM Cutoff (−2SD)</strong></div>
            <div style={{ display: "flex", alignItems: "center", gap: 6 }}><div style={{ width: 16, height: 3, background: "#B03A2E", borderRadius: 2 }} /> <strong>SAM Cutoff (−3SD)</strong></div>
          </div>

          {/* CHART */}
          <ResponsiveContainer width="100%" height={360}>
            <LineChart data={chartData} margin={{ left: 0, right: 20, top: 10, bottom: 10 }}>
              <CartesianGrid strokeDasharray="3 3" stroke={CS.grid} />
              <XAxis
                dataKey="month"
                tick={CS.axis}
                label={{ value: "Age (Months)", position: "insideBottom", offset: -5, style: { fontSize: 12, fontWeight: 600, fill: "#7A92A8" } }}
              />
              <YAxis
                tick={CS.axis}
                label={{ value: metric === "weight" ? "Weight (kg)" : "Height (cm)", angle: -90, position: "insideLeft", offset: 10, style: { fontSize: 12, fontWeight: 600, fill: "#7A92A8" } }}
              />
              <Tooltip
                contentStyle={{ borderRadius: 10, border: "1px solid #E2E8F0", fontSize: 12.5, fontFamily: "IBM Plex Sans" }}
                formatter={(value, name) => [`${value} ${metric === "weight" ? "kg" : "cm"}`, name]}
                labelFormatter={(label) => `Month ${label}`}
              />
              <Legend wrapperStyle={{ fontSize: 12, fontFamily: "IBM Plex Sans", paddingTop: 12 }} />
              <Line type="monotone" dataKey="Median" stroke="#1E8449" strokeWidth={2.5} dot={false} />
              <Line type="monotone" dataKey="MAM (−2SD)" stroke="#CA6F1E" strokeWidth={2} strokeDasharray="6 3" dot={false} />
              <Line type="monotone" dataKey="SAM (−3SD)" stroke="#B03A2E" strokeWidth={2} strokeDasharray="4 3" dot={false} />
              <ReferenceLine x={30} stroke="#94A3B8" strokeDasharray="3 3" label={{ value: "2.5 yrs", position: "top", style: { fontSize: 10, fill: "#94A3B8" } }} />
              <ReferenceLine x={60} stroke="#94A3B8" strokeDasharray="3 3" label={{ value: "5 yrs", position: "top", style: { fontSize: 10, fill: "#94A3B8" } }} />
            </LineChart>
          </ResponsiveContainer>

          {/* Key data points below chart */}
          <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 10, marginTop: 16 }}>
            {[12, 24, 36, 48].map(m => (
              <div key={m} style={{ background: "#F8FAFC", padding: "10px 12px", borderRadius: 8, border: "1px solid #E2E8F0", textAlign: "center" }}>
                <div style={{ fontSize: 10, fontWeight: 600, color: "#7A92A8", marginBottom: 4 }}>{m} MONTHS ({m/12} Yr)</div>
                <div style={{ fontSize: 13, fontWeight: 800, color: "#1E8449", fontFamily: "IBM Plex Mono" }}>
                  {getOptimalTarget(m, gender, metric).toFixed(1)} {metric === "weight" ? "kg" : "cm"}
                </div>
                <div style={{ fontSize: 10.5, color: "#CA6F1E", fontFamily: "IBM Plex Mono", marginTop: 2 }}>
                  MAM: &lt;{getWHOThresholds(m, gender, metric, -2).toFixed(1)}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
