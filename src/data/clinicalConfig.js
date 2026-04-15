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
  { id: "children",  label: "Children",   Icon: Users },
  { id: "add",       label: "Add Record", Icon: PlusCircle },
  { id: "analytics", label: "Analytics",  Icon: BarChart2 },
  { id: "docs",      label: "Medical & WHO Limits", Icon: BookOpen },
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

// Initial demo children for judges' review
export const INIT_CHILDREN = [
  {
    id: "1", name: "Aarav Kumar", age: 24, gender: "boys", village: "Block A",
    records: [
      { month: 0, weight: 3.2, height: 49.5 },
      { month: 12, weight: 8.5, height: 72.0 },
      { month: 24, weight: 10.9, height: 83.0 },
    ],
  },
  {
    id: "2", name: "Priya Selvi", age: 36, gender: "girls", village: "Block B",
    records: [
      { month: 0, weight: 2.8, height: 47.5 },
      { month: 24, weight: 9.0, height: 81.0 },
      { month: 36, weight: 11.2, height: 91.5 },
    ],
  },
  {
    id: "3", name: "Rajan Murugan", age: 12, gender: "boys", village: "Block A",
    records: [
      { month: 0, weight: 3.4, height: 50.0 },
      { month: 6, weight: 6.2, height: 65.0 },
      { month: 12, weight: 7.4, height: 72.0 }, // SAM Case (Weight < 8.6kg at 12m)
    ],
  },
  {
    id: "4", name: "Meena Devi", age: 48, gender: "girls", village: "Block C",
    records: [
      { month: 0, weight: 3.1, height: 49.0 },
      { month: 24, weight: 11.8, height: 85.0 },
      { month: 48, weight: 16.1, height: 102.5 },
    ],
  },
  {
    id: "5", name: "Arun J.", age: 8, gender: "boys", village: "Block B",
    records: [
      { month: 0, weight: 3.3, height: 50.5 },
      { month: 8, weight: 7.1, height: 68.0 }, // MAM Case (Weight < 7.5kg at 8m)
    ],
  },
  {
    id: "6", name: "Kavitha R.", age: 14, gender: "girls", village: "Block A",
    records: [
      { month: 0, weight: 3.0, height: 49.0 },
      { month: 14, weight: 8.8, height: 75.0 }, // MAM Case
    ],
  },
  {
    id: "7", name: "Vikram S.", age: 3, gender: "boys", village: "Block C",
    records: [
      { month: 0, weight: 3.5, height: 51.0 },
      { month: 3, weight: 5.2, height: 60.0 }, // SAM Height growth delay
    ],
  },
  {
    id: "8", name: "Lakshmi M.", age: 5, gender: "girls", village: "Block A",
    records: [
      { month: 0, weight: 3.1, height: 49.2 },
      { month: 5, weight: 5.8, height: 62.1 }, // Borderline MAM
    ],
  },
];
