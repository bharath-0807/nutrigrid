import { useState, useEffect } from "react";
import {
  LayoutDashboard, Users, PlusCircle, BarChart2,
  AlertTriangle, CheckCircle, Activity, Baby,
  Brain, MapPin, TrendingUp, TrendingDown,
  ArrowLeft, Zap, FileText
} from "lucide-react";
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, Legend
} from "recharts";
import * as tf from "@tensorflow/tfjs";

// ── WHO STANDARDS ────────────────────────────────────────────
const WHO = {
  boys: {
    weight: [
      { age: 0,  sd3n:2.1,  sd2n:2.5,  med:3.3,  sd2:4.4  },
      { age: 6,  sd3n:5.7,  sd2n:6.4,  med:7.9,  sd2:9.8  },
      { age: 12, sd3n:7.7,  sd2n:8.6,  med:10.2, sd2:12.3 },
      { age: 24, sd3n:9.7,  sd2n:10.8, med:12.7, sd2:15.3 },
      { age: 36, sd3n:11.4, sd2n:12.7, med:14.9, sd2:18.0 },
      { age: 48, sd3n:13.0, sd2n:14.4, med:16.9, sd2:20.5 },
      { age: 60, sd3n:14.1, sd2n:15.7, med:18.3, sd2:22.4 },
    ],
    height: [
      { age: 0,  sd3n:44.2,  sd2n:46.1,  med:49.9,  sd2:53.7  },
      { age: 6,  sd3n:61.7,  sd2n:63.3,  med:67.6,  sd2:71.9  },
      { age: 12, sd3n:69.6,  sd2n:71.0,  med:75.7,  sd2:80.5  },
      { age: 24, sd3n:81.7,  sd2n:83.5,  med:87.8,  sd2:92.2  },
      { age: 36, sd3n:88.7,  sd2n:91.1,  med:96.1,  sd2:101.1 },
      { age: 48, sd3n:94.9,  sd2n:97.7,  med:103.3, sd2:108.9 },
      { age: 60, sd3n:100.7, sd2n:103.9, med:110.0, sd2:116.0 },
    ],
  },
  girls: {
    weight: [
      { age: 0,  sd3n:2.0,  sd2n:2.4,  med:3.2,  sd2:4.2  },
      { age: 6,  sd3n:5.3,  sd2n:5.9,  med:7.3,  sd2:9.3  },
      { age: 12, sd3n:7.0,  sd2n:7.9,  med:9.5,  sd2:11.7 },
      { age: 24, sd3n:9.0,  sd2n:10.2, med:12.1, sd2:14.9 },
      { age: 36, sd3n:10.8, sd2n:12.1, med:14.3, sd2:17.7 },
      { age: 48, sd3n:12.3, sd2n:13.9, med:16.4, sd2:20.5 },
      { age: 60, sd3n:13.7, sd2n:15.5, med:18.3, sd2:23.2 },
    ],
    height: [
      { age: 0,  sd3n:43.6, sd2n:45.4,  med:49.1,  sd2:52.9  },
      { age: 6,  sd3n:59.8, sd2n:61.2,  med:65.7,  sd2:70.3  },
      { age: 12, sd3n:68.9, sd2n:70.0,  med:74.0,  sd2:78.0  },
      { age: 24, sd3n:80.0, sd2n:81.7,  med:86.4,  sd2:91.2  },
      { age: 36, sd3n:87.4, sd2n:90.0,  med:95.1,  sd2:100.1 },
      { age: 48, sd3n:94.1, sd2n:96.9,  med:102.7, sd2:108.5 },
      { age: 60, sd3n:99.9, sd2n:103.0, med:109.4, sd2:115.7 },
    ],
  },
};

function interpolate(table, age, key) {
  if (age <= table[0].age) return table[0][key];
  if (age >= table[table.length - 1].age) return table[table.length - 1][key];
  for (let i = 0; i < table.length - 1; i++) {
    if (table[i].age <= age && age <= table[i + 1].age) {
      const t = (age - table[i].age) / (table[i + 1].age - table[i].age);
      return table[i][key] + t * (table[i + 1][key] - table[i][key]);
    }
  }
  return table[0][key];
}

function getZScore(age, value, gender, type) {
  const table = WHO[gender][type];
  const med  = interpolate(table, age, "med");
  const sd2  = interpolate(table, age, "sd2");
  const sd2n = interpolate(table, age, "sd2n");
  const sd   = value >= med ? (sd2 - med) / 2 : (med - sd2n) / 2;
  return sd === 0 ? 0 : (value - med) / sd;
}

// ── TF.JS MODEL ──────────────────────────────────────────────
async function buildModel() {
  const xs = tf.tensor2d([
    [0.5,0.5,0.4],[0.2,0.3,0.5],[1.0,0.8,0.3],
    [-0.8,-0.7,0.4],[-1.0,-0.9,0.6],[-0.9,-1.1,0.3],
    [-1.5,-1.8,0.5],[-2.0,-1.6,0.4],[-1.8,-2.1,0.6],[-2.2,-1.9,0.3],
    [-2.8,-2.5,0.5],[-3.0,-2.8,0.4],[-3.2,-3.1,0.3],[-2.5,-3.0,0.6],
  ]);
  const ys = tf.tensor2d([
    [1,0,0,0],[1,0,0,0],[1,0,0,0],
    [0,1,0,0],[0,1,0,0],[0,1,0,0],
    [0,0,1,0],[0,0,1,0],[0,0,1,0],[0,0,1,0],
    [0,0,0,1],[0,0,0,1],[0,0,0,1],[0,0,0,1],
  ]);
  const model = tf.sequential({
    layers: [
      tf.layers.dense({ inputShape:[3], units:16, activation:"relu" }),
      tf.layers.dense({ units:8, activation:"relu" }),
      tf.layers.dense({ units:4, activation:"softmax" }),
    ],
  });
  model.compile({ optimizer:"adam", loss:"categoricalCrossentropy", metrics:["accuracy"] });
  await model.fit(xs, ys, { epochs:150, verbose:0 });
  xs.dispose(); ys.dispose();
  return model;
}

async function predict(model, waz, haz, age) {
  if (!model) return null;
  const input = tf.tensor2d([[waz, haz, age / 60]]);
  const pred  = model.predict(input);
  const probs = await pred.data();
  input.dispose(); pred.dispose();
  const LABELS = ["Normal","At Risk","Moderate Malnutrition","Severe Malnutrition"];
  const idx    = [...probs].indexOf(Math.max(...probs));
  return { label: LABELS[idx], confidence: (probs[idx] * 100).toFixed(1) };
}

// ── DATA ─────────────────────────────────────────────────────
const INIT_CHILDREN = [
  { id:1, name:"Aarav Kumar",  age:24, gender:"boys",  village:"Block A", records:[
    {month:0,weight:3.2,height:49.5},{month:6,weight:6.8,height:64.0},
    {month:12,weight:8.5,height:72.0},{month:18,weight:9.8,height:78.0},
    {month:24,weight:10.9,height:83.0}]},
  { id:2, name:"Priya Selvi",  age:36, gender:"girls", village:"Block B", records:[
    {month:0,weight:2.8,height:47.5},{month:6,weight:5.2,height:61.0},
    {month:12,weight:6.8,height:69.0},{month:18,weight:8.0,height:75.0},
    {month:24,weight:9.0,height:81.0},{month:30,weight:10.0,height:87.0},
    {month:36,weight:11.2,height:91.5}]},
  { id:3, name:"Rajan Murugan",age:18, gender:"boys",  village:"Block A", records:[
    {month:0,weight:2.4,height:46.0},{month:6,weight:5.8,height:63.0},
    {month:12,weight:7.2,height:70.0},{month:18,weight:7.5,height:74.0}]},
  { id:4, name:"Meena Devi",   age:48, gender:"girls", village:"Block C", records:[
    {month:0,weight:3.1,height:49.0},{month:12,weight:9.2,height:73.5},
    {month:24,weight:11.8,height:85.0},{month:36,weight:13.9,height:94.0},
    {month:48,weight:16.1,height:102.5}]},
];

const STATUS_CFG = {
  "Normal":               {bc:"badge-green",  dot:"#38A169", border:"#68D391", bg:"#F0FFF4"},
  "At Risk":              {bc:"badge-yellow", dot:"#D69E2E", border:"#F6E05E", bg:"#FFFFF0"},
  "Moderate Malnutrition":{bc:"badge-orange", dot:"#C05621", border:"#FBD38D", bg:"#FFFAF0"},
  "Severe Malnutrition":  {bc:"badge-red",    dot:"#C53030", border:"#FEB2B2", bg:"#FFF5F5"},
};

const RECS = {
  "Normal":               ["Continue regular monthly monitoring","Maintain balanced nutrition","Ensure timely vaccinations","Track growth at next scheduled visit"],
  "At Risk":              ["Schedule bi-monthly weight checks","Provide nutrition counseling to parents","Ensure adequate calorie intake daily","Monitor for signs of illness"],
  "Moderate Malnutrition":["Enroll in supplementary nutrition program","Provide therapeutic food (Bal Shakti)","Bi-weekly monitoring required","Check for underlying infection"],
  "Severe Malnutrition":  ["Refer immediately to PHC / District Hospital","Initiate RUTF (Ready-to-Use Therapeutic Food)","Weekly monitoring mandatory","Notify District Health Officer immediately"],
};

const NAV = [
  {id:"dashboard", label:"Dashboard",  Icon:LayoutDashboard},
  {id:"children",  label:"Children",   Icon:Users},
  {id:"add",       label:"Add Record", Icon:PlusCircle},
  {id:"analytics", label:"Analytics",  Icon:BarChart2},
];

// ════════════════════════════════════════════════════════════
export default function App() {
  const [screen,   setScreen]   = useState("dashboard");
  const [children, setChildren] = useState(INIT_CHILDREN);
  const [selected, setSelected] = useState(null);
  const [chartTab, setChartTab] = useState("weight");
  const [toast,    setToast]    = useState(false);
  const [model,    setModel]    = useState(null);
  const [ready,    setReady]    = useState(false);
  const [preds,    setPreds]    = useState({});
  const [form,     setForm]     = useState({name:"",age:"",gender:"boys",village:"Block A",weight:"",height:""});

  useEffect(() => {
    buildModel().then(m => { setModel(m); setReady(true); });
  }, []);

  useEffect(() => {
    if (!model) return;
    (async () => {
      const p = {};
      for (const c of children) {
        const last = c.records[c.records.length - 1];
        const waz  = getZScore(last.month, last.weight, c.gender, "weight");
        const haz  = getZScore(last.month, last.height, c.gender, "height");
        p[c.id] = await predict(model, waz, haz, last.month);
      }
      setPreds(p);
    })();
  }, [model, children]);

  const getStatus = c => preds[c.id]?.label ?? "Normal";

  const stats = {
    total:    children.length,
    normal:   children.filter(c => getStatus(c) === "Normal").length,
    atRisk:   children.filter(c => getStatus(c) === "At Risk").length,
    moderate: children.filter(c => getStatus(c) === "Moderate Malnutrition").length,
    severe:   children.filter(c => getStatus(c) === "Severe Malnutrition").length,
  };

  const handleAdd = () => {
    if (!form.name || !form.age || !form.weight || !form.height) return;
    const child = {
      id: Date.now(), name: form.name, age: parseInt(form.age),
      gender: form.gender, village: form.village,
      records: [{month: parseInt(form.age), weight: parseFloat(form.weight), height: parseFloat(form.height)}],
    };
    setChildren(p => [...p, child]);
    setForm({name:"",age:"",gender:"boys",village:"Block A",weight:"",height:""});
    setToast(true);
    setTimeout(() => { setToast(false); setScreen("children"); }, 2200);
  };

  const goDetail = c => { setSelected(c); setScreen("detail"); };

  const getChartData = child => {
    const type  = chartTab === "weight" ? "weight" : "height";
    const table = WHO[child.gender][type];
    const pts   = {};
    child.records.forEach(r => { pts[r.month] = chartTab === "weight" ? r.weight : r.height; });
    return table.map(s => ({ age:`${s.age}m`, Child:pts[s.age]??null, Median:s.med, "-2SD":s.sd2n, "-3SD":s.sd3n }));
  };

  // ── PAGES ──────────────────────────────────────────────────

  const Dashboard = () => (
    <>
      {(stats.severe + stats.moderate > 0) && (
        <div className="alert-banner">
          <AlertTriangle size={22} color="#E53E3E"/>
          <div>
            <h4>Immediate Action Required</h4>
            <p>{stats.severe} severe + {stats.moderate} moderate malnutrition cases detected by AI</p>
          </div>
        </div>
      )}

      <div className="stat-grid">
        {[
          {label:"Total Children", value:stats.total,                    icon:<Baby size={22}/>,          bg:"#EBF8FF", ic:"#2B6CB0"},
          {label:"Normal",         value:stats.normal,                   icon:<CheckCircle size={22}/>,   bg:"#F0FFF4", ic:"#276749"},
          {label:"At Risk",        value:stats.atRisk,                   icon:<AlertTriangle size={22}/>, bg:"#FFFFF0", ic:"#975A16"},
          {label:"Critical",       value:stats.severe+stats.moderate,    icon:<Zap size={22}/>,           bg:"#FFF5F5", ic:"#C53030"},
        ].map(s => (
          <div className="stat-card" key={s.label}>
            <div className="stat-icon" style={{background:s.bg, color:s.ic}}>{s.icon}</div>
            <div>
              <div className="stat-value" style={{color:s.ic}}>{s.value}</div>
              <div className="stat-label">{s.label}</div>
            </div>
          </div>
        ))}
      </div>

      <div className="card" style={{marginBottom:20, display:"flex", alignItems:"center", gap:12, padding:"14px 20px"}}>
        <div style={{width:36,height:36,borderRadius:10,background:ready?"#C6F6D5":"#FEF3C7",display:"flex",alignItems:"center",justifyContent:"center"}}>
          <Brain size={18} color={ready?"#276749":"#92400E"}/>
        </div>
        <div>
          <div style={{fontWeight:700,fontSize:13,color:ready?"#276749":"#92400E"}}>
            {ready ? "TensorFlow.js Neural Network Active" : "Training AI Model..."}
          </div>
          <div style={{fontSize:12,color:"#718096"}}>
            {ready ? "3-layer dense network classifying growth patterns in real-time" : "Please wait a moment"}
          </div>
        </div>
        {ready && <div style={{marginLeft:"auto"}}><span className="badge badge-green">● Live</span></div>}
      </div>

      <div className="card">
        <div className="section-header">
          <span className="section-title">Cases Requiring Attention</span>
        </div>
        <div className="table-wrap">
          <table>
            <thead><tr><th>Child</th><th>Age</th><th>Village</th><th>AI Status</th><th>Confidence</th></tr></thead>
            <tbody>
              {children.filter(c => getStatus(c) !== "Normal").map(child => {
                const s = getStatus(child);
                const cfg = STATUS_CFG[s];
                const conf = preds[child.id]?.confidence;
                return (
                  <tr key={child.id} onClick={() => goDetail(child)}>
                    <td><div style={{display:"flex",alignItems:"center",gap:10}}>
                      <div className="avatar" style={{background:cfg.dot}}>{child.name[0]}</div>
                      <div><div style={{fontWeight:600}}>{child.name}</div><div style={{fontSize:12,color:"#718096"}}>{child.gender==="boys"?"Boy":"Girl"}</div></div>
                    </div></td>
                    <td>{child.age} months</td>
                    <td><div style={{display:"flex",alignItems:"center",gap:5}}><MapPin size={13} color="#718096"/>{child.village}</div></td>
                    <td><span className={`badge ${cfg.bc}`}>{s}</span></td>
                    <td>
                      <div style={{display:"flex",alignItems:"center",gap:8}}>
                        <div style={{flex:1,background:"#E2E8F0",borderRadius:4,height:6,width:80}}>
                          <div style={{background:cfg.dot,height:6,borderRadius:4,width:`${conf}%`}}/>
                        </div>
                        <span style={{fontSize:12,fontWeight:600,color:"#4A5568"}}>{conf}%</span>
                      </div>
                    </td>
                  </tr>
                );
              })}
              {children.filter(c => getStatus(c) !== "Normal").length === 0 && (
                <tr><td colSpan={5} style={{textAlign:"center",color:"#718096",padding:24}}>
                  <CheckCircle size={24} color="#38A169" style={{margin:"0 auto 8px",display:"block"}}/>
                  All children are in normal nutritional status
                </td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </>
  );

  const ChildrenList = () => (
    <div className="card">
      <div className="section-header">
        <span className="section-title">All Registered Children</span>
        <button className="btn-primary" onClick={() => setScreen("add")}><PlusCircle size={15}/> Add Child</button>
      </div>
      <div className="table-wrap">
        <table>
          <thead><tr><th>Child</th><th>Age</th><th>Village</th><th>Weight</th><th>Height</th><th>AI Status</th></tr></thead>
          <tbody>
            {children.map(child => {
              const last = child.records[child.records.length-1];
              const s    = getStatus(child);
              const cfg  = STATUS_CFG[s];
              return (
                <tr key={child.id} onClick={() => goDetail(child)}>
                  <td><div style={{display:"flex",alignItems:"center",gap:10}}>
                    <div className="avatar" style={{background:cfg.dot}}>{child.name[0]}</div>
                    <div><div style={{fontWeight:600}}>{child.name}</div><div style={{fontSize:12,color:"#718096"}}>{child.gender==="boys"?"Boy":"Girl"}</div></div>
                  </div></td>
                  <td>{child.age} months</td>
                  <td><div style={{display:"flex",alignItems:"center",gap:5}}><MapPin size={13} color="#718096"/>{child.village}</div></td>
                  <td><strong>{last.weight}</strong> kg</td>
                  <td><strong>{last.height}</strong> cm</td>
                  <td><span className={`badge ${cfg.bc}`}>{s}</span></td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );

  const AddRecord = () => (
    <div style={{maxWidth:640,margin:"0 auto"}}>
      <div className="card">
        <div className="section-header" style={{marginBottom:20}}>
          <span className="section-title">New Child Record</span>
          <div style={{display:"flex",alignItems:"center",gap:6,fontSize:12,color:"#718096"}}><Brain size={14}/> AI will classify automatically</div>
        </div>
        {toast && <div className="toast"><CheckCircle size={16}/> Record saved! AI is analysing nutritional status...</div>}
        <div className="form-grid">
          <div className="form-group" style={{gridColumn:"1 / -1"}}>
            <label className="form-label">Child's Full Name</label>
            <input className="form-input" placeholder="e.g. Kavya Devi" value={form.name} onChange={e => setForm({...form,name:e.target.value})}/>
          </div>
          <div className="form-group">
            <label className="form-label">Age (months)</label>
            <input className="form-input" type="number" placeholder="e.g. 24" value={form.age} onChange={e => setForm({...form,age:e.target.value})}/>
          </div>
          <div className="form-group">
            <label className="form-label">Gender</label>
            <select className="form-input" value={form.gender} onChange={e => setForm({...form,gender:e.target.value})}>
              <option value="boys">Boy</option>
              <option value="girls">Girl</option>
            </select>
          </div>
          <div className="form-group">
            <label className="form-label">Weight (kg)</label>
            <input className="form-input" type="number" step="0.1" placeholder="e.g. 11.5" value={form.weight} onChange={e => setForm({...form,weight:e.target.value})}/>
          </div>
          <div className="form-group">
            <label className="form-label">Height (cm)</label>
            <input className="form-input" type="number" step="0.1" placeholder="e.g. 84.0" value={form.height} onChange={e => setForm({...form,height:e.target.value})}/>
          </div>
          <div className="form-group" style={{gridColumn:"1 / -1"}}>
            <label className="form-label">Village / Block</label>
            <select className="form-input" value={form.village} onChange={e => setForm({...form,village:e.target.value})}>
              <option>Block A</option><option>Block B</option><option>Block C</option>
            </select>
          </div>
        </div>
        <button className="btn-primary" onClick={handleAdd} style={{width:"100%",justifyContent:"center"}}>
          <Brain size={16}/> Save & Analyse with AI
        </button>
      </div>
    </div>
  );

  const Analytics = () => {
    const dist = [
      {label:"Normal",               value:stats.normal,   color:"#38A169"},
      {label:"At Risk",              value:stats.atRisk,   color:"#D69E2E"},
      {label:"Moderate Malnutrition",value:stats.moderate, color:"#C05621"},
      {label:"Severe Malnutrition",  value:stats.severe,   color:"#C53030"},
    ];
    return (
      <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:20}}>
        <div className="card" style={{gridColumn:"1 / -1"}}>
          <div className="section-title" style={{marginBottom:18}}>Nutritional Status Distribution</div>
          {dist.map(d => (
            <div key={d.label} style={{marginBottom:14}}>
              <div style={{display:"flex",justifyContent:"space-between",fontSize:13,marginBottom:5}}>
                <span style={{fontWeight:600,color:d.color}}>{d.label}</span>
                <span style={{color:"#4A5568"}}>{d.value} children · {stats.total>0?Math.round(d.value/stats.total*100):0}%</span>
              </div>
              <div className="progress-bar"><div className="progress-fill" style={{background:d.color,width:`${stats.total>0?d.value/stats.total*100:0}%`}}/></div>
            </div>
          ))}
        </div>

        <div className="card">
          <div className="section-title" style={{marginBottom:16}}>Village-wise Summary</div>
          {["Block A","Block B","Block C"].map(v => {
            const vc   = children.filter(c => c.village === v);
            const risk = vc.filter(c => getStatus(c) !== "Normal").length;
            return (
              <div key={v} style={{display:"flex",justifyContent:"space-between",alignItems:"center",padding:"12px 0",borderBottom:"1px solid #F0F4F8"}}>
                <div><div style={{fontWeight:600,fontSize:14}}>{v}</div><div style={{fontSize:12,color:"#718096"}}>{vc.length} children</div></div>
                <span className={`badge ${risk>0?"badge-red":"badge-green"}`}>{risk>0?`${risk} at risk`:"All normal"}</span>
              </div>
            );
          })}
        </div>

        <div className="card">
          <div className="section-title" style={{marginBottom:16}}>AI Model Details</div>
          {[
            {label:"Model Type",    value:"Neural Network (TensorFlow.js)"},
            {label:"Architecture",  value:"Dense 3-layer (16 → 8 → 4 units)"},
            {label:"Activation",    value:"ReLU + Softmax"},
            {label:"Inputs",        value:"WAZ, HAZ, Age (normalized)"},
            {label:"Output",        value:"4-class nutritional status"},
            {label:"Standard",      value:"WHO Child Growth Standards"},
          ].map(r => (
            <div key={r.label} style={{display:"flex",justifyContent:"space-between",padding:"8px 0",borderBottom:"1px solid #F0F4F8",fontSize:13}}>
              <span style={{color:"#718096"}}>{r.label}</span>
              <span style={{fontWeight:600,textAlign:"right",maxWidth:"60%"}}>{r.value}</span>
            </div>
          ))}
        </div>

        <div className="card" style={{gridColumn:"1 / -1",display:"flex",alignItems:"center",justifyContent:"space-between"}}>
          <div>
            <div className="section-title">Monthly Report — March 2026</div>
            <div style={{fontSize:13,color:"#718096",marginTop:4}}>Coimbatore District ICDS · Ready for submission</div>
          </div>
          <button className="btn-primary"><FileText size={15}/> Generate PDF</button>
        </div>
      </div>
    );
  };

  const Detail = () => {
    if (!selected) return null;
    const last = selected.records[selected.records.length-1];
    const waz  = getZScore(last.month, last.weight, selected.gender, "weight");
    const haz  = getZScore(last.month, last.height, selected.gender, "height");
    const s    = getStatus(selected);
    const cfg  = STATUS_CFG[s];
    const pred = preds[selected.id];
    const data = getChartData(selected);

    const StatusIcon = () => {
      if (s === "Normal") return <CheckCircle size={22} color="#38A169"/>;
      if (s === "At Risk") return <AlertTriangle size={22} color="#D69E2E"/>;
      return <TrendingDown size={22} color="#C53030"/>;
    };

    return (
      <>
        <button className="btn-secondary" onClick={() => setScreen("children")} style={{marginBottom:20}}>
          <ArrowLeft size={15}/> Back to Children
        </button>

        <div className="detail-header">
          <div className="detail-avatar">{selected.gender==="boys"?"👦":"👧"}</div>
          <div>
            <h2 style={{fontSize:20,fontWeight:800}}>{selected.name}</h2>
            <p style={{fontSize:13,opacity:0.8,marginTop:4}}>{selected.age} months · {selected.gender==="boys"?"Boy":"Girl"} · {selected.village}</p>
          </div>
          {pred && (
            <div style={{marginLeft:"auto",textAlign:"right"}}>
              <span className={`badge ${cfg.bc}`} style={{fontSize:13,padding:"6px 14px"}}>{s}</span>
              <div style={{fontSize:11,color:"rgba(255,255,255,0.7)",marginTop:6}}>AI Confidence: {pred.confidence}%</div>
            </div>
          )}
        </div>

        <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:20,marginBottom:20}}>
          <div className="status-card" style={{background:cfg.bg,borderColor:cfg.border}}>
            <StatusIcon/>
            <div>
              <div style={{fontWeight:700,fontSize:15}}>{s}</div>
              <div style={{fontSize:12,color:"#4A5568",marginTop:3}}>WAZ: {waz.toFixed(2)} · HAZ: {haz.toFixed(2)}</div>
            </div>
          </div>
          <div className="metric-grid" style={{margin:0}}>
            <div className="metric-card">
              <Activity size={16} color="#2B6CB0"/>
              <div className="metric-value" style={{color:"#2B6CB0"}}>{last.weight} kg</div>
              <div className="metric-label">Current Weight</div>
            </div>
            <div className="metric-card">
              <TrendingUp size={16} color="#276749"/>
              <div className="metric-value" style={{color:"#276749"}}>{last.height} cm</div>
              <div className="metric-label">Current Height</div>
            </div>
          </div>
        </div>

        <div className="card" style={{marginBottom:20}}>
          <div className="section-header">
            <span className="section-title">Growth Chart vs WHO Standards</span>
            <div style={{display:"flex",gap:8}}>
              {["weight","height"].map(t => (
                <button key={t} onClick={() => setChartTab(t)}
                  style={{padding:"6px 14px",borderRadius:8,border:"none",cursor:"pointer",fontSize:13,fontWeight:600,fontFamily:"Inter,sans-serif",
                    background:chartTab===t?"#1565C0":"#EDF2F7",color:chartTab===t?"#fff":"#4A5568"}}>
                  {t==="weight"?"Weight":"Height"}
                </button>
              ))}
            </div>
          </div>
          <ResponsiveContainer width="100%" height={240}>
            <LineChart data={data} margin={{left:-10,right:10}}>
              <CartesianGrid strokeDasharray="3 3" stroke="#F0F4F8"/>
              <XAxis dataKey="age" tick={{fontSize:11}}/>
              <YAxis tick={{fontSize:11}}/>
              <Tooltip contentStyle={{fontSize:12,borderRadius:10,border:"1px solid #E2E8F0"}}/>
              <Legend wrapperStyle={{fontSize:12}}/>
              <Line type="monotone" dataKey="Median" stroke="#38A169" strokeDasharray="6 3" dot={false} strokeWidth={1.5}/>
              <Line type="monotone" dataKey="-2SD"   stroke="#D69E2E" strokeDasharray="4 3" dot={false} strokeWidth={1.5}/>
              <Line type="monotone" dataKey="-3SD"   stroke="#C53030" strokeDasharray="3 3" dot={false} strokeWidth={1.5}/>
              <Line type="monotone" dataKey="Child"  stroke="#1565C0" strokeWidth={2.5} dot={{fill:"#1565C0",r:5}} connectNulls={false}/>
            </LineChart>
          </ResponsiveContainer>
        </div>

        <div className="ai-box">
          <h4><Brain size={15}/> AI-Generated Recommendations</h4>
          <ul>{RECS[s]?.map((r,i) => <li key={i}>{r}</li>)}</ul>
          {pred && <div style={{marginTop:12,fontSize:12,color:"#4A5568",borderTop:"1px solid #BEE3F8",paddingTop:10}}>
            Model confidence: <strong>{pred.confidence}%</strong> · Powered by TensorFlow.js neural network
          </div>}
        </div>
      </>
    );
  };

  // ── PAGE META ───────────────────────────────────────────────
  const meta = {
    dashboard:{title:"Dashboard",     sub:"Coimbatore District · March 2026"},
    children: {title:"Children",      sub:`${children.length} registered children`},
    add:      {title:"Add Record",    sub:"Register new child measurement"},
    analytics:{title:"Analytics",     sub:"Nutritional status overview"},
    detail:   {title:selected?.name??"", sub:`${selected?.age??""} months · ${selected?.village??""}`},
  };
  const pt = meta[screen] ?? meta.dashboard;

  // ── RENDER ──────────────────────────────────────────────────
  return (
    <div className="app-shell">
      {/* Sidebar */}
      <aside className="sidebar">
        <div className="sidebar-logo">
          <h1>🌱 NutriGrid</h1>
          <p>AI Child Growth Monitoring</p>
        </div>
        <nav className="sidebar-nav">
          {NAV.map(({id,label,Icon}) => (
            <button key={id} className={`nav-item ${screen===id?"active":""}`} onClick={() => setScreen(id)}>
              <Icon size={18}/> {label}
            </button>
          ))}
        </nav>
        <div className="sidebar-footer">
          <div className="role-badge">
            <strong>👩‍⚕️ Anganwadi Worker</strong>
            Coimbatore District
          </div>
        </div>
      </aside>

      {/* Main */}
      <main className="main-content">
        <div className="top-bar">
          <div><h2>{pt.title}</h2><p>{pt.sub}</p></div>
          <div style={{display:"flex",alignItems:"center",gap:8}}>
            <div style={{width:8,height:8,borderRadius:4,background:ready?"#38A169":"#D69E2E"}}/>
            <span style={{fontSize:12,color:"#718096"}}>{ready?"AI Active":"Loading AI..."}</span>
          </div>
        </div>
        <div className="page-body">
          {screen==="dashboard" && <Dashboard/>}
          {screen==="children"  && <ChildrenList/>}
          {screen==="add"       && <AddRecord/>}
          {screen==="analytics" && <Analytics/>}
          {screen==="detail"    && <Detail/>}
        </div>
      </main>

      {/* Mobile nav */}
      <nav className="mobile-nav">
        <div className="mobile-nav-inner">
          {NAV.map(({id,label,Icon}) => (
            <button key={id} className={`mobile-nav-item ${screen===id?"active":""}`} onClick={() => setScreen(id)}>
              <Icon size={20}/> {label}
            </button>
          ))}
        </div>
      </nav>
    </div>
  );
}