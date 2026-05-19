"use client";

import { useEffect, useMemo, useState } from "react";
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

type ReminderState = "checking" | "unsupported" | "ready" | "enabled" | "blocked" | "error";

export function SupplementReminderPanel({
  supplements,
}: SupplementReminderPanelProps) {
  const [state, setState] = useState<ReminderState>("checking");
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
  const nextReminder = pendingReminders[0];

  useEffect(() => {
    async function checkSupport() {
      if (!("serviceWorker" in navigator) || !("PushManager" in window)) {
        setState("unsupported");
        return;
      }

      if (Notification.permission === "denied") {
        setState("blocked");
        return;
      }

      const registration = await navigator.serviceWorker.register("/push-sw.js");
      const existingSubscription = await registration.pushManager.getSubscription();
      setState(existingSubscription ? "enabled" : "ready");
    }

    void checkSupport();
  }, []);

  async function enableReminders() {
    try {
      if (!("serviceWorker" in navigator) || !("PushManager" in window)) {
        setState("unsupported");
        return;
      }

      const permission = await Notification.requestPermission();

      if (permission === "denied") {
        setState("blocked");
        return;
      }

      if (permission !== "granted") {
        setState("ready");
        return;
      }

      const keyResponse = await fetch("/api/push/public-key");

      if (!keyResponse.ok) {
        setState("error");
        return;
      }

      const { publicKey } = await keyResponse.json() as { publicKey: string };
      const registration = await navigator.serviceWorker.register("/push-sw.js");
      const existingSubscription = await registration.pushManager.getSubscription();
      const subscription = existingSubscription ?? await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(publicKey),
      });
      const saveResponse = await fetch("/api/push/subscribe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(subscription),
      });

      setState(saveResponse.ok ? "enabled" : "error");
    } catch {
      setState("error");
    }
  }

  return (
    <section className="min-w-0 overflow-hidden rounded-[32px] border border-white/80 bg-white p-5 shadow-[0_24px_70px_rgba(30,41,59,0.08)]">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-sm font-medium text-blue-600">Reminders</p>
          <h2 className="mt-1 text-2xl font-semibold tracking-tight">
            {state === "enabled" ? "Push reminders on" : "Smart reminders"}
          </h2>
          <p className="mt-2 text-sm leading-6 text-slate-500">
            {reminderDescription(state, nextReminder)}
          </p>
        </div>
        <div className="grid size-11 shrink-0 place-items-center rounded-2xl bg-blue-50 text-blue-600">
          {state === "enabled" ? (
            <BellRing size={20} aria-hidden />
          ) : (
            <Bell size={20} aria-hidden />
          )}
        </div>
      </div>

      {state !== "enabled" && state !== "unsupported" && state !== "blocked" && (
        <button
          className="mt-5 inline-flex h-11 w-full items-center justify-center rounded-full bg-slate-950 px-4 text-sm font-semibold text-white shadow-lg shadow-slate-200 transition hover:-translate-y-0.5 hover:bg-slate-800 disabled:cursor-wait disabled:opacity-70"
          disabled={state === "checking"}
          onClick={enableReminders}
          type="button"
        >
          Enable push reminders
        </button>
      )}
    </section>
  );
}

function reminderDescription(
  state: ReminderState,
  nextReminder?: ReminderSupplement,
) {
  if (state === "unsupported") {
    return "This browser does not support Web Push reminders.";
  }

  if (state === "blocked") {
    return "Notifications are blocked in your browser settings.";
  }

  if (state === "error") {
    return "Push reminders need VAPID keys configured before they can be enabled.";
  }

  if (state === "checking") {
    return "Checking notification support...";
  }

  if (nextReminder) {
    return `Next supplement: ${nextReminder.name} at ${nextReminder.time}. Hydration and meal nudges are included.`;
  }

  return "Hydration and meal nudges are included. Add supplements to get dose-time reminders.";
}

function urlBase64ToUint8Array(base64String: string) {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/");
  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);

  for (let index = 0; index < rawData.length; index += 1) {
    outputArray[index] = rawData.charCodeAt(index);
  }

  return outputArray;
}
