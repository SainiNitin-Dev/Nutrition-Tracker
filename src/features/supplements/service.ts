import { LogSource, SupplementLogStatus } from "@/generated/prisma/client";
import { demoCoachUserEmail } from "@/features/coach/context";
import { prisma } from "@/lib/prisma/client";

export async function logSupplementForDemoUser(
  supplementId: string,
  status: SupplementLogStatus,
) {
  const user = await prisma.user.findUniqueOrThrow({
    where: { email: demoCoachUserEmail },
    select: { id: true },
  });

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
