// ══════════════════════════════════════════════════════════════
// Nutrition Calculations — ICMR RDA, diet analysis, forecasting
// Source: ICMR Recommended Dietary Allowances (2020)
// ══════════════════════════════════════════════════════════════

import { ICMR_FOODS } from "../data/icmrFoods";
import { lmsZScore } from "./lmsCalc";

/**
 * Get ICMR RDA (Recommended Dietary Allowance) by age group.
 * @param {number} ageMonths - Age in months
 */
export function getRDA(ageMonths) {
  if (ageMonths <= 6)  return { cal: 520,  pro: 1.2,  iron: 0,  vitA: 350, zinc: 2.8,  label: "0–6 mo" };
  if (ageMonths <= 12) return { cal: 650,  pro: 1.2,  iron: 5,  vitA: 350, zinc: 2.8,  label: "6–12 mo" };
  if (ageMonths <= 36) return { cal: 1000, pro: 16.7, iron: 9,  vitA: 400, zinc: 8.3,  label: "1–3 yr" };
  if (ageMonths <= 60) return { cal: 1350, pro: 20.1, iron: 13, vitA: 400, zinc: 11.0, label: "3–5 yr" };
  return                      { cal: 1350, pro: 20.1, iron: 13, vitA: 400, zinc: 11.0, label: "5 yr+" };
}

/**
 * Calculate daily nutrients from food intake array.
 * @param {Array} intake - [{foodId, qty}, ...]
 */
export function calcNutrients(intake) {
  let cal = 0, pro = 0, iron = 0, vitA = 0, zinc = 0;
  intake.forEach(({ foodId, qty }) => {
    const f = ICMR_FOODS.find((x) => x.id === foodId);
    if (!f) return;
    const factor = (qty * f.grams) / 100;
    cal  += f.cal  * factor;
    pro  += f.pro  * factor;
    iron += f.iron * factor;
    vitA += f.vitA * factor;
    zinc += f.zinc * factor;
  });
  return {
    cal: Math.round(cal),
    pro: +pro.toFixed(1),
    iron: +iron.toFixed(1),
    vitA: Math.round(vitA),
    zinc: +zinc.toFixed(1),
  };
}

/**
 * WHO growth velocity — expected weight gain per month by age.
 * Source: WHO Child Growth Standards velocity tables
 */
export function getExpectedWeightGainPerMonth(ageMonths) {
  if (ageMonths <= 3)  return 0.90;
  if (ageMonths <= 6)  return 0.60;
  if (ageMonths <= 12) return 0.35;
  if (ageMonths <= 24) return 0.22;
  if (ageMonths <= 36) return 0.18;
  if (ageMonths <= 60) return 0.15;
  return 0.15;
}

/**
 * Predict future WAZ based on current diet adequacy.
 * Logic: calorie adequacy drives growth velocity multiplier.
 */
export function predictGrowth(child, intake, months) {
  const last = child.records[child.records.length - 1];
  const rda = getRDA(last.month);
  const nuts = calcNutrients(intake);
  const calAdequacy = rda.cal > 0 ? nuts.cal / rda.cal : 0;

  const velocityFactor =
    calAdequacy < 0.5  ? 0.2
    : calAdequacy < 0.7  ? 0.5
    : calAdequacy < 0.85 ? 0.8
    : calAdequacy < 1.0  ? 1.0
    : 1.25;

  const points = [];
  let currentWeight = last.weight;
  let currentAge = last.month;

  for (let m = 1; m <= months; m++) {
    const expectedGain = getExpectedWeightGainPerMonth(currentAge + m);
    const actualGain = expectedGain * velocityFactor;
    currentWeight += actualGain;
    const predictedWeight = currentWeight;
    const optimalWeight = last.weight + expectedGain * 1.15 * m;
    const futureAge = currentAge + m;

    const predWAZ = lmsZScore(predictedWeight, Math.min(futureAge, 60), child.gender, "weight");
    const optimalWAZ = lmsZScore(optimalWeight, Math.min(futureAge, 60), child.gender, "weight");

    points.push({
      month: `+${m}mo`,
      "Current Diet WAZ": +predWAZ.toFixed(2),
      "Optimal Diet WAZ": +optimalWAZ.toFixed(2),
      "SAM Threshold": -3,
      "MAM Threshold": -2,
    });
  }
  return { points, calAdequacy, velocityFactor };
}

/**
 * Identify nutrient gaps vs ICMR RDA with food recommendations.
 */
export function getDietGaps(intake, ageMonths) {
  const nuts = calcNutrients(intake);
  const rda = getRDA(ageMonths);
  const gaps = [];

  if (nuts.cal  < rda.cal  * 0.85) gaps.push({ nutrient: "Energy",    got: nuts.cal,  need: rda.cal,  unit: "kcal", foods: "Rice, roti, banana, peanut",     severity: nuts.cal / rda.cal });
  if (nuts.pro  < rda.pro  * 0.85) gaps.push({ nutrient: "Protein",   got: nuts.pro,  need: rda.pro,  unit: "g",    foods: "Dal, egg, milk, chicken, fish",  severity: nuts.pro / rda.pro });
  if (nuts.iron < rda.iron * 0.75) gaps.push({ nutrient: "Iron",      got: nuts.iron, need: rda.iron, unit: "mg",   foods: "Green leafy veg, dal, jaggery",  severity: nuts.iron / rda.iron });
  if (nuts.vitA < rda.vitA * 0.75) gaps.push({ nutrient: "Vitamin A", got: nuts.vitA, need: rda.vitA, unit: "mcg",  foods: "Carrot, mango, egg, green leaves", severity: nuts.vitA / rda.vitA });
  if (nuts.zinc < rda.zinc * 0.75) gaps.push({ nutrient: "Zinc",      got: nuts.zinc, need: rda.zinc, unit: "mg",   foods: "Chicken, fish, dal, peanut",     severity: nuts.zinc / rda.zinc });

  return { gaps, nuts, rda };
}
