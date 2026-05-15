# Free-First Architecture

This project is designed to stay free while we build, demo, and validate the product.

## Recommended Free Stack

| Layer | Choice | Why |
| --- | --- | --- |
| Hosting | Vercel Free | Best developer experience for Next.js previews and deployment. |
| Database | Supabase Free Postgres | Free Postgres, Auth, Storage, and dashboard in one place. |
| Auth | Supabase Auth | Free managed auth while we are early; avoids building session infrastructure too soon. |
| ORM | Prisma | Typed schema, migrations, safer query layer, provider portability. |
| AI | Groq | Fast OpenAI-compatible chat completions and free-to-start developer access. |
| Validation | Zod | Runtime validation for forms and AI tool calls. |
| File Storage | Supabase Storage | Useful later for meal photos and progress images. |

## Local Environment Rules

Keep secrets only in `.env.local`. Never paste them into chat or commit them.

Supabase database URLs must be real Postgres URLs, not placeholders. Replace `[password]` with your actual database password. If the password contains special characters, URL-encode it before placing it in the URL.

Use this shape for local development:

```env
DATABASE_URL="postgresql://postgres.your-project-ref:URL_ENCODED_PASSWORD@aws-0-region.pooler.supabase.com:6543/postgres?pgbouncer=true"
DIRECT_URL="postgresql://postgres.your-project-ref:URL_ENCODED_PASSWORD@aws-0-region.pooler.supabase.com:5432/postgres"
```

`DATABASE_URL` uses Supabase Transaction pooler. It is good for serverless runtime queries.

`DIRECT_URL` should use Supabase Session pooler. Prisma schema operations need a stable session connection. Supabase's direct host, `db.your-project-ref.supabase.co`, can be IPv6-only, so it may fail on local networks without IPv6.

Groq keys usually start with `gsk_`. The key should be a plain string:

```env
GROQ_API_KEY="gsk_your_key_here"
```

## Why Supabase Over Neon For This App

Neon is excellent for free serverless Postgres. For this product, Supabase is the better default because it gives us more free app infrastructure in one account:

- Postgres database
- Authentication
- Storage for meal photos
- Row-level security if we later use direct client access
- Dashboard for inspecting data

We can still move to Neon later because our database layer stays standard Postgres and Prisma-compatible.

## Why Groq For AI

Groq is a strong fit for the AI coach because it is fast, cost-conscious, and offers OpenAI-compatible APIs. We will design the coach behind an adapter so we can swap models later.

The AI layer should never write directly to the database. It should call typed app tools:

- `addHydrationLog`
- `createMealFromText`
- `updateMealNutrition`
- `deleteMeal`
- `markSupplementTaken`
- `createCoachMemory`

Each tool validates inputs, checks ownership, writes through the app domain layer, and records an audit log.

## Free-Tier Guardrails

To keep costs at zero:

- Keep AI calls behind explicit user actions.
- Use a smaller Groq model for simple parsing and a larger model only for deep coaching.
- Send only relevant nutrition context to the model.
- Summarize old conversations instead of replaying everything.
- Cache deterministic calculations in code instead of asking AI.
- Avoid embeddings until structured Postgres retrieval is not enough.
- Store images only when the user explicitly uploads meal recognition photos.

## Upgrade Path

The app should be free-first, not free-trapped.

When usage grows:

- Upgrade Supabase for larger database/storage/auth limits.
- Add background jobs for reminders and daily summaries.
- Add vector search for long-term coach memory.
- Add rate limits per user for AI endpoints.
- Add billing only if we introduce paid user tiers.
