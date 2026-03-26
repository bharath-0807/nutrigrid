import { useState, useEffect, useCallback, useMemo } from "react";
import { ChevronRight, Download, LogOut } from "lucide-react";
import { lmsZScore, classifyChild } from "./utils/lmsCalc";
import { NAV, INIT_CHILDREN } from "./data/clinicalConfig";
import LoginPage from "./components/LoginPage";
import LandingPage from "./components/LandingPage";
import Dashboard from "./components/Dashboard";
import ChildrenList from "./components/ChildrenList";
import AddRecord from "./components/AddRecord";
import Analytics from "./components/Analytics";
import Detail from "./components/Detail";

// ── Local Storage helpers ──────────────────────────────────
const STORAGE_KEY = "nutrigrid-children";

function loadChildren() {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      const parsed = JSON.parse(saved);
      if (Array.isArray(parsed) && parsed.length > 0) return parsed;
    }
  } catch (e) {
    console.warn("NutriGrid: Could not load saved data, using defaults.", e);
  }
  return INIT_CHILDREN;
}

function saveChildren(children) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(children));
  } catch (e) {
    console.warn("NutriGrid: Could not save data.", e);
  }
}

// ── Main App ───────────────────────────────────────────────
export default function App() {
  const [page, setPage] = useState("landing");
  const [user, setUser] = useState(null);
  const [screen, setScreen] = useState("dashboard");
  const [children, setChildren] = useState(loadChildren);
  const [selected, setSelected] = useState(null);
  const [pwaEvt, setPwaEvt] = useState(null);

  // Persist children to localStorage on every change
  useEffect(() => {
    saveChildren(children);
  }, [children]);

  // Set browser tab title
  useEffect(() => {
    document.title = "NutriGrid | WHO LMS";
  }, []);

  // PWA install prompt
  useEffect(() => {
    const handler = (e) => {
      e.preventDefault();
      setPwaEvt(e);
    };
    window.addEventListener("beforeinstallprompt", handler);
    return () => window.removeEventListener("beforeinstallprompt", handler);
  }, []);

  const handleInstall = async () => {
    if (!pwaEvt) return;
    pwaEvt.prompt();
    const r = await pwaEvt.userChoice;
    if (r.outcome === "accepted") setPwaEvt(null);
  };

  // Memoize grade calculations — only recalculate when children array changes
  const grades = useMemo(() => {
    const g = {};
    children.forEach((c) => {
      const last = c.records[c.records.length - 1];
      const waz = lmsZScore(last.weight, last.month, c.gender, "weight");
      const haz = lmsZScore(last.height, last.month, c.gender, "height");
      g[c.id] = classifyChild(waz, haz);
    });
    return g;
  }, [children]);

  const stats = useMemo(() => ({
    total: children.length,
    normal: children.filter((c) => grades[c.id] === "Normal").length,
    mam: children.filter((c) => grades[c.id] === "MAM").length,
    sam: children.filter((c) => grades[c.id] === "SAM").length,
  }), [children, grades]);

  const goDetail = useCallback((c) => { setSelected(c); setScreen("detail"); }, []);
  const handleAdd = useCallback((c) => setChildren((p) => [...p, c]), []);
  const handleLogin = useCallback((u) => { setUser(u); setPage("app"); }, []);
  const handleLogout = useCallback(() => { setUser(null); setPage("landing"); setScreen("dashboard"); }, []);

  // ── Landing / Login gates ──
  if (page === "landing") return <LandingPage onLogin={() => setPage("login")} />;
  if (page === "login") return <LoginPage onLogin={handleLogin} />;

  // ── Page metadata ──
  const meta = {
    dashboard: { title: "Dashboard", sub: "Coimbatore District · March 2026" },
    children: { title: "Child Registry", sub: `${children.length} children · WHO LMS graded` },
    add: { title: "Register Child", sub: "New anthropometric measurement" },
    analytics: { title: "Analytics & Reports", sub: "SAM/MAM/GAM indicators" },
    detail: { title: selected?.name ?? "", sub: `${selected?.records?.[selected.records.length - 1]?.month ?? ""} months · ${selected?.village ?? ""}` },
  };
  const pt = meta[screen] ?? meta.dashboard;

  // Role icon
  const roleIcon = user?.role === "Anganwadi Worker" ? "👩‍⚕️"
    : user?.role === "CDPO Officer" ? "👩‍💼"
    : user?.role === "District Health Officer" ? "🏥" : "👤";

  return (
    <div className="app-shell">
      {/* ── SIDEBAR ── */}
      <aside className="sidebar">
        <div className="sidebar-logo" onClick={() => setPage("landing")}>
          <div className="logo-icon">🌱</div>
          <div className="logo-text"><h1>NutriGrid</h1><p>ICDS Monitoring System</p></div>
        </div>
        <nav className="sidebar-nav">
          <div className="nav-section-label">Navigation</div>
          {NAV.map(({ id, label, Icon }) => (
            <button key={id} className={`nav-item ${screen === id ? "active" : ""}`} onClick={() => setScreen(id)}>
              <Icon size={15} /> {label}
            </button>
          ))}
        </nav>
        <div className="sidebar-footer">
          <div className="user-card">
            <div className="user-avatar">{roleIcon}</div>
            <div><strong>{user?.role ?? "Worker"}</strong><span>{user?.block ?? "Coimbatore"}</span></div>
          </div>
          <button className="sidebar-logout-btn" onClick={handleLogout}>
            <LogOut size={13} /> Sign Out
          </button>
        </div>
      </aside>

      {/* ── MAIN CONTENT ── */}
      <main className="main-content">
        <div className="top-bar">
          <div className="top-bar-breadcrumb">
            <span>NutriGrid</span><ChevronRight size={13} /><span className="current">{pt.title}</span>
          </div>
          <div className="top-bar-right">
            {pwaEvt && <button className="pwa-install-btn" onClick={handleInstall}><Download size={13} /> Install App</button>}
            <button className="btn-ghost" onClick={() => setPage("landing")} style={{ fontSize: 12 }}>← Home</button>
            <div className="ai-status"><div className="status-dot" />WHO LMS ACTIVE</div>
          </div>
        </div>
        <div className="page-body">
          <div className="page-title-bar">
            <div><h2>{pt.title}</h2><p>{pt.sub}</p></div>
            {user && (
              <div style={{ fontSize: 11.5, color: "#7A92A8", textAlign: "right", fontFamily: "IBM Plex Mono" }}>
                {roleIcon} {user.role}<br /><span style={{ fontSize: 10 }}>{user.block}</span>
              </div>
            )}
          </div>
          {screen === "dashboard" && <Dashboard children={children} grades={grades} stats={stats} goDetail={goDetail} />}
          {screen === "children" && <ChildrenList children={children} grades={grades} goDetail={goDetail} setScreen={setScreen} />}
          {screen === "add" && <AddRecord onAdd={handleAdd} />}
          {screen === "analytics" && <Analytics children={children} grades={grades} stats={stats} />}
          {screen === "detail" && <Detail child={selected} grades={grades} setScreen={setScreen} />}
        </div>
      </main>

      {/* ── MOBILE NAV ── */}
      <nav className="mobile-nav">
        <div className="mobile-nav-inner">
          {NAV.map(({ id, label, Icon }) => (
            <button key={id} className={`mobile-nav-item ${screen === id ? "active" : ""}`} onClick={() => setScreen(id)}>
              <Icon size={18} /> {label}
            </button>
          ))}
        </div>
      </nav>
    </div>
  );
}
