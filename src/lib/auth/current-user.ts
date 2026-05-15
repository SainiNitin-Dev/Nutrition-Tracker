import { redirect } from "next/navigation";
import { cache } from "react";
import { prisma } from "@/lib/prisma/client";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export const getCurrentAppUser = cache(async () => {
  const claims = await getVerifiedSupabaseClaims();

  if (!claims?.email) {
    return null;
  }

  const existingUser = await prisma.user.findUnique({
    where: { email: claims.email },
  });

  if (existingUser) {
    return existingUser;
  }

  return prisma.user.create({
    data: {
      email: claims.email,
      name: claims.name ?? claims.email.split("@")[0],
      imageUrl: claims.imageUrl ?? null,
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

export async function getCurrentAppUserWithActiveGoal() {
  const user = await getCurrentAppUser();

  if (!user) {
    return null;
  }

  return prisma.user.findUnique({
    where: { id: user.id },
    include: {
      goals: {
        where: { isActive: true },
        take: 1,
      },
    },
  });
}

export async function getCurrentOrDemoAppUser() {
  return requireCurrentAppUser();
}

export async function getCurrentOrDemoUserWhereUnique() {
  const user = await requireCurrentAppUser();

  return { id: user.id } as const;
}

type VerifiedSupabaseClaims = {
  email?: string;
  name?: string;
  imageUrl?: string | null;
};

async function getVerifiedSupabaseClaims(): Promise<VerifiedSupabaseClaims | null> {
  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase.auth.getClaims();

  if (error || !data?.claims) {
    return null;
  }

  const claims = data.claims as Record<string, unknown>;
  const userMetadata = readRecord(claims.user_metadata);

  return {
    email: readString(claims.email),
    name: readString(userMetadata?.name) ?? readString(userMetadata?.full_name),
    imageUrl: readString(userMetadata?.avatar_url),
  };
}

function readRecord(value: unknown) {
  return value && typeof value === "object" ? (value as Record<string, unknown>) : null;
}

function readString(value: unknown) {
  return typeof value === "string" && value.trim() ? value : undefined;
}
