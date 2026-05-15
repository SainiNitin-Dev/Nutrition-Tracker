import { streamText, stepCountIs, tool } from "ai";
import { z } from "zod";
import { getGroqChatModel } from "@/lib/ai/provider";
import { prisma } from "@/lib/prisma/client";
import { LogSource, SupplementLogStatus } from "@/generated/prisma/client";
import { getCoachNutritionContext } from "@/features/coach/context";
import { buildCoachSystemPrompt } from "@/features/coach/prompt";
import { createMealForDemoUser, toMealType } from "@/features/meals/service";
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
  const mealRequest = latestUserMessage
    ? extractSimpleMealRequest(latestUserMessage.content)
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

function titleFromFoodText(text: string) {
  return text
    .split(" ")
    .filter(Boolean)
    .slice(0, 5)
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(" ");
}

