import { useState, useCallback, useRef } from "react";
import { CheckCircle, Brain, Mic, MicOff, Volume2, Search, UserPlus, Syringe, Heart, Edit3 } from "lucide-react";
import { lmsZScore, classifyChild, getOptimalTarget } from "../utils/lmsCalc";
import { GRADE_CFG } from "../data/clinicalConfig";
import { saveChildToFirebase } from "../services/childrenService";

// ── MUAC Classification (WHO/UNICEF Standard) ──
function classifyMUAC(muac) {
  if (muac === "" || muac === null || muac === undefined) return null;
  const v = parseFloat(muac);
  if (isNaN(v)) return null;
  if (v < 11.5) return { zone: "RED", label: "Severe Acute Malnutrition", color: "#B03A2E", bg: "#FDEDEC" };
  if (v < 12.5) return { zone: "YELLOW", label: "Moderate Acute Malnutrition", color: "#CA6F1E", bg: "#FEF5E7" };
  return { zone: "GREEN", label: "Normal — No Acute Malnutrition", color: "#1E8449", bg: "#E9F7EF" };
}

// ── Voice Recognition Hook ──
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
    if (recognitionRef.current) recognitionRef.current.stop();
    setListening(false);
  };

  return { listening, startListening, stopListening };
}

function parseSpokenNumber(text) {
  const wordToNum = {
    zero: 0, one: 1, two: 2, three: 3, four: 4, five: 5,
    six: 6, seven: 7, eight: 8, nine: 9, ten: 10,
    hundred: 100, point: ".",
    பூஜ்யம்: 0, ஒன்று: 1, இரண்டு: 2, மூன்று: 3, நான்கு: 4, ஐந்து: 5,
    ஆறு: 6, ஏழு: 7, எட்டு: 8, ஒன்பது: 9, பத்து: 10, புள்ளி: ".",
  };
  let cleaned = text.trim();
  Object.entries(wordToNum).forEach(([word, num]) => {
    cleaned = cleaned.replace(new RegExp(`\\b${word}\\b|${word}`, "gi"), num.toString());
  });
  const numbers = cleaned.match(/\d+\.?\d*/g);
  return numbers ? numbers.map(Number) : [];
}

const MEDICAL_OPTIONS = ["None", "Peanut Allergy", "Milk Allergy", "Asthma", "Type 1 Diabetes", "Differently Abled", "Congenital Heart Defect", "Epilepsy", "Other"];
const VACCINE_OPTIONS = ["Fully Vaccinated", "Pending Polio", "Pending Measles", "Pending DPT", "Not Vaccinated"];

export default function AddRecord({ user, children = [], setScreen, editChild, clearEdit }) {
  const [mode, setMode] = useState("new"); // "new" | "followup"
  const [searchId, setSearchId] = useState("");
  const [foundChild, setFoundChild] = useState(null);

  const [form, setForm] = useState({
    name: "", age: "", gender: "boys", village: "Block A", weight: "", height: "", muac: "",
    medicalConditions: [], vaccinationStatus: "Fully Vaccinated",
  });
  const [toast, setToast] = useState(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [voiceStatus, setVoiceStatus] = useState("");
  const [voiceLang, setVoiceLang] = useState("en-IN");

  // Pre-fill form when editing an existing child
  const isEditing = !!editChild;
  useState(() => {
    if (editChild) {
      const lastRec = editChild.records?.[editChild.records.length - 1];
      setMode("new");
      setForm({
        name: editChild.name || "",
        age: lastRec ? String(lastRec.month) : "",
        gender: editChild.gender || "boys",
        village: editChild.village || "Block A",
        weight: lastRec ? String(lastRec.weight) : "",
        height: lastRec ? String(lastRec.height) : "",
        muac: lastRec?.muac ? String(lastRec.muac) : "",
        medicalConditions: editChild.medicalConditions || [],
        vaccinationStatus: editChild.vaccinationStatus || "Fully Vaccinated",
      });
    }
  });

  const VOICE_LANGS = [
    { code: "en-IN", label: "English (India)" },
    { code: "ta-IN", label: "Tamil (தமிழ்)" },
    { code: "hi-IN", label: "Hindi (हिन्दी)" },
    { code: "kn-IN", label: "Kannada (ಕನ್ನಡ)" },
    { code: "ml-IN", label: "Malayalam (മലയാളം)" },
    { code: "te-IN", label: "Telugu (తెలుగు)" },
  ];

  const update = useCallback((k, v) => setForm((p) => ({ ...p, [k]: v })), []);

  const handleVoiceResult = useCallback((transcript) => {
    setVoiceStatus(`Heard: "${transcript}"`);
    const nums = parseSpokenNumber(transcript);
    const lower = transcript.toLowerCase();
    if (lower.includes("weight") && nums.length > 0) {
      update("weight", nums[0].toString());
      setVoiceStatus(`Weight set to ${nums[0]} kg`);
    } else if (lower.includes("height") && nums.length > 0) {
      update("height", nums[0].toString());
      setVoiceStatus(`Height set to ${nums[0]} cm`);
    } else if (lower.includes("age") && nums.length > 0) {
      update("age", Math.round(nums[0]).toString());
      setVoiceStatus(`Age set to ${Math.round(nums[0])} months`);
    } else if (nums.length >= 2) {
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

  // Search for existing child by NutriGrid ID
  const handleSearchFollowup = () => {
    setError("");
    setFoundChild(null);
    if (!searchId.trim()) { setError("Please enter a NutriGrid ID to search."); return; }
    const match = children.find(c =>
      c.nutrigridId?.toLowerCase() === searchId.trim().toLowerCase() ||
      c.id === searchId.trim()
    );
    if (match) {
      setFoundChild(match);
      const lastRec = match.records?.[match.records.length - 1];
      setForm(prev => ({ ...prev, age: lastRec ? String(lastRec.month + 6) : "", gender: match.gender, village: match.village }));
    } else {
      setError(`No child found with ID "${searchId}". Check the ID and try again.`);
    }
  };

  const toggleMedical = (cond) => {
    setForm(prev => {
      let arr = [...prev.medicalConditions];
      if (cond === "None") return { ...prev, medicalConditions: ["None"] };
      arr = arr.filter(c => c !== "None");
      if (arr.includes(cond)) arr = arr.filter(c => c !== cond);
      else arr.push(cond);
      return { ...prev, medicalConditions: arr.length > 0 ? arr : ["None"] };
    });
  };

  const handleSubmit = async () => {
    setError("");
    const wt = parseFloat(form.weight);
    const ht = parseFloat(form.height);
    const age = parseInt(form.age);
    const muac = form.muac ? parseFloat(form.muac) : null;

    if (mode === "new" && !form.name.trim()) { setError("Child name is required."); return; }
    if (!form.age || !form.weight || !form.height) { setError("Age, Weight, and Height are required."); return; }
    if (isNaN(age) || age < 0 || age > 60) { setError("Age must be between 0 and 60 months."); return; }
    if (isNaN(wt) || wt < 0.5 || wt > 30) { setError("Weight must be between 0.5 and 30 kg."); return; }
    if (isNaN(ht) || ht < 30 || ht > 130) { setError("Height must be between 30 and 130 cm."); return; }
    if (muac !== null && (isNaN(muac) || muac < 5 || muac > 25)) { setError("MUAC must be between 5 and 25 cm."); return; }

    const genderForCalc = form.gender;
    const waz = lmsZScore(wt, age, genderForCalc, "weight");
    const haz = lmsZScore(ht, age, genderForCalc, "height");
    const grade = classifyChild(waz, haz);

    setLoading(true);
    try {
      const record = {
        month: age, weight: wt, height: ht,
        enteredBy: user?.name || user?.email || "Worker",
        updatedAt: new Date().toISOString(),
      };
      if (muac !== null) record.muac = muac;

      let savedNutrigridId = "";

      if (isEditing && editChild) {
        // EDIT MODE: Replace the last record with corrected data
        const updatedRecords = [...(editChild.records || [])];
        updatedRecords[updatedRecords.length - 1] = {
          ...record,
          editedFrom: editChild.records[editChild.records.length - 1], // Keep old data for audit
          editReason: "Data Correction",
        };
        await saveChildToFirebase({
          ...editChild,
          name: form.name.trim(),
          age,
          gender: form.gender,
          village: form.village,
          records: updatedRecords,
          medicalConditions: form.medicalConditions,
          vaccinationStatus: form.vaccinationStatus,
          lastEditedBy: user?.name || user?.email || "Worker",
          lastEditedAt: new Date().toISOString(),
        });
        savedNutrigridId = editChild.nutrigridId || "";
      } else if (mode === "followup" && foundChild) {
        // Append new checkup to existing child
        const updatedRecords = [...(foundChild.records || []), record];
        await saveChildToFirebase({
          ...foundChild,
          age,
          records: updatedRecords,
          medicalConditions: form.medicalConditions,
          vaccinationStatus: form.vaccinationStatus,
        });
        savedNutrigridId = foundChild.nutrigridId || "";
      } else {
        // New child registration
        const nextId = Date.now().toString();
        savedNutrigridId = `NG-${new Date().getFullYear()}-${String(children.length + 1).padStart(3, "0")}`;
        await saveChildToFirebase({
          id: nextId,
          nutrigridId: savedNutrigridId,
          name: form.name.trim(),
          age,
          gender: form.gender,
          village: form.village,
          anganwadi_id: user?.anganwadi_id || "AW-COIM-101",
          medicalConditions: form.medicalConditions,
          vaccinationStatus: form.vaccinationStatus,
          records: [record],
        });
      }

      setToast({
        grade, waz: waz.toFixed(2), haz: haz.toFixed(2), muac: muacResult,
        isFollowup: mode === "followup", isEdit: isEditing,
        nutrigridId: savedNutrigridId,
      });
      setForm({ name: "", age: "", gender: "boys", village: "Block A", weight: "", height: "", muac: "", medicalConditions: [], vaccinationStatus: "Fully Vaccinated" });
      setFoundChild(null);
      setSearchId("");
      if (clearEdit) clearEdit();
      setTimeout(() => setToast(null), 8000);
    } catch (err) {
      setError("Failed to save record to Firebase. Check internet connection.");
    } finally {
      setLoading(false);
    }
  };

  const ageNum = parseInt(form.age);
  const showIdeal = !isNaN(ageNum) && ageNum >= 0 && ageNum <= 60;

  return (
    <div style={{ maxWidth: 600, margin: "0 auto" }}>
      {/* MODE TOGGLE (hidden in edit mode) */}
      {!isEditing && (
      <div style={{ display: "flex", gap: 8, marginBottom: 16 }}>
        <button
          onClick={() => { setMode("new"); setFoundChild(null); setError(""); }}
          style={{
            flex: 1, padding: "12px", borderRadius: 10, fontWeight: 700, fontSize: 13.5,
            display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
            background: mode === "new" ? "#00509E" : "#F1F5F9", color: mode === "new" ? "#fff" : "#64748B",
            border: "none", cursor: "pointer", fontFamily: "var(--font-heading)", transition: "all 0.2s",
          }}
        ><UserPlus size={16} /> New Registration</button>
        <button
          onClick={() => { setMode("followup"); setError(""); }}
          style={{
            flex: 1, padding: "12px", borderRadius: 10, fontWeight: 700, fontSize: 13.5,
            display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
            background: mode === "followup" ? "#059669" : "#F1F5F9", color: mode === "followup" ? "#fff" : "#64748B",
            border: "none", cursor: "pointer", fontFamily: "var(--font-heading)", transition: "all 0.2s",
          }}
        ><Search size={16} /> Follow-up Checkup</button>
      </div>
      )}

      {/* EDIT MODE BANNER */}
      {isEditing && (
        <div style={{
          background: "linear-gradient(135deg, #FEF3C7, #FFFBEB)", border: "1.5px solid #FDE68A",
          borderRadius: 12, padding: "14px 20px", marginBottom: 16,
          display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12,
        }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <Edit3 size={18} color="#D97706" />
            <div>
              <div style={{ fontWeight: 800, fontSize: 14, color: "#92400E" }}>Editing: {editChild.name}</div>
              <div style={{ fontSize: 12, color: "#B45309", fontFamily: "IBM Plex Mono" }}>{editChild.nutrigridId} · Correcting last record</div>
            </div>
          </div>
          <button
            onClick={() => { if (clearEdit) clearEdit(); setScreen("children"); }}
            style={{ padding: "6px 14px", borderRadius: 6, border: "1px solid #D97706", background: "#fff", color: "#D97706", fontSize: 12, fontWeight: 700, cursor: "pointer" }}
          >Cancel Edit</button>
        </div>
      )}

      {/* FOLLOW-UP SEARCH */}
      {mode === "followup" && (
        <div className="card" style={{ marginBottom: 16 }}>
          <div className="card-header">
            <div>
              <div className="card-title">Search Existing Child</div>
              <div className="card-subtitle">Enter their NutriGrid ID to add a new checkup record</div>
            </div>
          </div>
          <div className="card-body">
            <div style={{ display: "flex", gap: 8, marginBottom: 12 }}>
              <input
                className="form-input"
                placeholder="e.g. NG-2026-001"
                value={searchId}
                onChange={(e) => setSearchId(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleSearchFollowup()}
                style={{ flex: 1 }}
              />
              <button className="btn-primary" onClick={handleSearchFollowup} style={{ whiteSpace: "nowrap" }}>
                <Search size={13} /> Search
              </button>
            </div>
            {foundChild && (
              <div style={{
                background: "#ECFDF5", border: "1.5px solid #A7F3D0", borderRadius: 10, padding: "12px 16px",
                display: "flex", alignItems: "center", gap: 12,
              }}>
                <div className="avatar" style={{ background: "#059669", width: 36, height: 36, fontSize: 14 }}>{foundChild.name?.[0]}</div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontWeight: 700, fontSize: 14, color: "#065F46" }}>{foundChild.name}</div>
                  <div style={{ fontSize: 12, color: "#059669", fontFamily: "IBM Plex Mono" }}>
                    {foundChild.nutrigridId} · {foundChild.records?.length || 0} prior checkup{(foundChild.records?.length || 0) !== 1 ? "s" : ""}
                  </div>
                </div>
                <CheckCircle size={20} color="#059669" />
              </div>
            )}
          </div>
        </div>
      )}

      <div className="card">
        <div className="card-header">
          <div>
            <div className="card-title">{mode === "followup" && foundChild ? `Add Checkup — ${foundChild.name}` : "Register New Child"}</div>
            <div className="card-subtitle">WHO LMS z-score + MUAC computed automatically</div>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 6, background: "#E0F5F5", border: "1px solid #80CCCE", borderRadius: 3, padding: "4px 10px" }}>
            <Brain size={12} color="#007B83" />
            <span style={{ fontSize: 11, color: "#007B83", fontWeight: 700, fontFamily: "IBM Plex Mono" }}>WHO LMS</span>
          </div>
        </div>
        <div className="card-body">
          {toast && (
            <div className="toast" style={{
              background: GRADE_CFG[toast.grade]?.bg, borderColor: GRADE_CFG[toast.grade]?.border,
              borderLeftColor: GRADE_CFG[toast.grade]?.col, color: GRADE_CFG[toast.grade]?.col,
              flexDirection: "column", alignItems: "flex-start", gap: 6,
            }}>
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <CheckCircle size={16} />
                <strong style={{ fontSize: 14 }}>
                  {toast.isEdit ? "✏️ Record Corrected" : toast.isFollowup ? "📋 Follow-up Saved" : "✅ Child Registered"}
                </strong>
              </div>
              {toast.nutrigridId && (
                <div style={{
                  background: "rgba(0,0,0,0.06)", padding: "6px 14px", borderRadius: 6, marginTop: 4,
                  fontFamily: "IBM Plex Mono", fontWeight: 800, fontSize: 16, letterSpacing: 1,
                  color: "#00509E", border: "1.5px dashed rgba(0,0,0,0.15)",
                }}>
                  🆔 {toast.nutrigridId}
                </div>
              )}
              <div style={{ fontSize: 12, marginTop: 2 }}>
                WHO Grade: <strong>{toast.grade}</strong> · WAZ: {toast.waz} · HAZ: {toast.haz}
                {toast.muac && <> · MUAC: <strong>{toast.muac.zone}</strong></>}
              </div>
              {!toast.isEdit && toast.nutrigridId && (
                <div style={{ fontSize: 11, color: "#475569", marginTop: 2 }}>
                  ☝️ Note down this ID for future follow-up checkups
                </div>
              )}
            </div>
          )}
          {error && <div className="form-error">{error}</div>}

          {/* ── VOICE INPUT ── */}
          <div style={{
            background: listening ? "#EBF3FB" : "#f8fafc",
            border: `2px ${listening ? "solid #2563EB" : "dashed #cbd5e1"}`,
            borderRadius: 10, padding: "14px 18px", marginBottom: 18,
            display: "flex", alignItems: "center", gap: 14,
            transition: "all 0.3s ease",
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
                <select value={voiceLang} onChange={(e) => setVoiceLang(e.target.value)} disabled={listening}
                  style={{ fontSize: 10, padding: "2px 6px", borderRadius: 4, border: "1px solid #cbd5e1", background: "#fff", cursor: "pointer" }}>
                  {VOICE_LANGS.map(l => <option key={l.code} value={l.code}>{l.label}</option>)}
                </select>
              </div>
              <div style={{ fontSize: 11.5, color: "#7A92A8", marginTop: 2 }}>
                {voiceStatus || (listening ? 'Speak: "Weight 5.5" or measurements in your language' : "Tap microphone to speak measurements instead of typing")}
              </div>
            </div>
            {listening && <Volume2 size={18} color="#2563EB" style={{ animation: "blink 1s infinite" }} />}
          </div>

          <div className="form-grid">
            {/* Name (only for new registration) */}
            {mode === "new" && (
              <div className="form-group" style={{ gridColumn: "1 / -1" }}>
                <label className="form-label">Full Name</label>
                <input className="form-input" placeholder="Child's full name" value={form.name} onChange={(e) => update("name", e.target.value)} />
              </div>
            )}
            <div className="form-group">
              <label className="form-label">Age (months)</label>
              <input className="form-input" type="number" min="0" max="60" placeholder="0 – 60" value={form.age} onChange={(e) => update("age", e.target.value)} />
              <div className="form-hint">Completed months (0–60)</div>
            </div>
            {mode === "new" && (
              <div className="form-group">
                <label className="form-label">Sex</label>
                <select className="form-input" value={form.gender} onChange={(e) => update("gender", e.target.value)}>
                  <option value="boys">Male</option>
                  <option value="girls">Female</option>
                  <option value="transgender">Transgender</option>
                </select>
              </div>
            )}
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

            {/* MUAC */}
            <div className="form-group" style={{ gridColumn: "1 / -1" }}>
              <label className="form-label" style={{ display: "flex", alignItems: "center", gap: 8 }}>
                MUAC — Mid-Upper Arm Circumference (cm)
                <span style={{ fontSize: 10, background: "#E0F5F5", color: "#007B83", padding: "2px 8px", borderRadius: 10, fontWeight: 600 }}>WHO/UNICEF</span>
              </label>
              <input className="form-input" type="number" step="0.1" min="5" max="25" placeholder="e.g. 13.5 (optional)" value={form.muac} onChange={(e) => update("muac", e.target.value)} />
              <div style={{ marginTop: 10, display: "flex", borderRadius: 6, overflow: "hidden", height: 28, fontSize: 11, fontWeight: 700, fontFamily: "IBM Plex Mono" }}>
                <div style={{ flex: 1, background: "#B03A2E", color: "#fff", display: "flex", alignItems: "center", justifyContent: "center", opacity: muacResult?.zone === "RED" ? 1 : 0.3, transition: "opacity 0.3s" }}>RED &lt;11.5cm</div>
                <div style={{ flex: 1, background: "#CA6F1E", color: "#fff", display: "flex", alignItems: "center", justifyContent: "center", opacity: muacResult?.zone === "YELLOW" ? 1 : 0.3, transition: "opacity 0.3s" }}>YELLOW 11.5–12.5</div>
                <div style={{ flex: 1, background: "#1E8449", color: "#fff", display: "flex", alignItems: "center", justifyContent: "center", opacity: muacResult?.zone === "GREEN" ? 1 : 0.3, transition: "opacity 0.3s" }}>GREEN &gt;12.5cm</div>
              </div>
              {muacResult && (
                <div style={{ marginTop: 10, padding: "10px 14px", borderRadius: 8, background: muacResult.bg, borderLeft: `4px solid ${muacResult.color}`, fontSize: 12.5, fontWeight: 600, color: muacResult.color }}>
                  MUAC: {form.muac} cm — {muacResult.zone} Zone — {muacResult.label}
                </div>
              )}
            </div>

            {/* MEDICAL CONDITIONS */}
            <div className="form-group" style={{ gridColumn: "1 / -1" }}>
              <label className="form-label" style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <Heart size={14} color="#E11D48" /> Medical Conditions
              </label>
              <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
                {MEDICAL_OPTIONS.map(opt => (
                  <button
                    key={opt}
                    type="button"
                    onClick={() => toggleMedical(opt)}
                    style={{
                      padding: "6px 14px", borderRadius: 20, fontSize: 12, fontWeight: 600,
                      background: form.medicalConditions.includes(opt) ? (opt === "None" ? "#ECFDF5" : "#FFF1F2") : "#F8FAFC",
                      color: form.medicalConditions.includes(opt) ? (opt === "None" ? "#059669" : "#E11D48") : "#94A3B8",
                      border: `1.5px solid ${form.medicalConditions.includes(opt) ? (opt === "None" ? "#A7F3D0" : "#FECDD3") : "#E2E8F0"}`,
                      cursor: "pointer", transition: "all 0.2s",
                    }}
                  >{opt}</button>
                ))}
              </div>
            </div>

            {/* VACCINATION STATUS */}
            <div className="form-group" style={{ gridColumn: "1 / -1" }}>
              <label className="form-label" style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <Syringe size={14} color="#00509E" /> Vaccination Status
              </label>
              <select className="form-input" value={form.vaccinationStatus} onChange={(e) => update("vaccinationStatus", e.target.value)}>
                {VACCINE_OPTIONS.map(opt => <option key={opt} value={opt}>{opt}</option>)}
              </select>
            </div>

            {mode === "new" && (
              <div className="form-group" style={{ gridColumn: "1 / -1" }}>
                <label className="form-label">Block</label>
                <select className="form-input" value={form.village} onChange={(e) => update("village", e.target.value)}>
                  <option>Block A</option>
                  <option>Block B</option>
                  <option>Block C</option>
                </select>
              </div>
            )}
          </div>

          <button className="btn-primary" onClick={handleSubmit} disabled={loading || (mode === "followup" && !foundChild)} style={{ width: "100%", justifyContent: "center", padding: "11px", fontSize: 13.5 }}>
            {loading ? "Processing..." : <><Brain size={14} /> {mode === "followup" ? "Save Follow-up Checkup" : "Register & Compute WHO LMS Grade"}</>}
          </button>

          <div style={{ marginTop: 16, padding: "12px 16px", background: "#f8fafc", borderRadius: 8, border: "1px solid #e2e8f0" }}>
            <div style={{ fontSize: 11, fontWeight: 700, color: "#475569", marginBottom: 6 }}>Clinical References</div>
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
