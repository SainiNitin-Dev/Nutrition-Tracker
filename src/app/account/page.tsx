import Link from "next/link";
import { ArrowLeft, LogOut, Save, Target, UserRound } from "lucide-react";
import { PendingSubmitButton } from "@/components/ui/pending-submit-button";
import { getCurrentAppUserWithActiveGoal } from "@/lib/auth/current-user";
import { signOutAction } from "@/app/login/actions";
import { updateNameAction } from "./actions";

export const dynamic = "force-dynamic";

type AccountPageProps = {
  searchParams: Promise<{
    updated?: string;
    error?: string;
  }>;
};

export default async function AccountPage({ searchParams }: AccountPageProps) {
  const params = await searchParams;
  const user = await getCurrentAppUserWithActiveGoal();

  return (
    <main className="min-h-screen bg-[radial-gradient(circle_at_top_left,_rgba(219,234,254,0.9),_transparent_30%),linear-gradient(135deg,_#fbfcff_0%,_#f5f7fb_48%,_#eef5ff_100%)] px-4 py-5 text-slate-950 sm:px-6 lg:px-8">
      <div className="mx-auto grid w-full max-w-3xl gap-5">
        <header className="rounded-[32px] border border-white/80 bg-white/80 p-5 shadow-[0_24px_70px_rgba(30,41,59,0.08)] backdrop-blur">
          <div className="flex items-center gap-4">
            <Link
              className="grid size-11 place-items-center rounded-full border border-slate-200 bg-white text-slate-600 transition hover:-translate-y-0.5 hover:shadow-md"
              href="/"
              title="Back to dashboard"
            >
              <ArrowLeft size={18} aria-hidden />
            </Link>
            <div>
              <p className="text-sm font-medium text-blue-600">Account</p>
              <h1 className="text-3xl font-semibold tracking-tight">Profile session</h1>
            </div>
          </div>
        </header>

        {params.updated && (
          <div className="rounded-3xl border border-emerald-100 bg-emerald-50 px-5 py-4 text-sm font-medium text-emerald-800 shadow-sm">
            Name updated.
          </div>
        )}
        {params.error && (
          <div className="rounded-3xl border border-rose-100 bg-rose-50 px-5 py-4 text-sm font-medium text-rose-800 shadow-sm">
            Name must be between 2 and 80 characters.
          </div>
        )}

        <section className="rounded-[32px] border border-white/80 bg-white p-6 shadow-[0_24px_70px_rgba(30,41,59,0.08)]">
          <div className="flex items-start gap-4">
            <div className="grid size-14 place-items-center rounded-2xl bg-blue-50 text-blue-600">
              <UserRound size={24} aria-hidden />
            </div>
            <div>
              <h2 className="text-2xl font-semibold tracking-tight">
                {user?.name ?? "Demo user"}
              </h2>
              <p className="mt-1 text-sm text-slate-500">
                {user?.email ?? "Not signed in. The app is using demo data."}
              </p>
            </div>
          </div>

          {user ? (
            <>
              <form action={updateNameAction} className="mt-6 grid gap-3">
                <label className="grid gap-2 text-sm font-medium text-slate-700">
                  Display name
                  <input
                    className="h-12 rounded-2xl border border-slate-200 bg-slate-50 px-4 text-slate-950 outline-none transition placeholder:text-slate-400 focus:border-blue-300 focus:ring-4 focus:ring-blue-100"
                    defaultValue={user.name ?? ""}
                    maxLength={80}
                    name="name"
                    placeholder="Your name"
                    required
                  />
                </label>
                <PendingSubmitButton
                  className="inline-flex h-11 w-fit items-center gap-2 rounded-full bg-blue-600 px-4 text-sm font-semibold text-white shadow-lg shadow-blue-200 transition hover:-translate-y-0.5 hover:bg-blue-700 disabled:cursor-wait disabled:opacity-70"
                  pendingLabel="Saving..."
                >
                  <Save size={16} aria-hidden />
                  Save name
                </PendingSubmitButton>
              </form>

              <div className="mt-6 flex flex-wrap gap-2">
                <Link
                  className="inline-flex h-11 items-center gap-2 rounded-full bg-slate-950 px-4 text-sm font-semibold text-white shadow-lg shadow-slate-300 transition hover:-translate-y-0.5"
                  href="/onboarding"
                >
                  <Target size={16} aria-hidden />
                  {user.goals.length > 0 ? "Edit targets" : "Complete setup"}
                </Link>
                <form action={signOutAction}>
                  <PendingSubmitButton
                    className="inline-flex h-11 items-center gap-2 rounded-full border border-slate-200 bg-white px-4 text-sm font-semibold text-slate-700 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md disabled:cursor-wait disabled:opacity-70"
                    pendingLabel="Signing out..."
                  >
                    <LogOut size={16} aria-hidden />
                    Sign out
                  </PendingSubmitButton>
                </form>
              </div>
            </>
          ) : (
            <Link
              className="mt-6 inline-flex h-11 items-center rounded-full bg-slate-950 px-4 text-sm font-semibold text-white"
              href="/login"
            >
              Sign in
            </Link>
          )}
        </section>
      </div>
    </main>
  );
}
