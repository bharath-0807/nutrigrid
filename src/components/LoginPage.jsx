import { useState } from "react";
import {
  AlertTriangle, Eye, EyeOff, Lock, User, LogIn,
} from "lucide-react";
import { loginUser } from "../services/authService";

export default function LoginPage({ onLogin }) {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [showPw, setShowPw] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleLogin = async () => {
    setError("");
    if (!username.trim() || !password.trim()) {
      setError("Please enter email and password.");
      return;
    }
    setLoading(true);
    try {
      // In Firebase email is standard. If the user types in 'worker1' we can maybe parse it or just expect full email.
      // E.g., appending @nutrigrid.in for demo compatibility
      const email = username.includes('@') ? username : `${username}@nutrigrid.in`;
      
      await loginUser(email, password);
      // Wait, App.jsx handles user state centrally when Firebase auth state changes.
      // But we can trigger onLogin(user) to immediately update UI if needed.
    } catch (err) {
      setError(err.message || "Invalid credentials. Please try again.");
      setLoading(false);
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
            <div className="login-logo-icon">🌱</div>
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
            Enter your ICDS credentials to access the dashboard
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
            🔒 Secure ICDS System · Jansons Institute of Technology
          </div>
        </div>
      </div>
    </div>
  );
}
