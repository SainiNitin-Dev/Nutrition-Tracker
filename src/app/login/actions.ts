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
  const name = readName(formData, email);
  const supabase = await createSupabaseServerClient();
  const { error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: {
        name,
      },
    },
  });

  if (error) {
    redirect("/login?mode=signup&error=signup");
  }

  await ensureAppUser(email, name);
  redirect("/onboarding");
}

export async function signOutAction() {
  const supabase = await createSupabaseServerClient();
  await supabase.auth.signOut();
  redirect("/login?signedOut=1");
}

function readName(formData: FormData, email: string) {
  const name = String(formData.get("name") ?? "").trim();

  if (name.length > 80) {
    redirect("/login?error=invalid-name");
  }

  if (name.length < 2) {
    redirect("/login?mode=signup&error=invalid-name");
  }

  return name || email.split("@")[0];
}

async function ensureAppUser(email: string, name?: string) {
  return prisma.user.upsert({
    where: { email },
    update: name ? { name } : {},
    create: {
      email,
      name: name ?? email.split("@")[0],
      profile: {
        create: {
          timezone: "Asia/Calcutta",
        },
      },
    },
  });
}
