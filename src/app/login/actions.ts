"use server";

import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma/client";
import { createSupabaseServerClient } from "@/lib/supabase/server";

function readCredentials(formData: FormData) {
  const email = String(formData.get("email") ?? "")
    .trim()
    .toLowerCase();
  const password = String(formData.get("password") ?? "");

  if (!email || !email.includes("@")) {
    redirect("/login?error=invalid-email");
  }

  if (password.length < 6) {
    redirect("/login?error=invalid-password");
  }

  return { email, password };
}

export async function signInWithPasswordAction(formData: FormData) {
  const { email, password } = readCredentials(formData);
  const supabase = await createSupabaseServerClient();
  const { error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  if (error) {
    redirect("/login?error=invalid-login");
  }

  await ensureAppUser(email);
  redirect("/");
}

export async function signUpWithPasswordAction(formData: FormData) {
  const { email, password } = readCredentials(formData);
  const supabase = await createSupabaseServerClient();
  const { error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: {
        name: email.split("@")[0],
      },
    },
  });

  if (error) {
    redirect("/login?error=signup");
  }

  await ensureAppUser(email);
  redirect("/onboarding");
}

export async function signOutAction() {
  const supabase = await createSupabaseServerClient();
  await supabase.auth.signOut();
  redirect("/login?signedOut=1");
}

async function ensureAppUser(email: string) {
  return prisma.user.upsert({
    where: { email },
    update: {
      name: email.split("@")[0],
    },
    create: {
      email,
      name: email.split("@")[0],
      profile: {
        create: {
          timezone: "Asia/Calcutta",
        },
      },
    },
  });
}
