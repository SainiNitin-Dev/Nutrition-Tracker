"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { SupplementLogStatus } from "@/generated/prisma/client";
import { logSupplementForDemoUser } from "./service";

export async function markSupplementTakenAction(formData: FormData) {
  const supplementId = String(formData.get("supplementId") ?? "");

  if (!supplementId) {
    redirect("/supplements?error=invalid-supplement");
  }

  await logSupplementForDemoUser(supplementId, SupplementLogStatus.taken);

  revalidatePath("/");
  revalidatePath("/supplements");
  redirect("/supplements?taken=1");
}

export async function markSupplementSkippedAction(formData: FormData) {
  const supplementId = String(formData.get("supplementId") ?? "");

  if (!supplementId) {
    redirect("/supplements?error=invalid-supplement");
  }

  await logSupplementForDemoUser(supplementId, SupplementLogStatus.skipped);

  revalidatePath("/");
  revalidatePath("/supplements");
  redirect("/supplements?skipped=1");
}
