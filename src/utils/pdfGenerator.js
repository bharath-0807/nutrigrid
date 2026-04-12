// ══════════════════════════════════════════════════════════════
// PDF Report Generation
// Uses jsPDF + jspdf-autotable
// ══════════════════════════════════════════════════════════════

import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import { lmsZScore, classifyChild } from "./lmsCalc";
import { calcNutrients, getRDA, getDietGaps } from "./nutritionCalc";
import { ICMR_FOODS } from "../data/icmrFoods";
import { GRADE_CFG, CLINICAL_RECS } from "../data/clinicalConfig";

// ── QR CODE (pure canvas, no library) ──────────────────────
// Draws a simple visual QR-like pattern for demo purposes
function drawQR(doc, text, x, y, size) {
  const modules = 21, cell = size / modules;
  let hash = 0;
  for (let i = 0; i < text.length; i++) hash = ((hash << 5) - hash + text.charCodeAt(i)) | 0;

  doc.setFillColor(0, 59, 115);
  doc.rect(x, y, size, size, "F");
  doc.setFillColor(255, 255, 255);
  doc.rect(x + cell, y + cell, size - cell * 2, size - cell * 2, "F");

  [[0, 0], [0, 14], [14, 0]].forEach(([r, c]) => {
    doc.setFillColor(0, 59, 115);
    doc.rect(x + c * cell, y + r * cell, 7 * cell, 7 * cell, "F");
    doc.setFillColor(255, 255, 255);
    doc.rect(x + c * cell + cell, y + r * cell + cell, 5 * cell, 5 * cell, "F");
    doc.setFillColor(0, 59, 115);
    doc.rect(x + c * cell + 2 * cell, y + r * cell + 2 * cell, 3 * cell, 3 * cell, "F");
  });

  for (let r = 0; r < modules; r++) {
    for (let c = 0; c < modules; c++) {
      if ((r < 8 && c < 8) || (r < 8 && c > 12) || (r > 12 && c < 8)) continue;
      const bit = ((hash ^ (r * modules + c) * 2654435761) >>> 0) % 2;
      if (bit) {
        doc.setFillColor(0, 59, 115);
        doc.rect(x + c * cell, y + r * cell, cell, cell, "F");
      }
    }
  }
}

// ── DRAW NUTRIENT BAR in PDF ────────────────────────────────
function drawNutrientBar(doc, label, got, need, unit, color, x, y, w) {
  const pct = Math.min(1, need > 0 ? got / need : 0);
  const ok = pct >= 0.85;
  const barH = 5, labelW = 28, valW = 32;
  const barW = w - labelW - valW - 6;

  doc.setFontSize(8); doc.setFont("helvetica", "bold");
  doc.setTextColor(ok ? 30 : 176, ok ? 132 : 58, ok ? 73 : 46);
  doc.text(label, x, y + barH - 1);

  doc.setFillColor(220, 228, 236);
  doc.roundedRect(x + labelW, y, barW, barH, 1, 1, "F");
  const rgb = ok ? [30, 132, 73] : [176, 58, 46];
  doc.setFillColor(...rgb);
  doc.roundedRect(x + labelW, y, barW * pct, barH, 1, 1, "F");

  doc.setFontSize(7); doc.setFont("helvetica", "normal");
  doc.setTextColor(60, 81, 102);
  doc.text(`${got}${unit}/${need}${unit}`, x + labelW + barW + 3, y + barH - 1);
}

/**
 * Generate individual child PDF report.
 */
export function generateChildPDF(child, grade, waz, haz, dietData) {
  const doc = new jsPDF();
  const cfg = GRADE_CFG[grade] ?? GRADE_CFG["Normal"];
  const last = child.records[child.records.length - 1];
  const rda = getRDA(last.month);

  // ── PAGE 1 HEADER ──
  doc.setFillColor(0, 59, 115); doc.rect(0, 0, 210, 38, "F");
  doc.setFillColor(0, 80, 158); doc.rect(0, 34, 210, 4, "F");
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(15); doc.setFont("helvetica", "bold");
  doc.text("NutriGrid - Child Nutritional Assessment Report", 14, 13);
  doc.setFontSize(8.5); doc.setFont("helvetica", "normal");
  doc.text("Coimbatore District ICDS  |  March 2026  |  WHO LMS Box-Cox Algorithm (2006)", 14, 22);
  doc.text("Jansons Institute of Technology, Coimbatore", 14, 30);

  // ── GRADE BADGE ──
  const gc = grade === "SAM" ? [176, 58, 46] : grade === "MAM" ? [202, 111, 30] : [30, 132, 73];
  doc.setFillColor(...gc);
  doc.roundedRect(148, 4, 48, 30, 3, 3, "F");
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(16); doc.setFont("helvetica", "bold");
  doc.text(grade, 172, 17, { align: "center" });
  doc.setFontSize(7); doc.setFont("helvetica", "normal");
  doc.text(cfg.full.replace("Acute ", ""), 172, 26, { align: "center" });
  doc.text("WHO LMS Grade", 172, 31, { align: "center" });

  // ── CHILD INFO + QR ──
  doc.setTextColor(10, 10, 26);
  doc.setFontSize(11); doc.setFont("helvetica", "bold");
  doc.text("Child Information", 14, 50);

  autoTable(doc, {
    startY: 54, margin: { right: 52 },
    head: [["Field", "Details"]],
    body: [
      ["Name", child.name],
      ["Age", `${last.month} months (${(last.month / 12).toFixed(1)} years)`],
      ["Sex", child.gender === "boys" ? "Male" : "Female"],
      ["Block / Village", child.village],
      ["Weight", `${last.weight} kg`],
      ["Height", `${last.height} cm`],
      ["WAZ", `${waz.toFixed(3)}  (${waz < -3 ? "Below -3 SD" : waz < -2 ? "Below -2 SD" : "Within normal"})`],
      ["HAZ", `${haz.toFixed(3)}  (${haz < -3 ? "Severe stunting" : haz < -2 ? "Moderate stunting" : "Normal height"})`],
      ["WHO Grade", `${grade} - ${cfg.full}`],
      ["Algorithm", "WHO LMS Box-Cox Z-score  |  ICDS Standard"],
    ],
    headStyles: { fillColor: [0, 59, 115], fontSize: 8 },
    bodyStyles: { fontSize: 8 },
    alternateRowStyles: { fillColor: [240, 244, 248] },
  });

  drawQR(doc, `nutrigrid-child-${child.id}-${child.name}`, 158, 54, 36);
  doc.setFontSize(6.5); doc.setTextColor(120, 140, 160); doc.setFont("helvetica", "normal");
  doc.text("Scan for digital record", 176, 94, { align: "center" });

  // ── WHO THRESHOLDS BOX ──
  let y = doc.lastAutoTable.finalY + 10;
  doc.setFillColor(235, 243, 251); doc.roundedRect(14, y, 182, 18, 2, 2, "F");
  doc.setDrawColor(194, 220, 245); doc.roundedRect(14, y, 182, 18, 2, 2, "S");
  doc.setTextColor(0, 59, 115); doc.setFontSize(8); doc.setFont("helvetica", "bold");
  doc.text("WHO Classification Reference:", 18, y + 7);
  doc.setFont("helvetica", "normal"); doc.setFontSize(7.5);
  doc.text("SAM: WAZ < -3 SD  |  MAM: WAZ -3 to -2 SD  |  Normal: WAZ >= -2 SD  |  Stunting: HAZ < -2 SD", 18, y + 14);
  y += 24;

  // ── GROWTH HISTORY TABLE ──
  doc.setFontSize(11); doc.setFont("helvetica", "bold"); doc.setTextColor(10, 10, 26);
  doc.text("Growth History & Z-Score Trend", 14, y);
  autoTable(doc, {
    startY: y + 4,
    head: [["Visit", "Weight", "Height", "WAZ", "HAZ", "Grade", "Status"]],
    body: child.records.map((r) => {
      const rW = lmsZScore(r.weight, r.month, child.gender, "weight");
      const rH = lmsZScore(r.height, r.month, child.gender, "height");
      const rG = classifyChild(rW, rH);
      const trend = rW < -3 ? "[!] Critical" : rW < -2 ? "[v] Deficit" : "[ok] Normal";
      return [`${r.month} mo`, `${r.weight} kg`, `${r.height} cm`, rW.toFixed(2), rH.toFixed(2), rG, trend];
    }),
    headStyles: { fillColor: [0, 59, 115], fontSize: 7.5 },
    bodyStyles: { fontSize: 7.5 },
    alternateRowStyles: { fillColor: [240, 244, 248] },
    columnStyles: { 3: { fontStyle: "bold" }, 4: { fontStyle: "bold" }, 6: { fontStyle: "bold" } },
  });
  y = doc.lastAutoTable.finalY;

  // ── VISUAL WAZ TREND ──
  if (child.records.length >= 2 && y < 220) {
    y += 8;
    doc.setFontSize(9); doc.setFont("helvetica", "bold"); doc.setTextColor(10, 10, 26);
    doc.text("WAZ Trend Visualization", 14, y);
    y += 4;
    const chartX = 14, chartY = y, chartW = 182, chartH = 28;
    doc.setFillColor(244, 247, 251); doc.rect(chartX, chartY, chartW, chartH, "F");
    doc.setDrawColor(208, 217, 228); doc.rect(chartX, chartY, chartW, chartH, "S");
    const wazToY = (w) => { const mn = -5, mx = 1; return chartY + chartH - (((w - mn) / (mx - mn)) * chartH); };
    doc.setDrawColor(176, 58, 46); doc.setLineDashPattern([2, 1], 0);
    const y3 = wazToY(-3); doc.line(chartX, y3, chartX + chartW, y3);
    const y2 = wazToY(-2); doc.setDrawColor(202, 111, 30); doc.line(chartX, y2, chartX + chartW, y2);
    doc.setLineDashPattern([], 0);
    doc.setDrawColor(0, 80, 158); doc.setLineWidth(0.8);
    const pts = child.records.map((r, i) => ({
      x: chartX + (i / (child.records.length - 1)) * chartW,
      y: wazToY(lmsZScore(r.weight, r.month, child.gender, "weight")),
    }));
    for (let i = 0; i < pts.length - 1; i++) doc.line(pts[i].x, pts[i].y, pts[i + 1].x, pts[i + 1].y);
    pts.forEach((p) => { doc.setFillColor(0, 80, 158); doc.circle(p.x, p.y, 1, "F"); });
    doc.setLineWidth(0.2);
    doc.setFontSize(6); doc.setTextColor(176, 58, 46); doc.text("SAM -3SD", chartX + 2, y3 - 1);
    doc.setTextColor(202, 111, 30); doc.text("MAM -2SD", chartX + 2, y2 - 1);
    doc.setTextColor(100, 120, 140);
    child.records.forEach((r, i) => {
      const px = chartX + (i / (child.records.length - 1)) * chartW;
      doc.text(`${r.month}m`, px - 3, chartY + chartH + 5);
    });
    y = chartY + chartH + 10;
  }

  // ── Clinical Recommendations ──
  if (y > 230) { doc.addPage(); y = 20; }
  doc.setFontSize(11); doc.setFont("helvetica", "bold"); doc.setTextColor(10, 10, 26);
  doc.text(`Clinical Recommendations - ${grade} (${cfg.full})`, 14, y + 6); y += 10;
  autoTable(doc, {
    startY: y,
    head: [["#", "Action Required"]],
    body: (CLINICAL_RECS[grade] ?? []).map((r, i) => [(i + 1).toString(), r]),
    headStyles: { fillColor: [0, 59, 115], fontSize: 8 },
    bodyStyles: { fontSize: 8 },
    alternateRowStyles: { fillColor: [240, 244, 248] },
  });
  y = doc.lastAutoTable.finalY + 10;

  // ── DIET & NUTRITION SECTION ──
  if (dietData && dietData.intake && dietData.intake.length > 0) {
    if (y > 210) { doc.addPage(); y = 20; }
    const nuts = calcNutrients(dietData.intake);

    doc.setFontSize(11); doc.setFont("helvetica", "bold"); doc.setTextColor(10, 10, 26);
    doc.text("Daily Diet Assessment", 14, y); y += 6;

    autoTable(doc, {
      startY: y,
      head: [["Food Item", "Unit", "Qty", "Calories", "Protein", "Iron", "Vit-A", "Zinc"]],
      body: dietData.intake.map(({ foodId, qty }) => {
        const f = ICMR_FOODS.find((x) => x.id === foodId);
        if (!f) return [];
        const factor = (qty * f.grams) / 100;
        return [f.name, f.unit, `x${qty}`, (f.cal * factor).toFixed(0) + "kcal", (f.pro * factor).toFixed(1) + "g", (f.iron * factor).toFixed(1) + "mg", (f.vitA * factor).toFixed(0) + "mcg", (f.zinc * factor).toFixed(1) + "mg"];
      }).filter((r) => r.length > 0),
      headStyles: { fillColor: [0, 123, 131], fontSize: 7 },
      bodyStyles: { fontSize: 7 },
      alternateRowStyles: { fillColor: [224, 245, 245] },
    });
    y = doc.lastAutoTable.finalY + 8;

    // Nutrient adequacy bars
    if (y > 220) { doc.addPage(); y = 20; }
    doc.setFontSize(10); doc.setFont("helvetica", "bold"); doc.setTextColor(10, 10, 26);
    doc.text("Nutrient Adequacy vs ICMR RDA", 14, y); y += 6;

    const barDefs = [
      { label: "Energy",  got: nuts.cal,  need: rda.cal,  unit: "kcal", col: [0, 80, 158] },
      { label: "Protein", got: nuts.pro,  need: rda.pro,  unit: "g",    col: [0, 123, 131] },
      { label: "Iron",    got: nuts.iron, need: rda.iron, unit: "mg",   col: [202, 111, 30] },
      { label: "Vit-A",   got: nuts.vitA, need: rda.vitA, unit: "mcg",  col: [142, 68, 173] },
      { label: "Zinc",    got: nuts.zinc, need: rda.zinc, unit: "mg",   col: [30, 132, 73] },
    ];
    barDefs.forEach((b, i) => {
      drawNutrientBar(doc, b.label, b.got, b.need, b.unit, b.col, 14, y + i * 9, 182);
    });
    y += barDefs.length * 9 + 8;

    // Forecast summary
    if (dietData.forecast && y < 240) {
      if (y > 220) { doc.addPage(); y = 20; }
      doc.setFontSize(10); doc.setFont("helvetica", "bold"); doc.setTextColor(10, 10, 26);
      doc.text(`Growth Forecast - ${dietData.horizon}-Month Prediction`, 14, y); y += 5;

      const adeqPct = Math.round(dietData.forecast.calAdequacy * 100);
      const adeqOk = adeqPct >= 85;
      doc.setFillColor(adeqOk ? 233 : 253, adeqOk ? 247 : 237, adeqOk ? 239 : 236);
      doc.roundedRect(14, y, 182, 16, 2, 2, "F");
      doc.setFontSize(8); doc.setFont("helvetica", "bold");
      doc.setTextColor(adeqOk ? 30 : 176, adeqOk ? 132 : 58, adeqOk ? 73 : 46);
      doc.text(`Calorie Adequacy: ${adeqPct}%  |  Growth Velocity Factor: ${(dietData.forecast.velocityFactor * 100).toFixed(0)}%`, 18, y + 7);
      doc.setFont("helvetica", "normal"); doc.setFontSize(7.5); doc.setTextColor(60, 81, 102);
      doc.text(adeqOk ? "Diet meets ICMR RDA - child on track for normal growth trajectory" : "Diet below ICMR RDA - growth faltering risk - see food gap recommendations below", 18, y + 13);
      y += 22;

      autoTable(doc, {
        startY: y,
        head: [["Month", "Current Diet WAZ", "Optimal Diet WAZ", "SAM Line", "MAM Line", "Projected Grade"]],
        body: dietData.forecast.points.map((p) => {
          const projG = classifyChild(p["Current Diet WAZ"], -1.5);
          return [p.month, p["Current Diet WAZ"].toFixed(2), p["Optimal Diet WAZ"].toFixed(2), "-3.0", "-2.0", projG];
        }),
        headStyles: { fillColor: [0, 59, 115], fontSize: 7 },
        bodyStyles: { fontSize: 7.5 },
        alternateRowStyles: { fillColor: [240, 244, 248] },
        columnStyles: { 1: { fontStyle: "bold" }, 2: { fontStyle: "bold", textColor: [30, 132, 73] } },
      });
      y = doc.lastAutoTable.finalY + 8;
    }

    // Food gap recommendations
    if (y < 250) {
      if (y > 230) { doc.addPage(); y = 20; }
      const { gaps } = getDietGaps(dietData.intake, last.month);
      doc.setFontSize(10); doc.setFont("helvetica", "bold"); doc.setTextColor(10, 10, 26);
      doc.text("Food Gap Recommendations", 14, y); y += 5;
      if (gaps.length === 0) {
        doc.setFillColor(233, 247, 239); doc.roundedRect(14, y, 182, 14, 2, 2, "F");
        doc.setFontSize(8); doc.setFont("helvetica", "bold"); doc.setTextColor(30, 132, 73);
        doc.text("[ok] All nutrient targets met - continue current diet", 18, y + 9);
        y += 18;
      } else {
        autoTable(doc, {
          startY: y,
          head: [["Nutrient", "Got", "RDA", "Gap %", "Recommended Foods"]],
          body: gaps.map((g) => [g.nutrient, `${g.got}${g.unit}`, `${g.need}${g.unit}`, `${Math.round(g.severity * 100)}%`, g.foods]),
          headStyles: { fillColor: [176, 58, 46], fontSize: 7 },
          bodyStyles: { fontSize: 7 },
          alternateRowStyles: { fillColor: [253, 237, 236] },
        });
        y = doc.lastAutoTable.finalY + 8;
      }
    }
  }

  // ── FOOTER every page ──
  const pageCount = doc.internal.getNumberOfPages();
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);
    doc.setFillColor(0, 59, 115); doc.rect(0, 287, 210, 10, "F");
    doc.setFontSize(6.5); doc.setTextColor(255, 255, 255); doc.setFont("helvetica", "normal");
    doc.text(`NutriGrid  |  WHO Child Growth Standards (2006)  |  ICMR-NIN Food Composition (2017)  |  Page ${i}/${pageCount}`, 14, 293);
  }

  doc.save(`NutriGrid_${child.name.replace(/ /g, "_")}_Report.pdf`);
}

/**
 * Generate district-level ICDS report PDF.
 */
export function generatePDF(children, grades, timeFilter = "all") {
  const doc = new jsPDF();
  
  // ── FILTER CHILDREN BASED ON TIME FILTER ──
  let filtered = children;
  let reportTitle = "ICDS Nutritional Assessment Report";
  if (timeFilter === 3) {
    filtered = children.filter(c => {
      const last = c.records[c.records.length - 1];
      return last && last.month <= 3;
    });
    reportTitle = "ICDS 0-3 Months Assessment Report";
  } else if (timeFilter === 6) {
    filtered = children.filter(c => {
      const last = c.records[c.records.length - 1];
      return last && last.month <= 6;
    });
    reportTitle = "ICDS 0-6 Months Assessment Report";
  }

  // ── START DRAWING PDF ──
  doc.setFillColor(0, 59, 115); doc.rect(0, 0, 210, 34, "F");
  doc.setFillColor(0, 80, 158); doc.rect(0, 30, 210, 4, "F");
  doc.setTextColor(255, 255, 255); doc.setFontSize(16); doc.setFont("helvetica", "bold");
  doc.text("NutriGrid - " + reportTitle, 14, 14);
  doc.setFontSize(8.5); doc.setFont("helvetica", "normal");
  doc.text("Coimbatore District  |  March 2026  |  WHO LMS Box-Cox Algorithm  |  SAM/MAM Classification", 14, 24);

  const total = filtered.length;
  const sam = filtered.filter((c) => grades[c.id] === "SAM").length;
  const mam = filtered.filter((c) => grades[c.id] === "MAM").length;
  const normal = filtered.filter((c) => grades[c.id] === "Normal").length;
  const gam = sam + mam;

  doc.setTextColor(10, 10, 26); doc.setFontSize(12); doc.setFont("helvetica", "bold");
  doc.text("Programme Indicators (N=" + total + ")", 14, 46);
  autoTable(doc, {
    startY: 50,
    head: [["Indicator", "Count", "Rate", "WHO Threshold"]],
    body: [
      ["Total Assessed", total, "100%", "—"],
      ["Normal", normal, `${total ? Math.round((normal / total) * 100) : 0}%`, "Target ≥75%"],
      ["GAM (MAM+SAM)", gam, `${total ? Math.round((gam / total) * 100) : 0}%`, "Emergency >15%"],
      ["MAM", mam, `${total ? Math.round((mam / total) * 100) : 0}%`, "Alert >10%"],
      ["SAM", sam, `${total ? Math.round((sam / total) * 100) : 0}%`, "Emergency >2%"],
    ],
    headStyles: { fillColor: [0, 59, 115] },
    alternateRowStyles: { fillColor: [240, 244, 248] },
  });

  let y = doc.lastAutoTable.finalY + 12;

  // ── COMBINED SCATTER CHART IN PDF ──
  if (total > 0 && y < 160) {
    doc.setFontSize(12); doc.setFont("helvetica", "bold");
    doc.text("District WAZ Dispersal (Combined Chart)", 14, y);
    y += 6;
    
    // Draw scatter box
    const cx = 14, cy = y, cw = 182, ch = 50;
    doc.setFillColor(244, 247, 251); doc.rect(cx, cy, cw, ch, "F");
    doc.setDrawColor(208, 217, 228); doc.rect(cx, cy, cw, ch, "S");
    
    // Helper to map WAZ coordinates (Y-axis: +2 to -5, X-axis: 0 to 60mo based on time filter)
    const maxM = timeFilter === 3 ? 3 : timeFilter === 6 ? 6 : 60;
    const toY = (v) => { const mn = -5, mx = 2; return Math.min(Math.max(cy + ch - (((v - mn) / (mx - mn)) * ch), cy), cy + ch); };
    const toX = (m) => cx + (Math.min(m, maxM) / maxM) * cw;

    // Draw WHO threshold lines
    doc.setDrawColor(176, 58, 46); doc.setLineDashPattern([2, 1], 0); // SAM
    doc.line(cx, toY(-3), cx + cw, toY(-3));
    doc.setDrawColor(202, 111, 30); doc.line(cx, toY(-2), cx + cw, toY(-2)); // MAM
    doc.setDrawColor(30, 132, 73); doc.line(cx, toY(0), cx + cw, toY(0)); // Median
    doc.setLineDashPattern([], 0);

    // Labels for lines
    doc.setFontSize(6); 
    doc.setTextColor(176, 58, 46); doc.text("<-3SD SAM", cx + 2, toY(-3) - 1);
    doc.setTextColor(202, 111, 30); doc.text("<-2SD MAM", cx + 2, toY(-2) - 1);
    doc.setTextColor(30, 132, 73); doc.text("Median", cx + 2, toY(0) - 1);

    // Draw all children dots
    filtered.forEach(c => {
      const last = c.records[c.records.length - 1];
      if (last) {
        const cwz = lmsZScore(last.weight, last.month, c.gender, "weight");
        const px = toX(last.month);
        const py = toY(cwz);
        
        // Color code dots
        if (cwz < -3) doc.setFillColor(176, 58, 46);
        else if (cwz < -2) doc.setFillColor(202, 111, 30);
        else doc.setFillColor(30, 132, 73);
        
        // Slightly transparent look using small circle diameter
        doc.circle(px, py, 1.2, "F");
      }
    });

    // X-axis legend
    doc.setTextColor(100, 120, 140); doc.setFontSize(7);
    doc.text(`0 months`, cx, cy + ch + 5);
    doc.text(`${maxM} months`, cx + cw - 12, cy + ch + 5);
    
    y = cy + ch + 12;
  }

  // ── INDIVIDUAL TABLE ──
  doc.setTextColor(10, 10, 26);
  doc.setFontSize(12); doc.setFont("helvetica", "bold");
  doc.text("Individual Records", 14, y + 6);
  autoTable(doc, {
    startY: y + 10,
    head: [["Name", "Age", "Sex", "Block", "Wt(kg)", "Ht(cm)", "WAZ", "HAZ", "WHO Grade"]],
    body: filtered.map((c) => {
      const last = c.records[c.records.length - 1];
      return [
        c.name, last.month, c.gender === "boys" ? "M" : "F", c.village,
        `${last.weight}`, `${last.height}`,
        lmsZScore(last.weight, last.month, c.gender, "weight").toFixed(2),
        lmsZScore(last.height, last.month, c.gender, "height").toFixed(2),
        grades[c.id] ?? "—",
      ];
    }),
    headStyles: { fillColor: [0, 59, 115], fontSize: 8 },
    bodyStyles: { fontSize: 8 },
    alternateRowStyles: { fillColor: [240, 244, 248] },
  });

  const footerText = "WHO LMS Box-Cox z-score  |  SAM: WAZ/HAZ<-3  |  MAM: -3 to -2  |  NutriGrid ICDS System" + (timeFilter !== "all" ? ` | Filter: 0-${timeFilter}m` : "");

  // Apply footer to all pages
  const pageCount = doc.internal.getNumberOfPages();
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);
    doc.setFontSize(7.5); doc.setTextColor(120, 140, 160);
    doc.text(footerText, 14, 284);
  }

  const fn = timeFilter !== "all" ? `NutriGrid_0_${timeFilter}m_Report.pdf` : "NutriGrid_ICDS_Report.pdf";
  doc.save(fn);
}
