import { useState, useEffect, useCallback } from "react";
import {
  LayoutDashboard, Users, PlusCircle, BarChart2,
  AlertTriangle, CheckCircle, Activity, Baby,
  Brain, MapPin, TrendingUp,
  ArrowLeft, FileText, ArrowRight,
  Shield, Wifi, Bell, HeartPulse,
  ClipboardList, Zap, ChevronRight,
  Download, LogOut, LogIn
} from "lucide-react";
import {
  LineChart, Line, BarChart, Bar,
  XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, Legend, AreaChart, Area
} from "recharts";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

const LMS_TABLES = {
  boys: {
    weight: [[0,-0.3521,3.3464,0.14602],[1,-0.3521,4.4709,0.13395],[2,-0.3521,5.5675,0.12385],[3,-0.3521,6.3762,0.11727],[6,-0.3521,7.9340,0.11080],[9,-0.3521,9.1525,0.10698],[12,-0.3521,10.2087,0.10390],[18,-0.3521,11.5014,0.10170],[24,-0.3521,12.6558,0.10220],[36,-0.3521,14.3450,0.10695],[48,-0.3521,16.1750,0.11400],[60,-0.3521,18.3414,0.12200]],
    height: [[0,1,49.8842,0.03795],[1,1,54.7244,0.03557],[2,1,58.4249,0.03424],[3,1,61.4292,0.03328],[6,1,67.6236,0.03174],[9,1,72.0036,0.03117],[12,1,75.7488,0.03063],[18,1,82.3080,0.03001],[24,1,87.8161,0.03013],[36,1,96.1004,0.03054],[48,1,103.3120,0.03097],[60,1,110.0352,0.03167]],
  },
  girls: {
    weight: [[0,-0.3833,3.2322,0.14171],[1,-0.3833,4.1873,0.13724],[2,-0.3833,5.1282,0.13000],[3,-0.3833,5.8458,0.12619],[6,-0.3833,7.2973,0.12034],[9,-0.3833,8.3817,0.11683],[12,-0.3833,9.5249,0.11333],[18,-0.3833,10.8200,0.11108],[24,-0.3833,12.1416,0.11298],[36,-0.3833,14.3278,0.11939],[48,-0.3833,16.4436,0.12849],[60,-0.3833,18.3953,0.13468]],
    height: [[0,1,49.1477,0.03790],[1,1,53.6872,0.03625],[2,1,57.0673,0.03546],[3,1,59.8029,0.03481],[6,1,65.7302,0.03368],[9,1,70.1434,0.03275],[12,1,74.0150,0.03231],[18,1,80.7886,0.03142],[24,1,86.4035,0.03118],[36,1,95.1254,0.03074],[48,1,102.7124,0.03054],[60,1,109.4170,0.03051]],
  },
};

function lmsInterpolate(table, age) {
  if (age <= table[0][0]) return { L:table[0][1], M:table[0][2], S:table[0][3] };
  if (age >= table[table.length-1][0]) { const r=table[table.length-1]; return {L:r[1],M:r[2],S:r[3]}; }
  for (let i=0;i<table.length-1;i++) {
    if (table[i][0]<=age && age<=table[i+1][0]) {
      const t=(age-table[i][0])/(table[i+1][0]-table[i][0]);
      return { L:table[i][1]+t*(table[i+1][1]-table[i][1]), M:table[i][2]+t*(table[i+1][2]-table[i][2]), S:table[i][3]+t*(table[i+1][3]-table[i][3]) };
    }
  }
  return { L:table[0][1], M:table[0][2], S:table[0][3] };
}

function lmsZScore(value, age, gender, type) {
  const { L, M, S } = lmsInterpolate(LMS_TABLES[gender][type], age);
  if (Math.abs(L) < 0.0001) return Math.log(value/M)/S;
  return (Math.pow(value/M, L) - 1) / (L * S);
}

function classifyChild(waz, haz) {
  if (waz < -3 || haz < -3) return "SAM";
  if (waz < -2 || haz < -2) return "MAM";
  return "Normal";
}

function getGrowthVelocity(records, tab) {
  if (records.length < 2) return null;
  const last=records[records.length-1], prev=records[records.length-2];
  const val=tab==="weight"?last.weight-prev.weight:last.height-prev.height;
  const months=last.month-prev.month;
  return months>0?(val/months).toFixed(2):null;
}

const GRADE_CFG = {
  SAM:    { chip:"chip-sam",    col:"#B03A2E", bg:"#FDEDEC", border:"#F1948A", dot:"#B03A2E", full:"Severe Acute Malnutrition",   priority:1 },
  MAM:    { chip:"chip-mam",    col:"#CA6F1E", bg:"#FEF5E7", border:"#F0B27A", dot:"#CA6F1E", full:"Moderate Acute Malnutrition",  priority:2 },
  Normal: { chip:"chip-normal", col:"#1E8449", bg:"#E9F7EF", border:"#82E0AA", dot:"#1E8449", full:"Normal Nutritional Status",    priority:4 },
};

const CLINICAL_RECS = {
  SAM: ["URGENT: Refer immediately to NRC / District Hospital — RUTF F-75/F-100 protocol","Check bilateral pitting oedema and MUAC (< 11.5 cm confirms SAM)","Weekly mandatory follow-up — notify CDPO and District Health Officer","Screen for complications: dehydration, hypothermia, hypoglycaemia","Register in ICDS SAM tracking register immediately"],
  MAM: ["Enrol in Supplementary Nutrition Programme (SNP) — Bal Shakti ration","Provide RUSF or fortified blended foods as per state nutrition guidelines","Bi-weekly anthropometric monitoring and dietary recall","IYCF counselling — minimum dietary diversity, meal frequency","Refer to PHC if no improvement after 8 weeks"],
  Normal: ["Continue monthly WHO anthropometric monitoring per ICDS schedule","Reinforce IYCF practices — age-appropriate feeding counselling","Verify completion of National Immunisation Schedule","Document Vitamin A supplementation and deworming status"],
};

const WHO_REF = {
  boys: {
    weight: [{age:0,med:3.3,sd2n:2.5,sd3n:2.1},{age:6,med:7.9,sd2n:6.4,sd3n:5.7},{age:12,med:10.2,sd2n:8.6,sd3n:7.7},{age:24,med:12.7,sd2n:10.8,sd3n:9.7},{age:36,med:14.9,sd2n:12.7,sd3n:11.4},{age:48,med:16.9,sd2n:14.4,sd3n:13.0},{age:60,med:18.3,sd2n:15.7,sd3n:14.1}],
    height: [{age:0,med:49.9,sd2n:46.1,sd3n:44.2},{age:6,med:67.6,sd2n:63.3,sd3n:61.7},{age:12,med:75.7,sd2n:71.0,sd3n:69.6},{age:24,med:87.8,sd2n:83.5,sd3n:81.7},{age:36,med:96.1,sd2n:91.1,sd3n:88.7},{age:48,med:103.3,sd2n:97.7,sd3n:94.9},{age:60,med:110.0,sd2n:103.9,sd3n:100.7}],
  },
  girls: {
    weight: [{age:0,med:3.2,sd2n:2.4,sd3n:2.0},{age:6,med:7.3,sd2n:5.9,sd3n:5.3},{age:12,med:9.5,sd2n:7.9,sd3n:7.0},{age:24,med:12.1,sd2n:10.2,sd3n:9.0},{age:36,med:14.3,sd2n:12.1,sd3n:10.8},{age:48,med:16.4,sd2n:13.9,sd3n:12.3},{age:60,med:18.3,sd2n:15.5,sd3n:13.7}],
    height: [{age:0,med:49.1,sd2n:45.4,sd3n:43.6},{age:6,med:65.7,sd2n:61.2,sd3n:59.8},{age:12,med:74.0,sd2n:70.0,sd3n:68.9},{age:24,med:86.4,sd2n:81.7,sd3n:80.0},{age:36,med:95.1,sd2n:90.0,sd3n:87.4},{age:48,med:102.7,sd2n:96.9,sd3n:94.1},{age:60,med:109.4,sd2n:103.0,sd3n:99.9}],
  },
};

function buildChartData(child, tab) {
  const table=WHO_REF[child.gender][tab==="weight"?"weight":"height"], pts={};
  child.records.forEach(r=>{pts[r.month]=tab==="weight"?r.weight:r.height;});
  return table.map(s=>({age:`${s.age}m`,Child:pts[s.age]??null,Median:s.med,"-2SD":s.sd2n,"-3SD":s.sd3n}));
}

// ═══════════════════════════════════════════════════════════
// ICMR FOOD COMPOSITION TABLE (Indian foods)
// Source: ICMR-NIN Nutritive Value of Indian Foods (2017)
// Per 100g values: calories(kcal), protein(g), iron(mg),
//                  vitA(mcg), zinc(mg), calcium(mg)
// ═══════════════════════════════════════════════════════════
const ICMR_FOODS = [
  // Cereals
  {id:"rice",     name:"Rice (cooked)",     unit:"bowl(150g)", grams:150, cal:195, pro:4.0, iron:0.5, vitA:0,   zinc:0.8, cal2:10,  emoji:"🍚"},
  {id:"roti",     name:"Wheat Roti",        unit:"piece(30g)", grams:30,  cal:90,  pro:2.7, iron:0.9, vitA:0,   zinc:0.5, cal2:10,  emoji:"🫓"},
  {id:"idli",     name:"Idli",              unit:"piece(40g)", grams:40,  cal:58,  pro:2.0, iron:0.6, vitA:0,   zinc:0.3, cal2:8,   emoji:"🫓"},
  {id:"dosa",     name:"Dosa",              unit:"piece(50g)", grams:50,  cal:78,  pro:2.5, iron:0.7, vitA:0,   zinc:0.4, cal2:8,   emoji:"🫓"},
  {id:"upma",     name:"Upma (semolina)",   unit:"bowl(100g)", grams:100, cal:145, pro:4.0, iron:1.5, vitA:0,   zinc:0.7, cal2:15,  emoji:"🍲"},
  // Pulses / Protein
  {id:"dal",      name:"Dal (cooked)",      unit:"bowl(100g)", grams:100, cal:116, pro:7.6, iron:3.0, vitA:3,   zinc:1.0, cal2:30,  emoji:"🍲"},
  {id:"egg",      name:"Egg (whole)",       unit:"egg(50g)",   grams:50,  cal:77,  pro:6.3, iron:0.9, vitA:90,  zinc:0.6, cal2:25,  emoji:"🥚"},
  {id:"milk",     name:"Cow's Milk",        unit:"glass(200ml)",grams:200,cal:130, pro:6.6, iron:0.2, vitA:60,  zinc:0.8, cal2:240, emoji:"🥛"},
  {id:"curd",     name:"Curd / Yoghurt",   unit:"bowl(100g)", grams:100, cal:98,  pro:3.1, iron:0.2, vitA:28,  zinc:0.5, cal2:120, emoji:"🥛"},
  {id:"chicken",  name:"Chicken (cooked)", unit:"piece(60g)", grams:60,  cal:114, pro:14.4,iron:0.8, vitA:18,  zinc:1.4, cal2:8,   emoji:"🍗"},
  {id:"fish",     name:"Fish (cooked)",    unit:"piece(60g)", grams:60,  cal:78,  pro:13.2,iron:1.0, vitA:30,  zinc:0.8, cal2:30,  emoji:"🐟"},
  // Vegetables
  {id:"greens",   name:"Green Leafy Veg",  unit:"bowl(50g)",  grams:50,  cal:26,  pro:2.5, iron:2.5, vitA:265, zinc:0.3, cal2:190, emoji:"🥬"},
  {id:"carrot",   name:"Carrot",           unit:"medium(60g)",grams:60,  cal:25,  pro:0.6, iron:0.4, vitA:503, zinc:0.2, cal2:20,  emoji:"🥕"},
  {id:"tomato",   name:"Tomato",           unit:"medium(80g)",grams:80,  cal:18,  pro:0.9, iron:0.5, vitA:42,  zinc:0.2, cal2:10,  emoji:"🍅"},
  {id:"potato",   name:"Potato (boiled)",  unit:"medium(80g)",grams:80,  cal:77,  pro:1.6, iron:0.4, vitA:0,   zinc:0.3, cal2:8,   emoji:"🥔"},
  // Fruits
  {id:"banana",   name:"Banana",           unit:"medium(80g)",grams:80,  cal:73,  pro:0.9, iron:0.3, vitA:3,   zinc:0.2, cal2:5,   emoji:"🍌"},
  {id:"mango",    name:"Mango",            unit:"slice(80g)", grams:80,  cal:50,  pro:0.5, iron:0.2, vitA:383, zinc:0.1, cal2:11,  emoji:"🥭"},
  {id:"papaya",   name:"Papaya",           unit:"slice(80g)", grams:80,  cal:32,  pro:0.5, iron:0.2, vitA:204, zinc:0.1, cal2:24,  emoji:"🍊"},
  // Others
  {id:"peanut",   name:"Groundnut/Peanut", unit:"tbsp(15g)",  grams:15,  cal:85,  pro:3.8, iron:0.6, vitA:0,   zinc:0.6, cal2:12,  emoji:"🥜"},
  {id:"jaggery",  name:"Jaggery",          unit:"tsp(10g)",   grams:10,  cal:38,  pro:0.1, iron:2.8, vitA:0,   zinc:0.1, cal2:8,   emoji:"🟤"},
];

// ICMR RDA for children (per day) by age group
// Source: ICMR Recommended Dietary Allowances (2020)
function getRDA(ageMonths) {
  if (ageMonths <= 6)  return {cal:520,  pro:1.2,  iron:0,   vitA:350, zinc:2.8,  label:"0–6 mo"};
  if (ageMonths <= 12) return {cal:650,  pro:1.2,  iron:5,   vitA:350, zinc:2.8,  label:"6–12 mo"};
  if (ageMonths <= 36) return {cal:1000, pro:16.7, iron:9,   vitA:400, zinc:8.3,  label:"1–3 yr"};
  if (ageMonths <= 60) return {cal:1350, pro:20.1, iron:13,  vitA:400, zinc:11.0, label:"3–5 yr"};
  return                      {cal:1350, pro:20.1, iron:13,  vitA:400, zinc:11.0, label:"5 yr+"};
}

// Calculate daily nutrients from food intake
function calcNutrients(intake) {
  let cal=0, pro=0, iron=0, vitA=0, zinc=0;
  intake.forEach(({foodId, qty}) => {
    const f = ICMR_FOODS.find(x => x.id === foodId);
    if (!f) return;
    const factor = qty * f.grams / 100;
    cal  += f.cal  * factor;
    pro  += f.pro  * factor;
    iron += f.iron * factor;
    vitA += f.vitA * factor;
    zinc += f.zinc * factor;
  });
  return { cal:Math.round(cal), pro:+pro.toFixed(1), iron:+iron.toFixed(1), vitA:Math.round(vitA), zinc:+zinc.toFixed(1) };
}

// WHO growth velocity (weight gain per month) by age group
// Source: WHO Child Growth Standards — velocity tables
function getExpectedWeightGainPerMonth(ageMonths) {
  if (ageMonths <= 3)  return 0.90; // ~900g/month in first trimester
  if (ageMonths <= 6)  return 0.60;
  if (ageMonths <= 12) return 0.35;
  if (ageMonths <= 24) return 0.22;
  if (ageMonths <= 36) return 0.18;
  if (ageMonths <= 60) return 0.15;
  return 0.15;
}

// Predict future WAZ based on diet adequacy
// Logic: if calorie adequacy < 80% → growth faltering
//        80–100% → maintenance, 100%+ → catch-up growth
function predictGrowth(child, intake, months) {
  const last    = child.records[child.records.length - 1];
  const rda     = getRDA(last.month);
  const nuts    = calcNutrients(intake);
  const calAdequacy = rda.cal > 0 ? nuts.cal / rda.cal : 0;

  // Growth velocity multiplier based on diet quality
  const velocityFactor = calAdequacy < 0.5  ? 0.2
                       : calAdequacy < 0.7  ? 0.5
                       : calAdequacy < 0.85 ? 0.8
                       : calAdequacy < 1.0  ? 1.0
                       : 1.25; // catch-up growth if diet is adequate+

  const points = [];
  let currentWeight = last.weight;
  let currentAge    = last.month;

  for (let m = 1; m <= months; m++) {
    const expectedGain    = getExpectedWeightGainPerMonth(currentAge + m);
    const actualGain      = expectedGain * velocityFactor;
    currentWeight        += actualGain;
    const predictedWeight = currentWeight;
    const optimalWeight   = last.weight + (expectedGain * 1.15 * m);
    const futureAge       = currentAge + m;

    const predWAZ    = lmsZScore(predictedWeight, Math.min(futureAge, 60), child.gender, "weight");
    const optimalWAZ = lmsZScore(optimalWeight,   Math.min(futureAge, 60), child.gender, "weight");

    points.push({
      month: `+${m}mo`,
      "Current Diet WAZ": +predWAZ.toFixed(2),
      "Optimal Diet WAZ": +optimalWAZ.toFixed(2),
      "SAM Threshold":    -3,
      "MAM Threshold":    -2,
    });
  }
  return { points, calAdequacy, velocityFactor };
}

// Generate food gap recommendations
function getDietGaps(intake, ageMonths) {
  const nuts = calcNutrients(intake);
  const rda  = getRDA(ageMonths);
  const gaps = [];
  if (nuts.cal  < rda.cal  * 0.85) gaps.push({nutrient:"Energy",    got:nuts.cal,   need:rda.cal,   unit:"kcal", foods:"Rice, roti, banana, peanut",    severity:nuts.cal/rda.cal});
  if (nuts.pro  < rda.pro  * 0.85) gaps.push({nutrient:"Protein",   got:nuts.pro,   need:rda.pro,   unit:"g",    foods:"Dal, egg, milk, chicken, fish",  severity:nuts.pro/rda.pro});
  if (nuts.iron < rda.iron * 0.75) gaps.push({nutrient:"Iron",      got:nuts.iron,  need:rda.iron,  unit:"mg",   foods:"Green leafy veg, dal, jaggery",  severity:nuts.iron/rda.iron});
  if (nuts.vitA < rda.vitA * 0.75) gaps.push({nutrient:"Vitamin A", got:nuts.vitA,  need:rda.vitA,  unit:"mcg",  foods:"Carrot, mango, egg, green leaves",severity:nuts.vitA/rda.vitA});
  if (nuts.zinc < rda.zinc * 0.75) gaps.push({nutrient:"Zinc",      got:nuts.zinc,  need:rda.zinc,  unit:"mg",   foods:"Chicken, fish, dal, peanut",     severity:nuts.zinc/rda.zinc});
  return { gaps, nuts, rda };
}

// ── QR CODE (pure canvas, no library) ──────────────────────
// Draws a simple visual QR-like pattern for demo purposes
function drawQR(doc, text, x, y, size) {
  const modules = 21, cell = size / modules;
  // deterministic pattern from text hash
  let hash = 0;
  for (let i = 0; i < text.length; i++) hash = ((hash << 5) - hash + text.charCodeAt(i)) | 0;
  // border + finder patterns
  doc.setFillColor(0,59,115);
  // outer border
  doc.rect(x, y, size, size, "F");
  doc.setFillColor(255,255,255);
  doc.rect(x+cell, y+cell, size-cell*2, size-cell*2, "F");
  // finder squares (top-left, top-right, bottom-left)
  [[0,0],[0,14],[14,0]].forEach(([r,c])=>{
    doc.setFillColor(0,59,115);
    doc.rect(x+c*cell, y+r*cell, 7*cell, 7*cell, "F");
    doc.setFillColor(255,255,255);
    doc.rect(x+c*cell+cell, y+r*cell+cell, 5*cell, 5*cell, "F");
    doc.setFillColor(0,59,115);
    doc.rect(x+c*cell+2*cell, y+r*cell+2*cell, 3*cell, 3*cell, "F");
  });
  // data modules
  for (let r = 0; r < modules; r++) {
    for (let c = 0; c < modules; c++) {
      if ((r<8&&c<8)||(r<8&&c>12)||(r>12&&c<8)) continue;
      const bit = ((hash ^ (r*modules+c)*2654435761) >>> 0) % 2;
      if (bit) {
        doc.setFillColor(0,59,115);
        doc.rect(x+c*cell, y+r*cell, cell, cell, "F");
      }
    }
  }
}

// ── DRAW NUTRIENT BAR in PDF ────────────────────────────────
function drawNutrientBar(doc, label, got, need, unit, color, x, y, w) {
  const pct  = Math.min(1, need > 0 ? got / need : 0);
  const ok   = pct >= 0.85;
  const barH = 5, labelW = 28, valW = 32;
  const barW = w - labelW - valW - 6;

  doc.setFontSize(8); doc.setFont("helvetica","bold");
  doc.setTextColor(ok ? 30 : 176, ok ? 132 : 58, ok ? 73 : 46);
  doc.text(label, x, y + barH - 1);

  // background bar
  doc.setFillColor(220,228,236);
  doc.roundedRect(x+labelW, y, barW, barH, 1, 1, "F");
  // filled bar
  const rgb = ok ? [30,132,73] : [176,58,46];
  doc.setFillColor(...rgb);
  doc.roundedRect(x+labelW, y, barW*pct, barH, 1, 1, "F");

  // value text
  doc.setFontSize(7); doc.setFont("helvetica","normal");
  doc.setTextColor(60,81,102);
  doc.text(`${got}${unit}/${need}${unit}`, x+labelW+barW+3, y+barH-1);
}

// ── INDIVIDUAL CHILD PDF (upgraded) ────────────────────────
function generateChildPDF(child, grade, waz, haz, dietData) {
  const doc  = new jsPDF();
  const cfg  = GRADE_CFG[grade] ?? GRADE_CFG["Normal"];
  const last = child.records[child.records.length - 1];
  const rda  = getRDA(last.month);

  // ── PAGE 1 HEADER ──
  doc.setFillColor(0,59,115); doc.rect(0,0,210,38,"F");
  doc.setFillColor(0,80,158); doc.rect(0,34,210,4,"F");
  doc.setTextColor(255,255,255);
  doc.setFontSize(15); doc.setFont("helvetica","bold");
  doc.text("NutriGrid - Child Nutritional Assessment Report",14,13);
  doc.setFontSize(8.5); doc.setFont("helvetica","normal");
  doc.text("Coimbatore District ICDS  |  March 2026  |  WHO LMS Box-Cox Algorithm (2006)",14,22);
  doc.text("Jansons Institute of Technology  |  Niral Thiruvizha 3.0",14,30);

  // ── GRADE BADGE (coloured box top-right) ──
  const gc = grade==="SAM"?[176,58,46]:grade==="MAM"?[202,111,30]:[30,132,73];
  doc.setFillColor(...gc);
  doc.roundedRect(148,4,48,30,3,3,"F");
  doc.setTextColor(255,255,255);
  doc.setFontSize(16); doc.setFont("helvetica","bold");
  doc.text(grade, 172, 17, {align:"center"});
  doc.setFontSize(7); doc.setFont("helvetica","normal");
  doc.text(cfg.full.replace("Acute ",""), 172, 26, {align:"center"});
  doc.text("WHO LMS Grade", 172, 31, {align:"center"});

  // ── CHILD INFO + QR side by side ──
  doc.setTextColor(10,10,26);
  doc.setFontSize(11); doc.setFont("helvetica","bold");
  doc.text("Child Information",14,50);

  autoTable(doc,{startY:54, margin:{right:52},
    head:[["Field","Details"]],
    body:[
      ["Name",           child.name],
      ["Age",            `${last.month} months (${(last.month/12).toFixed(1)} years)`],
      ["Sex",            child.gender==="boys"?"Male":"Female"],
      ["Block / Village",child.village],
      ["Weight",         `${last.weight} kg`],
      ["Height",         `${last.height} cm`],
      ["WAZ",            `${waz.toFixed(3)}  (${waz<-3?"Below -3 SD":waz<-2?"Below -2 SD":"Within normal"})`],
      ["HAZ",            `${haz.toFixed(3)}  (${haz<-3?"Severe stunting":haz<-2?"Moderate stunting":"Normal height"})`],
      ["WHO Grade",      `${grade} - ${cfg.full}`],
      ["Algorithm",      "WHO LMS Box-Cox Z-score  |  ICDS Standard"],
    ],
    headStyles:{fillColor:[0,59,115],fontSize:8},
    bodyStyles:{fontSize:8},
    alternateRowStyles:{fillColor:[240,244,248]},
  });

  // QR code
  drawQR(doc, `nutrigrid-child-${child.id}-${child.name}`, 158, 54, 36);
  doc.setFontSize(6.5); doc.setTextColor(120,140,160); doc.setFont("helvetica","normal");
  doc.text("Scan for digital record", 176, 94, {align:"center"});

  // ── WHO THRESHOLDS BOX ──
  let y = doc.lastAutoTable.finalY + 10;
  doc.setFillColor(235,243,251); doc.roundedRect(14, y, 182, 18, 2, 2, "F");
  doc.setDrawColor(194,220,245); doc.roundedRect(14, y, 182, 18, 2, 2, "S");
  doc.setTextColor(0,59,115); doc.setFontSize(8); doc.setFont("helvetica","bold");
  doc.text("WHO Classification Reference:", 18, y+7);
  doc.setFont("helvetica","normal"); doc.setFontSize(7.5);
  doc.text("SAM: WAZ < -3 SD  |  MAM: WAZ -3 to -2 SD  |  Normal: WAZ >= -2 SD  |  Stunting: HAZ < -2 SD", 18, y+14);
  y += 24;

  // ── GROWTH HISTORY TABLE ──
  doc.setFontSize(11); doc.setFont("helvetica","bold"); doc.setTextColor(10,10,26);
  doc.text("Growth History & Z-Score Trend",14,y);
  autoTable(doc,{startY:y+4,
    head:[["Visit","Weight","Height","WAZ","HAZ","Grade","Status"]],
    body: child.records.map(r=>{
      const rW=lmsZScore(r.weight,r.month,child.gender,"weight");
      const rH=lmsZScore(r.height,r.month,child.gender,"height");
      const rG=classifyChild(rW,rH);
      const trend=rW<-3?"[!] Critical":rW<-2?"[v] Deficit":"[ok] Normal";
      return [`${r.month} mo`,`${r.weight} kg`,`${r.height} cm`,rW.toFixed(2),rH.toFixed(2),rG,trend];
    }),
    headStyles:{fillColor:[0,59,115],fontSize:7.5},
    bodyStyles:{fontSize:7.5},
    alternateRowStyles:{fillColor:[240,244,248]},
    columnStyles:{3:{fontStyle:"bold"},4:{fontStyle:"bold"},6:{fontStyle:"bold"}},
  });
  y = doc.lastAutoTable.finalY;

  // ── VISUAL WAZ TREND (mini sparkline using lines) ──
  if (child.records.length >= 2 && y < 220) {
    y += 8;
    doc.setFontSize(9); doc.setFont("helvetica","bold"); doc.setTextColor(10,10,26);
    doc.text("WAZ Trend Visualization",14,y);
    y += 4;
    const chartX=14, chartY=y, chartW=182, chartH=28;
    doc.setFillColor(244,247,251); doc.rect(chartX,chartY,chartW,chartH,"F");
    doc.setDrawColor(208,217,228); doc.rect(chartX,chartY,chartW,chartH,"S");
    const wazToY=(w)=>{ const mn=-5,mx=1; return chartY+chartH-(((w-mn)/(mx-mn))*chartH); };
    // SAM threshold line
    doc.setDrawColor(176,58,46); doc.setLineDashPattern([2,1],0);
    const y3=wazToY(-3); doc.line(chartX,y3,chartX+chartW,y3);
    // MAM threshold line
    const y2=wazToY(-2); doc.setDrawColor(202,111,30); doc.line(chartX,y2,chartX+chartW,y2);
    doc.setLineDashPattern([],0);
    // child WAZ line
    doc.setDrawColor(0,80,158); doc.setLineWidth(0.8);
    const pts=child.records.map((r,i)=>({
      x: chartX + (i/(child.records.length-1))*chartW,
      y: wazToY(lmsZScore(r.weight,r.month,child.gender,"weight")),
    }));
    for(let i=0;i<pts.length-1;i++) doc.line(pts[i].x,pts[i].y,pts[i+1].x,pts[i+1].y);
    pts.forEach(p=>{ doc.setFillColor(0,80,158); doc.circle(p.x,p.y,1,"F"); });
    doc.setLineWidth(0.2);
    // ASCII-safe labels
    doc.setFontSize(6); doc.setTextColor(176,58,46); doc.text("SAM -3SD",chartX+2,y3-1);
    doc.setTextColor(202,111,30); doc.text("MAM -2SD",chartX+2,y2-1);
    // age labels on x-axis
    doc.setTextColor(100,120,140);
    child.records.forEach((r,i)=>{
      const px=chartX+(i/(child.records.length-1))*chartW;
      doc.text(`${r.month}m`,px-3,chartY+chartH+5);
    });
    y = chartY + chartH + 10;
  }

  // ── PAGE 2 if needed - Clinical Recommendations ──
  if (y > 230) { doc.addPage(); y = 20; }

  doc.setFontSize(11); doc.setFont("helvetica","bold"); doc.setTextColor(10,10,26);
  doc.text(`Clinical Recommendations - ${grade} (${cfg.full})`,14,y+6); y+=10;
  autoTable(doc,{startY:y,
    head:[["#","Action Required"]],
    body:(CLINICAL_RECS[grade]??[]).map((r,i)=>[(i+1).toString(),r]),
    headStyles:{fillColor:[0,59,115],fontSize:8},
    bodyStyles:{fontSize:8},
    alternateRowStyles:{fillColor:[240,244,248]},
  });
  y = doc.lastAutoTable.finalY + 10;

  // ── DIET & NUTRITION SECTION ──
  if (dietData && dietData.intake && dietData.intake.length > 0) {
    if (y > 210) { doc.addPage(); y = 20; }
    const nuts = calcNutrients(dietData.intake);

    doc.setFontSize(11); doc.setFont("helvetica","bold"); doc.setTextColor(10,10,26);
    doc.text("Daily Diet Assessment",14,y); y+=6;

    // Food intake table
    autoTable(doc,{startY:y,
      head:[["Food Item","Unit","Qty","Calories","Protein","Iron","Vit-A","Zinc"]],
      body: dietData.intake.map(({foodId,qty})=>{
        const f=ICMR_FOODS.find(x=>x.id===foodId);
        if(!f) return [];
        const factor=qty*f.grams/100;
        return [f.name,f.unit,`x${qty}`,(f.cal*factor).toFixed(0)+"kcal",(f.pro*factor).toFixed(1)+"g",(f.iron*factor).toFixed(1)+"mg",(f.vitA*factor).toFixed(0)+"mcg",(f.zinc*factor).toFixed(1)+"mg"];
      }).filter(r=>r.length>0),
      headStyles:{fillColor:[0,123,131],fontSize:7},
      bodyStyles:{fontSize:7},
      alternateRowStyles:{fillColor:[224,245,245]},
    });
    y = doc.lastAutoTable.finalY + 8;

    // Nutrient adequacy bars
    if (y > 220) { doc.addPage(); y = 20; }
    doc.setFontSize(10); doc.setFont("helvetica","bold"); doc.setTextColor(10,10,26);
    doc.text("Nutrient Adequacy vs ICMR RDA",14,y); y+=6;

    const barDefs=[
      {label:"Energy",  got:nuts.cal,  need:rda.cal,  unit:"kcal",col:[0,80,158]},
      {label:"Protein", got:nuts.pro,  need:rda.pro,  unit:"g",   col:[0,123,131]},
      {label:"Iron",    got:nuts.iron, need:rda.iron, unit:"mg",  col:[202,111,30]},
      {label:"Vit-A",   got:nuts.vitA, need:rda.vitA, unit:"mcg", col:[142,68,173]},
      {label:"Zinc",    got:nuts.zinc, need:rda.zinc, unit:"mg",  col:[30,132,73]},
    ];
    barDefs.forEach((b,i)=>{
      drawNutrientBar(doc,b.label,b.got,b.need,b.unit,b.col,14,y+(i*9),182);
    });
    y += barDefs.length * 9 + 8;

    // Forecast summary
    if (dietData.forecast && y < 240) {
      if (y > 220) { doc.addPage(); y = 20; }
      doc.setFontSize(10); doc.setFont("helvetica","bold"); doc.setTextColor(10,10,26);
      doc.text(`Growth Forecast - ${dietData.horizon}-Month Prediction`,14,y); y+=5;

      const adeqPct = Math.round(dietData.forecast.calAdequacy*100);
      const adeqOk  = adeqPct >= 85;
      doc.setFillColor(adeqOk?233:253, adeqOk?247:237, adeqOk?239:236);
      doc.roundedRect(14,y,182,16,2,2,"F");
      doc.setFontSize(8); doc.setFont("helvetica","bold");
      doc.setTextColor(adeqOk?30:176,adeqOk?132:58,adeqOk?73:46);
      doc.text(`Calorie Adequacy: ${adeqPct}%  |  Growth Velocity Factor: ${(dietData.forecast.velocityFactor*100).toFixed(0)}%`,18,y+7);
      doc.setFont("helvetica","normal"); doc.setFontSize(7.5); doc.setTextColor(60,81,102);
      doc.text(adeqOk?"Diet meets ICMR RDA - child on track for normal growth trajectory":"Diet below ICMR RDA - growth faltering risk - see food gap recommendations below",18,y+13);
      y += 22;

      autoTable(doc,{startY:y,
        head:[["Month","Current Diet WAZ","Optimal Diet WAZ","SAM Line","MAM Line","Projected Grade"]],
        body: dietData.forecast.points.map(p=>{
          const projG=classifyChild(p["Current Diet WAZ"],-1.5);
          return [p.month, p["Current Diet WAZ"].toFixed(2), p["Optimal Diet WAZ"].toFixed(2), "-3.0", "-2.0", projG];
        }),
        headStyles:{fillColor:[0,59,115],fontSize:7},
        bodyStyles:{fontSize:7.5},
        alternateRowStyles:{fillColor:[240,244,248]},
        columnStyles:{1:{fontStyle:"bold"},2:{fontStyle:"bold",textColor:[30,132,73]}},
      });
      y = doc.lastAutoTable.finalY + 8;
    }

    // Food gap recommendations
    if (y < 250) {
      if (y > 230) { doc.addPage(); y = 20; }
      const {gaps} = getDietGaps(dietData.intake, last.month);
      doc.setFontSize(10); doc.setFont("helvetica","bold"); doc.setTextColor(10,10,26);
      doc.text("Food Gap Recommendations",14,y); y+=5;
      if (gaps.length === 0) {
        doc.setFillColor(233,247,239); doc.roundedRect(14,y,182,14,2,2,"F");
        doc.setFontSize(8); doc.setFont("helvetica","bold"); doc.setTextColor(30,132,73);
        doc.text("[ok] All nutrient targets met - continue current diet",18,y+9);
        y+=18;
      } else {
        autoTable(doc,{startY:y,
          head:[["Nutrient","Got","RDA","Gap %","Recommended Foods"]],
          body:gaps.map(g=>[g.nutrient,`${g.got}${g.unit}`,`${g.need}${g.unit}`,`${Math.round(g.severity*100)}%`,g.foods]),
          headStyles:{fillColor:[176,58,46],fontSize:7},
          bodyStyles:{fontSize:7},
          alternateRowStyles:{fillColor:[253,237,236]},
        });
        y = doc.lastAutoTable.finalY + 8;
      }
    }
  }

  // ── FOOTER every page ──
  const pageCount = doc.internal.getNumberOfPages();
  for (let i=1;i<=pageCount;i++) {
    doc.setPage(i);
    doc.setFillColor(0,59,115); doc.rect(0,287,210,10,"F");
    doc.setFontSize(6.5); doc.setTextColor(255,255,255); doc.setFont("helvetica","normal");
    doc.text(`NutriGrid  |  WHO Child Growth Standards (2006)  |  ICMR-NIN Food Composition (2017)  |  Niral Thiruvizha 3.0  |  Page ${i}/${pageCount}`,14,293);
  }

  doc.save(`NutriGrid_${child.name.replace(/ /g,"_")}_Report.pdf`);
}

const INIT_CHILDREN = [
  {id:1,name:"Aarav Kumar",  age:24,gender:"boys", village:"Block A",records:[{month:0,weight:3.2,height:49.5},{month:6,weight:6.8,height:64.0},{month:12,weight:8.5,height:72.0},{month:18,weight:9.8,height:78.0},{month:24,weight:10.9,height:83.0}]},
  {id:2,name:"Priya Selvi",  age:36,gender:"girls",village:"Block B",records:[{month:0,weight:2.8,height:47.5},{month:6,weight:5.2,height:61.0},{month:12,weight:6.8,height:69.0},{month:18,weight:8.0,height:75.0},{month:24,weight:9.0,height:81.0},{month:30,weight:10.0,height:87.0},{month:36,weight:11.2,height:91.5}]},
  {id:3,name:"Rajan Murugan",age:18,gender:"boys", village:"Block A",records:[{month:0,weight:2.4,height:46.0},{month:6,weight:5.8,height:63.0},{month:12,weight:7.2,height:70.0},{month:18,weight:7.5,height:74.0}]},
  {id:4,name:"Meena Devi",   age:48,gender:"girls",village:"Block C",records:[{month:0,weight:3.1,height:49.0},{month:12,weight:9.2,height:73.5},{month:24,weight:11.8,height:85.0},{month:36,weight:13.9,height:94.0},{month:48,weight:16.1,height:102.5}]},
];

const DEMO_USERS = [
  {id:"aw1",name:"Kavitha S.",  role:"Anganwadi Worker",block:"Block A, Coimbatore",emoji:"👩‍⚕️"},
  {id:"co1",name:"Dr. Meenakshi",role:"CDPO Officer",  block:"District HQ",       emoji:"👩‍💼"},
];

const NAV=[
  {id:"dashboard",label:"Dashboard",  Icon:LayoutDashboard},
  {id:"children", label:"Children",   Icon:Users},
  {id:"add",      label:"Add Record", Icon:PlusCircle},
  {id:"analytics",label:"Analytics",  Icon:BarChart2},
];

const CS={tooltip:{contentStyle:{background:"#fff",border:"1px solid #D0D9E4",borderRadius:4,fontSize:12,fontFamily:"IBM Plex Sans",boxShadow:"0 2px 8px rgba(0,40,80,0.10)"}},grid:"#E8EDF3",axis:{fontSize:11,fill:"#7A92A8",fontFamily:"IBM Plex Sans"}};

function generatePDF(children, grades) {
  const doc=new jsPDF();
  doc.setFillColor(0,59,115);doc.rect(0,0,210,34,"F");
  doc.setFillColor(0,80,158);doc.rect(0,30,210,4,"F");
  doc.setTextColor(255,255,255);doc.setFontSize(16);doc.setFont("helvetica","bold");
  doc.text("NutriGrid - ICDS Nutritional Assessment Report",14,14);
  doc.setFontSize(8.5);doc.setFont("helvetica","normal");
  doc.text("Coimbatore District  |  March 2026  |  WHO LMS Box-Cox Algorithm  |  SAM/MAM Classification",14,24);
  const total=children.length,sam=children.filter(c=>grades[c.id]==="SAM").length,mam=children.filter(c=>grades[c.id]==="MAM").length,normal=children.filter(c=>grades[c.id]==="Normal").length,gam=sam+mam;
  doc.setTextColor(10,10,26);doc.setFontSize(12);doc.setFont("helvetica","bold");
  doc.text("Programme Indicators",14,46);
  autoTable(doc,{startY:50,head:[["Indicator","Count","Rate","WHO Threshold"]],body:[["Total Assessed",total,"100%","—"],["Normal",normal,`${Math.round(normal/total*100)}%`,"Target ≥75%"],["GAM (MAM+SAM)",gam,`${Math.round(gam/total*100)}%`,"Emergency >15%"],["MAM",mam,`${Math.round(mam/total*100)}%`,"Alert >10%"],["SAM",sam,`${Math.round(sam/total*100)}%`,"Emergency >2%"]],headStyles:{fillColor:[0,59,115]},alternateRowStyles:{fillColor:[240,244,248]}});
  doc.setFontSize(12);doc.setFont("helvetica","bold");
  doc.text("Individual Records",14,doc.lastAutoTable.finalY+12);
  autoTable(doc,{startY:doc.lastAutoTable.finalY+16,head:[["Name","Age","Sex","Block","Wt(kg)","Ht(cm)","WAZ","HAZ","WHO Grade"]],body:children.map(c=>{const last=c.records[c.records.length-1];return [c.name,last.month,c.gender==="boys"?"M":"F",c.village,`${last.weight}`,`${last.height}`,lmsZScore(last.weight,last.month,c.gender,"weight").toFixed(2),lmsZScore(last.height,last.month,c.gender,"height").toFixed(2),grades[c.id]??"—"];}),headStyles:{fillColor:[0,59,115],fontSize:8},bodyStyles:{fontSize:8},alternateRowStyles:{fillColor:[240,244,248]}});
  doc.setFontSize(7.5);doc.setTextColor(120,140,160);
  doc.text("WHO LMS Box-Cox z-score  |  SAM: WAZ/HAZ<-3  |  MAM: -3 to -2  |  NutriGrid ICDS System  |  Niral Thiruvizha 3.0",14,284);
  doc.save("NutriGrid_ICDS_Report.pdf");
}

// LOGIN
function LoginPage({onLogin}) {
  const [sel,setSel]=useState("aw1");
  const handleLogin=()=>{const u=DEMO_USERS.find(u=>u.id===sel);if(u)onLogin(u);};
  return (
    <div className="login-page">
      <div className="login-grid"/>
      <div className="login-card">
        <div className="login-header">
          <div className="login-logo">
            <div className="login-logo-icon">🌱</div>
            <div><div className="login-logo-text">NutriGrid</div><div className="login-logo-sub">ICDS Monitoring System</div></div>
          </div>
          <div className="login-header-tag"><strong>Coimbatore District · ICDS Programme</strong><br/>WHO LMS Algorithm · v2.0</div>
        </div>
        <div className="login-body">
          <div className="login-title">Sign in to NutriGrid</div>
          <div className="login-sub">Select your role to access the ICDS dashboard</div>
          <div className="demo-users">
            <div className="demo-label">Demo Accounts — Click to Select</div>
            {DEMO_USERS.map(u=>(
              <div key={u.id} className="demo-user-row" onClick={()=>setSel(u.id)} style={sel===u.id?{borderColor:"#00509E",background:"#EBF3FB"}:{}}>
                <div style={{display:"flex",alignItems:"center",gap:10}}>
                  <span style={{fontSize:22}}>{u.emoji}</span>
                  <div className="demo-user-info"><strong>{u.name}</strong><span>{u.role} · {u.block}</span></div>
                </div>
                <span className="demo-user-badge">{sel===u.id?"✓ SELECTED":"SELECT"}</span>
              </div>
            ))}
          </div>
          <button className="login-btn" onClick={handleLogin}><LogIn size={15}/> Access Dashboard</button>
          <div className="login-footer-note">🔒 Demo system · Niral Thiruvizha 3.0 · Jansons Institute of Technology</div>
        </div>
      </div>
    </div>
  );
}

// LANDING
function LandingPage({onLogin}) {
  const grades=[
    {code:"SAM",name:"Severe Acute Malnutrition",  desc:"WAZ or HAZ < −3 SD. Immediate NRC referral, RUTF protocol.",bg:"#FDEDEC",border:"#F1948A",col:"#B03A2E"},
    {code:"MAM",name:"Moderate Acute Malnutrition", desc:"WAZ or HAZ −3 to −2 SD. SNP enrolment, RUSF supplementation.",bg:"#FEF5E7",border:"#F0B27A",col:"#CA6F1E"},
    {code:"GAM",name:"Global Acute Malnutrition",   desc:"Combined SAM+MAM. WHO emergency threshold >15%.",bg:"#FEFDE7",border:"#F7DC6F",col:"#D4AC0D"},
    {code:"Normal",name:"Normal Nutritional Status",desc:"WAZ ≥ −2 and HAZ ≥ −2. Routine monthly monitoring.",bg:"#E9F7EF",border:"#82E0AA",col:"#1E8449"},
  ];
  const features=[
    {Icon:Brain,      col:"#00509E",bg:"#EBF3FB",title:"WHO LMS Algorithm",       desc:"Official Box-Cox z-score method — same standard used by UNICEF, NRC centres, and India's NHM"},
    {Icon:HeartPulse, col:"#007B83",bg:"#E0F5F5",title:"SAM/MAM Clinical Grading",desc:"4-level classification with WHO-aligned RUTF/SNP intervention protocols"},
    {Icon:Bell,       col:"#B03A2E",bg:"#FDEDEC",title:"Priority Alert System",   desc:"SAM cases auto-escalated with NRC referral; MAM enrolled in SNP automatically"},
    {Icon:ClipboardList,col:"#CA6F1E",bg:"#FEF5E7",title:"ICDS PDF Reports",     desc:"Monthly district report with GAM/SAM/MAM rates vs WHO emergency thresholds"},
    {Icon:Wifi,       col:"#00509E",bg:"#EBF3FB",title:"PWA — Install & Offline",  desc:"Install on any device. Works without internet — built for rural Anganwadi centres"},
    {Icon:Shield,     col:"#1E8449",bg:"#E9F7EF",title:"Role-Based Login",        desc:"Separate access for Anganwadi Workers and CDPO Officers"},
  ];
  const steps=[
    {n:"01",title:"Login",          desc:"Worker or CDPO Officer signs in with their role credentials"},
    {n:"02",title:"Measure Child",  desc:"Enter weight and height — WHO LMS z-score computed instantly"},
    {n:"03",title:"Clinical Grade", desc:"System classifies SAM/MAM/Normal with UNICEF-standard protocol"},
    {n:"04",title:"Report & Refer", desc:"PDF for ICDS submission; SAM cases automatically flagged for NRC"},
  ];
  return (
    <div className="landing">
      <nav className="land-nav">
        <div className="land-logo"><div className="land-logo-icon">🌱</div><div><div className="land-logo-text">NutriGrid</div><div className="land-logo-sub">WHO LMS · ICDS System</div></div></div>
        <div className="land-nav-links">
          <span className="land-nav-link">Features</span>
          <span className="land-nav-link">WHO Grading</span>
          <button className="hero-btn-primary" onClick={onLogin} style={{padding:"8px 20px",fontSize:13}}>Sign In <ArrowRight size={13}/></button>
        </div>
      </nav>
      <section className="land-hero">
        <div className="hero-grid-overlay"/>
        <div className="hero-inner">
          <div>
            <div className="hero-flag"><span style={{width:8,height:8,borderRadius:"50%",background:"#4ADE80",display:"inline-block"}}/>Niral Thiruvizha 3.0 · Jansons Institute of Technology</div>
            <h1 className="hero-title">WHO-Standard SAM/MAM<br/>Detection for<br/><span className="accent">Anganwadi Centres</span></h1>
            <p className="hero-sub">NutriGrid implements the WHO official LMS Box-Cox z-score algorithm — the same method used by UNICEF, India NHM, and NRC centres — to classify SAM, MAM, and GAM with clinical precision.</p>
            <div className="hero-cta">
              <button className="hero-btn-primary" onClick={onLogin}>Sign In to System <ArrowRight size={14}/></button>
              <button className="hero-btn-outline">WHO LMS Reference</button>
            </div>
            <div className="hero-stats-strip">
              {[{val:"13.9L+",lbl:"Anganwadi Centres"},{val:"8.1Cr+",lbl:"Children Covered"},{val:"35.5%",lbl:"GAM Prevalence"}].map(s=>(
                <div className="hero-stat" key={s.lbl}><div className="hero-stat-val">{s.val}</div><div className="hero-stat-lbl">{s.lbl}</div></div>
              ))}
            </div>
          </div>
          <div className="hero-mockup">
            <div className="mockup-topbar"><div className="mockup-dot"/><div className="mockup-dot"/><div className="mockup-dot"/><span className="mockup-title">NutriGrid</span><span className="mockup-badge">WHO LMS</span></div>
            <div className="mockup-body">
              <div className="mockup-stat-row">
                <div className="mockup-stat-card"><div className="mockup-stat-val" style={{color:"#00509E"}}>4</div><div className="mockup-stat-lbl">Registered</div></div>
                <div className="mockup-stat-card"><div className="mockup-stat-val" style={{color:"#B03A2E"}}>2</div><div className="mockup-stat-lbl">SAM Cases</div></div>
              </div>
              <div className="mockup-table-hdr">Priority — SAM Cases</div>
              {[{name:"Aarav Kumar",grade:"SAM",sc:"#B03A2E",sb:"#FDEDEC"},{name:"Priya Selvi",grade:"SAM",sc:"#B03A2E",sb:"#FDEDEC"},{name:"Rajan M.",grade:"MAM",sc:"#CA6F1E",sb:"#FEF5E7"}].map(r=>(
                <div className="mockup-row" key={r.name}><span className="mockup-name">{r.name}</span><span className="mockup-grade" style={{color:r.sc,background:r.sb,border:`1px solid ${r.sc}40`}}>{r.grade}</span></div>
              ))}
            </div>
          </div>
        </div>
      </section>
      <section className="land-section alt">
        <div className="land-section-head"><div className="land-section-flag">Clinical Classification</div><h2 className="land-section-title">WHO-UNICEF Standard Grading</h2><p className="land-section-sub">Every child classified using the official WHO LMS Box-Cox method — not just thresholds, but the actual statistical model used in global nutrition programmes</p></div>
        <div className="grade-legend">
          {grades.map(g=>(
            <div key={g.code} className="grade-legend-card" style={{background:g.bg,borderColor:g.border,borderLeftColor:g.col}}>
              <div className="grade-legend-code" style={{color:g.col}}>{g.code}</div>
              <div className="grade-legend-name" style={{color:g.col}}>{g.name}</div>
              <div className="grade-legend-desc" style={{color:g.col}}>{g.desc}</div>
            </div>
          ))}
        </div>
      </section>
      <section className="land-section">
        <div className="land-section-head"><div className="land-section-flag">Capabilities</div><h2 className="land-section-title">Built to clinical and ICDS programme standards</h2></div>
        <div className="feature-grid">
          {features.map(f=>(
            <div className="feature-card" key={f.title} style={{borderTopColor:f.col}}>
              <div className="feature-icon-wrap" style={{background:f.bg}}><f.Icon size={20} color={f.col}/></div>
              <div className="feature-title">{f.title}</div>
              <div className="feature-desc">{f.desc}</div>
            </div>
          ))}
        </div>
      </section>
      <section className="land-section alt">
        <div className="land-section-head"><div className="land-section-flag">Workflow</div><h2 className="land-section-title">4-step clinical assessment workflow</h2></div>
        <div className="steps-row">
          {steps.map(s=>(<div className="step-card" key={s.n}><div className="step-num">{s.n}</div><div className="step-title">{s.title}</div><div className="step-desc">{s.desc}</div></div>))}
        </div>
      </section>
      <section className="land-cta">
        <div className="land-cta-inner">
          <h2>Explore NutriGrid Live</h2>
          <p>Sign in with a demo account — register children, view WHO growth charts, classify SAM/MAM, and generate ICDS-formatted reports instantly.</p>
          <button className="hero-btn-primary" onClick={onLogin} style={{fontSize:14,padding:"12px 28px"}}><LogIn size={15}/> Sign In to System</button>
        </div>
      </section>
      <footer className="land-footer">
        <div className="land-footer-left">🌱 NutriGrid v2.0 · WHO LMS Algorithm · Niral Thiruvizha 3.0 · Jansons Institute of Technology, Coimbatore</div>
        <div className="land-footer-right">Mohanapriya S · Gayathri M · Lavanya B · Bharath M · Guide: Mrs. Vidhya Gowri V</div>
      </footer>
    </div>
  );
}

// DASHBOARD
function Dashboard({children,grades,stats,goDetail}) {
  const trendData=[{month:"Oct",normal:18,gam:6},{month:"Nov",normal:16,gam:8},{month:"Dec",normal:15,gam:9},{month:"Jan",normal:14,gam:10},{month:"Feb",normal:13,gam:11},{month:"Mar",normal:stats.normal,gam:stats.sam+stats.mam}];
  const gamRate=stats.total>0?Math.round((stats.sam+stats.mam)/stats.total*100):0;
  return (
    <>
      {stats.sam>0&&(<div className="alert-critical"><AlertTriangle size={18} color="#B03A2E" style={{flexShrink:0,marginTop:1}}/><div><h4>SAM Alert — {stats.sam} Severe Acute Malnutrition Case{stats.sam>1?"s":""} — NRC Referral Required</h4><p>GAM rate: {gamRate}% · {stats.mam} MAM case{stats.mam!==1?"s":""} on SNP · Immediate action per ICDS protocol</p></div></div>)}
      <div className="stat-grid">
        {[
          {label:"Total Registered",value:stats.total,Icon:Baby,         col:"#00509E",bg:"#EBF3FB",top:"#00509E",note:"+2 this month"},
          {label:"Normal",          value:stats.normal,Icon:CheckCircle, col:"#1E8449",bg:"#E9F7EF",top:"#1E8449",note:"WAZ/HAZ ≥ −2 SD"},
          {label:"MAM Cases",       value:stats.mam,  Icon:AlertTriangle,col:"#CA6F1E",bg:"#FEF5E7",top:"#CA6F1E",note:"WAZ/HAZ −3 to −2"},
          {label:"SAM Cases",       value:stats.sam,  Icon:Zap,          col:"#B03A2E",bg:"#FDEDEC",top:"#B03A2E",note:"WAZ/HAZ < −3 SD"},
        ].map(s=>(<div className="stat-card" key={s.label} style={{borderTopColor:s.top}}><div className="stat-top"><div><div className="stat-value" style={{color:s.col}}>{s.value}</div><div className="stat-label">{s.label}</div></div><div className="stat-icon" style={{background:s.bg}}><s.Icon size={18} color={s.col}/></div></div><div className="stat-change" style={{background:s.bg,color:s.col,fontFamily:"IBM Plex Mono",fontSize:10}}>{s.note}</div></div>))}
      </div>
      <div style={{display:"grid",gridTemplateColumns:"1fr 280px",gap:14,marginBottom:14}}>
        <div className="card">
          <div className="card-header"><div><div className="card-title">GAM Trend — 6 Months</div><div className="card-subtitle">Global Acute Malnutrition vs Normal</div></div></div>
          <div className="card-body">
            <ResponsiveContainer width="100%" height={155}>
              <AreaChart data={trendData} margin={{left:-20,right:10}}>
                <defs>
                  <linearGradient id="gn" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor="#1E8449" stopOpacity={0.15}/><stop offset="95%" stopColor="#1E8449" stopOpacity={0}/></linearGradient>
                  <linearGradient id="gg" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor="#B03A2E" stopOpacity={0.15}/><stop offset="95%" stopColor="#B03A2E" stopOpacity={0}/></linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke={CS.grid}/><XAxis dataKey="month" tick={CS.axis}/><YAxis tick={CS.axis} allowDecimals={false}/><Tooltip {...CS.tooltip}/><Legend wrapperStyle={{fontSize:12,fontFamily:"IBM Plex Sans"}}/>
                <Area type="monotone" dataKey="normal" name="Normal" stroke="#1E8449" fill="url(#gn)" strokeWidth={2}/>
                <Area type="monotone" dataKey="gam" name="GAM" stroke="#B03A2E" fill="url(#gg)" strokeWidth={2}/>
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>
        <div className="card">
          <div className="card-header"><div><div className="card-title">WHO Classification</div></div></div>
          <div className="card-body">
            {[{k:"Algorithm",v:"WHO LMS Box-Cox"},{k:"WAZ < −3",v:"SAM → NRC"},{k:"WAZ −3→−2",v:"MAM → SNP"},{k:"HAZ < −3",v:"Stunting"},{k:"GAM Rate",v:`${gamRate}%`},{k:"WHO Alert",v:"GAM > 15%"}].map(r=>(<div key={r.k} style={{display:"flex",justifyContent:"space-between",padding:"7px 0",borderBottom:"1px solid #F0F4F8",fontSize:12}}><span style={{color:"#7A92A8",fontWeight:500}}>{r.k}</span><span style={{fontWeight:700,color:"#0D1B2A",fontFamily:"IBM Plex Mono",fontSize:11.5}}>{r.v}</span></div>))}
          </div>
        </div>
      </div>
      <div className="card">
        <div className="card-header"><div><div className="card-title">Priority Case Register</div><div className="card-subtitle">{children.filter(c=>grades[c.id]!=="Normal").length} cases — SAM flagged for NRC referral</div></div></div>
        <div className="table-wrap">
          <table>
            <thead><tr><th>Child</th><th>Age</th><th>Block</th><th>Weight</th><th>Height</th><th>WAZ</th><th>HAZ</th><th>WHO Grade</th></tr></thead>
            <tbody>
              {children.filter(c=>grades[c.id]!=="Normal").sort((a,b)=>(GRADE_CFG[grades[a.id]]?.priority??9)-(GRADE_CFG[grades[b.id]]?.priority??9)).map(child=>{
                const last=child.records[child.records.length-1],g=grades[child.id]??"Normal",cfg=GRADE_CFG[g];
                const waz=lmsZScore(last.weight,last.month,child.gender,"weight"),haz=lmsZScore(last.height,last.month,child.gender,"height");
                return (<tr key={child.id} onClick={()=>goDetail(child)}><td><div style={{display:"flex",alignItems:"center",gap:9}}><div className="avatar" style={{background:cfg.dot}}>{child.name[0]}</div><div><div style={{fontWeight:600,color:"#0D1B2A",fontSize:13}}>{child.name}</div><div style={{fontSize:11,color:"#7A92A8"}}>{child.gender==="boys"?"Male":"Female"}</div></div></div></td><td style={{fontFamily:"IBM Plex Mono",fontSize:12}}>{last.month}mo</td><td style={{fontSize:12,color:"#3D5166"}}>{child.village}</td><td style={{fontFamily:"IBM Plex Mono",fontSize:12,fontWeight:600}}>{last.weight} kg</td><td style={{fontFamily:"IBM Plex Mono",fontSize:12,fontWeight:600}}>{last.height} cm</td><td style={{fontFamily:"IBM Plex Mono",fontSize:12,fontWeight:700,color:waz<-2?"#B03A2E":"#1E8449"}}>{waz.toFixed(2)}</td><td style={{fontFamily:"IBM Plex Mono",fontSize:12,fontWeight:700,color:haz<-2?"#B03A2E":"#1E8449"}}>{haz.toFixed(2)}</td><td><span className={`chip ${cfg.chip}`}>{g}</span></td></tr>);
              })}
              {children.filter(c=>grades[c.id]!=="Normal").length===0&&(<tr><td colSpan={8} style={{textAlign:"center",padding:32,color:"#7A92A8"}}><CheckCircle size={20} color="#1E8449" style={{margin:"0 auto 8px",display:"block"}}/>No SAM/MAM cases detected</td></tr>)}
            </tbody>
          </table>
        </div>
      </div>
    </>
  );
}

// CHILDREN LIST
function ChildrenList({children,grades,goDetail,setScreen}) {
  return (
    <div className="card">
      <div className="card-header"><div><div className="card-title">Child Registry</div><div className="card-subtitle">{children.length} children · WHO LMS graded</div></div><button className="btn-primary" onClick={()=>setScreen("add")}><PlusCircle size={13}/> Register Child</button></div>
      <div className="table-wrap">
        <table>
          <thead><tr><th>Name</th><th>Age</th><th>Sex</th><th>Block</th><th>Weight</th><th>Height</th><th>WAZ</th><th>HAZ</th><th>WHO Grade</th></tr></thead>
          <tbody>
            {children.map(child=>{
              const last=child.records[child.records.length-1],g=grades[child.id]??"Normal",cfg=GRADE_CFG[g];
              const waz=lmsZScore(last.weight,last.month,child.gender,"weight"),haz=lmsZScore(last.height,last.month,child.gender,"height");
              return (<tr key={child.id} onClick={()=>goDetail(child)}><td><div style={{display:"flex",alignItems:"center",gap:9}}><div className="avatar" style={{background:cfg.dot,width:28,height:28,fontSize:12}}>{child.name[0]}</div><span style={{fontWeight:600,fontSize:13,color:"#0D1B2A"}}>{child.name}</span></div></td><td style={{fontFamily:"IBM Plex Mono",fontSize:12}}>{last.month}mo</td><td style={{fontSize:12}}>{child.gender==="boys"?"M":"F"}</td><td style={{fontSize:12,color:"#3D5166"}}>{child.village}</td><td style={{fontFamily:"IBM Plex Mono",fontSize:12,fontWeight:600}}>{last.weight} kg</td><td style={{fontFamily:"IBM Plex Mono",fontSize:12,fontWeight:600}}>{last.height} cm</td><td style={{fontFamily:"IBM Plex Mono",fontSize:12,fontWeight:700,color:waz<-2?"#B03A2E":"#1E8449"}}>{waz.toFixed(2)}</td><td style={{fontFamily:"IBM Plex Mono",fontSize:12,fontWeight:700,color:haz<-2?"#B03A2E":"#1E8449"}}>{haz.toFixed(2)}</td><td><span className={`chip ${cfg.chip}`}>{g}</span></td></tr>);
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// ADD RECORD
function AddRecord({onAdd}) {
  const [form,setForm]=useState({name:"",age:"",gender:"boys",village:"Block A",weight:"",height:""});
  const [toast,setToast]=useState(null);
  const [error,setError]=useState("");
  const update=useCallback((k,v)=>setForm(p=>({...p,[k]:v})),[]);
  const handleSubmit=()=>{
    if(!form.name.trim()||!form.age||!form.weight||!form.height){setError("All fields required for WHO z-score classification.");return;}
    const age=parseInt(form.age),wt=parseFloat(form.weight),ht=parseFloat(form.height);
    const waz=lmsZScore(wt,age,form.gender,"weight"),haz=lmsZScore(ht,age,form.gender,"height");
    const grade=classifyChild(waz,haz);
    setError("");
    onAdd({id:Date.now(),name:form.name.trim(),age,gender:form.gender,village:form.village,records:[{month:age,weight:wt,height:ht}]});
    setToast({grade,waz:waz.toFixed(2),haz:haz.toFixed(2)});
    setForm({name:"",age:"",gender:"boys",village:"Block A",weight:"",height:""});
    setTimeout(()=>setToast(null),4000);
  };
  return (
    <div style={{maxWidth:560,margin:"0 auto"}}>
      <div className="card">
        <div className="card-header"><div><div className="card-title">Register New Child</div><div className="card-subtitle">WHO LMS z-score computed automatically</div></div><div style={{display:"flex",alignItems:"center",gap:6,background:"#E0F5F5",border:"1px solid #80CCCE",borderRadius:3,padding:"4px 10px"}}><Brain size={12} color="#007B83"/><span style={{fontSize:11,color:"#007B83",fontWeight:700,fontFamily:"IBM Plex Mono"}}>WHO LMS</span></div></div>
        <div className="card-body">
          {toast&&(<div className="toast" style={{background:GRADE_CFG[toast.grade]?.bg,borderColor:GRADE_CFG[toast.grade]?.border,borderLeftColor:GRADE_CFG[toast.grade]?.col,color:GRADE_CFG[toast.grade]?.col}}><CheckCircle size={14}/>Registered · WHO Grade: <strong>{toast.grade}</strong> · WAZ:{toast.waz} · HAZ:{toast.haz}</div>)}
          {error&&<div className="form-error">{error}</div>}
          <div className="form-grid">
            <div className="form-group" style={{gridColumn:"1 / -1"}}><label className="form-label">Full Name</label><input className="form-input" placeholder="Child's full name" value={form.name} onChange={e=>update("name",e.target.value)}/></div>
            <div className="form-group"><label className="form-label">Age (months)</label><input className="form-input" type="number" placeholder="0 – 60" value={form.age} onChange={e=>update("age",e.target.value)}/><div className="form-hint">Completed months (0–60)</div></div>
            <div className="form-group"><label className="form-label">Sex</label><select className="form-input" value={form.gender} onChange={e=>update("gender",e.target.value)}><option value="boys">Male</option><option value="girls">Female</option></select></div>
            <div className="form-group"><label className="form-label">Weight (kg)</label><input className="form-input" type="number" step="0.1" placeholder="e.g. 11.5" value={form.weight} onChange={e=>update("weight",e.target.value)}/><div className="form-hint">Nearest 0.1 kg</div></div>
            <div className="form-group"><label className="form-label">Height / Length (cm)</label><input className="form-input" type="number" step="0.1" placeholder="e.g. 84.0" value={form.height} onChange={e=>update("height",e.target.value)}/><div className="form-hint">Recumbent for under 2 years</div></div>
            <div className="form-group" style={{gridColumn:"1 / -1"}}><label className="form-label">Block</label><select className="form-input" value={form.village} onChange={e=>update("village",e.target.value)}><option>Block A</option><option>Block B</option><option>Block C</option></select></div>
          </div>
          <button className="btn-primary" onClick={handleSubmit} style={{width:"100%",justifyContent:"center",padding:"11px",fontSize:13.5}}><Brain size={14}/> Register & Compute WHO LMS Grade</button>
        </div>
      </div>
    </div>
  );
}

// ANALYTICS
function Analytics({children,grades,stats}) {
  const barData=[{name:"Normal",value:stats.normal,fill:"#1E8449"},{name:"MAM",value:stats.mam,fill:"#CA6F1E"},{name:"SAM",value:stats.sam,fill:"#B03A2E"}];
  const vData=["Block A","Block B","Block C"].map(v=>{const vc=children.filter(c=>c.village===v);return {name:v,Normal:vc.filter(c=>grades[c.id]==="Normal").length,MAM:vc.filter(c=>grades[c.id]==="MAM").length,SAM:vc.filter(c=>grades[c.id]==="SAM").length};});
  const gam=stats.sam+stats.mam,gamRate=stats.total>0?Math.round(gam/stats.total*100):0;
  return (
    <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:14}}>
      <div className="card" style={{gridColumn:"1 / -1"}}>
        <div className="card-header"><div><div className="card-title">WHO Programme Indicators — March 2026</div><div className="card-subtitle">Coimbatore District ICDS · SAM/MAM/GAM vs WHO thresholds</div></div></div>
        <div className="card-body" style={{display:"grid",gridTemplateColumns:"repeat(4,1fr)",gap:12}}>
          {[{label:"GAM Rate",value:`${gamRate}%`,sub:"SAM+MAM/Total",col:"#B03A2E",bg:"#FDEDEC",note:gamRate>15?"⚠ WHO Emergency":"Threshold: 15%"},
            {label:"SAM Rate",value:`${stats.total>0?Math.round(stats.sam/stats.total*100):0}%`,sub:"Severe cases",col:"#B03A2E",bg:"#FDEDEC",note:"Emergency: >2%"},
            {label:"MAM Rate",value:`${stats.total>0?Math.round(stats.mam/stats.total*100):0}%`,sub:"Moderate cases",col:"#CA6F1E",bg:"#FEF5E7",note:"Alert: >10%"},
            {label:"Coverage",value:`${stats.total}`,sub:"Assessed",col:"#00509E",bg:"#EBF3FB",note:"Target: 100%"},
          ].map(d=>(<div key={d.label} style={{background:d.bg,borderRadius:4,padding:"14px 16px",borderLeft:`3px solid ${d.col}`}}><div style={{fontFamily:"IBM Plex Mono",fontSize:24,fontWeight:700,color:d.col}}>{d.value}</div><div style={{fontSize:12,fontWeight:700,color:d.col,margin:"3px 0"}}>{d.label}</div><div style={{fontSize:10.5,color:"#7A92A8"}}>{d.sub}</div><div style={{fontSize:10,color:d.col,marginTop:4,fontFamily:"IBM Plex Mono",background:"rgba(0,0,0,0.05)",padding:"2px 6px",borderRadius:2,display:"inline-block"}}>{d.note}</div></div>))}
        </div>
      </div>
      <div className="card">
        <div className="card-header"><div><div className="card-title">Grade Distribution</div></div></div>
        <div className="card-body">
          <ResponsiveContainer width="100%" height={150}>
            <BarChart data={barData} margin={{left:-15,right:10}}>
              <CartesianGrid strokeDasharray="3 3" stroke={CS.grid}/><XAxis dataKey="name" tick={CS.axis}/><YAxis tick={CS.axis} allowDecimals={false}/><Tooltip {...CS.tooltip}/>
              {barData.map((d,i)=><Bar key={i} dataKey="value" name={d.name} fill={d.fill} radius={[3,3,0,0]}/>)}
            </BarChart>
          </ResponsiveContainer>
          <div style={{marginTop:14}}>
            {[{label:"Normal",value:stats.normal,color:"#1E8449"},{label:"MAM",value:stats.mam,color:"#CA6F1E"},{label:"SAM",value:stats.sam,color:"#B03A2E"}].map(d=>(<div className="progress-wrap" key={d.label}><div className="progress-label-row"><span style={{fontWeight:700,color:d.color,fontSize:12}}>{d.label}</span><span style={{fontFamily:"IBM Plex Mono",fontSize:11,color:"#3D5166",fontWeight:600}}>{d.value}/{stats.total} ({stats.total>0?Math.round(d.value/stats.total*100):0}%)</span></div><div className="progress-bar"><div className="progress-fill" style={{background:d.color,width:`${stats.total>0?d.value/stats.total*100:0}%`}}/></div></div>))}
          </div>
        </div>
      </div>
      <div className="card">
        <div className="card-header"><div><div className="card-title">Block-wise SAM/MAM</div></div></div>
        <div className="card-body">
          <ResponsiveContainer width="100%" height={150}>
            <BarChart data={vData} margin={{left:-15,right:10}}>
              <CartesianGrid strokeDasharray="3 3" stroke={CS.grid}/><XAxis dataKey="name" tick={CS.axis}/><YAxis tick={CS.axis} allowDecimals={false}/><Tooltip {...CS.tooltip}/><Legend wrapperStyle={{fontSize:11,fontFamily:"IBM Plex Sans"}}/>
              <Bar dataKey="Normal" fill="#1E8449" radius={[3,3,0,0]}/><Bar dataKey="MAM" fill="#CA6F1E" radius={[3,3,0,0]}/><Bar dataKey="SAM" fill="#B03A2E" radius={[3,3,0,0]}/>
            </BarChart>
          </ResponsiveContainer>
          {["Block A","Block B","Block C"].map(v=>{const vc=children.filter(c=>c.village===v),s=vc.filter(c=>grades[c.id]==="SAM").length,m=vc.filter(c=>grades[c.id]==="MAM").length;return (<div key={v} style={{display:"flex",justifyContent:"space-between",alignItems:"center",padding:"9px 0",borderBottom:"1px solid #F0F4F8",fontSize:12.5}}><div><div style={{fontWeight:600,color:"#0D1B2A"}}>{v}</div><div style={{fontSize:11,color:"#7A92A8"}}>{vc.length} registered</div></div><div style={{display:"flex",gap:6}}>{s>0&&<span className="chip chip-sam">SAM:{s}</span>}{m>0&&<span className="chip chip-mam">MAM:{m}</span>}{s===0&&m===0&&<span className="chip chip-normal">Normal</span>}</div></div>);})}
        </div>
      </div>
      <div className="card" style={{gridColumn:"1 / -1"}}>
        <div className="card-header"><div><div className="card-title">Monthly ICDS Report — March 2026</div><div className="card-subtitle">WHO LMS classification · Ready for CDPO submission</div></div><button className="btn-primary" onClick={()=>generatePDF(children,grades)}><FileText size={13}/> Download PDF</button></div>
      </div>
    </div>
  );
}

// ── DIET FORECAST PANEL ────────────────────────────────────
function DietForecast({ child, grade, onDietReady }) {
  const last = child.records[child.records.length - 1];
  const rda  = getRDA(last.month);

  const [intake,    setIntake]    = useState([]);
  const [horizon,   setHorizon]   = useState(6);
  const [computed,  setComputed]  = useState(false);
  const [forecast,  setForecast]  = useState(null);
  const [gapResult, setGapResult] = useState(null);

  const addFood   = (foodId) => { if (intake.find(i=>i.foodId===foodId)) return; setIntake(p=>[...p,{foodId,qty:1}]); setComputed(false); };
  const setQty    = (foodId, qty) => { setIntake(p=>p.map(i=>i.foodId===foodId?{...i,qty:Math.max(0.5,+qty)}:i)); setComputed(false); };
  const removeFood= (foodId) => { setIntake(p=>p.filter(i=>i.foodId!==foodId)); setComputed(false); };

  const handleCompute = () => {
    if (intake.length === 0) return;
    const {points, calAdequacy, velocityFactor} = predictGrowth(child, intake, horizon);
    const gd = getDietGaps(intake, last.month);
    setForecast({points, calAdequacy, velocityFactor});
    setGapResult(gd);
    setComputed(true);
    // Pass diet data up to Detail for PDF
    if (onDietReady) onDietReady({intake, horizon, forecast:{points,calAdequacy,velocityFactor}});
  };

  const nuts = intake.length > 0 ? calcNutrients(intake) : null;

  const tabStyle = (active) => ({
    padding:"5px 14px", borderRadius:3, border:active?"none":"1.5px solid #D0D9E4",
    cursor:"pointer", fontSize:12, fontWeight:600,
    fontFamily:"IBM Plex Sans,sans-serif",
    background:active?"#00509E":"transparent", color:active?"#fff":"#3D5166",
    transition:"all 0.15s",
  });

  // Group foods by category
  const FOOD_GROUPS = [
    {label:"🍚 Cereals",   ids:["rice","roti","idli","dosa","upma"]},
    {label:"🥚 Protein",   ids:["dal","egg","milk","curd","chicken","fish"]},
    {label:"🥬 Vegetables",ids:["greens","carrot","tomato","potato"]},
    {label:"🍌 Fruits",    ids:["banana","mango","papaya"]},
    {label:"🥜 Others",    ids:["peanut","jaggery"]},
  ];

  return (
    <div>
      {/* ICMR RDA reference */}
      <div style={{background:"#EBF3FB",border:"1px solid #C2DCF5",borderLeft:"4px solid #00509E",borderRadius:6,padding:"11px 16px",marginBottom:14,display:"flex",alignItems:"center",gap:12,flexWrap:"wrap"}}>
        <Brain size={15} color="#00509E"/>
        <div style={{fontSize:12.5,color:"#00509E",fontWeight:600}}>ICMR RDA for {last.month} months ({rda.label})</div>
        {[{k:"Energy",v:`${rda.cal} kcal`},{k:"Protein",v:`${rda.pro}g`},{k:"Iron",v:`${rda.iron}mg`},{k:"Vit-A",v:`${rda.vitA}mcg`},{k:"Zinc",v:`${rda.zinc}mg`}].map(r=>(
          <div key={r.k} style={{background:"#fff",border:"1px solid #C2DCF5",borderRadius:3,padding:"3px 10px",fontSize:11.5,fontFamily:"IBM Plex Mono",color:"#00509E",fontWeight:700}}>
            {r.k}: {r.v}
          </div>
        ))}
      </div>

      <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:14,marginBottom:14}}>
        {/* Food selection */}
        <div className="card">
          <div className="card-header"><div><div className="card-title">Step 1 — Enter Daily Food Intake</div><div className="card-subtitle">Select foods the child eats daily · ICMR food composition table</div></div></div>
          <div className="card-body" style={{maxHeight:360,overflowY:"auto"}}>
            {FOOD_GROUPS.map(grp => (
              <div key={grp.label} style={{marginBottom:12}}>
                <div style={{fontSize:10.5,fontWeight:700,color:"#7A92A8",textTransform:"uppercase",letterSpacing:"0.8px",marginBottom:6}}>{grp.label}</div>
                <div style={{display:"flex",flexWrap:"wrap",gap:6}}>
                  {grp.ids.map(id => {
                    const f = ICMR_FOODS.find(x=>x.id===id);
                    const selected = intake.find(i=>i.foodId===id);
                    return (
                      <button key={id} onClick={()=>addFood(id)}
                        style={{padding:"4px 10px",borderRadius:3,border:`1.5px solid ${selected?"#00509E":"#D0D9E4"}`,cursor:"pointer",fontSize:11.5,fontWeight:selected?700:400,fontFamily:"IBM Plex Sans,sans-serif",background:selected?"#EBF3FB":"#fff",color:selected?"#00509E":"#3D5166",transition:"all 0.15s"}}>
                        {f?.emoji} {f?.name.split("(")[0].trim()}
                      </button>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Quantity + nutrient live meter */}
        <div className="card">
          <div className="card-header"><div><div className="card-title">Step 2 — Portions & Nutrient Meter</div><div className="card-subtitle">Adjust servings — live vs ICMR RDA</div></div></div>
          <div className="card-body">
            {intake.length === 0 ? (
              <div style={{textAlign:"center",padding:"32px 0",color:"#7A92A8",fontSize:13}}>
                <Zap size={22} color="#D0D9E4" style={{margin:"0 auto 8px",display:"block"}}/>
                Select foods from the left panel
              </div>
            ) : (
              <>
                {intake.map(({foodId, qty}) => {
                  const f = ICMR_FOODS.find(x=>x.id===foodId);
                  return (
                    <div key={foodId} style={{display:"flex",alignItems:"center",gap:8,padding:"6px 0",borderBottom:"1px solid #F0F4F8"}}>
                      <span style={{fontSize:16,flexShrink:0}}>{f?.emoji}</span>
                      <span style={{flex:1,fontSize:12.5,fontWeight:600,color:"#0D1B2A"}}>{f?.name.split("(")[0].trim()}</span>
                      <span style={{fontSize:10.5,color:"#7A92A8",flexShrink:0}}>{f?.unit}</span>
                      <input type="number" min="0.5" max="5" step="0.5" value={qty}
                        onChange={e=>setQty(foodId,e.target.value)}
                        style={{width:52,padding:"3px 6px",border:"1.5px solid #D0D9E4",borderRadius:3,fontSize:12,fontFamily:"IBM Plex Mono",textAlign:"center"}}/>
                      <button onClick={()=>removeFood(foodId)} style={{background:"none",border:"none",cursor:"pointer",color:"#B03A2E",fontSize:15,padding:"0 2px",lineHeight:1}}>×</button>
                    </div>
                  );
                })}

                {/* Live nutrient bar */}
                {nuts && (
                  <div style={{marginTop:14}}>
                    {[{k:"Energy",got:nuts.cal,need:rda.cal,unit:"kcal",col:"#00509E"},
                      {k:"Protein",got:nuts.pro,need:rda.pro,unit:"g",col:"#007B83"},
                      {k:"Iron",got:nuts.iron,need:rda.iron,unit:"mg",col:"#CA6F1E"},
                      {k:"Vit-A",got:nuts.vitA,need:rda.vitA,unit:"mcg",col:"#8E44AD"},
                      {k:"Zinc",got:nuts.zinc,need:rda.zinc,unit:"mg",col:"#1E8449"},
                    ].map(n => {
                      const pct = Math.min(100, rda[n.k==="Energy"?"cal":n.k==="Protein"?"pro":n.k==="Iron"?"iron":n.k==="Vit-A"?"vitA":"zinc"]>0 ? n.got/n.need*100 : 0);
                      const ok  = pct >= 85;
                      return (
                        <div key={n.k} style={{marginBottom:8}}>
                          <div style={{display:"flex",justifyContent:"space-between",fontSize:11.5,marginBottom:3}}>
                            <span style={{fontWeight:700,color:ok?n.col:"#B03A2E"}}>{n.k}</span>
                            <span style={{fontFamily:"IBM Plex Mono",fontSize:11,color:ok?"#1E8449":"#B03A2E",fontWeight:700}}>{n.got}{n.unit} / {n.need}{n.unit} ({Math.round(pct)}%)</span>
                          </div>
                          <div style={{background:"#EEF2F7",borderRadius:2,height:7,overflow:"hidden"}}>
                            <div style={{height:"100%",borderRadius:2,background:ok?n.col:"#B03A2E",width:`${pct}%`,transition:"width 0.4s ease"}}/>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      </div>

      {/* Forecast controls */}
      <div className="card" style={{marginBottom:14}}>
        <div className="card-header">
          <div><div className="card-title">Step 3 — Forecast Growth Trajectory</div><div className="card-subtitle">WHO growth velocity × diet adequacy → predicted WAZ</div></div>
          <div style={{display:"flex",alignItems:"center",gap:8}}>
            <span style={{fontSize:12,color:"#7A92A8",fontWeight:500}}>Horizon:</span>
            {[3,6].map(h=>(
              <button key={h} onClick={()=>{setHorizon(h);setComputed(false);}} style={tabStyle(horizon===h)}>{h} months</button>
            ))}
            <button className="btn-primary" onClick={handleCompute} disabled={intake.length===0}
              style={{opacity:intake.length===0?0.5:1,padding:"7px 18px"}}>
              <Brain size={13}/> Predict
            </button>
          </div>
        </div>

        {!computed ? (
          <div style={{padding:"40px 0",textAlign:"center",color:"#7A92A8",fontSize:13}}>
            <Brain size={24} color="#D0D9E4" style={{margin:"0 auto 10px",display:"block"}}/>
            Add foods → click <strong>Predict</strong> to see {horizon}-month WAZ forecast
          </div>
        ) : forecast && (
          <div className="card-body">
            {/* Adequacy summary */}
            <div style={{display:"grid",gridTemplateColumns:"repeat(3,1fr)",gap:10,marginBottom:16}}>
              {[
                {label:"Calorie Adequacy",  val:`${Math.round(forecast.calAdequacy*100)}%`, col:forecast.calAdequacy>=0.85?"#1E8449":"#B03A2E", bg:forecast.calAdequacy>=0.85?"#E9F7EF":"#FDEDEC"},
                {label:"Growth Factor",     val:`${(forecast.velocityFactor*100).toFixed(0)}%`, col:"#00509E", bg:"#EBF3FB"},
                {label:"Projected Grade",   val:classifyChild(forecast.points[forecast.points.length-1]["Current Diet WAZ"], lmsZScore(last.height,Math.min(last.month+horizon,60),child.gender,"height")), col:GRADE_CFG[classifyChild(forecast.points[forecast.points.length-1]["Current Diet WAZ"],lmsZScore(last.height,Math.min(last.month+horizon,60),child.gender,"height"))]?.col??"#1E8449", bg:GRADE_CFG[classifyChild(forecast.points[forecast.points.length-1]["Current Diet WAZ"],lmsZScore(last.height,Math.min(last.month+horizon,60),child.gender,"height"))]?.bg??"#E9F7EF"},
              ].map(s=>(
                <div key={s.label} style={{background:s.bg,borderRadius:4,padding:"12px 14px",borderLeft:`3px solid ${s.col}`,textAlign:"center"}}>
                  <div style={{fontFamily:"IBM Plex Mono",fontSize:22,fontWeight:700,color:s.col}}>{s.val}</div>
                  <div style={{fontSize:11,color:"#7A92A8",marginTop:3,fontWeight:500}}>{s.label}</div>
                </div>
              ))}
            </div>

            {/* Forecast chart */}
            <ResponsiveContainer width="100%" height={220}>
              <LineChart data={forecast.points} margin={{left:-10,right:10}}>
                <CartesianGrid strokeDasharray="3 3" stroke={CS.grid}/>
                <XAxis dataKey="month" tick={CS.axis}/>
                <YAxis tick={CS.axis} domain={['auto','auto']}/>
                <Tooltip {...CS.tooltip}/>
                <Legend wrapperStyle={{fontSize:12,fontFamily:"IBM Plex Sans"}}/>
                <Line type="monotone" dataKey="SAM Threshold"      stroke="#B03A2E" strokeDasharray="4 3" dot={false} strokeWidth={1.5}/>
                <Line type="monotone" dataKey="MAM Threshold"      stroke="#CA6F1E" strokeDasharray="4 3" dot={false} strokeWidth={1.5}/>
                <Line type="monotone" dataKey="Current Diet WAZ"   stroke="#CA6F1E" strokeWidth={2.5} dot={{r:4,fill:"#CA6F1E"}}/>
                <Line type="monotone" dataKey="Optimal Diet WAZ"   stroke="#1E8449" strokeWidth={2.5} dot={{r:4,fill:"#1E8449"}} strokeDasharray="6 2"/>
              </LineChart>
            </ResponsiveContainer>

            <div style={{marginTop:12,fontSize:11.5,color:"#7A92A8",fontStyle:"italic",textAlign:"center"}}>
              🟠 Current diet trajectory &nbsp;·&nbsp; 🟢 Optimal diet trajectory &nbsp;·&nbsp; Dashed = WHO thresholds
            </div>
          </div>
        )}
      </div>

      {/* Nutrient gap + food recommendations */}
      {computed && gapResult && (
        <div className="card" style={{marginBottom:14}}>
          <div className="card-header"><div><div className="card-title">Nutrient Gap Analysis & Food Recommendations</div><div className="card-subtitle">Based on ICMR RDA · {rda.label} age group</div></div></div>
          <div className="card-body">
            {gapResult.gaps.length === 0 ? (
              <div style={{background:"#E9F7EF",border:"1px solid #82E0AA",borderLeft:"4px solid #1E8449",borderRadius:6,padding:"14px 18px",display:"flex",gap:12,alignItems:"center"}}>
                <CheckCircle size={20} color="#1E8449"/>
                <div>
                  <div style={{fontWeight:700,fontSize:14,color:"#1E8449"}}>Excellent! All nutrient targets met</div>
                  <div style={{fontSize:12.5,color:"#1D6A3A",marginTop:3}}>Current diet adequately meets ICMR RDA. Continue this diet for sustained normal growth.</div>
                </div>
              </div>
            ) : (
              <div>
                <div style={{fontSize:12.5,color:"#3D5166",marginBottom:12,fontWeight:500}}>
                  {gapResult.gaps.length} nutrient gap{gapResult.gaps.length>1?"s":""} identified — add these foods to improve growth trajectory:
                </div>
                {gapResult.gaps.map(gap => (
                  <div key={gap.nutrient} style={{background:gap.severity<0.5?"#FDEDEC":"#FEF5E7",border:`1px solid ${gap.severity<0.5?"#F1948A":"#F0B27A"}`,borderLeft:`4px solid ${gap.severity<0.5?"#B03A2E":"#CA6F1E"}`,borderRadius:6,padding:"12px 16px",marginBottom:10}}>
                    <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:6}}>
                      <span style={{fontWeight:700,fontSize:13,color:gap.severity<0.5?"#B03A2E":"#CA6F1E"}}>{gap.nutrient} Deficiency</span>
                      <span style={{fontFamily:"IBM Plex Mono",fontSize:11.5,fontWeight:700,color:gap.severity<0.5?"#B03A2E":"#CA6F1E"}}>
                        {gap.got}{gap.unit} / {gap.need}{gap.unit} ({Math.round(gap.severity*100)}%)
                      </span>
                    </div>
                    <div style={{fontSize:12,color:"#3D5166"}}>
                      <strong>Add to diet:</strong> {gap.foods}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

// DETAIL
function Detail({child,grades,setScreen}) {
  const [mainTab,  setMainTab]  = useState("growth");
  const [chartTab, setChartTab] = useState("weight");
  const [dietData, setDietData] = useState(null);
  if(!child)return null;
  const last=child.records[child.records.length-1];
  const waz=lmsZScore(last.weight,last.month,child.gender,"weight"),haz=lmsZScore(last.height,last.month,child.gender,"height");
  const g=grades[child.id]??"Normal",cfg=GRADE_CFG[g];
  const data=buildChartData(child,chartTab);
  const vel=getGrowthVelocity(child.records,chartTab);

  const MAIN_TABS=[
    {id:"growth",  label:"📈 Growth & History"},
    {id:"diet",    label:"🥗 Diet & Forecast"},
  ];

  return (
    <>
      {/* Top bar */}
      <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:16,flexWrap:"wrap",gap:8}}>
        <button className="btn-ghost" onClick={()=>setScreen("children")}><ArrowLeft size={13}/> Back to Registry</button>
        <button className="btn-primary" onClick={()=>generateChildPDF(child,g,waz,haz,dietData)}>
          <FileText size={13}/> Download Child Report {dietData?"(+Diet)":""}
        </button>
      </div>

      {/* Detail header */}
      <div className="detail-header">
        <div className="detail-avatar">{child.gender==="boys"?"👦":"👧"}</div>
        <div style={{flex:1}}>
          <div style={{fontWeight:700,fontSize:20,color:"#fff"}}>{child.name}</div>
          <div style={{fontSize:12.5,color:"rgba(255,255,255,0.65)",marginTop:5,display:"flex",gap:14,flexWrap:"wrap"}}>
            <span>{last.month} months</span><span>·</span>
            <span>{child.gender==="boys"?"Male":"Female"}</span><span>·</span>
            <span style={{display:"flex",alignItems:"center",gap:3}}><MapPin size={10}/>{child.village}</span>
          </div>
        </div>
        <div style={{textAlign:"right"}}>
          <span className={`chip ${cfg.chip}`} style={{fontSize:12.5,padding:"5px 14px"}}>{g}</span>
          <div style={{fontSize:11,color:"rgba(255,255,255,0.5)",marginTop:6,fontFamily:"IBM Plex Mono"}}>{cfg.full}</div>
        </div>
      </div>

      {/* Stats strip */}
      <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:14,marginBottom:14}}>
        <div className="clinical-card" style={{background:cfg.bg,borderColor:cfg.border,borderLeftColor:cfg.col}}>
          {g==="Normal"?<CheckCircle size={20} color={cfg.col}/>:<AlertTriangle size={20} color={cfg.col}/>}
          <div>
            <div style={{fontWeight:700,fontSize:14,color:cfg.col}}>{cfg.full}</div>
            <div style={{fontSize:12,color:"#3D5166",marginTop:4,fontFamily:"IBM Plex Mono"}}>WAZ: {waz.toFixed(3)}  ·  HAZ: {haz.toFixed(3)}</div>
            {vel&&<div style={{fontSize:11,color:"#7A92A8",marginTop:3}}>Velocity: {vel} {chartTab==="weight"?"kg":"cm"}/month</div>}
          </div>
        </div>
        <div className="metric-grid" style={{margin:0}}>
          <div className="metric-card"><Activity size={14} color="#00509E"/><div className="metric-value" style={{color:"#00509E"}}>{last.weight}<span style={{fontSize:13,fontWeight:400}}> kg</span></div><div className="metric-label">Weight</div></div>
          <div className="metric-card"><TrendingUp size={14} color="#007B83"/><div className="metric-value" style={{color:"#007B83"}}>{last.height}<span style={{fontSize:13,fontWeight:400}}> cm</span></div><div className="metric-label">Height</div></div>
        </div>
      </div>

      {/* Main tab switcher */}
      <div style={{display:"flex",gap:6,marginBottom:14,borderBottom:"2px solid #E8EDF3",paddingBottom:0}}>
        {MAIN_TABS.map(t=>(
          <button key={t.id} onClick={()=>setMainTab(t.id)}
            style={{padding:"9px 20px",border:"none",borderBottom:mainTab===t.id?"3px solid #00509E":"3px solid transparent",cursor:"pointer",fontSize:13,fontWeight:mainTab===t.id?700:500,fontFamily:"IBM Plex Sans,sans-serif",background:"transparent",color:mainTab===t.id?"#00509E":"#7A92A8",transition:"all 0.15s",marginBottom:-2}}>
            {t.label}
          </button>
        ))}
      </div>

      {/* GROWTH TAB */}
      {mainTab==="growth" && (
        <>
          <div className="card" style={{marginBottom:14}}>
            <div className="card-header"><div className="card-title">Anthropometric History</div></div>
            <div className="table-wrap">
              <table>
                <thead><tr><th>Visit</th><th>Weight</th><th>Height</th><th>WAZ</th><th>HAZ</th><th>WHO Grade</th></tr></thead>
                <tbody>
                  {child.records.map((r,i)=>{
                    const rW=lmsZScore(r.weight,r.month,child.gender,"weight");
                    const rH=lmsZScore(r.height,r.month,child.gender,"height");
                    const rG=classifyChild(rW,rH),rC=GRADE_CFG[rG];
                    return (
                      <tr key={i}>
                        <td style={{fontFamily:"IBM Plex Mono",fontWeight:600,color:"#0D1B2A"}}>{r.month} mo</td>
                        <td style={{fontFamily:"IBM Plex Mono"}}>{r.weight} kg</td>
                        <td style={{fontFamily:"IBM Plex Mono"}}>{r.height} cm</td>
                        <td style={{fontFamily:"IBM Plex Mono",fontWeight:700,color:rW<-2?"#B03A2E":"#1E8449"}}>{rW.toFixed(3)}</td>
                        <td style={{fontFamily:"IBM Plex Mono",fontWeight:700,color:rH<-2?"#B03A2E":"#1E8449"}}>{rH.toFixed(3)}</td>
                        <td><span className={`chip ${rC.chip}`}>{rG}</span></td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

          <div className="card" style={{marginBottom:14}}>
            <div className="card-header">
              <div><div className="card-title">Growth Chart vs WHO Reference</div><div className="card-subtitle">LMS-derived curves · Median, −2SD, −3SD</div></div>
              <div style={{display:"flex",gap:6}}>
                {["weight","height"].map(t=>(
                  <button key={t} onClick={()=>setChartTab(t)}
                    style={{padding:"6px 16px",borderRadius:3,border:chartTab===t?"none":"1.5px solid #D0D9E4",cursor:"pointer",fontSize:12.5,fontWeight:600,fontFamily:"IBM Plex Sans,sans-serif",background:chartTab===t?"#00509E":"transparent",color:chartTab===t?"#fff":"#3D5166"}}>
                    {t==="weight"?"WAZ":"HAZ"}
                  </button>
                ))}
              </div>
            </div>
            <div className="card-body">
              <ResponsiveContainer width="100%" height={240}>
                <LineChart data={data} margin={{left:-10,right:10}}>
                  <CartesianGrid strokeDasharray="3 3" stroke={CS.grid}/>
                  <XAxis dataKey="age" tick={CS.axis}/><YAxis tick={CS.axis}/>
                  <Tooltip {...CS.tooltip}/><Legend wrapperStyle={{fontSize:12,fontFamily:"IBM Plex Sans"}}/>
                  <Line type="monotone" dataKey="Median" stroke="#1E8449" strokeDasharray="6 3" dot={false} strokeWidth={1.5}/>
                  <Line type="monotone" dataKey="-2SD"   stroke="#CA6F1E" strokeDasharray="4 3" dot={false} strokeWidth={1.5}/>
                  <Line type="monotone" dataKey="-3SD"   stroke="#B03A2E" strokeDasharray="3 3" dot={false} strokeWidth={1.5}/>
                  <Line type="monotone" dataKey="Child"  stroke="#00509E" strokeWidth={2.5} dot={{fill:"#00509E",r:4,strokeWidth:0}} connectNulls={false}/>
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="ai-box">
            <div className="ai-box-title"><ClipboardList size={12}/> Clinical Protocol — {g} ({cfg.full})</div>
            <ul>{CLINICAL_RECS[g]?.map((r,i)=><li key={i}>{r}</li>)}</ul>
            <div style={{marginTop:12,fontSize:11,color:"#7A92A8",borderTop:"1px solid #C2DCF5",paddingTop:10,fontFamily:"IBM Plex Mono"}}>
              WHO LMS Box-Cox · WAZ:{waz.toFixed(3)} HAZ:{haz.toFixed(3)} · {cfg.full} · WHO Child Growth Standards 2006
            </div>
          </div>
        </>
      )}

      {/* DIET & FORECAST TAB */}
      {mainTab==="diet" && <DietForecast child={child} grade={g} onDietReady={setDietData}/>}
    </>
  );
}

// MAIN APP
export default function App() {
  const [page,setPage]=useState("landing");
  const [user,setUser]=useState(null);
  const [screen,setScreen]=useState("dashboard");
  const [children,setChildren]=useState(INIT_CHILDREN);
  const [selected,setSelected]=useState(null);
  const [pwaEvt,setPwaEvt]=useState(null);

  useEffect(()=>{
    const handler=e=>{e.preventDefault();setPwaEvt(e);};
    window.addEventListener("beforeinstallprompt",handler);
    return ()=>window.removeEventListener("beforeinstallprompt",handler);
  },[]);

  const handleInstall=async()=>{if(!pwaEvt)return;pwaEvt.prompt();const r=await pwaEvt.userChoice;if(r.outcome==="accepted")setPwaEvt(null);};

  const grades={};
  children.forEach(c=>{const last=c.records[c.records.length-1];const waz=lmsZScore(last.weight,last.month,c.gender,"weight");const haz=lmsZScore(last.height,last.month,c.gender,"height");grades[c.id]=classifyChild(waz,haz);});

  const stats={total:children.length,normal:children.filter(c=>grades[c.id]==="Normal").length,mam:children.filter(c=>grades[c.id]==="MAM").length,sam:children.filter(c=>grades[c.id]==="SAM").length};

  const goDetail=useCallback(c=>{setSelected(c);setScreen("detail");},[]);
  const handleAdd=useCallback(c=>setChildren(p=>[...p,c]),[]);
  const handleLogin=useCallback(u=>{setUser(u);setPage("app");},[]);
  const handleLogout=useCallback(()=>{setUser(null);setPage("landing");setScreen("dashboard");},[]);

  if(page==="landing")return <LandingPage onLogin={()=>setPage("login")}/>;
  if(page==="login")return <LoginPage onLogin={handleLogin}/>;

  const meta={dashboard:{title:"Dashboard",sub:"Coimbatore District · March 2026"},children:{title:"Child Registry",sub:`${children.length} children · WHO LMS graded`},add:{title:"Register Child",sub:"New anthropometric measurement"},analytics:{title:"Analytics & Reports",sub:"SAM/MAM/GAM indicators"},detail:{title:selected?.name??"",sub:`${selected?.records?.[selected.records.length-1]?.month??""} months · ${selected?.village??""}`}};
  const pt=meta[screen]??meta.dashboard;

  return (
    <div className="app-shell">
      <aside className="sidebar">
        <div className="sidebar-logo" onClick={()=>setPage("landing")}><div className="logo-icon">🌱</div><div className="logo-text"><h1>NutriGrid</h1><p>ICDS Monitoring System</p></div></div>
        <nav className="sidebar-nav">
          <div className="nav-section-label">Navigation</div>
          {NAV.map(({id,label,Icon})=>(<button key={id} className={`nav-item ${screen===id?"active":""}`} onClick={()=>setScreen(id)}><Icon size={15}/> {label}</button>))}
        </nav>
        <div className="sidebar-footer">
          <div className="user-card"><div className="user-avatar">{user?.emoji??"👩‍⚕️"}</div><div><strong>{user?.name??"Worker"}</strong><span>{user?.block??"Coimbatore"}</span></div></div>
          <button onClick={handleLogout} style={{marginTop:8,width:"100%",padding:"7px",background:"rgba(255,255,255,0.06)",border:"1px solid rgba(255,255,255,0.1)",borderRadius:4,color:"rgba(255,255,255,0.5)",fontSize:11.5,cursor:"pointer",fontFamily:"IBM Plex Sans",display:"flex",alignItems:"center",justifyContent:"center",gap:6,transition:"all 0.15s"}} onMouseOver={e=>{e.currentTarget.style.color="#fff";e.currentTarget.style.background="rgba(255,255,255,0.12)"}} onMouseOut={e=>{e.currentTarget.style.color="rgba(255,255,255,0.5)";e.currentTarget.style.background="rgba(255,255,255,0.06)"}}><LogOut size={13}/> Sign Out</button>
        </div>
      </aside>
      <main className="main-content">
        <div className="top-bar">
          <div className="top-bar-breadcrumb"><span>NutriGrid</span><ChevronRight size={13}/><span className="current">{pt.title}</span></div>
          <div className="top-bar-right">
            {pwaEvt&&<button className="pwa-install-btn" onClick={handleInstall}><Download size={13}/> Install App</button>}
            <button className="btn-ghost" onClick={()=>setPage("landing")} style={{fontSize:12}}>← Home</button>
            <div className="ai-status"><div className="status-dot"/>WHO LMS ACTIVE</div>
          </div>
        </div>
        <div className="page-body">
          <div className="page-title-bar"><div><h2>{pt.title}</h2><p>{pt.sub}</p></div>{user&&<div style={{fontSize:11.5,color:"#7A92A8",textAlign:"right",fontFamily:"IBM Plex Mono"}}>{user.emoji} {user.name}<br/><span style={{fontSize:10}}>{user.role}</span></div>}</div>
          {screen==="dashboard"&&<Dashboard children={children} grades={grades} stats={stats} goDetail={goDetail}/>}
          {screen==="children" &&<ChildrenList children={children} grades={grades} goDetail={goDetail} setScreen={setScreen}/>}
          {screen==="add"      &&<AddRecord onAdd={handleAdd}/>}
          {screen==="analytics"&&<Analytics children={children} grades={grades} stats={stats}/>}
          {screen==="detail"   &&<Detail child={selected} grades={grades} setScreen={setScreen}/>}
        </div>
      </main>
      <nav className="mobile-nav"><div className="mobile-nav-inner">{NAV.map(({id,label,Icon})=>(<button key={id} className={`mobile-nav-item ${screen===id?"active":""}`} onClick={()=>setScreen(id)}><Icon size={18}/> {label}</button>))}</div></nav>
    </div>
  );
}
