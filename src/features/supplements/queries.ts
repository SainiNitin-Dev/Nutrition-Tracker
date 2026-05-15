import { getCurrentOrDemoUserWhereUnique } from "@/lib/auth/current-user";
import { prisma } from "@/lib/prisma/client";

export async function getSupplementTrackerData() {
  const userWhere = await getCurrentOrDemoUserWhereUnique();
  const user = await prisma.user.findUniqueOrThrow({
    where: userWhere,
    include: {
      supplements: {
        where: { active: true },
        include: {
          schedules: true,
          logs: {
            where: {
              takenAt: {
                gte: startOfToday(),
                lt: startOfTomorrow(),
              },
            },
            orderBy: { takenAt: "desc" },
            take: 1,
          },
        },
        orderBy: { createdAt: "asc" },
      },
    },
  });

  const supplements = user.supplements.map((supplement) => {
    const schedule = supplement.schedules[0];
    const log = supplement.logs[0];

    return {
      id: supplement.id,
      name: supplement.name,
      dose: `${Number(supplement.dosageAmount)} ${supplement.dosageUnit}`,
      purpose: supplement.purpose ?? "Daily support",
      instructions: supplement.instructions,
      time: schedule?.timeOfDay ?? "Anytime",
      reminderEnabled: schedule?.reminderEnabled ?? false,
      status: log?.status ?? "planned",
      loggedAt: log?.takenAt.toLocaleTimeString("en-US", {
        hour: "numeric",
        minute: "2-digit",
      }),
    };
  });

  return {
    userName: user.name ?? "Alex",
    supplements,
    takenCount: supplements.filter((item) => item.status === "taken").length,
    skippedCount: supplements.filter((item) => item.status === "skipped").length,
  };
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
