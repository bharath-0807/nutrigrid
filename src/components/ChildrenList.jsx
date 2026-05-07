import { PlusCircle, Search } from "lucide-react";
import { useState } from "react";
import { lmsZScore } from "../utils/lmsCalc";
import { GRADE_CFG } from "../data/clinicalConfig";

export default function ChildrenList({ children, grades, goDetail, setScreen }) {
  const [search, setSearch] = useState("");

  const filtered = children.filter((c) => {
    if (!search.trim()) return true;
    const q = search.toLowerCase();
    return (
      c.name?.toLowerCase().includes(q) ||
      c.nutrigridId?.toLowerCase().includes(q) ||
      c.village?.toLowerCase().includes(q)
    );
  });

  const genderLabel = (g) => g === "boys" ? "M" : g === "girls" ? "F" : "T";

  return (
    <div className="card">
      <div className="card-header" style={{ flexWrap: "wrap", gap: 10 }}>
        <div>
          <div className="card-title">Digital Register</div>
          <div className="card-subtitle">{children.length} children · WHO LMS graded</div>
        </div>
        <div style={{ display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap" }}>
          <div style={{ position: "relative" }}>
            <Search size={14} style={{ position: "absolute", left: 10, top: "50%", transform: "translateY(-50%)", color: "#7A92A8" }} />
            <input
              type="text"
              placeholder="Search ID, name, block..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              style={{
                padding: "8px 12px 8px 32px", borderRadius: 8, border: "1.5px solid #D0D9E4",
                fontSize: 12.5, fontFamily: "IBM Plex Sans, sans-serif", width: 200,
                background: "#F8FAFC", outline: "none",
              }}
            />
          </div>
          <button className="btn-primary" onClick={() => setScreen("add")}>
            <PlusCircle size={13} /> Register Child
          </button>
        </div>
      </div>
      <div className="table-wrap">
        <table>    
          <thead>
            <tr>
              <th>NutriGrid ID</th><th>Name</th><th>Age</th><th>Sex</th><th>Block</th>
              <th>Weight</th><th>Height</th><th>WAZ</th><th>HAZ</th><th>WHO Grade</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((child) => {
              const last = child.records?.[child.records.length - 1];
              if (!last) return null;
              const g = grades[child.id] ?? "Normal";
              const cfg = GRADE_CFG[g];
              const sexAtBirth = child.sexAtBirth || (child.gender === "transgender" ? "boys" : undefined);
              const waz = lmsZScore(last.weight, last.month, child.gender, "weight", sexAtBirth);
              const haz = lmsZScore(last.height, last.month, child.gender, "height", sexAtBirth);
              return (
                <tr key={child.id} onClick={() => goDetail(child)}>
                  <td style={{ fontFamily: "IBM Plex Mono", fontSize: 11, fontWeight: 700, color: "#00509E" }}>
                    {child.nutrigridId || "—"}
                  </td>
                  <td>
                    <div style={{ display: "flex", alignItems: "center", gap: 9 }}>
                      <div className="avatar" style={{ background: cfg.dot, width: 28, height: 28, fontSize: 12 }}>{child.name?.[0]}</div>
                      <span style={{ fontWeight: 600, fontSize: 13, color: "#0D1B2A" }}>{child.name}</span>
                    </div>
                  </td>
                  <td style={{ fontFamily: "IBM Plex Mono", fontSize: 12 }}>{last.month}mo</td>
                  <td style={{ fontSize: 12, fontWeight: 600, color: child.gender === "transgender" ? "#7C3AED" : "#3D5166" }}>
                    {genderLabel(child.gender)}
                  </td>
                  <td style={{ fontSize: 12, color: "#3D5166" }}>{child.village}</td>
                  <td style={{ fontFamily: "IBM Plex Mono", fontSize: 12, fontWeight: 600 }}>{last.weight} kg</td>
                  <td style={{ fontFamily: "IBM Plex Mono", fontSize: 12, fontWeight: 600 }}>{last.height} cm</td>
                  <td style={{ fontFamily: "IBM Plex Mono", fontSize: 12, fontWeight: 700, color: waz < -2 ? "#B03A2E" : "#1E8449" }}>{waz.toFixed(2)}</td>
                  <td style={{ fontFamily: "IBM Plex Mono", fontSize: 12, fontWeight: 700, color: haz < -2 ? "#B03A2E" : "#1E8449" }}>{haz.toFixed(2)}</td>
                  <td><span className={`chip ${cfg.chip}`}>{g}</span></td>
                </tr>
              );
            })}
            {filtered.length === 0 && (
              <tr>
                <td colSpan={10} style={{ textAlign: "center", padding: 32, color: "#7A92A8" }}>
                  No children match "{search}"
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
