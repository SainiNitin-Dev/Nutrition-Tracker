"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { LogSource } from "@/generated/prisma/client";
import { getCurrentOrDemoAppUser } from "@/lib/auth/current-user";
import { prisma } from "@/lib/prisma/client";
import {
  deleteMealSchema,
  manualMealSchema,
  mealTemplateActionSchema,
  saveMealTemplateSchema,
} from "./schemas";
import {
  createMealForDemoUser,
  deleteMealTemplateForCurrentUser,
  logMealTemplateForCurrentUser,
  saveMealAsTemplateForCurrentUser,
  toMealType,
} from "./service";

export async function addManualMealAction(formData: FormData) {
  const parsed = manualMealSchema.safeParse(Object.fromEntries(formData));

  if (!parsed.success) {
    redirect("/meals?error=invalid-meal");
  }

  await createMealForDemoUser({
    mealType: toMealType(parsed.data.mealType),
    title: parsed.data.title,
    itemName: parsed.data.itemName,
    quantity: parsed.data.quantity,
    unit: parsed.data.unit,
    calories: parsed.data.calories,
    protein: parsed.data.protein,
    carbs: parsed.data.carbs,
    fat: parsed.data.fat,
    fiber: parsed.data.fiber,
    sugar: parsed.data.sugar,
    sodium: parsed.data.sodium,
    source: LogSource.manual,
  });

  revalidatePath("/");
  revalidatePath("/meals");
  redirect("/meals?created=1");
}

export async function deleteMealAction(formData: FormData) {
  const parsed = deleteMealSchema.safeParse(Object.fromEntries(formData));

  if (!parsed.success) {
    redirect("/meals?error=invalid-delete");
  }

  const user = await getCurrentOrDemoAppUser();

  await prisma.meal.delete({
    where: {
      id: parsed.data.mealId,
      userId: user.id,
    },
  });

  revalidatePath("/");
  revalidatePath("/meals");
  redirect("/meals?deleted=1");
}

export async function saveMealTemplateAction(formData: FormData) {
  const parsed = saveMealTemplateSchema.safeParse(Object.fromEntries(formData));

  if (!parsed.success) {
    redirect("/meals?error=invalid-template");
  }

  await saveMealAsTemplateForCurrentUser(parsed.data.mealId);

  revalidatePath("/meals");
  redirect("/meals?saved=1");
}

export async function logMealTemplateAction(formData: FormData) {
  const parsed = mealTemplateActionSchema.safeParse(Object.fromEntries(formData));

  if (!parsed.success) {
    redirect("/meals?error=invalid-template");
  }

  await logMealTemplateForCurrentUser(parsed.data.templateId);

  revalidatePath("/");
  revalidatePath("/meals");
  redirect("/meals?logged=1");
}

export async function deleteMealTemplateAction(formData: FormData) {
  const parsed = mealTemplateActionSchema.safeParse(Object.fromEntries(formData));

  if (!parsed.success) {
    redirect("/meals?error=invalid-template");
  }

  await deleteMealTemplateForCurrentUser(parsed.data.templateId);

  revalidatePath("/meals");
  redirect("/meals?templateDeleted=1");
}
