import Link from "next/link";
import { ArrowLeft, LogOut, UserRound } from "lucide-react";
import { getCurrentAppUser } from "@/lib/auth/current-user";
import { signOutAction } from "@/app/login/actions";

export const dynamic = "force-dynamic";

export default async function AccountPage() {
  const user = await getCurrentAppUser();

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
            <form action={signOutAction} className="mt-6">
              <button className="inline-flex h-11 items-center gap-2 rounded-full border border-slate-200 bg-white px-4 text-sm font-semibold text-slate-700 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md">
                <LogOut size={16} aria-hidden />
                Sign out
              </button>
            </form>
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
