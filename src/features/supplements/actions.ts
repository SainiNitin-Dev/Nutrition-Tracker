"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { SupplementLogStatus } from "@/generated/prisma/client";
import { supplementIdSchema, supplementSchema } from "./schemas";
import {
  createSupplementForCurrentUser,
  deactivateSupplementForCurrentUser,
  logSupplementForDemoUser,
} from "./service";

export async function addSupplementAction(formData: FormData) {
  const parsed = supplementSchema.safeParse(Object.fromEntries(formData));

  if (!parsed.success) {
    redirect("/supplements?error=invalid-supplement");
  }

  await createSupplementForCurrentUser(parsed.data);

  revalidatePath("/");
  revalidatePath("/supplements");
  redirect("/supplements?added=1");
}

export async function markSupplementTakenAction(formData: FormData) {
  const parsed = supplementIdSchema.safeParse(Object.fromEntries(formData));

  if (!parsed.success) {
    redirect("/supplements?error=invalid-supplement");
  }

  await logSupplementForDemoUser(parsed.data.supplementId, SupplementLogStatus.taken);

  revalidatePath("/");
  revalidatePath("/supplements");
  redirect("/supplements?taken=1");
}

export async function markSupplementSkippedAction(formData: FormData) {
  const parsed = supplementIdSchema.safeParse(Object.fromEntries(formData));

  if (!parsed.success) {
    redirect("/supplements?error=invalid-supplement");
  }

  await logSupplementForDemoUser(parsed.data.supplementId, SupplementLogStatus.skipped);

  revalidatePath("/");
  revalidatePath("/supplements");
  redirect("/supplements?skipped=1");
}

export async function deleteSupplementAction(formData: FormData) {
  const parsed = supplementIdSchema.safeParse(Object.fromEntries(formData));

  if (!parsed.success) {
    redirect("/supplements?error=invalid-supplement");
  }

  await deactivateSupplementForCurrentUser(parsed.data.supplementId);

  revalidatePath("/");
  revalidatePath("/supplements");
  redirect("/supplements?deleted=1");
}
