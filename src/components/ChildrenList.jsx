import { PlusCircle } from "lucide-react";
import { lmsZScore } from "../utils/lmsCalc";
import { GRADE_CFG } from "../data/clinicalConfig";

export default function ChildrenList({ children, grades, goDetail, setScreen }) {
  return (
    <div className="card">
      <div className="card-header">
        <div>
          <div className="card-title">Child Registry</div>
          <div className="card-subtitle">{children.length} children · WHO LMS graded</div>
        </div>
        <button className="btn-primary" onClick={() => setScreen("add")}>
          <PlusCircle size={13} /> Register Child
        </button>
      </div>
      <div className="table-wrap">
        <table>
          <thead>
            <tr>
              <th>Name</th><th>Age</th><th>Sex</th><th>Block</th>
              <th>Weight</th><th>Height</th><th>WAZ</th><th>HAZ</th><th>WHO Grade</th>
            </tr>
          </thead>
          <tbody>
            {children.map((child) => {
              const last = child.records[child.records.length - 1];
              const g = grades[child.id] ?? "Normal";
              const cfg = GRADE_CFG[g];
              const waz = lmsZScore(last.weight, last.month, child.gender, "weight");
              const haz = lmsZScore(last.height, last.month, child.gender, "height");
              return (
                <tr key={child.id} onClick={() => goDetail(child)}>
                  <td>
                    <div style={{ display: "flex", alignItems: "center", gap: 9 }}>
                      <div className="avatar" style={{ background: cfg.dot, width: 28, height: 28, fontSize: 12 }}>{child.name[0]}</div>
                      <span style={{ fontWeight: 600, fontSize: 13, color: "#0D1B2A" }}>{child.name}</span>
                    </div>
                  </td>
                  <td style={{ fontFamily: "IBM Plex Mono", fontSize: 12 }}>{last.month}mo</td>
                  <td style={{ fontSize: 12 }}>{child.gender === "boys" ? "M" : "F"}</td>
                  <td style={{ fontSize: 12, color: "#3D5166" }}>{child.village}</td>
                  <td style={{ fontFamily: "IBM Plex Mono", fontSize: 12, fontWeight: 600 }}>{last.weight} kg</td>
                  <td style={{ fontFamily: "IBM Plex Mono", fontSize: 12, fontWeight: 600 }}>{last.height} cm</td>
                  <td style={{ fontFamily: "IBM Plex Mono", fontSize: 12, fontWeight: 700, color: waz < -2 ? "#B03A2E" : "#1E8449" }}>{waz.toFixed(2)}</td>
                  <td style={{ fontFamily: "IBM Plex Mono", fontSize: 12, fontWeight: 700, color: haz < -2 ? "#B03A2E" : "#1E8449" }}>{haz.toFixed(2)}</td>
                  <td><span className={`chip ${cfg.chip}`}>{g}</span></td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
