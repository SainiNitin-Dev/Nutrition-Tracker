import { z } from "zod";

export const manualMealSchema = z.object({
  mealType: z.enum(["breakfast", "lunch", "dinner", "snack"]),
  title: z.string().trim().min(2).max(80),
  itemName: z.string().trim().min(2).max(120),
  quantity: z.coerce.number().positive().max(10000),
  unit: z.string().trim().min(1).max(24),
  calories: z.coerce.number().min(0).max(5000),
  protein: z.coerce.number().min(0).max(500),
  carbs: z.coerce.number().min(0).max(800),
  fat: z.coerce.number().min(0).max(400),
  fiber: z.coerce.number().min(0).max(150).optional().default(0),
  sugar: z.coerce.number().min(0).max(400).optional().default(0),
  sodium: z.coerce.number().min(0).max(10000).optional().default(0),
});

export const deleteMealSchema = z.object({
  mealId: z.string().min(1),
});

export const editMealSchema = manualMealSchema.extend({
  mealId: z.string().min(1),
  itemId: z.string().min(1),
});

export const saveMealTemplateSchema = z.object({
  mealId: z.string().min(1),
});

export const mealTemplateActionSchema = z.object({
  templateId: z.string().min(1),
});

export type ManualMealInput = z.infer<typeof manualMealSchema>;
export type EditMealInput = z.infer<typeof editMealSchema>;
