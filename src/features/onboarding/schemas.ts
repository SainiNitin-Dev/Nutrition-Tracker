import { z } from "zod";

export const onboardingSchema = z.object({
  sex: z.string().trim().max(40).optional(),
  age: z.coerce.number().int().min(13).max(100),
  heightCm: z.coerce.number().min(100).max(250),
  weightKg: z.coerce.number().min(30).max(250),
  activityLevel: z.enum([
    "sedentary",
    "lightly_active",
    "moderately_active",
    "very_active",
    "athlete",
  ]),
  goalType: z.enum([
    "fat_loss",
    "muscle_gain",
    "maintenance",
    "performance",
    "wellness",
  ]),
  dietaryPreference: z.string().trim().max(120).optional(),
  allergies: z.string().trim().max(240).optional(),
  targetCalories: z.coerce.number().int().min(1000).max(6000),
  proteinGrams: z.coerce.number().min(30).max(400),
  carbsGrams: z.coerce.number().min(30).max(800),
  fatGrams: z.coerce.number().min(20).max(300),
  fiberGrams: z.coerce.number().min(10).max(100),
  waterMl: z.coerce.number().int().min(1000).max(8000),
});
