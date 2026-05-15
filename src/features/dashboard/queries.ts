import { getCurrentOrDemoUserWhereUnique } from "@/lib/auth/current-user";
import { prisma } from "@/lib/prisma/client";
import { addNutrientTotals } from "@/lib/nutrition/math";
import { dashboardSnapshot } from "./data";
import type { DashboardSnapshot } from "./data";

export async function getTodayDashboardSnapshot(): Promise<DashboardSnapshot> {
  const userWhere = await getCurrentOrDemoUserWhereUnique();
  const today = startOfToday();
  const tomorrow = startOfTomorrow();
  const weekStart = startOfDayOffset(-6);
  const user = await prisma.user.findUnique({
    where: userWhere,
    include: {
      goals: {
        where: { isActive: true },
        take: 1,
        orderBy: { createdAt: "desc" },
      },
      meals: {
        where: {
          date: {
            gte: weekStart,
            lt: tomorrow,
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
            gte: weekStart,
            lt: tomorrow,
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
                gte: today,
                lt: tomorrow,
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
  const mealsWithTotals = user.meals.map((meal) => ({
    meal,
    totals: addNutrientTotals(
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
  }));
  const todayMeals = mealsWithTotals.filter(({ meal }) => meal.date >= today);
  const totals = addNutrientTotals(todayMeals.map(({ totals }) => totals));
  const hydrationTotal = user.hydrationLogs.reduce(
    (sum, log) => (log.loggedAt >= today ? sum + log.amountMl : sum),
    0,
  );
  const weeklyCalories = lastSevenDays().map(({ start, end }) =>
    Math.round(
      mealsWithTotals
        .filter(({ meal }) => meal.date >= start && meal.date < end)
        .reduce((sum, { totals }) => sum + totals.calories, 0),
    ),
  );
  const activeDays = lastSevenDays().map(({ start, end }) => {
    const hasMeal = mealsWithTotals.some(
      ({ meal }) => meal.date >= start && meal.date < end,
    );
    const hasHydration = user.hydrationLogs.some(
      (log) => log.loggedAt >= start && log.loggedAt < end,
    );

    return hasMeal || hasHydration;
  });
  const streak = calculateCurrentStreak(activeDays);
  const waterGoal = goal?.waterMl ?? dashboardSnapshot.hydration.goalMl;
  const fiberGoal = Number(
    goal?.fiberGrams ??
      dashboardSnapshot.macros.find((macro) => macro.label === "Fiber")?.goal ??
      35,
  );
  const supplementTotal = user.supplements.length;
  const supplementTaken = user.supplements.filter((supplement) =>
    supplement.logs.some((log) => log.status === "taken"),
  ).length;
  const supplementPercent = supplementTotal
    ? Math.round((supplementTaken / supplementTotal) * 100)
    : 0;
  const hydratedWeekDays = lastSevenDays().filter(({ start, end }) => {
    const dailyTotal = user.hydrationLogs.reduce(
      (sum, log) =>
        log.loggedAt >= start && log.loggedAt < end ? sum + log.amountMl : sum,
      0,
    );

    return dailyTotal >= waterGoal * 0.8;
  }).length;
  const weeklyHydrationPercent = Math.round((hydratedWeekDays / 7) * 100);
  const hydrationPercent = Math.round((hydrationTotal / waterGoal) * 100);
  const fiberTotal = totals.fiber ?? 0;
  const fiberPercent = Math.round((fiberTotal / fiberGoal) * 100);
  const calorieGoal = goal?.targetCalories ?? dashboardSnapshot.calories.goal;

  return {
    ...dashboardSnapshot,
    userName: user.name ?? "Alex",
    dateLabel: formatTodayLabel(),
    calories: {
      current: Math.round(totals.calories),
      goal: calorieGoal,
      remaining: Math.max(calorieGoal - Math.round(totals.calories), 0),
    },
    macros: dashboardSnapshot.macros.map((macro) => {
      const goals = {
        Protein: Number(goal?.proteinGrams ?? macro.goal),
        Carbs: Number(goal?.carbsGrams ?? macro.goal),
        Fats: Number(goal?.fatGrams ?? macro.goal),
        Fiber: fiberGoal,
      };
      const currents = {
        Protein: Math.round(totals.protein),
        Carbs: Math.round(totals.carbs),
        Fats: Math.round(totals.fat),
        Fiber: Math.round(fiberTotal),
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
      goalMl: waterGoal,
    },
    meals: todayMeals.map(({ meal, totals }, index) => ({
      name: formatMealType(meal.mealType),
      time: meal.date.toLocaleTimeString("en-US", {
        hour: "numeric",
        minute: "2-digit",
      }),
      calories: Math.round(totals.calories),
      protein: Math.round(totals.protein),
      accent: dashboardSnapshot.meals[index]?.accent ?? "#3b82f6",
      items: meal.items.map((item) => item.name),
    })),
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
    weeklyCalories,
    signals: dashboardSnapshot.signals.map((signal) => {
      if (signal.label === "Streak") {
        return {
          ...signal,
          value: `${streak} ${streak === 1 ? "day" : "days"}`,
        };
      }

      if (signal.label === "Hydration") {
        return {
          ...signal,
          value: `${Math.min(Math.max(weeklyHydrationPercent, hydrationPercent), 100)}%`,
        };
      }

      if (signal.label === "Fiber") {
        return {
          ...signal,
          value: `${Math.min(fiberPercent, 100)}%`,
        };
      }

      if (signal.label === "Supplements") {
        return {
          ...signal,
          value: supplementTotal ? `${supplementPercent}%` : "None",
        };
      }

      return signal;
    }),
    insights:
      user.memories.length > 0
        ? user.memories.map((memory) => memory.content)
        : buildFallbackInsights({
            caloriesRemaining: calorieGoal - Math.round(totals.calories),
            hydrationPercent,
            supplementPercent,
            supplementTotal,
          }),
  };
}

function buildFallbackInsights({
  caloriesRemaining,
  hydrationPercent,
  supplementPercent,
  supplementTotal,
}: {
  caloriesRemaining: number;
  hydrationPercent: number;
  supplementPercent: number;
  supplementTotal: number;
}) {
  const insights = [
    caloriesRemaining > 0
      ? `You have about ${caloriesRemaining} calories left for today.`
      : "You are at or above today's calorie target, so keep the rest of the day lighter.",
    hydrationPercent >= 80
      ? "Hydration is on pace today."
      : "Hydration is behind pace. A 500 ml add would move the day forward.",
  ];

  if (supplementTotal > 0) {
    insights.push(`Supplement adherence is ${supplementPercent}% today.`);
  } else {
    insights.push("No supplements are scheduled yet.");
  }

  return insights;
}

function calculateCurrentStreak(activeDays: boolean[]) {
  let streak = 0;

  for (let index = activeDays.length - 1; index >= 0; index -= 1) {
    if (!activeDays[index]) {
      break;
    }

    streak += 1;
  }

  return streak;
}

function lastSevenDays() {
  return Array.from({ length: 7 }, (_, index) => {
    const start = startOfDayOffset(index - 6);
    const end = new Date(start);
    end.setDate(end.getDate() + 1);

    return { start, end };
  });
}

function startOfDayOffset(offset: number) {
  const date = startOfToday();
  date.setDate(date.getDate() + offset);
  return date;
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

function formatTodayLabel() {
  return new Intl.DateTimeFormat("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
  }).format(new Date());
}

function formatMealType(mealType: string) {
  return mealType.charAt(0).toUpperCase() + mealType.slice(1);
}
