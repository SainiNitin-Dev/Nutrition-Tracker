import Link from "next/link";
import { ArrowLeft, Check, Clock3, Pill, Plus, RotateCcw, Trash2, X } from "lucide-react";
import { PendingSubmitButton } from "@/components/ui/pending-submit-button";
import {
  addSupplementAction,
  deleteSupplementAction,
  markSupplementSkippedAction,
  markSupplementTakenAction,
  updateSupplementScheduleAction,
} from "@/features/supplements/actions";
import { getSupplementTrackerData } from "@/features/supplements/queries";

export const dynamic = "force-dynamic";

type SupplementsPageProps = {
  searchParams: Promise<{
    taken?: string;
    skipped?: string;
    added?: string;
    deleted?: string;
    scheduleUpdated?: string;
    error?: string;
  }>;
};

export default async function SupplementsPage({
  searchParams,
}: SupplementsPageProps) {
  const params = await searchParams;
  const data = await getSupplementTrackerData();
  const completionPercent = data.supplements.length
    ? Math.round((data.takenCount / data.supplements.length) * 100)
    : 0;

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
                <p className="text-sm font-medium text-blue-600">Supplements</p>
                <h1 className="text-3xl font-semibold tracking-tight">
                  {"Today's supplement schedule"}
                </h1>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2 sm:flex">
              <HeaderStat label="Taken" value={`${data.takenCount}`} />
              <HeaderStat label="Complete" value={`${completionPercent}%`} />
            </div>
          </div>
        </header>

        {params.added && <Notice tone="success">Supplement added to your stack.</Notice>}
        {params.taken && <Notice tone="success">Supplement marked as taken.</Notice>}
        {params.skipped && <Notice tone="success">Supplement marked as skipped.</Notice>}
        {params.deleted && <Notice tone="success">Supplement removed from active schedule.</Notice>}
        {params.scheduleUpdated && <Notice tone="success">Supplement schedule updated.</Notice>}
        {params.error && (
          <Notice tone="error">
            Could not update that supplement. Refresh and try again.
          </Notice>
        )}

        <section className="grid min-w-0 gap-5 xl:grid-cols-[minmax(0,380px)_minmax(0,1fr)]">
          <div className="grid min-w-0 gap-5">
            <AddSupplementForm />
            <ProgressPanel
              completionPercent={completionPercent}
              skippedCount={data.skippedCount}
              total={data.supplements.length}
            />
          </div>
          <SupplementList supplements={data.supplements} />
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

function AddSupplementForm() {
  return (
    <form
      action={addSupplementAction}
      className="min-w-0 overflow-hidden rounded-[32px] border border-white/80 bg-white p-6 shadow-[0_24px_70px_rgba(30,41,59,0.08)]"
    >
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-medium text-slate-500">Build your stack</p>
          <h2 className="mt-1 text-2xl font-semibold tracking-tight">Add supplement</h2>
        </div>
        <div className="grid size-11 place-items-center rounded-2xl bg-blue-50 text-blue-600">
          <Plus size={20} aria-hidden />
        </div>
      </div>

      <div className="mt-6 grid gap-4">
        <TextInput label="Name" name="name" placeholder="Creatine" />

        <div className="grid gap-3 sm:grid-cols-[1fr_0.8fr]">
          <NumberInput label="Dosage" name="dosageAmount" placeholder="5" />
          <TextInput label="Unit" name="dosageUnit" placeholder="g" />
        </div>

        <TextInput
          label="Purpose"
          name="purpose"
          placeholder="Strength and power"
          required={false}
        />
        <TextInput
          label="Instructions"
          name="instructions"
          placeholder="After lunch"
          required={false}
        />

        <label className="grid gap-2 text-sm font-medium text-slate-700">
          Time
          <input
            className="h-12 rounded-2xl border border-slate-200 bg-slate-50 px-4 text-slate-950 outline-none transition focus:border-blue-300 focus:ring-4 focus:ring-blue-100"
            defaultValue="09:00"
            name="timeOfDay"
            required
            type="time"
          />
        </label>
      </div>

      <PendingSubmitButton
        className="mt-6 inline-flex h-12 w-full items-center justify-center gap-2 rounded-full bg-slate-950 px-5 text-sm font-semibold text-white shadow-lg shadow-slate-300 transition hover:-translate-y-0.5 hover:bg-slate-800 disabled:cursor-wait disabled:opacity-70"
        pendingLabel="Adding..."
      >
        <Plus size={17} aria-hidden />
        Add supplement
      </PendingSubmitButton>
    </form>
  );
}

function TextInput({
  label,
  name,
  placeholder,
  required = true,
}: {
  label: string;
  name: string;
  placeholder: string;
  required?: boolean;
}) {
  return (
    <label className="grid min-w-0 gap-2 text-sm font-medium text-slate-700">
      {label}
      <input
        className="h-12 rounded-2xl border border-slate-200 bg-slate-50 px-4 text-slate-950 outline-none transition placeholder:text-slate-400 focus:border-blue-300 focus:ring-4 focus:ring-blue-100"
        name={name}
        placeholder={placeholder}
        required={required}
      />
    </label>
  );
}

function NumberInput({
  label,
  name,
  placeholder,
}: {
  label: string;
  name: string;
  placeholder: string;
}) {
  return (
    <label className="grid min-w-0 gap-2 text-sm font-medium text-slate-700">
      {label}
      <input
        className="h-12 rounded-2xl border border-slate-200 bg-slate-50 px-4 text-slate-950 outline-none transition placeholder:text-slate-400 focus:border-blue-300 focus:ring-4 focus:ring-blue-100"
        inputMode="decimal"
        name={name}
        placeholder={placeholder}
        required
        type="text"
      />
    </label>
  );
}

function ProgressPanel({
  completionPercent,
  skippedCount,
  total,
}: {
  completionPercent: number;
  skippedCount: number;
  total: number;
}) {
  return (
    <section className="min-w-0 overflow-hidden rounded-[32px] border border-white/80 bg-white p-6 shadow-[0_24px_70px_rgba(30,41,59,0.08)]">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-medium text-blue-600">Daily adherence</p>
          <h2 className="mt-1 text-4xl font-semibold tracking-tight">
            {completionPercent}%
          </h2>
          <p className="mt-1 text-sm text-slate-500">
            {total} supplements scheduled today
          </p>
        </div>
        <div className="grid size-12 place-items-center rounded-2xl bg-blue-50 text-blue-600">
          <Pill size={22} aria-hidden />
        </div>
      </div>

      <div
        className="relative mx-auto mt-10 grid aspect-square max-w-64 place-items-center rounded-full"
        style={{
          background: `conic-gradient(#2563eb ${completionPercent}%, #e8eef8 0)`,
        }}
      >
        <div className="grid size-[72%] place-items-center rounded-full bg-white shadow-inner">
          <div className="text-center">
            <p className="text-3xl font-semibold">{completionPercent}%</p>
            <p className="text-xs font-medium uppercase tracking-[0.2em] text-slate-400">
              taken
            </p>
          </div>
        </div>
      </div>

      <div className="mt-8 grid grid-cols-2 gap-3">
        <div className="rounded-3xl bg-slate-50 p-4">
          <p className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-400">
            Skipped
          </p>
          <p className="mt-1 text-2xl font-semibold text-slate-950">{skippedCount}</p>
        </div>
        <div className="rounded-3xl bg-slate-50 p-4">
          <p className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-400">
            Remaining
          </p>
          <p className="mt-1 text-2xl font-semibold text-slate-950">
            {Math.max(total - skippedCount - Math.round((completionPercent / 100) * total), 0)}
          </p>
        </div>
      </div>
    </section>
  );
}

function SupplementList({
  supplements,
}: {
  supplements: Awaited<ReturnType<typeof getSupplementTrackerData>>["supplements"];
}) {
  return (
    <section className="rounded-[32px] border border-white/80 bg-white p-6 shadow-[0_24px_70px_rgba(30,41,59,0.08)]">
      <div className="flex items-center justify-between gap-4">
        <div>
          <p className="text-sm font-medium text-slate-500">Schedule</p>
          <h2 className="mt-1 text-2xl font-semibold tracking-tight">
            {"Today's stack"}
          </h2>
        </div>
        <span className="rounded-full bg-blue-50 px-3 py-1 text-sm font-semibold text-blue-700">
          {supplements.length} active
        </span>
      </div>

      <div className="mt-6 grid gap-4">
        {supplements.length === 0 ? (
          <div className="rounded-3xl border border-dashed border-slate-200 bg-slate-50 p-8 text-center">
            <p className="font-semibold text-slate-950">No active supplements yet.</p>
            <p className="mx-auto mt-2 max-w-sm text-sm leading-6 text-slate-500">
              {"Add your first supplement and it will appear in today's schedule."}
            </p>
          </div>
        ) : (
          supplements.map((supplement) => (
          <article
            className="rounded-3xl border border-slate-100 bg-slate-50/80 p-4"
            key={supplement.id}
          >
            <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-2">
                  <span className={statusClassName(supplement.status)}>
                    {supplement.status}
                  </span>
                  <span className="inline-flex items-center gap-1 text-sm text-slate-500">
                    <Clock3 size={14} aria-hidden />
                    {supplement.time}
                  </span>
                </div>
                <h3 className="mt-3 text-xl font-semibold tracking-tight text-slate-950">
                  {supplement.name}
                </h3>
                <p className="mt-1 text-sm text-slate-500">
                  {supplement.dose} | {supplement.purpose}
                </p>
              </div>

              <div className="flex flex-wrap gap-2">
                <form action={markSupplementTakenAction}>
                  <input name="supplementId" type="hidden" value={supplement.id} />
                  <PendingSubmitButton
                    aria-label={`Mark ${supplement.name} taken`}
                    className="inline-flex h-10 items-center gap-2 rounded-full border border-emerald-100 bg-white px-3 text-sm font-semibold text-emerald-700 transition hover:-translate-y-0.5 hover:bg-emerald-50"
                    title="Mark taken"
                  >
                    <Check size={16} aria-hidden />
                    Taken
                  </PendingSubmitButton>
                </form>
                <form action={markSupplementSkippedAction}>
                  <input name="supplementId" type="hidden" value={supplement.id} />
                  <PendingSubmitButton
                    aria-label={`Skip ${supplement.name}`}
                    className="inline-flex h-10 items-center gap-2 rounded-full border border-rose-100 bg-white px-3 text-sm font-semibold text-rose-600 transition hover:-translate-y-0.5 hover:bg-rose-50"
                    title="Skip supplement"
                  >
                    <X size={16} aria-hidden />
                    Skip
                  </PendingSubmitButton>
                </form>
                <form action={deleteSupplementAction}>
                  <input name="supplementId" type="hidden" value={supplement.id} />
                  <PendingSubmitButton
                    aria-label={`Remove ${supplement.name}`}
                    className="inline-flex h-10 items-center gap-2 rounded-full border border-slate-200 bg-white px-3 text-sm font-semibold text-slate-600 transition hover:-translate-y-0.5 hover:bg-slate-100"
                    title="Remove supplement"
                  >
                    <Trash2 size={16} aria-hidden />
                    Remove
                  </PendingSubmitButton>
                </form>
              </div>
            </div>

            <form
              action={updateSupplementScheduleAction}
              className="mt-4 flex flex-col gap-3 rounded-2xl bg-white p-3 shadow-sm sm:flex-row sm:items-end"
            >
              <input name="supplementId" type="hidden" value={supplement.id} />
              <label className="grid flex-1 gap-2 text-sm font-medium text-slate-700">
                Schedule time
                <input
                  className="h-11 rounded-2xl border border-slate-200 bg-slate-50 px-4 text-slate-950 outline-none transition focus:border-blue-300 focus:ring-4 focus:ring-blue-100"
                  defaultValue={supplement.time === "Anytime" ? "09:00" : supplement.time}
                  name="timeOfDay"
                  required
                  type="time"
                />
              </label>
              <PendingSubmitButton
                className="inline-flex h-11 items-center justify-center gap-2 rounded-full bg-blue-600 px-4 text-sm font-semibold text-white shadow-md shadow-blue-100 transition hover:-translate-y-0.5 hover:bg-blue-700 disabled:cursor-wait disabled:opacity-70"
                pendingLabel="Saving..."
              >
                <Clock3 size={16} aria-hidden />
                Save schedule
              </PendingSubmitButton>
            </form>

            {supplement.loggedAt && (
              <div className="mt-4 inline-flex items-center gap-2 rounded-full bg-white px-3 py-2 text-xs font-semibold text-slate-500 shadow-sm">
                <RotateCcw size={14} aria-hidden />
                Last updated {supplement.loggedAt}
              </div>
            )}
          </article>
          ))
        )}
      </div>
    </section>
  );
}

function statusClassName(status: string) {
  const base =
    "rounded-full px-3 py-1 text-xs font-semibold uppercase tracking-[0.14em]";

  if (status === "taken") {
    return `${base} bg-emerald-50 text-emerald-700`;
  }

  if (status === "skipped") {
    return `${base} bg-rose-50 text-rose-700`;
  }

  return `${base} bg-amber-50 text-amber-700`;
}
