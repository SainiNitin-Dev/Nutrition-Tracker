import Link from "next/link";
import { ArrowLeft, MessageCircle } from "lucide-react";
import { CoachChatPanel } from "@/features/coach/components/coach-chat-panel";
import { getTodayDashboardSnapshot } from "@/features/dashboard/queries";

export const dynamic = "force-dynamic";

export default async function CoachPage() {
  const snapshot = await getTodayDashboardSnapshot();

  return (
    <main className="min-h-[100svh] bg-[radial-gradient(circle_at_top_left,_rgba(219,234,254,0.9),_transparent_30%),linear-gradient(135deg,_#fbfcff_0%,_#f5f7fb_48%,_#eef5ff_100%)] px-4 py-5 text-slate-950 sm:px-6 lg:px-8">
      <div className="mx-auto flex min-h-[calc(100svh-160px)] w-full max-w-4xl flex-col gap-4">
        <header className="flex items-center justify-between rounded-[28px] border border-white/80 bg-white/82 p-4 shadow-[0_18px_50px_rgba(30,41,59,0.07)] backdrop-blur">
          <div className="flex items-center gap-3">
            <Link
              className="grid size-11 place-items-center rounded-full border border-slate-200 bg-white text-slate-600 transition active:scale-95"
              href="/"
              title="Back to today"
            >
              <ArrowLeft size={18} aria-hidden />
              <span className="sr-only">Back to today</span>
            </Link>
            <div>
              <p className="text-sm font-medium text-blue-600">AI coach</p>
              <h1 className="text-2xl font-semibold tracking-tight">Conversation</h1>
            </div>
          </div>
          <div className="grid size-11 place-items-center rounded-2xl bg-slate-950 text-white">
            <MessageCircle size={20} aria-hidden />
          </div>
        </header>

        <section className="flex flex-1 flex-col">
          <CoachChatPanel insights={snapshot.insights} variant="conversation" />
        </section>
      </div>
    </main>
  );
}
