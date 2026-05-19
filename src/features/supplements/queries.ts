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

  const scheduledSupplements = supplements.sort(
    (first, second) =>
      supplementTimeSortValue(first.time) - supplementTimeSortValue(second.time),
  );

  return {
    userName: user.name ?? "Alex",
    supplements: scheduledSupplements,
    takenCount: scheduledSupplements.filter((item) => item.status === "taken").length,
    skippedCount: scheduledSupplements.filter((item) => item.status === "skipped").length,
  };
}

function supplementTimeSortValue(time: string) {
  if (time === "Anytime") {
    return Number.MAX_SAFE_INTEGER;
  }

  const [hour, minute] = time.split(":").map(Number);

  return hour * 60 + minute;
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
