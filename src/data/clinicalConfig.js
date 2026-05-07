// ══════════════════════════════════════════════════════════════
// Clinical Configuration — Grade styling, navigation, chart,
// clinical recommendations, and initial demo data
// ══════════════════════════════════════════════════════════════

import {
  LayoutDashboard, Users, PlusCircle, BarChart2, BookOpen
} from "lucide-react";

// WHO Grade display configuration
export const GRADE_CFG = {
  SAM: {
    chip: "chip-sam",
    col: "#B03A2E",
    bg: "#FDEDEC",
    border: "#F1948A",
    dot: "#B03A2E",
    full: "Severe Acute Malnutrition",
    priority: 1,
  },
  MAM: {
    chip: "chip-mam",
    col: "#CA6F1E",
    bg: "#FEF5E7",
    border: "#F0B27A",
    dot: "#CA6F1E",
    full: "Moderate Acute Malnutrition",
    priority: 2,
  },
  Normal: {
    chip: "chip-normal",
    col: "#1E8449",
    bg: "#E9F7EF",
    border: "#82E0AA",
    dot: "#1E8449",
    full: "Normal Nutritional Status",
    priority: 4,
  },
};

// ICDS Clinical Recommendations per grade
export const CLINICAL_RECS = {
  SAM: [
    "URGENT: Refer immediately to NRC / District Hospital — RUTF F-75/F-100 protocol",
    "Check bilateral pitting oedema and MUAC (< 11.5 cm confirms SAM)",
    "Weekly mandatory follow-up — notify CDPO and District Health Officer",
    "Screen for complications: dehydration, hypothermia, hypoglycaemia",
    "Register in ICDS SAM tracking register immediately",
  ],
  MAM: [
    "Enrol in Supplementary Nutrition Programme (SNP) — Bal Shakti ration",
    "Provide RUSF or fortified blended foods as per state nutrition guidelines",
    "Bi-weekly anthropometric monitoring and dietary recall",
    "IYCF counselling — minimum dietary diversity, meal frequency",
    "Refer to PHC if no improvement after 8 weeks",
  ],
  Normal: [
    "Continue monthly WHO anthropometric monitoring per ICDS schedule",
    "Reinforce IYCF practices — age-appropriate feeding counselling",
    "Verify completion of National Immunisation Schedule",
    "Document Vitamin A supplementation and deworming status",
  ],
};

// Sidebar navigation items
export const NAV = [
  { id: "dashboard", label: "Dashboard",  Icon: LayoutDashboard },
  { id: "children",  label: "Register",   Icon: Users },
  { id: "add",       label: "Add Record", Icon: PlusCircle },
  { id: "analytics", label: "Analytics",  Icon: BarChart2 },
  { id: "docs",      label: "WHO Limits", Icon: BookOpen },
];

// Recharts shared styling
export const CHART_STYLES = {
  tooltip: {
    contentStyle: {
      background: "#fff",
      border: "1px solid #D0D9E4",
      borderRadius: 4,
      fontSize: 12,
      fontFamily: "IBM Plex Sans",
      boxShadow: "0 2px 8px rgba(0,40,80,0.10)",
    },
  },
  grid: "#E8EDF3",
  axis: {
    fontSize: 11,
    fill: "#7A92A8",
    fontFamily: "IBM Plex Sans",
  },
};

// Enterprise Demo Data for Judges' Review (RBAC, Audit, Medical)
export const INIT_CHILDREN = [
  {
    id: "1", nutrigridId: "NG-2026-001", name: "Aarav Kumar", age: 30, gender: "boys", village: "Block A", anganwadi_id: "AW-COIM-101",
    medicalConditions: ["None"], vaccinationStatus: "Fully Vaccinated",
    records: [
      { month: 24, weight: 11.5, height: 86.0, enteredBy: "Worker 1", updatedAt: new Date("2025-10-15").toISOString() },
      { month: 30, weight: 12.5, height: 90.0, enteredBy: "Worker 1", updatedAt: new Date("2026-04-15").toISOString() }, // Normal
    ],
  },
  {
    id: "2", nutrigridId: "NG-2026-002", name: "Priya Selvi", age: 36, gender: "girls", village: "Block B", anganwadi_id: "AW-COIM-101",
    medicalConditions: ["Peanut Allergy"], vaccinationStatus: "Pending Polio",
    records: [
      { month: 30, weight: 10.0, height: 88.0, enteredBy: "Worker 1", updatedAt: new Date("2025-10-20").toISOString() },
      { month: 36, weight: 10.5, height: 92.0, enteredBy: "Worker 1", updatedAt: new Date("2026-04-20").toISOString() }, // MAM Case
    ],
  },
  {
    id: "3", nutrigridId: "NG-2026-003", name: "Rajan Murugan", age: 48, gender: "boys", village: "Block A", anganwadi_id: "AW-COIM-101",
    medicalConditions: ["Type 1 Diabetes"], vaccinationStatus: "Fully Vaccinated",
    records: [
      { month: 36, weight: 12.0, height: 92.0, enteredBy: "Worker 1", updatedAt: new Date("2025-04-10").toISOString() },
      { month: 48, weight: 11.0, height: 95.0, enteredBy: "Worker 1", updatedAt: new Date("2026-04-10").toISOString() }, // SAM Case
    ],
  },
  {
    id: "4", nutrigridId: "NG-2026-004", name: "Kiran Dev", age: 60, gender: "transgender", sexAtBirth: "boys", village: "Block C", anganwadi_id: "AW-COIM-101",
    medicalConditions: ["None"], vaccinationStatus: "Fully Vaccinated",
    records: [
      { month: 48, weight: 15.0, height: 102.0, enteredBy: "Worker 1", updatedAt: new Date("2025-04-05").toISOString() },
      { month: 60, weight: 17.5, height: 108.0, enteredBy: "Worker 1", updatedAt: new Date("2026-04-05").toISOString() }, // Normal, Transgender rep
    ],
  },
  {
    id: "5", nutrigridId: "NG-2026-005", name: "Arun J.", age: 42, gender: "boys", village: "Block B", anganwadi_id: "AW-COIM-102",
    medicalConditions: ["Asthma"], vaccinationStatus: "Fully Vaccinated",
    records: [
      { month: 36, weight: 12.5, height: 93.0, enteredBy: "Worker 2", updatedAt: new Date("2025-10-12").toISOString() },
      { month: 42, weight: 12.0, height: 95.0, enteredBy: "Worker 2", updatedAt: new Date("2026-04-12").toISOString() }, // MAM Case (Different Anganwadi)
    ],
  },
  {
    id: "6", nutrigridId: "NG-2026-006", name: "Kavitha R.", age: 54, gender: "girls", village: "Block A", anganwadi_id: "AW-COIM-101",
    medicalConditions: ["Differently Abled"], vaccinationStatus: "Fully Vaccinated",
    records: [
      { month: 48, weight: 13.0, height: 98.0, enteredBy: "Worker 1", updatedAt: new Date("2025-10-01").toISOString() },
      { month: 54, weight: 11.5, height: 97.0, enteredBy: "Worker 1", updatedAt: new Date("2026-04-01").toISOString() }, // SAM Case
    ],
  },
  {
    id: "7", nutrigridId: "NG-2026-007", name: "Vikram S.", age: 32, gender: "boys", village: "Block C", anganwadi_id: "AW-COIM-102",
    medicalConditions: ["None"], vaccinationStatus: "Pending Measles",
    records: [
      { month: 24, weight: 11.8, height: 87.0, enteredBy: "Worker 2", updatedAt: new Date("2025-08-11").toISOString() },
      { month: 32, weight: 14.0, height: 94.0, enteredBy: "Worker 2", updatedAt: new Date("2026-04-11").toISOString() }, // Normal
    ],
  },
  {
    id: "8", nutrigridId: "NG-2026-008", name: "Lakshmi M.", age: 38, gender: "girls", village: "Block A", anganwadi_id: "AW-COIM-101",
    medicalConditions: ["None"], vaccinationStatus: "Fully Vaccinated",
    records: [
      { month: 30, weight: 10.5, height: 89.0, enteredBy: "Worker 1", updatedAt: new Date("2025-08-08").toISOString() },
      { month: 38, weight: 11.0, height: 94.0, enteredBy: "Worker 1", updatedAt: new Date("2026-04-08").toISOString() }, // MAM Case
    ],
  },
];
