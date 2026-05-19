import { createClient } from "npm:@supabase/supabase-js@2.45.4";
import webpush from "npm:web-push@3.6.7";

type PushSubscriptionRow = {
  id: string;
  userId: string;
  endpoint: string;
  p256dh: string;
  auth: string;
};

type UserRow = {
  id: string;
  name: string | null;
};

type ProfileRow = {
  userId: string;
  timezone: string | null;
};

type GoalRow = {
  userId: string;
  targetCalories: number;
  waterMl: number;
};

type HydrationLogRow = {
  amountMl: number;
  loggedAt: string;
};

type MealRow = {
  mealType: "breakfast" | "lunch" | "dinner" | "snack";
  date: string;
};

type SupplementRow = {
  id: string;
  userId: string;
  name: string;
  dosageAmount: string | number;
  dosageUnit: string;
  active: boolean;
};

type SupplementScheduleRow = {
  id: string;
  supplementId: string;
  timeOfDay: string;
  daysOfWeek: number[] | null;
  reminderEnabled: boolean;
};

type SupplementLogRow = {
  supplementId: string;
  takenAt: string;
  status: "taken" | "skipped" | "planned";
};

type ReminderPayload = {
  deliveryKey: string;
  title: string;
  body: string;
  url: string;
  tag: string;
};

const supabaseUrl = Deno.env.get("SUPABASE_URL") ?? "";
const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";
const vapidPublicKey = Deno.env.get("VAPID_PUBLIC_KEY") ?? "";
const vapidPrivateKey = Deno.env.get("VAPID_PRIVATE_KEY") ?? "";
const vapidSubject = Deno.env.get("VAPID_SUBJECT") ?? "mailto:hello@nourish.ai";

const hydrationReminderTimes = ["10:30", "13:30", "16:30", "19:30"];
const mealReminderTimes = [
  { mealType: "breakfast" as const, time: "09:00", label: "breakfast" },
  { mealType: "lunch" as const, time: "13:00", label: "lunch" },
  { mealType: "snack" as const, time: "17:00", label: "snack" },
  { mealType: "dinner" as const, time: "20:30", label: "dinner" },
];

if (vapidPublicKey && vapidPrivateKey) {
  webpush.setVapidDetails(vapidSubject, vapidPublicKey, vapidPrivateKey);
}

const supabase = createClient(supabaseUrl, serviceRoleKey, {
  auth: { persistSession: false },
});

Deno.serve(async () => {
  if (!supabaseUrl || !serviceRoleKey || !vapidPublicKey || !vapidPrivateKey) {
    return Response.json(
      { error: "Reminder function is missing Supabase or VAPID secrets." },
      { status: 500 },
    );
  }

  const now = new Date();
  const { data: subscriptions, error } = await supabase
    .from("PushSubscription")
    .select("id,userId,endpoint,p256dh,auth");

  if (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }

  const subscriptionsByUser = groupByUser(subscriptions ?? []);
  let sent = 0;
  let skipped = 0;

  for (const [userId, userSubscriptions] of subscriptionsByUser.entries()) {
    const reminders = await buildDueReminders(userId, now);

    for (const reminder of reminders) {
      const didReserve = await reserveDelivery(userId, reminder.deliveryKey, now);

      if (!didReserve) {
        skipped += 1;
        continue;
      }

      await sendToUserSubscriptions(userSubscriptions, reminder);
      sent += 1;
    }
  }

  return Response.json({ ok: true, sent, skipped, users: subscriptionsByUser.size });
});

async function buildDueReminders(userId: string, now: Date) {
  const [user, profile, goal] = await Promise.all([
    findSingle<UserRow>("User", "id,name", "id", userId),
    findSingle<ProfileRow>("Profile", "userId,timezone", "userId", userId),
    findSingle<GoalRow>("Goal", "userId,targetCalories,waterMl", "userId", userId, {
      column: "isActive",
      value: true,
    }),
  ]);

  const timezone = profile?.timezone || "Asia/Kolkata";
  const dateKey = formatDateKey(now, timezone);
  const dayOfWeek = localDayOfWeek(now, timezone);
  const userName = user?.name?.split(" ")[0] || "there";
  const reminders: ReminderPayload[] = [];

  reminders.push(...await buildSupplementReminders(userId, userName, timezone, dateKey, dayOfWeek, now));
  reminders.push(...await buildHydrationReminders(userId, userName, timezone, dateKey, now, goal?.waterMl ?? 3000));
  reminders.push(...await buildMealReminders(userId, userName, timezone, dateKey, now));

  return reminders;
}

async function buildSupplementReminders(
  userId: string,
  userName: string,
  timezone: string,
  dateKey: string,
  dayOfWeek: number,
  now: Date,
) {
  const { data: supplements } = await supabase
    .from("Supplement")
    .select("id,userId,name,dosageAmount,dosageUnit,active")
    .eq("userId", userId)
    .eq("active", true)
    .returns<SupplementRow[]>();

  if (!supplements?.length) {
    return [];
  }

  const supplementIds = supplements.map((supplement) => supplement.id);
  const [{ data: schedules }, { data: logs }] = await Promise.all([
    supabase
      .from("SupplementSchedule")
      .select("id,supplementId,timeOfDay,daysOfWeek,reminderEnabled")
      .in("supplementId", supplementIds)
      .eq("reminderEnabled", true)
      .returns<SupplementScheduleRow[]>(),
    supabase
      .from("SupplementLog")
      .select("supplementId,takenAt,status")
      .in("supplementId", supplementIds)
      .returns<SupplementLogRow[]>(),
  ]);

  const completedToday = new Set(
    (logs ?? [])
      .filter((log) => log.status !== "planned" && formatDateKey(new Date(log.takenAt), timezone) === dateKey)
      .map((log) => log.supplementId),
  );
  const supplementById = new Map(supplements.map((supplement) => [supplement.id, supplement]));

  return (schedules ?? [])
    .filter((schedule) => {
      const days = schedule.daysOfWeek ?? [];
      return (
        !completedToday.has(schedule.supplementId) &&
        (days.length === 0 || days.includes(dayOfWeek)) &&
        isDueWithinWindow(schedule.timeOfDay, now, timezone)
      );
    })
    .map((schedule) => {
      const supplement = supplementById.get(schedule.supplementId);
      return {
        deliveryKey: `supplement:${schedule.id}:${schedule.timeOfDay}`,
        title: `Time for ${supplement?.name ?? "your supplement"}`,
        body: `${userName}, ${formatDose(supplement)} is scheduled now.`,
        url: "/supplements",
        tag: `supplement-${schedule.id}`,
      };
    });
}

async function buildHydrationReminders(
  userId: string,
  userName: string,
  timezone: string,
  dateKey: string,
  now: Date,
  waterGoalMl: number,
) {
  const dueTime = hydrationReminderTimes.find((time) => isDueWithinWindow(time, now, timezone));

  if (!dueTime) {
    return [];
  }

  const { data: logs } = await supabase
    .from("HydrationLog")
    .select("amountMl,loggedAt")
    .eq("userId", userId)
    .returns<HydrationLogRow[]>();
  const totalMl = (logs ?? [])
    .filter((log) => formatDateKey(new Date(log.loggedAt), timezone) === dateKey)
    .reduce((sum, log) => sum + log.amountMl, 0);
  const targetByNow = Math.round(waterGoalMl * hydrationProgressTarget(dueTime));

  if (totalMl >= targetByNow) {
    return [];
  }

  return [
    {
      deliveryKey: `hydration:${dueTime}`,
      title: "Hydration check",
      body: `${userName}, you are at ${totalMl}ml today. A quick glass keeps the day moving.`,
      url: "/hydration",
      tag: `hydration-${dueTime}`,
    },
  ];
}

async function buildMealReminders(
  userId: string,
  userName: string,
  timezone: string,
  dateKey: string,
  now: Date,
) {
  const dueMeal = mealReminderTimes.find((meal) => isDueWithinWindow(meal.time, now, timezone));

  if (!dueMeal) {
    return [];
  }

  const { data: meals } = await supabase
    .from("Meal")
    .select("mealType,date")
    .eq("userId", userId)
    .eq("mealType", dueMeal.mealType)
    .returns<MealRow[]>();
  const alreadyLogged = (meals ?? []).some(
    (meal) => formatDateKey(new Date(meal.date), timezone) === dateKey,
  );

  if (alreadyLogged) {
    return [];
  }

  return [
    {
      deliveryKey: `meal:${dueMeal.mealType}:${dueMeal.time}`,
      title: `Log ${dueMeal.label}`,
      body: `${userName}, did you have ${dueMeal.label}? Add it now so your day stays accurate.`,
      url: "/meals",
      tag: `meal-${dueMeal.mealType}`,
    },
  ];
}

async function reserveDelivery(userId: string, deliveryKey: string, now: Date) {
  const timezone = await findSingle<ProfileRow>("Profile", "userId,timezone", "userId", userId);
  const dateKey = formatDateKey(now, timezone?.timezone || "Asia/Kolkata");
  const { error } = await supabase
    .from("NotificationDelivery")
    .insert({
      id: crypto.randomUUID(),
      userId,
      deliveryKey,
      dateKey,
      sentAt: now.toISOString(),
    });

  if (!error) {
    return true;
  }

  if (error.code === "23505") {
    return false;
  }

  console.error("Could not reserve reminder delivery", error);
  return false;
}

async function sendToUserSubscriptions(
  subscriptions: PushSubscriptionRow[],
  reminder: ReminderPayload,
) {
  await Promise.all(
    subscriptions.map(async (subscription) => {
      try {
        await webpush.sendNotification(
          {
            endpoint: subscription.endpoint,
            keys: {
              p256dh: subscription.p256dh,
              auth: subscription.auth,
            },
          },
          JSON.stringify({
            title: reminder.title,
            body: reminder.body,
            url: reminder.url,
            tag: reminder.tag,
          }),
        );
      } catch (error) {
        const statusCode = typeof error === "object" && error && "statusCode" in error
          ? Number(error.statusCode)
          : 0;

        if (statusCode === 404 || statusCode === 410) {
          await supabase.from("PushSubscription").delete().eq("id", subscription.id);
        } else {
          console.error("Push send failed", error);
        }
      }
    }),
  );
}

async function findSingle<T>(
  table: string,
  select: string,
  column: string,
  value: string,
  extraFilter?: { column: string; value: string | number | boolean },
) {
  let query = supabase.from(table).select(select).eq(column, value).limit(1);

  if (extraFilter) {
    query = query.eq(extraFilter.column, extraFilter.value);
  }

  const { data } = await query.maybeSingle<T>();
  return data;
}

function groupByUser(subscriptions: PushSubscriptionRow[]) {
  const map = new Map<string, PushSubscriptionRow[]>();

  for (const subscription of subscriptions) {
    const existing = map.get(subscription.userId) ?? [];
    existing.push(subscription);
    map.set(subscription.userId, existing);
  }

  return map;
}

function isDueWithinWindow(timeOfDay: string, now: Date, timezone: string) {
  if (!/^\d{2}:\d{2}$/.test(timeOfDay)) {
    return false;
  }

  const [hour, minute] = timeOfDay.split(":").map(Number);
  const dueMinutes = hour * 60 + minute;
  const localMinutes = localHourMinute(now, timezone);
  const diff = localMinutes - dueMinutes;

  return diff >= 0 && diff < 5;
}

function localHourMinute(date: Date, timezone: string) {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone: timezone,
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  }).formatToParts(date);
  const hour = Number(parts.find((part) => part.type === "hour")?.value ?? "0");
  const minute = Number(parts.find((part) => part.type === "minute")?.value ?? "0");
  return hour * 60 + minute;
}

function formatDateKey(date: Date, timezone: string) {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: timezone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(date);
  const year = parts.find((part) => part.type === "year")?.value;
  const month = parts.find((part) => part.type === "month")?.value;
  const day = parts.find((part) => part.type === "day")?.value;
  return `${year}-${month}-${day}`;
}

function localDayOfWeek(date: Date, timezone: string) {
  const weekday = new Intl.DateTimeFormat("en-US", {
    timeZone: timezone,
    weekday: "short",
  }).format(date);
  return ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].indexOf(weekday);
}

function hydrationProgressTarget(time: string) {
  if (time <= "10:30") return 0.25;
  if (time <= "13:30") return 0.45;
  if (time <= "16:30") return 0.65;
  return 0.85;
}

function formatDose(supplement?: SupplementRow) {
  if (!supplement) {
    return "your dose";
  }

  return `${Number(supplement.dosageAmount).toLocaleString()}${supplement.dosageUnit} ${supplement.name}`;
}
