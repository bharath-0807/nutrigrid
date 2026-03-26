// ══════════════════════════════════════════════════════════════
// ICMR Food Composition Table (Indian foods)
// Source: ICMR-NIN Nutritive Value of Indian Foods (2017)
// Per 100g values: cal(kcal), pro(g), iron(mg),
//                  vitA(mcg), zinc(mg), cal2=calcium(mg)
// ══════════════════════════════════════════════════════════════

export const ICMR_FOODS = [
  // Cereals
  { id: "rice",    name: "Rice (cooked)",     unit: "bowl(150g)", grams: 150, cal: 195, pro: 4.0, iron: 0.5, vitA: 0,   zinc: 0.8, cal2: 10,  emoji: "🍚" },
  { id: "roti",    name: "Wheat Roti",        unit: "piece(30g)", grams: 30,  cal: 90,  pro: 2.7, iron: 0.9, vitA: 0,   zinc: 0.5, cal2: 10,  emoji: "🫓" },
  { id: "idli",    name: "Idli",              unit: "piece(40g)", grams: 40,  cal: 58,  pro: 2.0, iron: 0.6, vitA: 0,   zinc: 0.3, cal2: 8,   emoji: "🫓" },
  { id: "dosa",    name: "Dosa",              unit: "piece(50g)", grams: 50,  cal: 78,  pro: 2.5, iron: 0.7, vitA: 0,   zinc: 0.4, cal2: 8,   emoji: "🫓" },
  { id: "upma",    name: "Upma (semolina)",   unit: "bowl(100g)", grams: 100, cal: 145, pro: 4.0, iron: 1.5, vitA: 0,   zinc: 0.7, cal2: 15,  emoji: "🍲" },
  // Pulses / Protein
  { id: "dal",     name: "Dal (cooked)",      unit: "bowl(100g)", grams: 100, cal: 116, pro: 7.6, iron: 3.0, vitA: 3,   zinc: 1.0, cal2: 30,  emoji: "🍲" },
  { id: "egg",     name: "Egg (whole)",       unit: "egg(50g)",   grams: 50,  cal: 77,  pro: 6.3, iron: 0.9, vitA: 90,  zinc: 0.6, cal2: 25,  emoji: "🥚" },
  { id: "milk",    name: "Cow's Milk",        unit: "glass(200ml)",grams: 200, cal: 130, pro: 6.6, iron: 0.2, vitA: 60,  zinc: 0.8, cal2: 240, emoji: "🥛" },
  { id: "curd",    name: "Curd / Yoghurt",    unit: "bowl(100g)", grams: 100, cal: 98,  pro: 3.1, iron: 0.2, vitA: 28,  zinc: 0.5, cal2: 120, emoji: "🥛" },
  { id: "chicken", name: "Chicken (cooked)",  unit: "piece(60g)", grams: 60,  cal: 114, pro: 14.4,iron: 0.8, vitA: 18,  zinc: 1.4, cal2: 8,   emoji: "🍗" },
  { id: "fish",    name: "Fish (cooked)",     unit: "piece(60g)", grams: 60,  cal: 78,  pro: 13.2,iron: 1.0, vitA: 30,  zinc: 0.8, cal2: 30,  emoji: "🐟" },
  // Vegetables
  { id: "greens",  name: "Green Leafy Veg",   unit: "bowl(50g)",  grams: 50,  cal: 26,  pro: 2.5, iron: 2.5, vitA: 265, zinc: 0.3, cal2: 190, emoji: "🥬" },
  { id: "carrot",  name: "Carrot",            unit: "medium(60g)",grams: 60,  cal: 25,  pro: 0.6, iron: 0.4, vitA: 503, zinc: 0.2, cal2: 20,  emoji: "🥕" },
  { id: "tomato",  name: "Tomato",            unit: "medium(80g)",grams: 80,  cal: 18,  pro: 0.9, iron: 0.5, vitA: 42,  zinc: 0.2, cal2: 10,  emoji: "🍅" },
  { id: "potato",  name: "Potato (boiled)",   unit: "medium(80g)",grams: 80,  cal: 77,  pro: 1.6, iron: 0.4, vitA: 0,   zinc: 0.3, cal2: 8,   emoji: "🥔" },
  // Fruits
  { id: "banana",  name: "Banana",            unit: "medium(80g)",grams: 80,  cal: 73,  pro: 0.9, iron: 0.3, vitA: 3,   zinc: 0.2, cal2: 5,   emoji: "🍌" },
  { id: "mango",   name: "Mango",             unit: "slice(80g)", grams: 80,  cal: 50,  pro: 0.5, iron: 0.2, vitA: 383, zinc: 0.1, cal2: 11,  emoji: "🥭" },
  { id: "papaya",  name: "Papaya",            unit: "slice(80g)", grams: 80,  cal: 32,  pro: 0.5, iron: 0.2, vitA: 204, zinc: 0.1, cal2: 24,  emoji: "🍊" },
  // Others
  { id: "peanut",  name: "Groundnut/Peanut",  unit: "tbsp(15g)",  grams: 15,  cal: 85,  pro: 3.8, iron: 0.6, vitA: 0,   zinc: 0.6, cal2: 12,  emoji: "🥜" },
  { id: "jaggery", name: "Jaggery",           unit: "tsp(10g)",   grams: 10,  cal: 38,  pro: 0.1, iron: 2.8, vitA: 0,   zinc: 0.1, cal2: 8,   emoji: "🟤" },
];

// Food groups for the diet UI
export const FOOD_GROUPS = [
  { label: "🍚 Cereals",    ids: ["rice", "roti", "idli", "dosa", "upma"] },
  { label: "🥚 Protein",    ids: ["dal", "egg", "milk", "curd", "chicken", "fish"] },
  { label: "🥬 Vegetables", ids: ["greens", "carrot", "tomato", "potato"] },
  { label: "🍌 Fruits",     ids: ["banana", "mango", "papaya"] },
  { label: "🥜 Others",     ids: ["peanut", "jaggery"] },
];
