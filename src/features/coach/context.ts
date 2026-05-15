import { getCurrentOrDemoAppUser } from "@/lib/auth/current-user";
import { prisma } from "@/lib/prisma/client";
import { addNutrientTotals } from "@/lib/nutrition/math";
import { demoUserEmail } from "@/lib/demo";

export const demoCoachUserEmail = demoUserEmail;

export async function getCoachNutritionContext() {
  const currentUser = await getCurrentOrDemoAppUser();
  const user = await prisma.user.findUnique({
    where: { id: currentUser.id },
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
        orderBy: { date: "asc" },
      },
      hydrationLogs: {
        where: {
          loggedAt: {
            gte: startOfToday(),
            lt: startOfTomorrow(),
          },
        },
        orderBy: { loggedAt: "asc" },
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
        take: 6,
        orderBy: [{ importance: "desc" }, { updatedAt: "desc" }],
      },
    },
  });

  if (!user) {
    throw new Error("Demo coach user has not been seeded.");
  }

  const goal = user.goals[0];
  const mealSummaries = user.meals.map((meal) => {
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
      mealType: meal.mealType,
      title: meal.title ?? meal.mealType,
      time: meal.date.toISOString(),
      items: meal.items.map((item) => item.name),
      totals,
    };
  });

  const dailyTotals = addNutrientTotals(
    mealSummaries.map((meal) => meal.totals),
  );
  const hydrationMl = user.hydrationLogs.reduce(
    (sum, log) => sum + log.amountMl,
    0,
  );

  return {
    user: {
      id: user.id,
      name: user.name ?? "Alex",
      email: user.email,
    },
    goal: goal
      ? {
          calories: goal.targetCalories,
          protein: Number(goal.proteinGrams),
          carbs: Number(goal.carbsGrams),
          fat: Number(goal.fatGrams),
          fiber: Number(goal.fiberGrams ?? 0),
          waterMl: goal.waterMl,
        }
      : null,
    dailyTotals,
    hydration: {
      currentMl: hydrationMl,
      logs: user.hydrationLogs.map((log) => ({
        amountMl: log.amountMl,
        loggedAt: log.loggedAt.toISOString(),
      })),
    },
    meals: mealSummaries,
    supplements: user.supplements.map((supplement) => ({
      id: supplement.id,
      name: supplement.name,
      dose: `${Number(supplement.dosageAmount)} ${supplement.dosageUnit}`,
      schedule: supplement.schedules[0]?.timeOfDay ?? "unscheduled",
      status: supplement.logs[0]?.status ?? "planned",
    })),
    memories: user.memories.map((memory) => ({
      type: memory.type,
      content: memory.content,
      importance: memory.importance,
    })),
  };
}

export type CoachNutritionContext = Awaited<
  ReturnType<typeof getCoachNutritionContext>
>;

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
