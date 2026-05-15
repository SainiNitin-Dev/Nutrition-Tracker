import { MealType, LogSource } from "@/generated/prisma/client";
import { getCurrentOrDemoAppUser } from "@/lib/auth/current-user";
import { prisma } from "@/lib/prisma/client";

export type CreateMealInput = {
  mealType: MealType;
  title: string;
  itemName: string;
  quantity: number;
  unit: string;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  fiber?: number;
  sugar?: number;
  sodium?: number;
  source: LogSource;
};

export async function createMealForDemoUser(input: CreateMealInput) {
  const user = await getCurrentOrDemoAppUser();

  return prisma.meal.create({
    data: {
      userId: user.id,
      date: new Date(),
      mealType: input.mealType,
      title: input.title,
      source: input.source,
      items: {
        create: {
          name: input.itemName,
          quantity: input.quantity,
          unit: input.unit,
          calories: input.calories,
          protein: input.protein,
          carbs: input.carbs,
          fat: input.fat,
          fiber: input.fiber ?? 0,
          sugar: input.sugar ?? 0,
          sodium: input.sodium ?? 0,
          confidence: input.source === LogSource.manual ? 1 : 0.72,
        },
      },
    },
    include: {
      items: true,
    },
  });
}

export function toMealType(mealType: string) {
  const mealTypes: Record<string, MealType> = {
    breakfast: MealType.breakfast,
    lunch: MealType.lunch,
    dinner: MealType.dinner,
    snack: MealType.snack,
  };

  return mealTypes[mealType] ?? MealType.snack;
}
