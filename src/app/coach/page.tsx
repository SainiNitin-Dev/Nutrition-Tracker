import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { CoachChatPanel } from "@/features/coach/components/coach-chat-panel";
import { getTodayDashboardSnapshot } from "@/features/dashboard/queries";

export const dynamic = "force-dynamic";

export default async function CoachPage() {
  const snapshot = await getTodayDashboardSnapshot();

  return (
    <main className="min-h-[100svh] bg-slate-950 text-white">
      <div className="mx-auto flex min-h-[100svh] w-full max-w-4xl flex-col">
        <header className="sticky top-0 z-10 flex items-center justify-between border-b border-white/10 bg-slate-950/92 px-4 pb-4 pt-[calc(env(safe-area-inset-top)+1rem)] backdrop-blur">
          <div className="flex min-w-0 items-center gap-3">
            <Link
              className="grid size-11 shrink-0 place-items-center rounded-full border border-white/10 bg-white/8 text-slate-200 transition active:scale-95"
              href="/"
              title="Back to today"
            >
              <ArrowLeft size={18} aria-hidden />
              <span className="sr-only">Back to today</span>
            </Link>
            <div className="min-w-0">
              <p className="text-sm font-medium text-blue-200">Nourish AI</p>
              <h1 className="truncate text-2xl font-semibold tracking-tight">
                Coach
              </h1>
            </div>
          </div>
        </header>

        <section className="flex min-h-0 flex-1 flex-col">
          <CoachChatPanel insights={snapshot.insights} variant="conversation" />
        </section>
      </div>
    </main>
  );
}
