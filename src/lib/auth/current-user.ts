import { redirect } from "next/navigation";
import { demoUserEmail } from "@/lib/demo";
import { prisma } from "@/lib/prisma/client";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export async function getCurrentAppUser() {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();

  if (error || !user?.email) {
    return null;
  }

  return prisma.user.upsert({
    where: { email: user.email },
    update: {
      name:
        user.user_metadata?.name ??
        user.user_metadata?.full_name ??
        user.email.split("@")[0],
      imageUrl: user.user_metadata?.avatar_url ?? null,
    },
    create: {
      email: user.email,
      name:
        user.user_metadata?.name ??
        user.user_metadata?.full_name ??
        user.email.split("@")[0],
      imageUrl: user.user_metadata?.avatar_url ?? null,
      profile: {
        create: {
          timezone: "Asia/Calcutta",
        },
      },
    },
  });
}

export async function requireCurrentAppUser() {
  const user = await getCurrentAppUser();

  if (!user) {
    redirect("/login");
  }

  return user;
}

export async function getCurrentOrDemoAppUser() {
  const user = await getCurrentAppUser();

  if (user) {
    return user;
  }

  return prisma.user.findUniqueOrThrow({
    where: { email: demoUserEmail },
  });
}
