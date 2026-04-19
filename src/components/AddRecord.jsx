import { useState, useCallback, useRef } from "react";
import { CheckCircle, Brain, Mic, MicOff, Volume2, AlertCircle } from "lucide-react";
import { lmsZScore, classifyChild, getOptimalTarget } from "../utils/lmsCalc";
import { GRADE_CFG } from "../data/clinicalConfig";
import { saveChildToFirebase } from "../services/childrenService";

// ── MUAC Classification (WHO/UNICEF Standard) ──
// Applies to children 6–59 months
function classifyMUAC(muac) {
  if (muac === "" || muac === null || muac === undefined) return null;
  const v = parseFloat(muac);
  if (isNaN(v)) return null;
  if (v < 11.5) return { zone: "RED", label: "Severe Acute Malnutrition", color: "#B03A2E", bg: "#FDEDEC" };
  if (v < 12.5) return { zone: "YELLOW", label: "Moderate Acute Malnutrition", color: "#CA6F1E", bg: "#FEF5E7" };
  return { zone: "GREEN", label: "Normal — No Acute Malnutrition", color: "#1E8449", bg: "#E9F7EF" };
}

// ── Voice Recognition Hook (Web Speech API — 100% free) ──
function useVoiceInput(onResult, lang) {
  const [listening, setListening] = useState(false);
  const recognitionRef = useRef(null);

  const startListening = () => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) {
      alert("Voice input is not supported in this browser. Please use Chrome.");
      return;
    }

    const recognition = new SpeechRecognition();
    recognition.continuous = false;
    recognition.interimResults = false;
    recognition.lang = lang; 
    recognition.maxAlternatives = 1;

    recognition.onresult = (event) => {
      const transcript = event.results[0][0].transcript.toLowerCase();
      onResult(transcript);
      setListening(false);
    };

    recognition.onerror = () => setListening(false);
    recognition.onend = () => setListening(false);

    recognitionRef.current = recognition;
    recognition.start();
    setListening(true);
  };

  const stopListening = () => {
    if (recognitionRef.current) {
      recognitionRef.current.stop();
    }
    setListening(false);
  };

  return { listening, startListening, stopListening };
}

// ── Parse spoken numbers from voice transcript ──
function parseSpokenNumber(text) {
  // Common number mappings for multiple languages
  const wordToNum = {
    // English
    zero: 0, one: 1, two: 2, three: 3, four: 4, five: 5,
    six: 6, seven: 7, eight: 8, nine: 9, ten: 10,
    hundred: 100, point: ".",
    // Tamil
    பூஜ்யம்: 0, ஒன்று: 1, இரண்டு: 2, மூன்று: 3, நான்கு: 4, ஐந்து: 5,
    ஆறு: 6, ஏழு: 7, எட்டு: 8, ஒன்பது: 9, பத்து: 10, புள்ளி: ".",
    // Hindi
    शून्य: 0, एक: 1, दो: 2, तीन: 3, चार: 4, पाँच: 5,
    छह: 6, सात: 7, आठ: 8, नौ: 9, दस: 10, दशमलव: ".",
  };

  let cleaned = text.trim();

  // Replace word numbers with digits
  Object.entries(wordToNum).forEach(([word, num]) => {
    cleaned = cleaned.replace(new RegExp(`\\b${word}\\b|${word}`, "gi"), num.toString());
  });

  // Extract all numbers (including decimals)
  const numbers = cleaned.match(/\d+\.?\d*/g);
  return numbers ? numbers.map(Number) : [];
}

export default function AddRecord() {
  const [form, setForm] = useState({
    name: "", age: "", gender: "boys", village: "Block A", weight: "", height: "", muac: "",
  });
  const [toast, setToast] = useState(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [voiceStatus, setVoiceStatus] = useState("");
  const [voiceLang, setVoiceLang] = useState("en-IN");

  const VOICE_LANGS = [
    { code: "en-IN", label: "English (India)" },
    { code: "ta-IN", label: "Tamil (தமிழ்)" },
    { code: "hi-IN", label: "Hindi (हिन्दी)" },
    { code: "kn-IN", label: "Kannada (ಕನ್ನಡ)" },
    { code: "ml-IN", label: "Malayalam (മലയാളம்)" },
    { code: "te-IN", label: "Telugu (తెలుగు)" },
  ];

  const update = useCallback((k, v) => setForm((p) => ({ ...p, [k]: v })), []);

  // ── Voice command handler ──
  const handleVoiceResult = useCallback((transcript) => {
    setVoiceStatus(`Heard: "${transcript}"`);
    const nums = parseSpokenNumber(transcript);
    const lower = transcript.toLowerCase();

    // Try to find which field the user is talking about
    if (lower.includes("weight") && nums.length > 0) {
      update("weight", nums[0].toString());
      setVoiceStatus(`Weight set to ${nums[0]} kg`);
    } else if (lower.includes("height") && nums.length > 0) {
      update("height", nums[0].toString());
      setVoiceStatus(`Height set to ${nums[0]} cm`);
    } else if (lower.includes("age") && nums.length > 0) {
      update("age", Math.round(nums[0]).toString());
      setVoiceStatus(`Age set to ${Math.round(nums[0])} months`);
    } else if ((lower.includes("muac") || lower.includes("arm")) && nums.length > 0) {
      update("weight", nums[0].toString());
      setVoiceStatus(`MUAC set to ${nums[0]} cm`);
    } else if (nums.length >= 2) {
      // If two numbers spoken without field names, assume weight then height
      update("weight", nums[0].toString());
      update("height", nums[1].toString());
      setVoiceStatus(`Weight: ${nums[0]} kg, Height: ${nums[1]} cm`);
    } else if (nums.length === 1) {
      setVoiceStatus(`Heard ${nums[0]} — specify "weight" or "height"`);
    } else {
      setVoiceStatus(`Could not parse input. Try again.`);
    }

    setTimeout(() => setVoiceStatus(""), 5000);
  }, [update]);

  const { listening, startListening, stopListening } = useVoiceInput(handleVoiceResult, voiceLang);

  const muacResult = classifyMUAC(form.muac);

  const handleSubmit = async () => {
    setError("");

    if (!form.name.trim() || !form.age || !form.weight || !form.height) {
      setError("All fields required for WHO z-score classification.");
      return;
    }

    const age = parseInt(form.age);
    const wt = parseFloat(form.weight);
    const ht = parseFloat(form.height);
    const muac = form.muac ? parseFloat(form.muac) : null;

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
    if (muac !== null && (isNaN(muac) || muac < 5 || muac > 25)) {
      setError("MUAC must be between 5 and 25 cm.");
      return;
    }

    const waz = lmsZScore(wt, age, form.gender, "weight");
    const haz = lmsZScore(ht, age, form.gender, "height");
    const grade = classifyChild(waz, haz);

    setLoading(true);
    try {
      const record = { month: age, weight: wt, height: ht };
      if (muac !== null) record.muac = muac;

      await saveChildToFirebase({
        id: Date.now().toString(),
        name: form.name.trim(),
        age,
        gender: form.gender,
        village: form.village,
        records: [record],
      });

      setToast({ grade, waz: waz.toFixed(2), haz: haz.toFixed(2), muac: muacResult });
      setForm({ name: "", age: "", gender: "boys", village: "Block A", weight: "", height: "", muac: "" });
      setTimeout(() => setToast(null), 5000);
    } catch (err) {
      setError("Failed to save record to Firebase. Check internet connection.");
    } finally {
      setLoading(false);
    }
  };

  // Show ideal weight/height when age and gender are filled
  const ageNum = parseInt(form.age);
  const showIdeal = !isNaN(ageNum) && ageNum >= 0 && ageNum <= 60;

  return (
    <div style={{ maxWidth: 560, margin: "0 auto" }}>
      <div className="card">
        <div className="card-header">
          <div>
            <div className="card-title">Register New Child</div>
            <div className="card-subtitle">WHO LMS z-score + MUAC computed automatically</div>
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
              {toast.muac && <> · MUAC: <strong>{toast.muac.zone}</strong></>}
            </div>
          )}
          {error && <div className="form-error">{error}</div>}

          {/* ── VOICE INPUT SECTION ── */}
          <div style={{
            background: listening ? "#EBF3FB" : "#f8fafc",
            border: `2px ${listening ? "solid #2563EB" : "dashed #cbd5e1"}`,
            borderRadius: 10, padding: "14px 18px", marginBottom: 18,
            display: "flex", alignItems: "center", gap: 14,
            transition: "all 0.3s ease",
            animation: listening ? "pulse 1.5s infinite" : "none",
          }}>
            <button
              onClick={listening ? stopListening : startListening}
              style={{
                width: 44, height: 44, borderRadius: "50%",
                background: listening ? "#2563EB" : "#00509E",
                border: "none", cursor: "pointer", display: "flex",
                alignItems: "center", justifyContent: "center",
                boxShadow: listening ? "0 0 0 6px rgba(37,99,235,0.2)" : "none",
                transition: "all 0.3s",
              }}
            >
              {listening ? <MicOff size={20} color="#fff" /> : <Mic size={20} color="#fff" />}
            </button>
            <div style={{ flex: 1 }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <div style={{ fontSize: 13, fontWeight: 700, color: listening ? "#2563EB" : "#0D1B2A", fontFamily: "var(--font-heading)" }}>
                  {listening ? "Listening... Speak now" : "AI Voice Input"}
                </div>
                <select 
                  value={voiceLang} 
                  onChange={(e) => setVoiceLang(e.target.value)} 
                  disabled={listening}
                  style={{ fontSize: 10, padding: "2px 6px", borderRadius: 4, border: "1px solid #cbd5e1", background: "#fff", cursor: "pointer" }}
                >
                  {VOICE_LANGS.map(l => <option key={l.code} value={l.code}>{l.label}</option>)}
                </select>
              </div>
              <div style={{ fontSize: 11.5, color: "#7A92A8", marginTop: 2 }}>
                {voiceStatus || (listening
                  ? 'Speak: "Weight 5.5" or measurements in your language'
                  : "Tap microphone to speak measurements instead of typing")}
              </div>
            </div>
            {listening && <Volume2 size={18} color="#2563EB" style={{ animation: "blink 1s infinite" }} />}
          </div>

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
              <div className="form-hint">
                {showIdeal
                  ? <>WHO Ideal: <strong>{getOptimalTarget(ageNum, form.gender, "weight").toFixed(1)} kg</strong></>
                  : "0.5–30 kg (nearest 0.1 kg)"}
              </div>
            </div>
            <div className="form-group">
              <label className="form-label">Height / Length (cm)</label>
              <input className="form-input" type="number" step="0.1" min="30" max="130" placeholder="e.g. 84.0" value={form.height} onChange={(e) => update("height", e.target.value)} />
              <div className="form-hint">
                {showIdeal
                  ? <>WHO Ideal: <strong>{getOptimalTarget(ageNum, form.gender, "height").toFixed(1)} cm</strong></>
                  : "30–130 cm · Recumbent for under 2 years"}
              </div>
            </div>

            {/* ── MUAC FIELD ── */}
            <div className="form-group" style={{ gridColumn: "1 / -1" }}>
              <label className="form-label" style={{ display: "flex", alignItems: "center", gap: 8 }}>
                MUAC — Mid-Upper Arm Circumference (cm)
                <span style={{ fontSize: 10, background: "#E0F5F5", color: "#007B83", padding: "2px 8px", borderRadius: 10, fontWeight: 600 }}>WHO/UNICEF</span>
              </label>
              <input className="form-input" type="number" step="0.1" min="5" max="25" placeholder="e.g. 13.5 (optional but recommended)" value={form.muac} onChange={(e) => update("muac", e.target.value)} />
              <div className="form-hint">Measured on the left arm, midpoint between shoulder and elbow · 6–59 months</div>

              {/* MUAC Visual Tape */}
              <div style={{ marginTop: 10, display: "flex", borderRadius: 6, overflow: "hidden", height: 28, fontSize: 11, fontWeight: 700, fontFamily: "IBM Plex Mono" }}>
                <div style={{ flex: 1, background: "#B03A2E", color: "#fff", display: "flex", alignItems: "center", justifyContent: "center", opacity: muacResult?.zone === "RED" ? 1 : 0.3, transition: "opacity 0.3s" }}>
                  RED &lt;11.5cm
                </div>
                <div style={{ flex: 1, background: "#CA6F1E", color: "#fff", display: "flex", alignItems: "center", justifyContent: "center", opacity: muacResult?.zone === "YELLOW" ? 1 : 0.3, transition: "opacity 0.3s" }}>
                  YELLOW 11.5–12.5cm
                </div>
                <div style={{ flex: 1, background: "#1E8449", color: "#fff", display: "flex", alignItems: "center", justifyContent: "center", opacity: muacResult?.zone === "GREEN" ? 1 : 0.3, transition: "opacity 0.3s" }}>
                  GREEN &gt;12.5cm
                </div>
              </div>

              {/* MUAC Result */}
              {muacResult && (
                <div style={{
                  marginTop: 10, padding: "10px 14px", borderRadius: 8,
                  background: muacResult.bg, borderLeft: `4px solid ${muacResult.color}`,
                  fontSize: 12.5, fontWeight: 600, color: muacResult.color,
                }}>
                  MUAC: {form.muac} cm — {muacResult.zone} Zone — {muacResult.label}
                </div>
              )}
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

          {/* ── WHO Reference Footer ── */}
          <div style={{ marginTop: 16, padding: "12px 16px", background: "#f8fafc", borderRadius: 8, border: "1px solid #e2e8f0" }}>
            <div style={{ fontSize: 11, fontWeight: 700, color: "#475569", marginBottom: 6 }}>📋 Clinical References</div>
            <div style={{ fontSize: 10.5, color: "#7A92A8", lineHeight: 1.6 }}>
              • WHO Child Growth Standards (2006) — LMS Box-Cox Z-Score Method<br />
              • WHO MGRS: Children across all ethnicities grow similarly under optimal conditions<br />
              • MUAC: WHO/UNICEF standard for genetic-independent malnutrition screening (6–59mo)<br />
              • ICMR-NIN Recommended Dietary Allowances for Indians (2020)
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
