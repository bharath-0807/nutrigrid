import { useState, useMemo } from "react";
import { AlertTriangle, CheckCircle, FileText, Download, ExternalLink, BookOpen } from "lucide-react";
import { getOptimalTarget, getWHOThresholds } from "../utils/lmsCalc";

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

  // Dynamically generate the full 0-60 months WHO cutoff table
  const tableData = useMemo(() => {
    const rows = [];
    for (let m = 0; m <= 60; m++) {
      rows.push({
        month: m,
        ideal: getOptimalTarget(m, gender, metric),
        mam: getWHOThresholds(m, gender, metric, -2),
        sam: getWHOThresholds(m, gender, metric, -3),
      });
    }
    return rows;
  }, [gender, metric]);

  return (
    <div className="dashboard-content" style={{ paddingBottom: 60 }}>
      {/* HEADER SECTION */}
      <div className="page-title-bar" style={{ marginBottom: 24 }}>
        <div>
          <h1 className="page-title" style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <BookOpen size={24} color="#00509E" /> Clinical Guidelines & Proofs
          </h1>
          <div className="page-subtitle">WHO Child Growth Standards • Evidence-based Nutrition</div>
        </div>
      </div>

      {/* PROOFS / PDF LINKS */}
      <h3 style={{ fontSize: 16, color: "#0D1B2A", marginBottom: 12, display: "flex", alignItems: "center", gap: 8 }}>
        <FileText size={18} color="#00509E" /> Official Medical Proofs
      </h3>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))", gap: 16, marginBottom: 32 }}>
        {REFERENCE_DOCS.map((doc, i) => (
          <a
            key={i} href={doc.url} target="_blank" rel="noopener noreferrer"
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

      {/* WHO TABLES SECTION */}
      <div className="card">
        <div className="card-header" style={{ flexWrap: "wrap", gap: 16 }}>
          <div>
            <div className="card-title">WHO Master Reference Tables (0–60 Months)</div>
            <div className="card-subtitle">Official LMS Box-Cox derivation limits</div>
          </div>
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
            <div style={{ display: "flex", background: "#f1f5f9", borderRadius: 6, padding: 3 }}>
              <button
                onClick={() => setGender("boys")}
                style={{ padding: "6px 14px", border: "none", borderRadius: 4, fontSize: 12.5, fontWeight: 600, cursor: "pointer", background: gender === "boys" ? "#fff" : "transparent", color: gender === "boys" ? "#0f172a" : "#64748b", boxShadow: gender === "boys" ? "0 1px 3px rgba(0,0,0,0.1)" : "none" }}
              >Boys</button>
              <button
                onClick={() => setGender("girls")}
                style={{ padding: "6px 14px", border: "none", borderRadius: 4, fontSize: 12.5, fontWeight: 600, cursor: "pointer", background: gender === "girls" ? "#fff" : "transparent", color: gender === "girls" ? "#0f172a" : "#64748b", boxShadow: gender === "girls" ? "0 1px 3px rgba(0,0,0,0.1)" : "none" }}
              >Girls</button>
            </div>
            <div style={{ display: "flex", background: "#f1f5f9", borderRadius: 6, padding: 3 }}>
              <button
                onClick={() => setMetric("weight")}
                style={{ padding: "6px 14px", border: "none", borderRadius: 4, fontSize: 12.5, fontWeight: 600, cursor: "pointer", background: metric === "weight" ? "#fff" : "transparent", color: metric === "weight" ? "#0f172a" : "#64748b", boxShadow: metric === "weight" ? "0 1px 3px rgba(0,0,0,0.1)" : "none" }}
              >Weight (WAZ)</button>
              <button
                onClick={() => setMetric("height")}
                style={{ padding: "6px 14px", border: "none", borderRadius: 4, fontSize: 12.5, fontWeight: 600, cursor: "pointer", background: metric === "height" ? "#fff" : "transparent", color: metric === "height" ? "#0f172a" : "#64748b", boxShadow: metric === "height" ? "0 1px 3px rgba(0,0,0,0.1)" : "none" }}
              >Height (HAZ)</button>
            </div>
          </div>
        </div>

        <div className="card-body" style={{ padding: 0 }}>
          <div style={{ background: "#f8fafc", padding: "12px 20px", borderBottom: "1px solid #e2e8f0", fontSize: 12, color: "#475569", display: "flex", alignItems: "center", gap: 12 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 6 }}><CheckCircle size={14} color="#1E8449" /> <strong>Ideal Target:</strong> Healthy Median (50th percentile)</div>
            <div style={{ display: "flex", alignItems: "center", gap: 6 }}><AlertTriangle size={14} color="#CA6F1E" /> <strong>MAM:</strong> Moderate Malnutrition (-2 SD Cutoff)</div>
            <div style={{ display: "flex", alignItems: "center", gap: 6 }}><AlertTriangle size={14} color="#B03A2E" /> <strong>SAM:</strong> Severe Malnutrition (-3 SD Cutoff)</div>
          </div>

          <div className="table-wrap" style={{ maxHeight: 600, overflowY: "auto" }}>
            <table style={{ minWidth: 600 }}>
              <thead style={{ position: "sticky", top: 0, background: "#fff", zIndex: 10, boxShadow: "0 1px 0 #e2e8f0" }}>
                <tr>
                  <th style={{ width: 100 }}>Month</th>
                  <th style={{ color: "#1E8449", background: "#f0fdf4" }}>Ideal Target (Median)</th>
                  <th style={{ color: "#CA6F1E", background: "#fffbeb" }}>MAM Alert (-2 SD Cutoff)</th>
                  <th style={{ color: "#B03A2E", background: "#fef2f2" }}>SAM Crisis (-3 SD Cutoff)</th>
                </tr>
              </thead>
              <tbody>
                {tableData.map((row) => (
                  <tr key={row.month} style={{ background: row.month % 12 === 0 ? "#f8fafc" : "#fff" }}>
                    <td style={{ fontWeight: 700, color: "#0D1B2A", fontFamily: "'IBM Plex Mono', monospace" }}>
                      Month {row.month}
                      {row.month % 12 === 0 && row.month > 0 && <span style={{ marginLeft: 6, fontSize: 10, background: "#e2e8f0", padding: "2px 6px", borderRadius: 10, color: "#475569" }}>{row.month / 12} Yrs</span>}
                    </td>
                    <td style={{ fontWeight: 700, color: "#1E8449", fontFamily: "'IBM Plex Mono', monospace" }}>
                      {row.ideal.toFixed(1)} {metric === "weight" ? "kg" : "cm"}
                    </td>
                    <td style={{ fontWeight: 600, color: "#CA6F1E", fontFamily: "'IBM Plex Mono', monospace" }}>
                      {metric === "weight" ? "<" : "<"} {row.mam.toFixed(1)} {metric === "weight" ? "kg" : "cm"}
                    </td>
                    <td style={{ fontWeight: 600, color: "#B03A2E", fontFamily: "'IBM Plex Mono', monospace" }}>
                      {metric === "weight" ? "<" : "<"} {row.sam.toFixed(1)} {metric === "weight" ? "kg" : "cm"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
