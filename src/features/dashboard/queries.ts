import { prisma } from "@/lib/prisma/client";
import { addNutrientTotals } from "@/lib/nutrition/math";
import { dashboardSnapshot } from "./data";
import type { DashboardSnapshot } from "./data";

const demoUserEmail = "alex.demo@nourish.local";

export async function getTodayDashboardSnapshot(): Promise<DashboardSnapshot> {
  const user = await prisma.user.findUnique({
    where: { email: demoUserEmail },
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
        include: {
          items: true,
        },
        orderBy: { date: "asc" },
      },
      hydrationLogs: {
        where: {
          loggedAt: {
            gte: startOfToday(),
            lt: startOfTomorrow(),
          },
        },
      },
      supplements: {
        where: { active: true },
        include: {
          schedules: true,
          logs: {
            where: {
              takenAt: {
                gte: startOfToday(),
                lt: startOfTomorrow(),
              },
            },
          },
        },
        orderBy: { createdAt: "asc" },
      },
      memories: {
        take: 3,
        orderBy: [{ importance: "desc" }, { updatedAt: "desc" }],
      },
    },
  });

  if (!user) {
    return dashboardSnapshot;
  }

  const goal = user.goals[0];
  const mealTotals = user.meals.map((meal) =>
    addNutrientTotals(
      meal.items.map((item) => ({
        calories: Number(item.calories),
        protein: Number(item.protein),
        carbs: Number(item.carbs),
        fat: Number(item.fat),
        fiber: Number(item.fiber ?? 0),
        sugar: Number(item.sugar ?? 0),
        sodium: Number(item.sodium ?? 0),
      })),
    ),
  );
  const totals = addNutrientTotals(mealTotals);
  const hydrationTotal = user.hydrationLogs.reduce(
    (sum, log) => sum + log.amountMl,
    0,
  );

  return {
    ...dashboardSnapshot,
    userName: user.name ?? "Alex",
    calories: {
      current: Math.round(totals.calories),
      goal: goal?.targetCalories ?? dashboardSnapshot.calories.goal,
      remaining: Math.max(
        (goal?.targetCalories ?? dashboardSnapshot.calories.goal) -
          Math.round(totals.calories),
        0,
      ),
    },
    macros: dashboardSnapshot.macros.map((macro) => {
      const goals = {
        Protein: Number(goal?.proteinGrams ?? macro.goal),
        Carbs: Number(goal?.carbsGrams ?? macro.goal),
        Fats: Number(goal?.fatGrams ?? macro.goal),
        Fiber: Number(goal?.fiberGrams ?? macro.goal),
      };
      const currents = {
        Protein: Math.round(totals.protein),
        Carbs: Math.round(totals.carbs),
        Fats: Math.round(totals.fat),
        Fiber: Math.round(totals.fiber ?? 0),
      };

      return {
        ...macro,
        current: currents[macro.label as keyof typeof currents],
        goal: goals[macro.label as keyof typeof goals],
      };
    }),
    hydration: {
      ...dashboardSnapshot.hydration,
      currentMl: hydrationTotal,
      goalMl: goal?.waterMl ?? dashboardSnapshot.hydration.goalMl,
    },
    meals: user.meals.map((meal, index) => {
      const total = mealTotals[index];

      return {
        name: formatMealType(meal.mealType),
        time: meal.date.toLocaleTimeString("en-US", {
          hour: "numeric",
          minute: "2-digit",
        }),
        calories: Math.round(total.calories),
        protein: Math.round(total.protein),
        accent: dashboardSnapshot.meals[index]?.accent ?? "#3b82f6",
        items: meal.items.map((item) => item.name),
      };
    }),
    supplements: user.supplements.map((supplement) => {
      const log = supplement.logs[0];
      const schedule = supplement.schedules[0];

      return {
        name: supplement.name,
        dose: `${Number(supplement.dosageAmount)} ${supplement.dosageUnit}`,
        time: schedule?.timeOfDay ?? "Anytime",
        status: log?.status === "taken" ? "taken" : "upcoming",
      };
    }),
    insights:
      user.memories.length > 0
        ? user.memories.map((memory) => memory.content)
        : dashboardSnapshot.insights,
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

function formatMealType(mealType: string) {
  return mealType.charAt(0).toUpperCase() + mealType.slice(1);
}
