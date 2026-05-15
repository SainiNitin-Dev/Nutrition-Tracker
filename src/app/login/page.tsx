import Link from "next/link";
import {
  ArrowRight,
  CheckCircle2,
  KeyRound,
  LockKeyhole,
  Mail,
  Sparkles,
  UserRound,
} from "lucide-react";
import { signInWithPasswordAction, signUpWithPasswordAction } from "./actions";

type LoginPageProps = {
  searchParams: Promise<{
    signedOut?: string;
    error?: string;
  }>;
};

export default async function LoginPage({ searchParams }: LoginPageProps) {
  const params = await searchParams;

  return (
    <main className="min-h-screen bg-[radial-gradient(circle_at_top_left,_rgba(219,234,254,0.9),_transparent_30%),linear-gradient(135deg,_#fbfcff_0%,_#f5f7fb_48%,_#eef5ff_100%)] px-4 py-6 text-slate-950 sm:px-6 lg:px-8">
      <div className="mx-auto grid min-h-[calc(100vh-48px)] w-full max-w-6xl items-center gap-8 lg:grid-cols-[1.05fr_0.95fr]">
        <section className="order-2 grid gap-5 lg:order-1">
          <div className="inline-flex w-fit items-center gap-2 rounded-full border border-blue-100 bg-white/80 px-4 py-2 text-sm font-semibold text-blue-700 shadow-sm">
            <Sparkles size={16} aria-hidden />
            AI nutrition coach
          </div>
          <div>
            <h1 className="max-w-2xl text-5xl font-semibold tracking-tight text-slate-950 sm:text-6xl">
              Your health data, finally in conversation.
            </h1>
            <p className="mt-5 max-w-xl text-lg leading-8 text-slate-600">
              Sign in with email and password to track meals, hydration,
              supplements, and coach actions against your own account.
            </p>
          </div>

          <div className="grid gap-3 sm:grid-cols-3">
            {["Meal logs", "Water trends", "Coach actions"].map((item) => (
              <div
                className="rounded-3xl border border-white/80 bg-white/75 p-4 shadow-[0_18px_50px_rgba(30,41,59,0.06)] backdrop-blur"
                key={item}
              >
                <CheckCircle2 className="text-blue-600" size={20} aria-hidden />
                <p className="mt-4 text-sm font-semibold text-slate-950">{item}</p>
              </div>
            ))}
          </div>
        </section>

        <section className="order-1 rounded-[36px] border border-white/80 bg-white p-6 shadow-[0_24px_70px_rgba(30,41,59,0.1)] lg:order-2">
          <div className="grid size-14 place-items-center rounded-2xl bg-slate-950 text-white shadow-lg shadow-slate-300">
            <LockKeyhole size={22} aria-hidden />
          </div>
          <h2 className="mt-6 text-3xl font-semibold tracking-tight">Sign in</h2>
          <p className="mt-2 text-sm leading-6 text-slate-500">
            Use email and password. No email redirect setup needed.
          </p>

          {params.signedOut && (
            <div className="mt-5 rounded-3xl border border-blue-100 bg-blue-50 px-4 py-3 text-sm font-medium text-blue-800">
              You have been signed out.
            </div>
          )}
          {params.error && (
            <div className="mt-5 rounded-3xl border border-rose-100 bg-rose-50 px-4 py-3 text-sm font-medium text-rose-800">
              {errorMessage(params.error)}
            </div>
          )}

          <form className="mt-6 grid gap-4">
            <label className="grid gap-2 text-sm font-medium text-slate-700">
              Name
              <span className="relative">
                <UserRound
                  className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400"
                  size={18}
                  aria-hidden
                />
                <input
                  className="h-13 w-full rounded-2xl border border-slate-200 bg-slate-50 px-11 text-slate-950 outline-none transition placeholder:text-slate-400 focus:border-blue-300 focus:ring-4 focus:ring-blue-100"
                  maxLength={80}
                  name="name"
                  placeholder="Used when creating an account"
                />
              </span>
            </label>

            <label className="grid gap-2 text-sm font-medium text-slate-700">
              Email address
              <span className="relative">
                <Mail
                  className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400"
                  size={18}
                  aria-hidden
                />
                <input
                  className="h-13 w-full rounded-2xl border border-slate-200 bg-slate-50 px-11 text-slate-950 outline-none transition placeholder:text-slate-400 focus:border-blue-300 focus:ring-4 focus:ring-blue-100"
                  name="email"
                  placeholder="you@example.com"
                  required
                  type="email"
                />
              </span>
            </label>

            <label className="grid gap-2 text-sm font-medium text-slate-700">
              Password
              <span className="relative">
                <KeyRound
                  className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400"
                  size={18}
                  aria-hidden
                />
                <input
                  className="h-13 w-full rounded-2xl border border-slate-200 bg-slate-50 px-11 text-slate-950 outline-none transition placeholder:text-slate-400 focus:border-blue-300 focus:ring-4 focus:ring-blue-100"
                  minLength={6}
                  name="password"
                  placeholder="At least 6 characters"
                  required
                  type="password"
                />
              </span>
            </label>

            <div className="grid gap-3 sm:grid-cols-2">
              <button
                className="inline-flex h-12 items-center justify-between rounded-full bg-slate-950 px-5 text-sm font-semibold text-white shadow-lg shadow-slate-300 transition hover:-translate-y-0.5 hover:bg-slate-800"
                formAction={signInWithPasswordAction}
              >
                Sign in
                <ArrowRight size={17} aria-hidden />
              </button>
              <button
                className="inline-flex h-12 items-center justify-center rounded-full border border-slate-200 bg-white px-5 text-sm font-semibold text-slate-800 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md"
                formAction={signUpWithPasswordAction}
              >
                Create account
              </button>
            </div>
          </form>

          <Link
            className="mt-5 inline-flex text-sm font-semibold text-blue-700"
            href="/"
          >
            Continue to demo dashboard
          </Link>
        </section>
      </div>
    </main>
  );
}

function errorMessage(error: string) {
  const messages: Record<string, string> = {
    "invalid-email": "Enter a valid email address.",
    "invalid-name": "Name must be 80 characters or fewer.",
    "invalid-password": "Password must be at least 6 characters.",
    "invalid-login": "Email or password is incorrect.",
    signup: "Could not create account. Check if the email already exists or if password signups are enabled in Supabase.",
  };

  return messages[error] ?? "Sign-in could not be completed. Please try again.";
}
