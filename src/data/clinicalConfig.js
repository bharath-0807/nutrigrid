// ══════════════════════════════════════════════════════════════
// Clinical Configuration — Grade styling, navigation, chart,
// clinical recommendations, and initial demo data
// ══════════════════════════════════════════════════════════════

import {
  LayoutDashboard, Users, PlusCircle, BarChart2,
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
  { id: "children",  label: "Children",   Icon: Users },
  { id: "add",       label: "Add Record", Icon: PlusCircle },
  { id: "analytics", label: "Analytics",  Icon: BarChart2 },
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

// Initial demo children
export const INIT_CHILDREN = [
  {
    id: 1, name: "Aarav Kumar", age: 24, gender: "boys", village: "Block A",
    records: [
      { month: 0, weight: 3.2, height: 49.5 },
      { month: 6, weight: 6.8, height: 64.0 },
      { month: 12, weight: 8.5, height: 72.0 },
      { month: 18, weight: 9.8, height: 78.0 },
      { month: 24, weight: 10.9, height: 83.0 },
    ],
  },
  {
    id: 2, name: "Priya Selvi", age: 36, gender: "girls", village: "Block B",
    records: [
      { month: 0, weight: 2.8, height: 47.5 },
      { month: 6, weight: 5.2, height: 61.0 },
      { month: 12, weight: 6.8, height: 69.0 },
      { month: 18, weight: 8.0, height: 75.0 },
      { month: 24, weight: 9.0, height: 81.0 },
      { month: 30, weight: 10.0, height: 87.0 },
      { month: 36, weight: 11.2, height: 91.5 },
    ],
  },
  {
    id: 3, name: "Rajan Murugan", age: 18, gender: "boys", village: "Block A",
    records: [
      { month: 0, weight: 2.4, height: 46.0 },
      { month: 6, weight: 5.8, height: 63.0 },
      { month: 12, weight: 7.2, height: 70.0 },
      { month: 18, weight: 7.5, height: 74.0 },
    ],
  },
  {
    id: 4, name: "Meena Devi", age: 48, gender: "girls", village: "Block C",
    records: [
      { month: 0, weight: 3.1, height: 49.0 },
      { month: 12, weight: 9.2, height: 73.5 },
      { month: 24, weight: 11.8, height: 85.0 },
      { month: 36, weight: 13.9, height: 94.0 },
      { month: 48, weight: 16.1, height: 102.5 },
    ],
  },
];
