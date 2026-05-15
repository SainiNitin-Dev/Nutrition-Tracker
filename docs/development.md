# Development Workflow

## Reset Demo Data

The app currently uses one demo user while authentication is still being built:

```text
alex.demo@nourish.local
```

During development, actions from the dashboard, hydration page, supplements page, and AI coach write real rows to Supabase. Use this command to reset the demo user back to the known seed state:

```bash
npm run demo:reset
```

This resets:

- Active goal
- Meals and meal items
- Hydration logs
- Supplements, schedules, and supplement logs
- Coach memories
- Coach conversations
- AI action logs

It does not delete the Supabase project, schema, or environment configuration.

## Verification Before Pushing

Run:

```bash
npm run lint
npm run build
```

Both should pass before pushing to `main`.

## Supabase Auth Local Setup

The app uses Supabase magic-link auth through `@supabase/ssr`.

For local development, add this URL in Supabase Auth settings:

```text
http://localhost:3000/auth/callback
```

Also keep `.env.local` aligned with the local app URL:

```env
NEXT_PUBLIC_APP_URL="http://localhost:3000"
```

When a user is signed in, app data is mapped to a Prisma `User` row by email. When no user is signed in, the app intentionally falls back to the seeded demo user so development remains usable.
