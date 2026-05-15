export default function Loading() {
  return (
    <main className="min-h-screen bg-[radial-gradient(circle_at_top_left,_rgba(219,234,254,0.9),_transparent_30%),linear-gradient(135deg,_#fbfcff_0%,_#f5f7fb_48%,_#eef5ff_100%)] px-4 py-5 text-slate-950 sm:px-6 lg:px-8">
      <div className="mx-auto grid w-full max-w-7xl gap-5">
        <section className="rounded-[32px] border border-white/80 bg-white/80 p-5 shadow-[0_24px_70px_rgba(30,41,59,0.08)] backdrop-blur">
          <div className="flex items-center gap-4">
            <div className="size-12 animate-pulse rounded-2xl bg-slate-200" />
            <div className="grid flex-1 gap-3">
              <div className="h-4 w-32 animate-pulse rounded-full bg-blue-100" />
              <div className="h-8 w-72 max-w-full animate-pulse rounded-full bg-slate-200" />
            </div>
          </div>
        </section>

        <section className="grid gap-5 lg:grid-cols-[0.95fr_1.05fr]">
          <div className="h-[420px] animate-pulse rounded-[32px] border border-white/80 bg-white/75 shadow-[0_24px_70px_rgba(30,41,59,0.08)]" />
          <div className="grid gap-5">
            <div className="h-48 animate-pulse rounded-[32px] border border-white/80 bg-white/75 shadow-[0_24px_70px_rgba(30,41,59,0.08)]" />
            <div className="h-48 animate-pulse rounded-[32px] border border-white/80 bg-white/75 shadow-[0_24px_70px_rgba(30,41,59,0.08)]" />
          </div>
        </section>
      </div>
    </main>
  );
}
