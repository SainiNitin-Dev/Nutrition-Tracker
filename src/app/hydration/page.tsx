import Link from "next/link";
import { ArrowLeft, Droplets, Plus, Trash2, Waves } from "lucide-react";
import {
  addHydrationAction,
  deleteHydrationAction,
} from "@/features/hydration/actions";
import { getHydrationTrackerData } from "@/features/hydration/queries";

export const dynamic = "force-dynamic";

type HydrationPageProps = {
  searchParams: Promise<{
    added?: string;
    deleted?: string;
    error?: string;
  }>;
};

const quickAdds = [250, 500, 750, 1000];

export default async function HydrationPage({
  searchParams,
}: HydrationPageProps) {
  const params = await searchParams;
  const data = await getHydrationTrackerData();

  return (
    <main className="min-h-screen bg-[radial-gradient(circle_at_top_left,_rgba(219,234,254,0.9),_transparent_30%),linear-gradient(135deg,_#fbfcff_0%,_#f5f7fb_48%,_#eef5ff_100%)] px-4 py-5 text-slate-950 sm:px-6 lg:px-8">
      <div className="mx-auto grid w-full max-w-7xl gap-5">
        <header className="rounded-[32px] border border-white/80 bg-white/80 p-5 shadow-[0_24px_70px_rgba(30,41,59,0.08)] backdrop-blur">
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div className="flex items-center gap-4">
              <Link
                className="grid size-11 place-items-center rounded-full border border-slate-200 bg-white text-slate-600 transition hover:-translate-y-0.5 hover:shadow-md"
                href="/"
                title="Back to dashboard"
              >
                <ArrowLeft size={18} aria-hidden />
                <span className="sr-only">Back to dashboard</span>
              </Link>
              <div>
                <p className="text-sm font-medium text-blue-600">Hydration</p>
                <h1 className="text-3xl font-semibold tracking-tight">
                  Keep water on pace
                </h1>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2 sm:flex">
              <HeaderStat label="Total" value={`${data.totalMl} ml`} />
              <HeaderStat label="Remaining" value={`${data.remainingMl} ml`} />
            </div>
          </div>
        </header>

        {params.added && <Notice tone="success">Water added to today’s log.</Notice>}
        {params.deleted && <Notice tone="success">Hydration log removed.</Notice>}
        {params.error && (
          <Notice tone="error">
            Water amount should be between 50ml and 3000ml.
          </Notice>
        )}

        <section className="grid gap-5 lg:grid-cols-[430px_minmax(0,1fr)]">
          <HydrationControl data={data} />
          <HydrationLog logs={data.logs} />
        </section>
      </div>
    </main>
  );
}

function HeaderStat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl border border-slate-100 bg-white px-4 py-3 shadow-sm">
      <p className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-400">
        {label}
      </p>
      <p className="mt-1 text-base font-semibold text-slate-950">{value}</p>
    </div>
  );
}

function Notice({
  children,
  tone,
}: {
  children: React.ReactNode;
  tone: "success" | "error";
}) {
  return (
    <div
      className={`rounded-3xl border px-5 py-4 text-sm font-medium shadow-sm ${
        tone === "success"
          ? "border-emerald-100 bg-emerald-50 text-emerald-800"
          : "border-rose-100 bg-rose-50 text-rose-800"
      }`}
    >
      {children}
    </div>
  );
}

function HydrationControl({
  data,
}: {
  data: Awaited<ReturnType<typeof getHydrationTrackerData>>;
}) {
  return (
    <section className="rounded-[32px] border border-white/80 bg-white p-6 shadow-[0_24px_70px_rgba(30,41,59,0.08)]">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-medium text-blue-600">Today’s goal</p>
          <h2 className="mt-1 text-4xl font-semibold tracking-tight">
            {Math.min(data.percent, 999)}%
          </h2>
          <p className="mt-1 text-sm text-slate-500">
            {data.totalMl.toLocaleString()}ml of {data.goalMl.toLocaleString()}ml
          </p>
        </div>
        <div className="grid size-12 place-items-center rounded-2xl bg-blue-50 text-blue-600">
          <Droplets size={22} aria-hidden />
        </div>
      </div>

      <div className="mt-8 grid place-items-center">
        <div className="relative h-72 w-40 overflow-hidden rounded-b-[52px] rounded-t-[28px] border border-blue-200 bg-blue-50/40 shadow-inner">
          <div
            className="water-fill absolute bottom-0 left-0 right-0 bg-gradient-to-t from-blue-600 via-sky-400 to-cyan-200"
            style={{ height: `${Math.min(data.percent, 100)}%` }}
          />
          <Waves
            className="absolute left-1/2 top-8 -translate-x-1/2 text-blue-300"
            size={42}
            aria-hidden
          />
          <div className="absolute inset-0 grid place-items-center">
            <p className="rounded-full bg-white/85 px-4 py-2 text-sm font-semibold text-blue-700 shadow-sm backdrop-blur">
              {data.remainingMl > 0 ? `${data.remainingMl}ml left` : "Goal met"}
            </p>
          </div>
        </div>
      </div>

      <div className="mt-8 grid grid-cols-2 gap-3">
        {quickAdds.map((amount) => (
          <form action={addHydrationAction} key={amount}>
            <input name="amountMl" type="hidden" value={amount} />
            <button className="h-12 w-full rounded-full border border-blue-100 bg-blue-50 text-sm font-semibold text-blue-700 transition hover:-translate-y-0.5 hover:bg-blue-100">
              +{amount}ml
            </button>
          </form>
        ))}
      </div>

      <form action={addHydrationAction} className="mt-4 flex items-center gap-2">
        <label className="sr-only" htmlFor="custom-water">
          Custom water amount
        </label>
        <input
          className="h-12 min-w-0 flex-1 rounded-full border border-slate-200 bg-slate-50 px-4 text-sm font-medium outline-none transition placeholder:text-slate-400 focus:border-blue-300 focus:ring-4 focus:ring-blue-100"
          id="custom-water"
          inputMode="numeric"
          name="amountMl"
          placeholder="Custom ml"
          required
          type="text"
        />
        <button
          className="grid size-12 shrink-0 place-items-center rounded-full bg-slate-950 text-white shadow-lg shadow-slate-300 transition hover:-translate-y-0.5"
          title="Add custom water"
          type="submit"
        >
          <Plus size={18} aria-hidden />
          <span className="sr-only">Add custom water</span>
        </button>
      </form>
    </section>
  );
}

function HydrationLog({
  logs,
}: {
  logs: Awaited<ReturnType<typeof getHydrationTrackerData>>["logs"];
}) {
  return (
    <section className="rounded-[32px] border border-white/80 bg-white p-6 shadow-[0_24px_70px_rgba(30,41,59,0.08)]">
      <div className="flex items-center justify-between gap-4">
        <div>
          <p className="text-sm font-medium text-slate-500">Timeline</p>
          <h2 className="mt-1 text-2xl font-semibold tracking-tight">Water logs</h2>
        </div>
        <span className="rounded-full bg-blue-50 px-3 py-1 text-sm font-semibold text-blue-700">
          {logs.length} entries
        </span>
      </div>

      <div className="mt-6 grid gap-3">
        {logs.length === 0 ? (
          <div className="rounded-3xl border border-dashed border-slate-200 bg-slate-50 p-8 text-center">
            <p className="font-semibold text-slate-950">No water logged yet.</p>
            <p className="mt-2 text-sm text-slate-500">
              Use a quick add to start your hydration timeline.
            </p>
          </div>
        ) : (
          logs.map((log) => (
            <article
              className="flex items-center justify-between gap-4 rounded-3xl border border-slate-100 bg-slate-50/80 p-4"
              key={log.id}
            >
              <div className="flex items-center gap-3">
                <div className="grid size-11 place-items-center rounded-2xl bg-white text-blue-600 shadow-sm">
                  <Droplets size={18} aria-hidden />
                </div>
                <div>
                  <h3 className="font-semibold text-slate-950">{log.amountMl}ml</h3>
                  <p className="text-sm text-slate-500">
                    {log.time} · {log.source}
                  </p>
                </div>
              </div>

              <form action={deleteHydrationAction}>
                <input name="logId" type="hidden" value={log.id} />
                <button
                  aria-label={`Delete ${log.amountMl}ml water log`}
                  className="grid size-10 place-items-center rounded-full border border-rose-100 bg-white text-rose-500 transition hover:-translate-y-0.5 hover:bg-rose-50"
                  title="Delete water log"
                  type="submit"
                >
                  <Trash2 size={16} aria-hidden />
                </button>
              </form>
            </article>
          ))
        )}
      </div>
    </section>
  );
}
