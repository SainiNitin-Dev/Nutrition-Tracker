export type NutrientTotals = {
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  fiber?: number;
  sugar?: number;
  sodium?: number;
};

export function calculateProgress(current: number, goal: number): number {
  if (goal <= 0) {
    return 0;
  }

  return Math.round((current / goal) * 100);
}

export function clampPercent(value: number): number {
  return Math.max(0, Math.min(value, 100));
}

export function addNutrientTotals(items: NutrientTotals[]): NutrientTotals {
  return items.reduce<NutrientTotals>(
    (total, item) => ({
      calories: total.calories + item.calories,
      protein: total.protein + item.protein,
      carbs: total.carbs + item.carbs,
      fat: total.fat + item.fat,
      fiber: (total.fiber ?? 0) + (item.fiber ?? 0),
      sugar: (total.sugar ?? 0) + (item.sugar ?? 0),
      sodium: (total.sodium ?? 0) + (item.sodium ?? 0),
    }),
    {
      calories: 0,
      protein: 0,
      carbs: 0,
      fat: 0,
      fiber: 0,
      sugar: 0,
      sodium: 0,
    },
  );
}
