import { LogSource } from "@/generated/prisma/client";
import { getCurrentOrDemoAppUser } from "@/lib/auth/current-user";
import { prisma } from "@/lib/prisma/client";

export async function addHydrationLogForDemoUser(
  amountMl: number,
  source: LogSource,
) {
  const normalized = normalizeWaterAmount(amountMl);

  if (!normalized) {
    throw new Error("Water amount must be between 50ml and 3000ml.");
  }

  const currentUser = await getCurrentOrDemoAppUser();
  const user = await prisma.user.findUniqueOrThrow({
    where: { id: currentUser.id },
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
      amountMl: normalized,
      source,
    },
  });

  if (source === LogSource.coach) {
    await prisma.aiActionLog.create({
      data: {
        userId: user.id,
        actionType: "addHydrationLog",
        payloadJson: {
          amountMl: normalized,
          hydrationLogId: log.id,
        },
        status: "applied",
      },
    });
  }

  const totalMl = await getTodayHydrationTotal(user.id);
  const goalMl = user.goals[0]?.waterMl ?? 3000;

  return {
    amountMl: normalized,
    totalMl,
    percent: Math.round((totalMl / goalMl) * 100),
    loggedAt: log.loggedAt.toISOString(),
  };
}

export async function deleteHydrationLogForDemoUser(logId: string) {
  const user = await getCurrentOrDemoAppUser();

  await prisma.hydrationLog.delete({
    where: {
      id: logId,
      userId: user.id,
    },
  });
}

export function normalizeWaterAmount(amountMl: number) {
  if (!Number.isFinite(amountMl) || amountMl < 50 || amountMl > 3000) {
    return null;
  }

  return Math.round(amountMl);
}

async function getTodayHydrationTotal(userId: string) {
  const logs = await prisma.hydrationLog.findMany({
    where: {
      userId,
      loggedAt: {
        gte: startOfToday(),
        lt: startOfTomorrow(),
      },
    },
    select: { amountMl: true },
  });

  return logs.reduce((sum, item) => sum + item.amountMl, 0);
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
