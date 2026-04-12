import { useState, useCallback } from "react";
import { CheckCircle, Brain } from "lucide-react";
import { lmsZScore, classifyChild } from "../utils/lmsCalc";
import { GRADE_CFG } from "../data/clinicalConfig";
import { saveChildToFirebase } from "../services/childrenService";

export default function AddRecord() {
  const [form, setForm] = useState({
    name: "", age: "", gender: "boys", village: "Block A", weight: "", height: "",
  });
  const [toast, setToast] = useState(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const update = useCallback((k, v) => setForm((p) => ({ ...p, [k]: v })), []);

  const handleSubmit = async () => {
    // Clear previous error
    setError("");

    // Required field check
    if (!form.name.trim() || !form.age || !form.weight || !form.height) {
      setError("All fields required for WHO z-score classification.");
      return;
    }

    const age = parseInt(form.age);
    const wt = parseFloat(form.weight);
    const ht = parseFloat(form.height);

    // Range validation
    if (isNaN(age) || age < 0 || age > 60) {
      setError("Age must be between 0 and 60 months.");
      return;
    }
    if (isNaN(wt) || wt < 0.5 || wt > 30) {
      setError("Weight must be between 0.5 and 30 kg for children 0–60 months.");
      return;
    }
    if (isNaN(ht) || ht < 30 || ht > 130) {
      setError("Height must be between 30 and 130 cm for children 0–60 months.");
      return;
    }

    const waz = lmsZScore(wt, age, form.gender, "weight");
    const haz = lmsZScore(ht, age, form.gender, "height");
    const grade = classifyChild(waz, haz);

    setLoading(true);
    try {
      await saveChildToFirebase({
        id: Date.now().toString(),
        name: form.name.trim(),
        age,
        gender: form.gender,
        village: form.village,
        records: [{ month: age, weight: wt, height: ht }],
      });

      setToast({ grade, waz: waz.toFixed(2), haz: haz.toFixed(2) });
      setForm({ name: "", age: "", gender: "boys", village: "Block A", weight: "", height: "" });
      setTimeout(() => setToast(null), 4000);
    } catch (err) {
      setError("Failed to save record to Firebase. Check internet connection.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ maxWidth: 560, margin: "0 auto" }}>
      <div className="card">
        <div className="card-header">
          <div>
            <div className="card-title">Register New Child</div>
            <div className="card-subtitle">WHO LMS z-score computed automatically</div>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 6, background: "#E0F5F5", border: "1px solid #80CCCE", borderRadius: 3, padding: "4px 10px" }}>
            <Brain size={12} color="#007B83" />
            <span style={{ fontSize: 11, color: "#007B83", fontWeight: 700, fontFamily: "IBM Plex Mono" }}>WHO LMS</span>
          </div>
        </div>
        <div className="card-body">
          {toast && (
            <div
              className="toast"
              style={{
                background: GRADE_CFG[toast.grade]?.bg,
                borderColor: GRADE_CFG[toast.grade]?.border,
                borderLeftColor: GRADE_CFG[toast.grade]?.col,
                color: GRADE_CFG[toast.grade]?.col,
              }}
            >
              <CheckCircle size={14} />
              Registered · WHO Grade: <strong>{toast.grade}</strong> · WAZ:{toast.waz} · HAZ:{toast.haz}
            </div>
          )}
          {error && <div className="form-error">{error}</div>}

          <div className="form-grid">
            <div className="form-group" style={{ gridColumn: "1 / -1" }}>
              <label className="form-label">Full Name</label>
              <input className="form-input" placeholder="Child's full name" value={form.name} onChange={(e) => update("name", e.target.value)} />
            </div>
            <div className="form-group">
              <label className="form-label">Age (months)</label>
              <input className="form-input" type="number" min="0" max="60" placeholder="0 – 60" value={form.age} onChange={(e) => update("age", e.target.value)} />
              <div className="form-hint">Completed months (0–60)</div>
            </div>
            <div className="form-group">
              <label className="form-label">Sex</label>
              <select className="form-input" value={form.gender} onChange={(e) => update("gender", e.target.value)}>
                <option value="boys">Male</option>
                <option value="girls">Female</option>
              </select>
            </div>
            <div className="form-group">
              <label className="form-label">Weight (kg)</label>
              <input className="form-input" type="number" step="0.1" min="0.5" max="30" placeholder="e.g. 11.5" value={form.weight} onChange={(e) => update("weight", e.target.value)} />
              <div className="form-hint">0.5–30 kg (nearest 0.1 kg)</div>
            </div>
            <div className="form-group">
              <label className="form-label">Height / Length (cm)</label>
              <input className="form-input" type="number" step="0.1" min="30" max="130" placeholder="e.g. 84.0" value={form.height} onChange={(e) => update("height", e.target.value)} />
              <div className="form-hint">30–130 cm · Recumbent for under 2 years</div>
            </div>
            <div className="form-group" style={{ gridColumn: "1 / -1" }}>
              <label className="form-label">Block</label>
              <select className="form-input" value={form.village} onChange={(e) => update("village", e.target.value)}>
                <option>Block A</option>
                <option>Block B</option>
                <option>Block C</option>
              </select>
            </div>
          </div>
          <button className="btn-primary" onClick={handleSubmit} disabled={loading} style={{ width: "100%", justifyContent: "center", padding: "11px", fontSize: 13.5 }}>
            {loading ? "Processing..." : <><Brain size={14} /> Register & Compute WHO LMS Grade</>}
          </button>
        </div>
      </div>
    </div>
  );
}
