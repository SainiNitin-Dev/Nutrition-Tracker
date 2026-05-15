"use server";

import { redirect } from "next/navigation";
import { ActivityLevel, GoalType } from "@/generated/prisma/client";
import { requireCurrentAppUser } from "@/lib/auth/current-user";
import { prisma } from "@/lib/prisma/client";
import { onboardingSchema } from "./schemas";

export async function completeOnboardingAction(formData: FormData) {
  const parsed = onboardingSchema.safeParse(Object.fromEntries(formData));

  if (!parsed.success) {
    redirect("/onboarding?error=invalid");
  }

  const user = await requireCurrentAppUser();
  const birthDate = approximateBirthDateFromAge(parsed.data.age);

  await prisma.profile.upsert({
    where: { userId: user.id },
    update: {
      sex: parsed.data.sex || null,
      birthDate,
      heightCm: parsed.data.heightCm,
      weightKg: parsed.data.weightKg,
      activityLevel: parsed.data.activityLevel as ActivityLevel,
      dietaryPreference: parsed.data.dietaryPreference || null,
      allergies: splitAllergies(parsed.data.allergies),
    },
    create: {
      userId: user.id,
      sex: parsed.data.sex || null,
      birthDate,
      heightCm: parsed.data.heightCm,
      weightKg: parsed.data.weightKg,
      activityLevel: parsed.data.activityLevel as ActivityLevel,
      dietaryPreference: parsed.data.dietaryPreference || null,
      allergies: splitAllergies(parsed.data.allergies),
      timezone: "Asia/Calcutta",
    },
  });

  await prisma.goal.updateMany({
    where: { userId: user.id, isActive: true },
    data: { isActive: false },
  });

  await prisma.goal.create({
    data: {
      userId: user.id,
      type: parsed.data.goalType as GoalType,
      targetCalories: parsed.data.targetCalories,
      proteinGrams: parsed.data.proteinGrams,
      carbsGrams: parsed.data.carbsGrams,
      fatGrams: parsed.data.fatGrams,
      fiberGrams: parsed.data.fiberGrams,
      waterMl: parsed.data.waterMl,
      startDate: new Date(),
      isActive: true,
    },
  });

  redirect("/");
}

function approximateBirthDateFromAge(age: number) {
  const date = new Date();
  date.setFullYear(date.getFullYear() - age);
  return date;
}

function splitAllergies(value?: string) {
  return (
    value
      ?.split(",")
      .map((item) => item.trim())
      .filter(Boolean) ?? []
  );
}
