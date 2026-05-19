export async function GET() {
  const publicKey = process.env.VAPID_PUBLIC_KEY;

  if (!publicKey) {
    return Response.json(
      { error: "Web Push is not configured yet." },
      { status: 503 },
    );
  }

  return Response.json({ publicKey });
}
