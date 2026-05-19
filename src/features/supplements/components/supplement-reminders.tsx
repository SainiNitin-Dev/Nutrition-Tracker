"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { Bell, BellRing } from "lucide-react";

type ReminderSupplement = {
  id: string;
  name: string;
  time: string;
  status: string;
  reminderEnabled: boolean;
};

type SupplementReminderPanelProps = {
  supplements: ReminderSupplement[];
};

export function SupplementReminderPanel({
  supplements,
}: SupplementReminderPanelProps) {
  const [permission, setPermission] = useState<NotificationPermission | "unsupported">(() => {
    if (typeof window === "undefined") {
      return "default";
    }

    return "Notification" in window ? Notification.permission : "unsupported";
  });
  const timeoutIds = useRef<number[]>([]);
  const pendingReminders = useMemo(
    () =>
      supplements.filter(
        (supplement) =>
          supplement.status === "planned" &&
          supplement.reminderEnabled &&
          /^\d{2}:\d{2}$/.test(supplement.time),
      ),
    [supplements],
  );


  useEffect(() => {
    timeoutIds.current.forEach((id) => window.clearTimeout(id));
    timeoutIds.current = [];

    if (permission !== "granted") {
      return;
    }

    pendingReminders.forEach((supplement) => {
      const delay = millisecondsUntilTodayTime(supplement.time);

      if (delay === null) {
        return;
      }

      const timeoutId = window.setTimeout(() => {
        new Notification("Supplement reminder", {
          body: `${supplement.name} is scheduled for ${supplement.time}.`,
          tag: `supplement-${supplement.id}-${supplement.time}`,
        });
      }, delay);

      timeoutIds.current.push(timeoutId);
    });

    return () => {
      timeoutIds.current.forEach((id) => window.clearTimeout(id));
      timeoutIds.current = [];
    };
  }, [pendingReminders, permission]);

  async function requestPermission() {
    if (!("Notification" in window)) {
      setPermission("unsupported");
      return;
    }

    const nextPermission = await Notification.requestPermission();
    setPermission(nextPermission);
  }

  const nextReminder = pendingReminders[0];

  return (
    <section className="min-w-0 overflow-hidden rounded-[32px] border border-white/80 bg-white p-5 shadow-[0_24px_70px_rgba(30,41,59,0.08)]">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-sm font-medium text-blue-600">Reminders</p>
          <h2 className="mt-1 text-2xl font-semibold tracking-tight">
            {permission === "granted" ? "Notifications on" : "Local nudges"}
          </h2>
          <p className="mt-2 text-sm leading-6 text-slate-500">
            {permission === "unsupported"
              ? "This browser does not support local notifications."
              : nextReminder
                ? `Next: ${nextReminder.name} at ${nextReminder.time}. Works while the app is open or active.`
                : "No pending supplement reminders for today."}
          </p>
        </div>
        <div className="grid size-11 shrink-0 place-items-center rounded-2xl bg-blue-50 text-blue-600">
          {permission === "granted" ? (
            <BellRing size={20} aria-hidden />
          ) : (
            <Bell size={20} aria-hidden />
          )}
        </div>
      </div>

      {permission !== "granted" && permission !== "unsupported" && (
        <button
          className="mt-5 inline-flex h-11 w-full items-center justify-center rounded-full bg-slate-950 px-4 text-sm font-semibold text-white shadow-lg shadow-slate-200 transition hover:-translate-y-0.5 hover:bg-slate-800"
          onClick={requestPermission}
          type="button"
        >
          Enable reminders
        </button>
      )}
    </section>
  );
}

function millisecondsUntilTodayTime(time: string) {
  const [hour, minute] = time.split(":").map(Number);

  if (!Number.isFinite(hour) || !Number.isFinite(minute)) {
    return null;
  }

  const now = new Date();
  const scheduled = new Date();
  scheduled.setHours(hour, minute, 0, 0);
  const delay = scheduled.getTime() - now.getTime();

  return delay > 0 ? delay : null;
}
