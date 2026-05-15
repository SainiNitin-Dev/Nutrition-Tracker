import { streamText, stepCountIs, tool } from "ai";
import { z } from "zod";
import { getGroqChatModel } from "@/lib/ai/provider";
import { prisma } from "@/lib/prisma/client";
import { LogSource } from "@/generated/prisma/client";
import {
  demoCoachUserEmail,
  getCoachNutritionContext,
} from "@/features/coach/context";
import { buildCoachSystemPrompt } from "@/features/coach/prompt";

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
    },
  });

  return result.toTextStreamResponse();
}

async function addHydrationLog(amountMl: number) {
  const user = await prisma.user.findUniqueOrThrow({
    where: { email: demoCoachUserEmail },
    include: {
      goals: {
        where: { isActive: true },
        take: 1,
        orderBy: { createdAt: "desc" },
      },
    },
  });

  const log = await prisma.hydrationLog.create({
    data: {
      userId: user.id,
      amountMl,
      source: LogSource.coach,
    },
  });

  await prisma.aiActionLog.create({
    data: {
      userId: user.id,
      actionType: "addHydrationLog",
      payloadJson: {
        amountMl,
        hydrationLogId: log.id,
      },
      status: "applied",
    },
  });

  const todayLogs = await prisma.hydrationLog.findMany({
    where: {
      userId: user.id,
      loggedAt: {
        gte: startOfToday(),
        lt: startOfTomorrow(),
      },
    },
    select: { amountMl: true },
  });
  const totalMl = todayLogs.reduce((sum, item) => sum + item.amountMl, 0);
  const goalMl = user.goals[0]?.waterMl ?? 3000;

  return {
    amountMl,
    totalMl,
    percent: Math.round((totalMl / goalMl) * 100),
    loggedAt: log.loggedAt.toISOString(),
  };
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

function normalizeWaterAmount(amountMl: number) {
  if (!Number.isFinite(amountMl) || amountMl < 50 || amountMl > 3000) {
    return null;
  }

  return amountMl;
}

function startOfToday() {
  const date = new Date();
  date.setHours(0, 0, 0, 0);
  return date;
}

function startOfTomorrow() {
  const date = startOfToday();
  date.setDate(date.getDate() + 1);
  return date;
}
