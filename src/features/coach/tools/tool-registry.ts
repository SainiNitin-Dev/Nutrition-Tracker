import type { CoachToolName } from "@/lib/ai/provider";

export type CoachToolDefinition = {
  name: CoachToolName;
  description: string;
  requiresConfirmation: boolean;
};

export const coachToolRegistry: CoachToolDefinition[] = [
  {
    name: "addHydrationLog",
    description: "Log a water intake amount for the authenticated user.",
    requiresConfirmation: false,
  },
  {
    name: "createMealFromText",
    description: "Create a meal and meal items from a natural-language food description.",
    requiresConfirmation: false,
  },
  {
    name: "logSavedMeal",
    description: "Log a meal from the user's personal saved meal library.",
    requiresConfirmation: false,
  },
  {
    name: "updateMealNutrition",
    description: "Update nutrient values for a specific meal or meal item.",
    requiresConfirmation: true,
  },
  {
    name: "deleteMeal",
    description: "Delete a meal when the target meal is unambiguous.",
    requiresConfirmation: true,
  },
  {
    name: "markSupplementTaken",
    description: "Mark a scheduled supplement dose as taken or skipped.",
    requiresConfirmation: false,
  },
  {
    name: "createCoachMemory",
    description: "Store a durable user preference, pattern, constraint, or summary.",
    requiresConfirmation: false,
  },
];
