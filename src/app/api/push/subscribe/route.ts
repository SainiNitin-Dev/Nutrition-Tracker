import { randomUUID } from "node:crypto";
import { z } from "zod";
import { requireCurrentAppUser } from "@/lib/auth/current-user";
import { prisma } from "@/lib/prisma/client";

const subscriptionSchema = z.object({
  endpoint: z.string().url(),
  expirationTime: z.number().nullable().optional(),
  keys: z.object({
    p256dh: z.string().min(1),
    auth: z.string().min(1),
  }),
});

export async function POST(request: Request) {
  const user = await requireCurrentAppUser();
  const body = await request.json();
  const parsed = subscriptionSchema.safeParse(body);

  if (!parsed.success) {
    return Response.json({ error: "Invalid push subscription." }, { status: 400 });
  }

  const expirationTime = parsed.data.expirationTime
    ? new Date(parsed.data.expirationTime)
    : null;
  const userAgent = request.headers.get("user-agent");
  const id = randomUUID();

  await prisma.$executeRaw`
    INSERT INTO "PushSubscription" (
      "id",
      "userId",
      "endpoint",
      "p256dh",
      "auth",
      "expirationTime",
      "userAgent",
      "createdAt",
      "updatedAt"
    ) VALUES (
      ${id},
      ${user.id},
      ${parsed.data.endpoint},
      ${parsed.data.keys.p256dh},
      ${parsed.data.keys.auth},
      ${expirationTime},
      ${userAgent},
      now(),
      now()
    )
    ON CONFLICT ("endpoint") DO UPDATE SET
      "userId" = EXCLUDED."userId",
      "p256dh" = EXCLUDED."p256dh",
      "auth" = EXCLUDED."auth",
      "expirationTime" = EXCLUDED."expirationTime",
      "userAgent" = EXCLUDED."userAgent",
      "updatedAt" = now()
  `;

  return Response.json({ ok: true });
}
