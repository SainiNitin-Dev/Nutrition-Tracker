import { addNutrientTotals } from "@/lib/nutrition/math";
import { prisma } from "@/lib/prisma/client";
import { demoCoachUserEmail } from "@/features/coach/context";

export async function getMealTrackerData() {
  const user = await prisma.user.findUniqueOrThrow({
    where: { email: demoCoachUserEmail },
    include: {
      goals: {
        where: { isActive: true },
        take: 1,
        orderBy: { createdAt: "desc" },
      },
      meals: {
        where: {
          date: {
            gte: startOfToday(),
            lt: startOfTomorrow(),
          },
        },
        include: { items: true },
        orderBy: { date: "desc" },
      },
    },
  });

  const meals = user.meals.map((meal) => {
    const totals = addNutrientTotals(
      meal.items.map((item) => ({
        calories: Number(item.calories),
        protein: Number(item.protein),
        carbs: Number(item.carbs),
        fat: Number(item.fat),
        fiber: Number(item.fiber ?? 0),
        sugar: Number(item.sugar ?? 0),
        sodium: Number(item.sodium ?? 0),
      })),
    );

    return {
      id: meal.id,
      title: meal.title ?? meal.mealType,
      mealType: meal.mealType,
      time: meal.date.toLocaleTimeString("en-US", {
        hour: "numeric",
        minute: "2-digit",
      }),
      items: meal.items.map((item) => ({
        id: item.id,
        name: item.name,
        quantity: Number(item.quantity),
        unit: item.unit,
      })),
      totals,
    };
  });

  const totals = addNutrientTotals(meals.map((meal) => meal.totals));
  const goal = user.goals[0];

  return {
    userName: user.name ?? "Alex",
    calorieGoal: goal?.targetCalories ?? 2300,
    proteinGoal: Number(goal?.proteinGrams ?? 165),
    meals,
    totals,
  };
}

function startOfToday() {
  const date = new Date();
  date.setHours(0, 0, 0, 0);
  return date;
}

function startOfTomorrow() {
  const date = startOfToday();
  date.setDate(date.getDate() + 1);
  return date;
}
