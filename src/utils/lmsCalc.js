// ══════════════════════════════════════════════════════════════
// WHO LMS Box-Cox Z-Score Calculations
// Source: WHO Child Growth Standards (2006) — official method
// ══════════════════════════════════════════════════════════════

import { LMS_TABLES } from "../data/lmsTables";
import { WHO_REF } from "../data/whoReference";

/**
 * Interpolate LMS parameters for a given age in months.
 */
export function lmsInterpolate(table, age) {
  if (age <= table[0][0]) {
    return { L: table[0][1], M: table[0][2], S: table[0][3] };
  }
  if (age >= table[table.length - 1][0]) {
    const r = table[table.length - 1];
    return { L: r[1], M: r[2], S: r[3] };
  }
  for (let i = 0; i < table.length - 1; i++) {
    if (table[i][0] <= age && age <= table[i + 1][0]) {
      const t = (age - table[i][0]) / (table[i + 1][0] - table[i][0]);
      return {
        L: table[i][1] + t * (table[i + 1][1] - table[i][1]),
        M: table[i][2] + t * (table[i + 1][2] - table[i][2]),
        S: table[i][3] + t * (table[i + 1][3] - table[i][3]),
      };
    }
  }
  return { L: table[0][1], M: table[0][2], S: table[0][3] };
}

/**
 * Compute WHO LMS z-score for a measurement.
 * @param {number} value   - Weight (kg) or Height (cm)
 * @param {number} age     - Age in months
 * @param {string} gender  - "boys" or "girls"
 * @param {string} type    - "weight" or "height"
 * @returns {number} z-score
 */
export function lmsZScore(value, age, gender, type) {
  const { L, M, S } = lmsInterpolate(LMS_TABLES[gender][type], age);
  if (Math.abs(L) < 0.0001) return Math.log(value / M) / S;
  return (Math.pow(value / M, L) - 1) / (L * S);
}

/**
 * Classify child as SAM, MAM, or Normal based on WAZ and HAZ.
 */
export function classifyChild(waz, haz) {
  if (waz < -3 || haz < -3) return "SAM";
  if (waz < -2 || haz < -2) return "MAM";
  return "Normal";
}

/**
 * Calculate growth velocity from records.
 */
export function getGrowthVelocity(records, tab) {
  if (records.length < 2) return null;
  const last = records[records.length - 1];
  const prev = records[records.length - 2];
  const val = tab === "weight" ? last.weight - prev.weight : last.height - prev.height;
  const months = last.month - prev.month;
  return months > 0 ? (val / months).toFixed(2) : null;
}

/**
 * Build chart data for a child's growth vs WHO reference curves.
 */
export function buildChartData(child, tab) {
  const table = WHO_REF[child.gender][tab === "weight" ? "weight" : "height"];
  const pts = {};
  child.records.forEach((r) => {
    pts[r.month] = tab === "weight" ? r.weight : r.height;
  });
  return table.map((s) => ({
    age: `${s.age}m`,
    Child: pts[s.age] ?? null,
    Median: s.med,
    "-2SD": s.sd2n,
    "-3SD": s.sd3n,
  }));
}
