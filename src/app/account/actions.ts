"use server";

import { redirect } from "next/navigation";
import { requireCurrentAppUser } from "@/lib/auth/current-user";
import { prisma } from "@/lib/prisma/client";

export async function updateNameAction(formData: FormData) {
  const name = String(formData.get("name") ?? "").trim();

  if (name.length < 2 || name.length > 80) {
    redirect("/account?error=invalid-name");
  }

  const user = await requireCurrentAppUser();

  await prisma.user.update({
    where: { id: user.id },
    data: { name },
  });

  redirect("/account?updated=1");
}
