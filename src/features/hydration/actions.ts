"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { LogSource } from "@/generated/prisma/client";
import {
  addHydrationLogForDemoUser,
  deleteHydrationLogForDemoUser,
} from "./service";

export async function addHydrationAction(formData: FormData) {
  const amountMl = Number(formData.get("amountMl"));

  try {
    await addHydrationLogForDemoUser(amountMl, LogSource.manual);
  } catch {
    redirect("/hydration?error=invalid-water");
  }

  revalidatePath("/");
  revalidatePath("/hydration");
  redirect("/hydration?added=1");
}

export async function deleteHydrationAction(formData: FormData) {
  const logId = String(formData.get("logId") ?? "");

  if (!logId) {
    redirect("/hydration?error=invalid-delete");
  }

  await deleteHydrationLogForDemoUser(logId);

  revalidatePath("/");
  revalidatePath("/hydration");
  redirect("/hydration?deleted=1");
}
