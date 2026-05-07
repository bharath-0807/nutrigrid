import { useState } from "react";
import {
  AlertTriangle, Eye, EyeOff, Lock, User, LogIn, Sprout, Fingerprint, Shield
} from "lucide-react";
import { loginUser } from "../services/authService";

export default function LoginPage({ onLogin }) {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [showPw, setShowPw] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [bioStatus, setBioStatus] = useState(""); // "" | "scanning" | "success" | "error"

  const handleLogin = async () => {
    setError("");
    if (!username.trim() || !password.trim()) {
      setError("Please enter email and password.");
      return;
    }
    setLoading(true);
    try {
      const email = username.includes('@') ? username : `${username}@nutrigrid.in`;
      const user = await loginUser(email, password);
      onLogin(user);
    } catch (err) {
      setError(err.message || "Invalid credentials. Please try again.");
      setLoading(false);
    }
  };

  // WebAuthn Biometric Login (uses phone fingerprint / face unlock)
  const handleBiometric = async () => {
    setBioStatus("scanning");
    setError("");
    try {
      if (!window.PublicKeyCredential) {
        throw new Error("Biometric authentication is not supported on this device/browser.");
      }
      // Create a challenge for WebAuthn
      const challenge = new Uint8Array(32);
      crypto.getRandomValues(challenge);
      const credential = await navigator.credentials.create({
        publicKey: {
          challenge,
          rp: { name: "NutriGrid ICDS" },
          user: {
            id: new Uint8Array(16),
            name: "worker@nutrigrid.in",
            displayName: "Anganwadi Worker",
          },
          pubKeyCredParams: [{ alg: -7, type: "public-key" }],
          authenticatorSelection: {
            authenticatorAttachment: "platform",
            userVerification: "required",
          },
          timeout: 60000,
        },
      });
      if (credential) {
        setBioStatus("success");
        // After biometric success, log in with default worker account
        setTimeout(async () => {
          try {
            const user = await loginUser("worker@nutrigrid.in", "nutrigrid123");
            onLogin(user);
          } catch {
            setError("Biometric verified, but account login failed. Use email/password.");
            setBioStatus("");
          }
        }, 800);
      }
    } catch (err) {
      setBioStatus("error");
      setError(err.message || "Biometric authentication failed.");
      setTimeout(() => setBioStatus(""), 3000);
    }
  };

  const handleKey = (e) => {
    if (e.key === "Enter") handleLogin();
  };

  return (
    <div className="login-page">
      <div className="login-grid" />
      <div className="login-card">
        {/* Header */}
        <div className="login-header">
          <div className="login-logo">
            <div className="login-logo-icon"><Sprout size={24} color="#fff" /></div>
            <div>
              <div className="login-logo-text">NutriGrid</div>
              <div className="login-logo-sub">ICDS Monitoring System</div>
            </div>
          </div>
          <div className="login-header-tag">
            <strong>Coimbatore District · ICDS Programme</strong>
            <br />
            WHO LMS Algorithm · v2.0
          </div>
        </div>

        {/* Body */}
        <div className="login-body">
          <div className="login-title">Sign in to NutriGrid</div>
          <div className="login-sub">
            Enter your ICDS credentials or use biometric authentication
          </div>

          {/* Biometric Login Button */}
          <button
            onClick={handleBiometric}
            disabled={bioStatus === "scanning" || bioStatus === "success"}
            style={{
              width: "100%", padding: "14px", borderRadius: 12, fontSize: 14, fontWeight: 700,
              display: "flex", alignItems: "center", justifyContent: "center", gap: 10,
              background: bioStatus === "success" ? "#ECFDF5" : bioStatus === "scanning" ? "#EBF3FB" : "linear-gradient(135deg, #0F172A, #1E293B)",
              color: bioStatus === "success" ? "#059669" : bioStatus === "scanning" ? "#2563EB" : "#fff",
              border: bioStatus === "success" ? "2px solid #A7F3D0" : bioStatus === "scanning" ? "2px solid #93C5FD" : "2px solid transparent",
              cursor: (bioStatus === "scanning" || bioStatus === "success") ? "not-allowed" : "pointer",
              transition: "all 0.3s", marginBottom: 16,
              fontFamily: "var(--font-heading)",
              boxShadow: bioStatus === "" ? "0 4px 12px rgba(15,23,42,0.3)" : "none",
            }}
          >
            {bioStatus === "scanning" && <><Fingerprint size={20} style={{ animation: "pulse 1s infinite" }} /> Scanning Biometric...</>}
            {bioStatus === "success" && <><Shield size={20} /> Biometric Verified</>}
            {bioStatus === "error" && <><AlertTriangle size={20} /> Retry Biometric</>}
            {bioStatus === "" && <><Fingerprint size={20} /> Login with Fingerprint / Face ID</>}
          </button>

          <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 16 }}>
            <div style={{ flex: 1, height: 1, background: "#E2E8F0" }} />
            <span style={{ fontSize: 11.5, color: "#94A3B8", fontWeight: 600 }}>OR</span>
            <div style={{ flex: 1, height: 1, background: "#E2E8F0" }} />
          </div>

          {/* Username */}
          <div className="login-field">
            <label className="login-label">Username</label>
            <div className="login-input-wrap">
              <User size={15} color="#7A92A8" style={{ position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)" }} />
              <input
                className="login-input"
                type="text"
                placeholder="Enter your username"
                value={username}
                onChange={(e) => { setUsername(e.target.value); setError(""); }}
                onKeyDown={handleKey}
                autoComplete="username"
              />
            </div>
          </div>

          {/* Password */}
          <div className="login-field">
            <label className="login-label">Password</label>
            <div className="login-input-wrap">
              <Lock size={15} color="#7A92A8" style={{ position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)" }} />
              <input
                className="login-input"
                type={showPw ? "text" : "password"}
                placeholder="Enter your password"
                value={password}
                onChange={(e) => { setPassword(e.target.value); setError(""); }}
                onKeyDown={handleKey}
                autoComplete="current-password"
                style={{ paddingRight: 40 }}
              />
              <button
                onClick={() => setShowPw((p) => !p)}
                style={{ position: "absolute", right: 12, top: "50%", transform: "translateY(-50%)", background: "none", border: "none", cursor: "pointer", color: "#7A92A8", padding: 0 }}
              >
                {showPw ? <EyeOff size={15} /> : <Eye size={15} />}
              </button>
            </div>
          </div>

          {/* Error */}
          {error && (
            <div style={{ background: "#FDEDEC", border: "1px solid #F1948A", borderRadius: 4, padding: "9px 12px", fontSize: 12.5, color: "#B03A2E", display: "flex", alignItems: "center", gap: 8 }}>
              <AlertTriangle size={13} /> {error}
            </div>
          )}

          {/* Login Button */}
          <button className="login-btn" onClick={handleLogin} disabled={loading}>
            {loading ? (
              <span style={{ opacity: 0.7 }}>Verifying...</span>
            ) : (
              <>
                <LogIn size={15} /> Sign In
              </>
            )}
          </button>

          <div className="login-footer-note">
            <Shield size={12} style={{ marginRight: 4 }} /> Secure ICDS System · Jansons Institute of Technology
          </div>
        </div>
      </div>
    </div>
  );
}
