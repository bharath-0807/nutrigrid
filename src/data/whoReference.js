// ══════════════════════════════════════════════════════════════
// WHO Growth Reference Curves for Chart Display
// Source: WHO Child Growth Standards (2006)
// ══════════════════════════════════════════════════════════════

export const WHO_REF = {
  boys: {
    weight: [
      { age: 0,  med: 3.3,  sd2n: 2.5,  sd3n: 2.1 },
      { age: 6,  med: 7.9,  sd2n: 6.4,  sd3n: 5.7 },
      { age: 12, med: 10.2, sd2n: 8.6,  sd3n: 7.7 },
      { age: 24, med: 12.7, sd2n: 10.8, sd3n: 9.7 },
      { age: 36, med: 14.9, sd2n: 12.7, sd3n: 11.4 },
      { age: 48, med: 16.9, sd2n: 14.4, sd3n: 13.0 },
      { age: 60, med: 18.3, sd2n: 15.7, sd3n: 14.1 },
    ],
    height: [
      { age: 0,  med: 49.9, sd2n: 46.1, sd3n: 44.2 },
      { age: 6,  med: 67.6, sd2n: 63.3, sd3n: 61.7 },
      { age: 12, med: 75.7, sd2n: 71.0, sd3n: 69.6 },
      { age: 24, med: 87.8, sd2n: 83.5, sd3n: 81.7 },
      { age: 36, med: 96.1, sd2n: 91.1, sd3n: 88.7 },
      { age: 48, med: 103.3, sd2n: 97.7, sd3n: 94.9 },
      { age: 60, med: 110.0, sd2n: 103.9, sd3n: 100.7 },
    ],
  },
  girls: {
    weight: [
      { age: 0,  med: 3.2,  sd2n: 2.4,  sd3n: 2.0 },
      { age: 6,  med: 7.3,  sd2n: 5.9,  sd3n: 5.3 },
      { age: 12, med: 9.5,  sd2n: 7.9,  sd3n: 7.0 },
      { age: 24, med: 12.1, sd2n: 10.2, sd3n: 9.0 },
      { age: 36, med: 14.3, sd2n: 12.1, sd3n: 10.8 },
      { age: 48, med: 16.4, sd2n: 13.9, sd3n: 12.3 },
      { age: 60, med: 18.3, sd2n: 15.5, sd3n: 13.7 },
    ],
    height: [
      { age: 0,  med: 49.1, sd2n: 45.4, sd3n: 43.6 },
      { age: 6,  med: 65.7, sd2n: 61.2, sd3n: 59.8 },
      { age: 12, med: 74.0, sd2n: 70.0, sd3n: 68.9 },
      { age: 24, med: 86.4, sd2n: 81.7, sd3n: 80.0 },
      { age: 36, med: 95.1, sd2n: 90.0, sd3n: 87.4 },
      { age: 48, med: 102.7, sd2n: 96.9, sd3n: 94.1 },
      { age: 60, med: 109.4, sd2n: 103.0, sd3n: 99.9 },
    ],
  },
};
