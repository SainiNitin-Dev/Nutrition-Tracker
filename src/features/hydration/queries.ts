import { getCurrentOrDemoAppUser } from "@/lib/auth/current-user";
import { prisma } from "@/lib/prisma/client";

export async function getHydrationTrackerData() {
  const currentUser = await getCurrentOrDemoAppUser();
  const user = await prisma.user.findUniqueOrThrow({
    where: { id: currentUser.id },
    include: {
      goals: {
        where: { isActive: true },
        take: 1,
        orderBy: { createdAt: "desc" },
      },
      hydrationLogs: {
        where: {
          loggedAt: {
            gte: startOfToday(),
            lt: startOfTomorrow(),
          },
        },
        orderBy: { loggedAt: "desc" },
      },
    },
  });

  const goalMl = user.goals[0]?.waterMl ?? 3000;
  const totalMl = user.hydrationLogs.reduce((sum, log) => sum + log.amountMl, 0);

  return {
    userName: user.name ?? "Alex",
    goalMl,
    totalMl,
    remainingMl: Math.max(goalMl - totalMl, 0),
    percent: Math.round((totalMl / goalMl) * 100),
    logs: user.hydrationLogs.map((log) => ({
      id: log.id,
      amountMl: log.amountMl,
      source: log.source,
      time: log.loggedAt.toLocaleTimeString("en-US", {
        hour: "numeric",
        minute: "2-digit",
      }),
    })),
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
