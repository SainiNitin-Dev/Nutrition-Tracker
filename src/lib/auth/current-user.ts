import { redirect } from "next/navigation";
import { cache } from "react";
import { cookies } from "next/headers";
import { demoUserEmail } from "@/lib/demo";
import { prisma } from "@/lib/prisma/client";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export const getCurrentAppUser = cache(async () => {
  if (!(await hasSupabaseAuthCookie())) {
    return null;
  }

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
});

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

async function hasSupabaseAuthCookie() {
  const cookieStore = await cookies();

  return cookieStore
    .getAll()
    .some((cookie) => cookie.name.startsWith("sb-") && cookie.name.includes("auth-token"));
}
