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

export async function saveMealAsTemplateForCurrentUser(mealId: string) {
  const user = await getCurrentOrDemoAppUser();
  const meal = await prisma.meal.findUnique({
    where: {
      id: mealId,
      userId: user.id,
    },
    include: {
      items: true,
    },
  });

  if (!meal || meal.items.length === 0) {
    throw new Error("Meal not found");
  }

  return prisma.mealTemplate.create({
    data: {
      userId: user.id,
      title: meal.title ?? titleCaseMealType(meal.mealType),
      mealType: meal.mealType,
      notes: meal.notes,
      items: {
        create: meal.items.map((item) => ({
          name: item.name,
          quantity: item.quantity,
          unit: item.unit,
          calories: item.calories,
          protein: item.protein,
          carbs: item.carbs,
          fat: item.fat,
          fiber: item.fiber ?? 0,
          sugar: item.sugar ?? 0,
          sodium: item.sodium ?? 0,
        })),
      },
    },
    include: {
      items: true,
    },
  });
}

export async function logMealTemplateForCurrentUser(templateId: string) {
  const user = await getCurrentOrDemoAppUser();
  const template = await prisma.mealTemplate.findUnique({
    where: {
      id: templateId,
      userId: user.id,
    },
    include: {
      items: true,
    },
  });

  if (!template || template.items.length === 0) {
    throw new Error("Meal template not found");
  }

  return prisma.meal.create({
    data: {
      userId: user.id,
      date: new Date(),
      mealType: template.mealType,
      title: template.title,
      notes: template.notes,
      source: LogSource.manual,
      items: {
        create: template.items.map((item) => ({
          name: item.name,
          quantity: item.quantity,
          unit: item.unit,
          calories: item.calories,
          protein: item.protein,
          carbs: item.carbs,
          fat: item.fat,
          fiber: item.fiber ?? 0,
          sugar: item.sugar ?? 0,
          sodium: item.sodium ?? 0,
          confidence: 1,
        })),
      },
    },
    include: {
      items: true,
    },
  });
}

export async function deleteMealTemplateForCurrentUser(templateId: string) {
  const user = await getCurrentOrDemoAppUser();

  return prisma.mealTemplate.delete({
    where: {
      id: templateId,
      userId: user.id,
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

function titleCaseMealType(mealType: MealType) {
  return mealType.charAt(0).toUpperCase() + mealType.slice(1);
}
