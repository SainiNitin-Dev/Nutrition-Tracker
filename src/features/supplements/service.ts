import { LogSource, SupplementLogStatus } from "@/generated/prisma/client";
import { getCurrentOrDemoAppUser } from "@/lib/auth/current-user";
import { prisma } from "@/lib/prisma/client";
import type { SupplementInput } from "./schemas";

export async function createSupplementForCurrentUser(input: SupplementInput) {
  const user = await getCurrentOrDemoAppUser();

  return prisma.supplement.create({
    data: {
      userId: user.id,
      name: input.name,
      dosageAmount: input.dosageAmount,
      dosageUnit: input.dosageUnit,
      purpose: input.purpose || null,
      instructions: input.instructions || null,
      schedules: {
        create: {
          timeOfDay: input.timeOfDay,
          daysOfWeek: [1, 2, 3, 4, 5, 6, 7],
          reminderEnabled: true,
        },
      },
    },
    include: {
      schedules: true,
    },
  });
}

export async function deactivateSupplementForCurrentUser(supplementId: string) {
  const user = await getCurrentOrDemoAppUser();

  return prisma.supplement.update({
    where: {
      id: supplementId,
      userId: user.id,
    },
    data: {
      active: false,
    },
  });
}

export async function logSupplementForDemoUser(
  supplementId: string,
  status: SupplementLogStatus,
) {
  const user = await getCurrentOrDemoAppUser();

  const supplement = await prisma.supplement.findFirstOrThrow({
    where: {
      id: supplementId,
      userId: user.id,
      active: true,
    },
  });

  await prisma.supplementLog.deleteMany({
    where: {
      userId: user.id,
      supplementId,
      takenAt: {
        gte: startOfToday(),
        lt: startOfTomorrow(),
      },
    },
  });

  return prisma.supplementLog.create({
    data: {
      userId: user.id,
      supplementId,
      amount: supplement.dosageAmount,
      status,
      source: LogSource.manual,
    },
  });
}

export async function findSupplementForDemoUserByName(name: string) {
  const normalized = name.trim().toLowerCase();

  if (!normalized) {
    return null;
  }

  const user = await getCurrentOrDemoAppUser();

  const supplements = await prisma.supplement.findMany({
    where: {
      userId: user.id,
      active: true,
    },
    select: {
      id: true,
      name: true,
      dosageAmount: true,
      dosageUnit: true,
    },
  });

  return (
    supplements.find((supplement) =>
      supplement.name.toLowerCase().includes(normalized),
    ) ??
    supplements.find((supplement) =>
      normalized.includes(supplement.name.toLowerCase()),
    ) ??
    null
  );
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
