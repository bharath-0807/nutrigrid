import {
  Brain, HeartPulse, Bell, ClipboardList, Wifi, Shield,
  ArrowRight, LogIn,
} from "lucide-react";

export default function LandingPage({ onLogin }) {
  const grades = [
    { code: "SAM", name: "Severe Acute Malnutrition", desc: "WAZ or HAZ < −3 SD. Immediate NRC referral, RUTF protocol.", bg: "#FDEDEC", border: "#F1948A", col: "#B03A2E" },
    { code: "MAM", name: "Moderate Acute Malnutrition", desc: "WAZ or HAZ −3 to −2 SD. SNP enrolment, RUSF supplementation.", bg: "#FEF5E7", border: "#F0B27A", col: "#CA6F1E" },
    { code: "GAM", name: "Global Acute Malnutrition", desc: "Combined SAM+MAM. WHO emergency threshold >15%.", bg: "#FEFDE7", border: "#F7DC6F", col: "#D4AC0D" },
    { code: "Normal", name: "Normal Nutritional Status", desc: "WAZ ≥ −2 and HAZ ≥ −2. Routine monthly monitoring.", bg: "#E9F7EF", border: "#82E0AA", col: "#1E8449" },
  ];

  const features = [
    { Icon: Brain, col: "#00509E", bg: "#EBF3FB", title: "WHO LMS Algorithm", desc: "Official Box-Cox z-score method — same standard used by UNICEF, NRC centres, and India's NHM" },
    { Icon: HeartPulse, col: "#007B83", bg: "#E0F5F5", title: "SAM/MAM Clinical Grading", desc: "4-level classification with WHO-aligned RUTF/SNP intervention protocols" },
    { Icon: Bell, col: "#B03A2E", bg: "#FDEDEC", title: "Priority Alert System", desc: "SAM cases auto-escalated with NRC referral; MAM enrolled in SNP automatically" },
    { Icon: ClipboardList, col: "#CA6F1E", bg: "#FEF5E7", title: "ICDS PDF Reports", desc: "Monthly district report with GAM/SAM/MAM rates vs WHO emergency thresholds" },
    { Icon: Wifi, col: "#00509E", bg: "#EBF3FB", title: "PWA — Install & Offline", desc: "Install on any device. Works without internet — built for rural Anganwadi centres" },
    { Icon: Shield, col: "#1E8449", bg: "#E9F7EF", title: "Role-Based Login", desc: "Separate access for Anganwadi Workers and CDPO Officers" },
  ];

  const steps = [
    { n: "01", title: "Login", desc: "Worker or CDPO Officer signs in with their role credentials" },
    { n: "02", title: "Measure Child", desc: "Enter weight and height — WHO LMS z-score computed instantly" },
    { n: "03", title: "Clinical Grade", desc: "System classifies SAM/MAM/Normal with UNICEF-standard protocol" },
    { n: "04", title: "Report & Refer", desc: "PDF for ICDS submission; SAM cases automatically flagged for NRC" },
  ];

  return (
    <div className="landing">
      <nav className="land-nav">
        <div className="land-logo">
          <div className="land-logo-icon">🌱</div>
          <div>
            <div className="land-logo-text">NutriGrid</div>
            <div className="land-logo-sub">WHO LMS · ICDS System</div>
          </div>
        </div>
        <div className="land-nav-links">
          <span className="land-nav-link">Features</span>
          <span className="land-nav-link">WHO Grading</span>
          <button className="hero-btn-primary" onClick={onLogin} style={{ padding: "8px 20px", fontSize: 13 }}>
            Sign In <ArrowRight size={13} />
          </button>
        </div>
      </nav>

      <section className="land-hero">
        <div className="hero-grid-overlay" />
        <div className="hero-inner">
          <div>
            <div className="hero-flag">
              <span style={{ width: 8, height: 8, borderRadius: "50%", background: "#4ADE80", display: "inline-block" }} />
              WHO LMS · Jansons Institute of Technology
            </div>
            <h1 className="hero-title">
              WHO-Standard SAM/MAM<br />Detection for<br />
              <span className="accent">Anganwadi Centres</span>
            </h1>
            <p className="hero-sub">
              NutriGrid implements the WHO official LMS Box-Cox z-score algorithm — the same method used by UNICEF, India NHM, and NRC centres — to classify SAM, MAM, and GAM with clinical precision.
            </p>
            <div className="hero-cta">
              <button className="hero-btn-primary" onClick={onLogin}>
                Sign In to System <ArrowRight size={14} />
              </button>
              <button className="hero-btn-outline">WHO LMS Reference</button>
            </div>
            <div className="hero-stats-strip">
              {[
                { val: "13.9L+", lbl: "Anganwadi Centres" },
                { val: "8.1Cr+", lbl: "Children Covered" },
                { val: "35.5%", lbl: "GAM Prevalence" },
              ].map((s) => (
                <div className="hero-stat" key={s.lbl}>
                  <div className="hero-stat-val">{s.val}</div>
                  <div className="hero-stat-lbl">{s.lbl}</div>
                </div>
              ))}
            </div>
          </div>
          <div className="hero-mockup">
            <div className="mockup-topbar">
              <div className="mockup-dot" />
              <div className="mockup-dot" />
              <div className="mockup-dot" />
              <span className="mockup-title">NutriGrid</span>
              <span className="mockup-badge">WHO LMS</span>
            </div>
            <div className="mockup-body">
              <div className="mockup-stat-row">
                <div className="mockup-stat-card">
                  <div className="mockup-stat-val" style={{ color: "#00509E" }}>4</div>
                  <div className="mockup-stat-lbl">Registered</div>
                </div>
                <div className="mockup-stat-card">
                  <div className="mockup-stat-val" style={{ color: "#B03A2E" }}>2</div>
                  <div className="mockup-stat-lbl">SAM Cases</div>
                </div>
              </div>
              <div className="mockup-table-hdr">Priority — SAM Cases</div>
              {[
                { name: "Aarav Kumar", grade: "SAM", sc: "#B03A2E", sb: "#FDEDEC" },
                { name: "Priya Selvi", grade: "SAM", sc: "#B03A2E", sb: "#FDEDEC" },
                { name: "Rajan M.", grade: "MAM", sc: "#CA6F1E", sb: "#FEF5E7" },
              ].map((r) => (
                <div className="mockup-row" key={r.name}>
                  <span className="mockup-name">{r.name}</span>
                  <span className="mockup-grade" style={{ color: r.sc, background: r.sb, border: `1px solid ${r.sc}40` }}>
                    {r.grade}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section className="land-section alt">
        <div className="land-section-head">
          <div className="land-section-flag">Clinical Classification</div>
          <h2 className="land-section-title">WHO-UNICEF Standard Grading</h2>
          <p className="land-section-sub">
            Every child classified using the official WHO LMS Box-Cox method — not just thresholds, but the actual statistical model used in global nutrition programmes
          </p>
        </div>
        <div className="grade-legend">
          {grades.map((g) => (
            <div key={g.code} className="grade-legend-card" style={{ background: g.bg, borderColor: g.border, borderLeftColor: g.col }}>
              <div className="grade-legend-code" style={{ color: g.col }}>{g.code}</div>
              <div className="grade-legend-name" style={{ color: g.col }}>{g.name}</div>
              <div className="grade-legend-desc" style={{ color: g.col }}>{g.desc}</div>
            </div>
          ))}
        </div>
      </section>

      <section className="land-section">
        <div className="land-section-head">
          <div className="land-section-flag">Capabilities</div>
          <h2 className="land-section-title">Built to clinical and ICDS programme standards</h2>
        </div>
        <div className="feature-grid">
          {features.map((f) => (
            <div className="feature-card" key={f.title} style={{ borderTopColor: f.col }}>
              <div className="feature-icon-wrap" style={{ background: f.bg }}>
                <f.Icon size={20} color={f.col} />
              </div>
              <div className="feature-title">{f.title}</div>
              <div className="feature-desc">{f.desc}</div>
            </div>
          ))}
        </div>
      </section>

      <section className="land-section alt">
        <div className="land-section-head">
          <div className="land-section-flag">Workflow</div>
          <h2 className="land-section-title">4-step clinical assessment workflow</h2>
        </div>
        <div className="steps-row">
          {steps.map((s) => (
            <div className="step-card" key={s.n}>
              <div className="step-num">{s.n}</div>
              <div className="step-title">{s.title}</div>
              <div className="step-desc">{s.desc}</div>
            </div>
          ))}
        </div>
      </section>

      <section className="land-cta">
        <div className="land-cta-inner">
          <h2>Explore NutriGrid Live</h2>
          <p>
            Sign in with a demo account — register children, view WHO growth charts, classify SAM/MAM, and generate ICDS-formatted reports instantly.
          </p>
          <button className="hero-btn-primary" onClick={onLogin} style={{ fontSize: 14, padding: "12px 28px" }}>
            <LogIn size={15} /> Sign In to System
          </button>
        </div>
      </section>

      <footer className="land-footer">
        <div className="land-footer-left">
          🌱 NutriGrid v2.0 · WHO LMS Algorithm · Jansons Institute of Technology, Coimbatore
        </div>
        <div className="land-footer-right">
          Mohanapriya S · Gayathri M · Lavanya B · Bharath M · Guide: Mrs. Vidhya Gowri V
        </div>
      </footer>
    </div>
  );
}
