"use server";

import { redirect } from "next/navigation";
import { LogSource } from "@/generated/prisma/client";
import { getCurrentOrDemoAppUser } from "@/lib/auth/current-user";
import { prisma } from "@/lib/prisma/client";
import {
  deleteMealSchema,
  editMealSchema,
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
  updateMealForCurrentUser,
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

  redirect("/meals?deleted=1");
}

export async function updateMealAction(formData: FormData) {
  const parsed = editMealSchema.safeParse(Object.fromEntries(formData));

  if (!parsed.success) {
    redirect("/meals?error=invalid-meal");
  }

  await updateMealForCurrentUser({
    mealId: parsed.data.mealId,
    itemId: parsed.data.itemId,
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

  redirect("/meals?updated=1");
}

export async function saveMealTemplateAction(formData: FormData) {
  const parsed = saveMealTemplateSchema.safeParse(Object.fromEntries(formData));

  if (!parsed.success) {
    redirect("/meals?error=invalid-template");
  }

  await saveMealAsTemplateForCurrentUser(parsed.data.mealId);

  redirect("/meals?saved=1");
}

export async function logMealTemplateAction(formData: FormData) {
  const parsed = mealTemplateActionSchema.safeParse(Object.fromEntries(formData));

  if (!parsed.success) {
    redirect("/meals?error=invalid-template");
  }

  await logMealTemplateForCurrentUser(parsed.data.templateId);

  redirect("/meals?logged=1");
}

export async function deleteMealTemplateAction(formData: FormData) {
  const parsed = mealTemplateActionSchema.safeParse(Object.fromEntries(formData));

  if (!parsed.success) {
    redirect("/meals?error=invalid-template");
  }

  await deleteMealTemplateForCurrentUser(parsed.data.templateId);

  redirect("/meals?templateDeleted=1");
}
