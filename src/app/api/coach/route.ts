import { streamText, stepCountIs, tool } from "ai";
import { z } from "zod";
import { getGroqChatModel } from "@/lib/ai/provider";
import { prisma } from "@/lib/prisma/client";
import { LogSource, SupplementLogStatus } from "@/generated/prisma/client";
import { getCoachNutritionContext } from "@/features/coach/context";
import { buildCoachSystemPrompt } from "@/features/coach/prompt";
import {
  createMealForDemoUser,
  findMealTemplateForCurrentUserByName,
  logMealTemplateForCurrentUser,
  toMealType,
} from "@/features/meals/service";
import {
  addHydrationLogForDemoUser,
  normalizeWaterAmount,
} from "@/features/hydration/service";
import {
  findSupplementForDemoUserByName,
  logSupplementForDemoUser,
} from "@/features/supplements/service";
import { getCurrentOrDemoAppUser } from "@/lib/auth/current-user";

const coachMessageSchema = z.object({
  role: z.enum(["user", "assistant"]),
  content: z.string().min(1).max(4000),
});

const coachRequestSchema = z.object({
  messages: z.array(coachMessageSchema).min(1).max(20),
});

export async function POST(request: Request) {
  const body = await request.json();
  const parsed = coachRequestSchema.safeParse(body);

  if (!parsed.success) {
    return Response.json(
      { error: "Invalid coach request." },
      { status: 400 },
    );
  }

  const context = await getCoachNutritionContext();
  const latestUserMessage = [...parsed.data.messages]
    .reverse()
    .find((message) => message.role === "user");
  const waterAmount = latestUserMessage
    ? extractWaterAmountMl(latestUserMessage.content)
    : null;
  const savedMealRequest = latestUserMessage
    ? extractSavedMealLookup(latestUserMessage.content, context.savedMeals)
    : null;
  const mealRequest = latestUserMessage
    ? extractSimpleMealRequest(latestUserMessage.content)
    : null;
  const foodReportRequest = latestUserMessage
    ? extractFoodReportRequest(latestUserMessage.content)
    : null;
  const supplementRequest = latestUserMessage
    ? extractSupplementRequest(latestUserMessage.content)
    : null;

  if (waterAmount) {
    const result = await addHydrationLog(waterAmount);

    return new Response(
      `Logged ${result.amountMl}ml of water. You are now at ${result.totalMl}ml for today, about ${result.percent}% of your goal.`,
      {
        headers: {
          "Content-Type": "text/plain; charset=utf-8",
        },
      },
    );
  }

  if (savedMealRequest?.title) {
    const result = await logSavedMealFromCoach(savedMealRequest.title);

    if (result) {
      return new Response(
        `Logged your saved meal: ${result.title}. That adds ${result.calories} kcal, ${result.protein}g protein, ${result.carbs}g carbs, and ${result.fat}g fat to today.`,
        {
          headers: {
            "Content-Type": "text/plain; charset=utf-8",
          },
        },
      );
    }
  }

  if (savedMealRequest?.intent) {
    return new Response(
      `I could not find "${savedMealRequest.requestedName}" in your saved meals yet. Save it from the Meals page first, then I can log it for you in one message.`,
      {
        headers: {
          "Content-Type": "text/plain; charset=utf-8",
        },
      },
    );
  }

  if (mealRequest) {
    const result = await createCoachMeal(mealRequest);

    return new Response(
      `Added ${result.title} as ${result.mealType}. I estimated ${result.calories} kcal with ${result.protein}g protein. You can refine the numbers on the meal page.`,
      {
        headers: {
          "Content-Type": "text/plain; charset=utf-8",
        },
      },
    );
  }

  if (foodReportRequest) {
    const result = await createCoachMeal(foodReportRequest);

    return new Response(
      `Logged ${result.title} as ${result.mealType}. I estimated ${result.calories} kcal with ${result.protein}g protein, ${result.carbs}g carbs, and ${result.fat}g fat. You can refine it on the Meals page if needed.`,
      {
        headers: {
          "Content-Type": "text/plain; charset=utf-8",
        },
      },
    );
  }

  if (supplementRequest) {
    const result = await logSupplementFromCoach(
      supplementRequest.name,
      supplementRequest.status,
    );

    if (!result) {
      return new Response(
        `I could not find "${supplementRequest.name}" in your active supplements. Try the supplement's saved name.`,
        {
          headers: {
            "Content-Type": "text/plain; charset=utf-8",
          },
        },
      );
    }

    return new Response(
      `${result.name} marked as ${supplementRequest.status}.`,
      {
        headers: {
          "Content-Type": "text/plain; charset=utf-8",
        },
      },
    );
  }

  const result = streamText({
    model: getGroqChatModel(),
    system: buildCoachSystemPrompt(context),
    messages: parsed.data.messages,
    stopWhen: stepCountIs(3),
    tools: {
      addHydrationLog: tool({
        description:
          "Log water intake for the user. Use this when the user says they drank water or asks you to add water.",
        inputSchema: z.object({
          amountMl: z
            .number()
            .int()
            .min(50)
            .max(3000)
            .describe("Water amount in milliliters."),
        }),
        execute: async ({ amountMl }) => {
          const result = await addHydrationLog(amountMl);

          return {
            ok: true,
            ...result,
          };
        },
      }),
      createMealFromText: tool({
        description:
          "Create a meal from a short food description. Use when the user clearly asks to add or log food.",
        inputSchema: z.object({
          mealType: z
            .enum(["breakfast", "lunch", "dinner", "snack"])
            .describe("The meal slot the food belongs to."),
          title: z.string().min(2).max(80),
          itemName: z.string().min(2).max(120),
          calories: z.number().min(0).max(5000),
          protein: z.number().min(0).max(500),
          carbs: z.number().min(0).max(800),
          fat: z.number().min(0).max(400),
          fiber: z.number().min(0).max(150).optional(),
          sodium: z.number().min(0).max(10000).optional(),
        }),
        execute: async (input) => {
          const result = await createCoachMeal({
            mealType: input.mealType,
            text: input.itemName,
            title: input.title,
            nutrition: {
              calories: input.calories,
              protein: input.protein,
              carbs: input.carbs,
              fat: input.fat,
              fiber: input.fiber ?? 0,
              sodium: input.sodium ?? 0,
            },
          });

          return {
            ok: true,
            mealId: result.mealId,
            title: result.title,
            mealType: result.mealType,
          };
        },
      }),
      logSavedMeal: tool({
        description:
          "Log one meal from the user's personal saved meal library. Use this when the user names a saved meal or asks to repeat a saved meal.",
        inputSchema: z.object({
          savedMealName: z
            .string()
            .min(2)
            .max(120)
            .describe("The title or close name of the saved meal to log."),
        }),
        execute: async ({ savedMealName }) => {
          const result = await logSavedMealFromCoach(savedMealName);

          return result
            ? {
                ok: true,
                mealId: result.mealId,
                templateId: result.templateId,
                title: result.title,
                mealType: result.mealType,
                totals: {
                  calories: result.calories,
                  protein: result.protein,
                  carbs: result.carbs,
                  fat: result.fat,
                },
              }
            : {
                ok: false,
                error: "Saved meal not found.",
              };
        },
      }),
      markSupplement: tool({
        description:
          "Mark an active supplement as taken or skipped when the user clearly asks to update a supplement.",
        inputSchema: z.object({
          supplementName: z.string().min(2).max(80),
          status: z.enum(["taken", "skipped"]),
        }),
        execute: async ({ supplementName, status }) => {
          const result = await logSupplementFromCoach(
            supplementName,
            status as SupplementLogStatus,
          );

          return result
            ? {
                ok: true,
                supplementId: result.id,
                name: result.name,
                status,
              }
            : {
                ok: false,
                error: "Supplement not found.",
              };
        },
      }),
    },
  });

  return result.toTextStreamResponse();
}

async function logSupplementFromCoach(
  supplementName: string,
  status: SupplementLogStatus,
) {
  const supplement = await findSupplementForDemoUserByName(supplementName);

  if (!supplement) {
    return null;
  }

  await logSupplementForDemoUser(supplement.id, status);

  const user = await getCurrentOrDemoAppUser();

  await prisma.aiActionLog.create({
    data: {
      userId: user.id,
      actionType: "markSupplement",
      payloadJson: {
        supplementId: supplement.id,
        supplementName: supplement.name,
        status,
      },
      status: "applied",
    },
  });

  return supplement;
}

async function logSavedMealFromCoach(savedMealName: string) {
  const template = await findMealTemplateForCurrentUserByName(savedMealName);

  if (!template) {
    return null;
  }

  const meal = await logMealTemplateForCurrentUser(template.id, LogSource.coach);
  const user = await getCurrentOrDemoAppUser();
  const totals = template.items.reduce(
    (sum, item) => ({
      calories: sum.calories + Number(item.calories),
      protein: sum.protein + Number(item.protein),
      carbs: sum.carbs + Number(item.carbs),
      fat: sum.fat + Number(item.fat),
    }),
    { calories: 0, protein: 0, carbs: 0, fat: 0 },
  );

  await prisma.aiActionLog.create({
    data: {
      userId: user.id,
      actionType: "logSavedMeal",
      payloadJson: {
        mealId: meal.id,
        templateId: template.id,
        title: template.title,
        mealType: template.mealType,
      },
      status: "applied",
    },
  });

  return {
    mealId: meal.id,
    templateId: template.id,
    title: template.title,
    mealType: template.mealType,
    calories: Math.round(totals.calories),
    protein: Math.round(totals.protein),
    carbs: Math.round(totals.carbs),
    fat: Math.round(totals.fat),
  };
}

type SimpleMealRequest = {
  mealType: "breakfast" | "lunch" | "dinner" | "snack";
  text: string;
  title?: string;
  nutrition?: {
    calories: number;
    protein: number;
    carbs: number;
    fat: number;
    fiber?: number;
    sodium?: number;
  };
};

async function createCoachMeal(request: SimpleMealRequest) {
  const estimated = request.nutrition ?? estimateNutritionFromText(request.text);
  const title = request.title ?? titleFromFoodText(request.text);
  const meal = await createMealForDemoUser({
    mealType: toMealType(request.mealType),
    title,
    itemName: request.text,
    quantity: 1,
    unit: "serving",
    calories: estimated.calories,
    protein: estimated.protein,
    carbs: estimated.carbs,
    fat: estimated.fat,
    fiber: estimated.fiber ?? 0,
    sodium: estimated.sodium ?? 0,
    source: LogSource.ai_text,
  });
  const user = await getCurrentOrDemoAppUser();

  await prisma.aiActionLog.create({
    data: {
      userId: user.id,
      actionType: "createMealFromText",
      payloadJson: {
        mealId: meal.id,
        title,
        mealType: request.mealType,
        estimated,
      },
      status: "applied",
    },
  });

  return {
    mealId: meal.id,
    title,
    mealType: request.mealType,
    ...estimated,
  };
}

async function addHydrationLog(amountMl: number) {
  return addHydrationLogForDemoUser(amountMl, LogSource.coach);
}

function extractWaterAmountMl(text: string) {
  const normalized = text.toLowerCase();
  const milliliterMatch = normalized.match(/(\d{2,4})\s*(ml|milliliters?)/);

  if (milliliterMatch) {
    return normalizeWaterAmount(Number(milliliterMatch[1]));
  }

  const literMatch = normalized.match(/(\d+(?:\.\d+)?)\s*(l|liters?|litres?)/);

  if (literMatch) {
    return normalizeWaterAmount(Math.round(Number(literMatch[1]) * 1000));
  }

  return null;
}

function extractSavedMealLookup(
  text: string,
  savedMeals: Array<{ title: string }>,
): { title?: string; intent?: boolean; requestedName?: string } | null {
  const normalized = normalizeLookup(text);

  if (!/\b(add|log|repeat|ate|had)\b/.test(normalized)) {
    return null;
  }

  const matchingMeal = savedMeals.find((meal) =>
    normalized.includes(normalizeLookup(meal.title)),
  );

  if (matchingMeal) {
    return { title: matchingMeal.title };
  }

  if (/\b(saved|usual|regular|repeat|same|my)\b/.test(normalized)) {
    return {
      intent: true,
      requestedName: cleanSavedMealName(text),
    };
  }

  return null;
}

function extractSimpleMealRequest(text: string): SimpleMealRequest | null {
  const normalized = text.trim().toLowerCase();

  if (!/\b(add|log|ate|had)\b/.test(normalized)) {
    return null;
  }

  const mealTypeMatch = normalized.match(
    /\b(breakfast|lunch|dinner|snack)\b/,
  );

  if (!mealTypeMatch) {
    return null;
  }

  const withoutCommand = text
    .replace(/\b(add|log|ate|had)\b/gi, "")
    .replace(/\b(for|as|to my|my)\b/gi, "")
    .replace(/\b(breakfast|lunch|dinner|snack)\b/gi, "")
    .replace(/\s+/g, " ")
    .trim();

  if (withoutCommand.length < 3) {
    return null;
  }

  return {
    mealType: mealTypeMatch[1] as SimpleMealRequest["mealType"],
    text: withoutCommand,
  };
}

function extractFoodReportRequest(text: string): SimpleMealRequest | null {
  const normalized = text.trim().toLowerCase();

  if (!/\b(had|ate|eaten|consumed|drank)\b/.test(normalized)) {
    return null;
  }

  if (extractWaterAmountMl(text) && !hasFoodSignal(normalized)) {
    return null;
  }

  if (!hasFoodSignal(normalized)) {
    return null;
  }

  return {
    mealType: inferMealTypeFromCurrentTime(),
    text: cleanFoodReportText(text),
  };
}

function hasFoodSignal(normalized: string) {
  return (
    /\b(oats?|milk|shake|peanut|butter|sugar|rice|chicken|egg|eggs|whey|banana|roti|bread|paneer|tofu|yogurt|yoghurt|dal|beans|salad|pasta|potato)\b/.test(
      normalized,
    ) || /\b\d+(?:\.\d+)?\s*(g|gram|grams|kg|ml|cup|cups|scoop|scoops)\b/.test(normalized)
  );
}

function cleanFoodReportText(value: string) {
  const cleaned = value
    .replace(/\byes\b/gi, "")
    .replace(/\bi\s+(have\s+)?(had|ate|eaten|consumed|drank)\b/gi, "")
    .replace(/\s+/g, " ")
    .trim();

  return cleaned || value.trim();
}

function inferMealTypeFromCurrentTime(): SimpleMealRequest["mealType"] {
  const hour = new Date().getHours();

  if (hour < 11) {
    return "breakfast";
  }

  if (hour < 16) {
    return "lunch";
  }

  if (hour < 19) {
    return "snack";
  }

  return "dinner";
}

function normalizeLookup(value: string) {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function cleanSavedMealName(value: string) {
  const cleaned = value
    .replace(/\b(add|log|repeat|ate|had)\b/gi, "")
    .replace(/\b(my|saved|usual|regular|same|meal|for|as|today)\b/gi, "")
    .replace(/\s+/g, " ")
    .trim();

  return cleaned || "that meal";
}

function extractSupplementRequest(
  text: string,
): { name: string; status: SupplementLogStatus } | null {
  const normalized = text.trim().toLowerCase();

  if (!/\b(supplement|vitamin|creatine|magnesium|d3)\b/.test(normalized)) {
    return null;
  }

  const status = /\b(skip|skipped|missed)\b/.test(normalized)
    ? SupplementLogStatus.skipped
    : /\b(take|taken|took|mark|logged|had)\b/.test(normalized)
      ? SupplementLogStatus.taken
      : null;

  if (!status) {
    return null;
  }

  const knownNames = ["magnesium", "creatine", "vitamin d3", "d3"];
  const knownName = knownNames.find((name) => normalized.includes(name));

  if (knownName) {
    return {
      name: knownName === "d3" ? "Vitamin D3" : knownName,
      status,
    };
  }

  const fallback = normalized
    .replace(/\b(mark|take|taken|took|skip|skipped|missed|my|the|supplement|as|today|tonight)\b/g, "")
    .replace(/\s+/g, " ")
    .trim();

  if (fallback.length < 2) {
    return null;
  }

  return {
    name: fallback,
    status,
  };
}

function estimateNutritionFromText(text: string) {
  const normalized = text.toLowerCase();
  const ingredientEstimate = estimateKnownIngredients(normalized);

  if (ingredientEstimate) {
    return ingredientEstimate;
  }

  const isProteinHeavy = /\b(chicken|turkey|salmon|fish|paneer|tofu|egg|whey|beef)\b/.test(
    normalized,
  );
  const hasRiceOrBread = /\b(rice|bread|pasta|potato|quinoa|oats|roti|wrap)\b/.test(
    normalized,
  );
  const hasNutsOrAvocado = /\b(avocado|nuts|peanut|almond|oil|cheese)\b/.test(
    normalized,
  );

  return {
    calories: 420 + (isProteinHeavy ? 120 : 0) + (hasRiceOrBread ? 130 : 0),
    protein: isProteinHeavy ? 42 : 18,
    carbs: hasRiceOrBread ? 58 : 28,
    fat: hasNutsOrAvocado ? 24 : 14,
    fiber: 7,
    sodium: 520,
  };
}

function estimateKnownIngredients(normalized: string) {
  const totals = {
    calories: 0,
    protein: 0,
    carbs: 0,
    fat: 0,
    fiber: 0,
    sodium: 0,
  };
  let matched = false;

  matched = addKnownIngredient(
    totals,
    amountForIngredient(normalized, "oats?"),
    { calories: 389, protein: 16.9, carbs: 66.3, fat: 6.9, fiber: 10.6, sodium: 2 },
  ) || matched;
  matched = addKnownIngredient(
    totals,
    amountForIngredient(normalized, "(?:buffalo|buffallo)\\s+milk"),
    { calories: 97, protein: 3.8, carbs: 5.2, fat: 6.9, fiber: 0, sodium: 52 },
  ) || matched;

  if (!/\b(buffalo|buffallo)\s+milk\b/.test(normalized)) {
    matched = addKnownIngredient(
      totals,
      amountForIngredient(normalized, "milk"),
      { calories: 61, protein: 3.2, carbs: 4.8, fat: 3.3, fiber: 0, sodium: 43 },
    ) || matched;
  }

  matched = addKnownIngredient(
    totals,
    amountForIngredient(normalized, "peanut\\s+butter"),
    { calories: 588, protein: 25, carbs: 20, fat: 50, fiber: 6, sodium: 460 },
  ) || matched;
  matched = addKnownIngredient(
    totals,
    amountForIngredient(normalized, "sugar"),
    { calories: 400, protein: 0, carbs: 100, fat: 0, fiber: 0, sodium: 0 },
  ) || matched;

  if (!matched) {
    return null;
  }

  return {
    calories: Math.round(totals.calories),
    protein: Math.round(totals.protein),
    carbs: Math.round(totals.carbs),
    fat: Math.round(totals.fat),
    fiber: Math.round(totals.fiber),
    sodium: Math.round(totals.sodium),
  };
}

function amountForIngredient(normalized: string, ingredientPattern: string) {
  const before = normalized.match(
    new RegExp(`(\\d+(?:\\.\\d+)?)\\s*(?:g|gram|grams|ml)\\s+${ingredientPattern}\\b`),
  );
  const after = normalized.match(
    new RegExp(`\\b${ingredientPattern}\\b\\s+(\\d+(?:\\.\\d+)?)\\s*(?:g|gram|grams|ml)`),
  );

  return Number(before?.[1] ?? after?.[1] ?? 0);
}

function addKnownIngredient(
  totals: {
    calories: number;
    protein: number;
    carbs: number;
    fat: number;
    fiber: number;
    sodium: number;
  },
  amount: number,
  per100g: {
    calories: number;
    protein: number;
    carbs: number;
    fat: number;
    fiber: number;
    sodium: number;
  },
) {
  if (!amount) {
    return false;
  }

  totals.calories += (per100g.calories * amount) / 100;
  totals.protein += (per100g.protein * amount) / 100;
  totals.carbs += (per100g.carbs * amount) / 100;
  totals.fat += (per100g.fat * amount) / 100;
  totals.fiber += (per100g.fiber * amount) / 100;
  totals.sodium += (per100g.sodium * amount) / 100;

  return true;
}

function titleFromFoodText(text: string) {
  return text
    .split(" ")
    .filter(Boolean)
    .slice(0, 5)
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(" ");
}

