import Link from "next/link";
import {
  Check,
  Clock3,
  MoreHorizontal,
  Plus,
  Sparkles,
} from "lucide-react";
import { PendingSubmitButton } from "@/components/ui/pending-submit-button";
import { CoachChatPanel } from "@/features/coach/components/coach-chat-panel";
import { addHydrationAction } from "@/features/hydration/actions";
import { dashboardNav } from "../data";
import type { DashboardSnapshot, Macro } from "../data";

type DashboardExperienceProps = {
  snapshot: DashboardSnapshot;
};

const toneClass: Record<Macro["tone"], string> = {
  blue: "from-blue-500 to-sky-400",
  green: "from-teal-500 to-emerald-400",
  amber: "from-amber-500 to-yellow-400",
  rose: "from-rose-500 to-pink-400",
};

const toneText: Record<Macro["tone"], string> = {
  blue: "text-blue-600",
  green: "text-teal-600",
  amber: "text-amber-600",
  rose: "text-rose-600",
};

export function DashboardExperience({ snapshot }: DashboardExperienceProps) {
  const caloriePercent = Math.round(
    (snapshot.calories.current / snapshot.calories.goal) * 100,
  );

  return (
    <main className="min-h-screen overflow-hidden bg-[radial-gradient(circle_at_top_left,_rgba(219,234,254,0.9),_transparent_30%),linear-gradient(135deg,_#fbfcff_0%,_#f5f7fb_48%,_#eef5ff_100%)] px-4 py-4 text-slate-950 sm:px-6 lg:px-8">
      <div className="mx-auto flex w-full max-w-7xl flex-col gap-5">
        <TopBar name={snapshot.userName} dateLabel={snapshot.dateLabel} />

        <div className="grid gap-5 lg:grid-cols-[84px_minmax(0,1fr)_360px]">
          <Sidebar />

          <section className="grid min-w-0 gap-5 xl:grid-cols-[1.05fr_0.95fr]">
            <HeroPanel
              current={snapshot.calories.current}
              goal={snapshot.calories.goal}
              remaining={snapshot.calories.remaining}
              percent={caloriePercent}
            />
            <MacroPanel macros={snapshot.macros} />
            <div className="hidden lg:contents">
              <MealTimeline meals={snapshot.meals} />
              <HydrationPanel hydration={snapshot.hydration} />
              <WeeklyPanel values={snapshot.weeklyCalories} />
              <SupplementPanel supplements={snapshot.supplements} />
            </div>
            <MobileTodayActions />
          </section>

          <aside className="hidden content-start gap-5 lg:grid" id="coach">
            <CoachChatPanel insights={snapshot.insights} />
            <SignalsPanel signals={snapshot.signals} />
            <QuickActions actions={snapshot.quickActions} />
          </aside>
        </div>
      </div>
    </main>
  );
}

function TopBar({ name, dateLabel }: { name: string; dateLabel: string }) {
  return (
    <header className="animate-rise-in flex flex-col gap-4 rounded-[28px] border border-white/80 bg-white/75 p-4 shadow-[0_24px_70px_rgba(30,41,59,0.08)] backdrop-blur md:flex-row md:items-center md:justify-between">
      <div className="flex items-center gap-3">
        <div className="grid size-12 place-items-center rounded-2xl bg-slate-950 text-sm font-semibold text-white shadow-lg shadow-slate-300">
          N
        </div>
        <div>
          <p className="text-sm text-slate-500">{dateLabel}</p>
          <h1 className="text-2xl font-semibold tracking-tight text-slate-950">
            Good afternoon, {name}
          </h1>
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <Link
          className="inline-flex h-11 items-center rounded-full border border-slate-200 bg-white px-4 text-sm font-medium text-slate-700 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md"
          href="/account"
        >
          Account
        </Link>
        <Link
          className="inline-flex h-11 items-center gap-2 rounded-full bg-slate-950 px-4 text-sm font-medium text-white shadow-lg shadow-slate-300 transition hover:-translate-y-0.5 hover:bg-slate-800"
          href="/meals"
        >
          <Plus size={16} aria-hidden />
          Quick log
        </Link>
      </div>
    </header>
  );
}

function Sidebar() {
  return (
    <nav className="animate-rise-in hidden rounded-[28px] border border-white/80 bg-white/70 p-3 shadow-[0_24px_70px_rgba(30,41,59,0.07)] backdrop-blur lg:block">
      <div className="flex flex-col gap-2">
        {dashboardNav.map((item, index) => {
          const Icon = item.icon;
          const isActive = index === 0;
          const href =
            item.label === "Meals"
              ? "/meals"
              : item.label === "Hydration"
                ? "/hydration"
                : item.label === "Supplements"
                  ? "/supplements"
                  : item.label === "Coach"
                    ? "/coach"
                    : null;
          const className = `group grid h-14 place-items-center rounded-2xl transition ${
            isActive
              ? "bg-blue-600 text-white shadow-lg shadow-blue-200"
              : "text-slate-500 hover:bg-slate-100 hover:text-slate-900"
          }`;

          return href ? (
            <Link className={className} href={href} key={item.label} title={item.label}>
              <Icon size={20} aria-hidden />
              <span className="sr-only">{item.label}</span>
            </Link>
          ) : (
            <button className={className} key={item.label} title={item.label}>
              <Icon size={20} aria-hidden />
              <span className="sr-only">{item.label}</span>
            </button>
          );
        })}
      </div>
    </nav>
  );
}

function HeroPanel({
  current,
  goal,
  remaining,
  percent,
}: {
  current: number;
  goal: number;
  remaining: number;
  percent: number;
}) {
  return (
    <section className="animate-rise-in overflow-hidden rounded-[32px] border border-white/80 bg-white p-6 shadow-[0_24px_70px_rgba(30,41,59,0.08)]">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-sm font-medium text-blue-600">Daily energy</p>
          <h2 className="mt-2 text-4xl font-semibold tracking-tight text-slate-950 sm:text-5xl">
            {current.toLocaleString()}
            <span className="ml-2 text-lg font-medium text-slate-400">kcal</span>
          </h2>
          <p className="mt-2 text-sm text-slate-500">
            {remaining} calories left against a {goal.toLocaleString()} kcal goal.
          </p>
        </div>
        <Link
          className="grid size-10 place-items-center rounded-full border border-slate-200 text-slate-500 transition hover:-translate-y-0.5 hover:bg-slate-50"
          href="/meals"
          title="Open meals"
        >
          <MoreHorizontal size={18} aria-hidden />
        </Link>
      </div>

      <div className="mt-8 grid gap-5 sm:grid-cols-[180px_minmax(0,1fr)] sm:items-center">
        <div
          className="relative grid aspect-square place-items-center rounded-full"
          style={{
            background: `conic-gradient(#2563eb ${percent}%, #e8eef8 0)`,
          }}
        >
          <div className="grid size-[72%] place-items-center rounded-full bg-white shadow-inner">
            <div className="text-center">
              <p className="text-3xl font-semibold">{percent}%</p>
              <p className="text-xs font-medium uppercase tracking-[0.2em] text-slate-400">
                logged
              </p>
            </div>
          </div>
        </div>

        <div className="grid gap-3">
          {[
            ["Breakfast", 420, "bg-blue-500"],
            ["Lunch", 710, "bg-teal-500"],
            ["Snack", 230, "bg-amber-500"],
            ["Dinner target", remaining, "bg-slate-300"],
          ].map(([label, value, color]) => (
            <div className="grid gap-2" key={label}>
              <div className="flex items-center justify-between text-sm">
                <span className="font-medium text-slate-700">{label}</span>
                <span className="text-slate-500">{value} kcal</span>
              </div>
              <div className="h-2 overflow-hidden rounded-full bg-slate-100">
                <div
                  className={`h-full rounded-full ${color}`}
                  style={{ width: `${Math.min((Number(value) / goal) * 100, 100)}%` }}
                />
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function MacroPanel({ macros }: { macros: Macro[] }) {
  return (
    <section className="animate-rise-in rounded-[32px] border border-white/80 bg-white/82 p-6 shadow-[0_24px_70px_rgba(30,41,59,0.07)] backdrop-blur">
      <div className="flex items-center justify-between gap-3">
        <div>
          <p className="text-sm font-medium text-slate-500">Macro balance</p>
          <h2 className="mt-1 text-2xl font-semibold tracking-tight">Precision, not pressure</h2>
        </div>
        <Sparkles className="text-blue-500" size={22} aria-hidden />
      </div>

      <div className="mt-6 grid gap-4">
        {macros.map((macro) => {
          const percent = Math.round((macro.current / macro.goal) * 100);

          return (
            <article
              className="rounded-3xl border border-slate-100 bg-slate-50/70 p-4"
              key={macro.label}
            >
              <div className="mb-3 flex items-center justify-between">
                <div>
                  <h3 className="font-semibold text-slate-900">{macro.label}</h3>
                  <p className="text-sm text-slate-500">
                    {macro.current}
                    {macro.unit} of {macro.goal}
                    {macro.unit}
                  </p>
                </div>
                <span className={`text-lg font-semibold ${toneText[macro.tone]}`}>
                  {percent}%
                </span>
              </div>
              <div className="h-3 overflow-hidden rounded-full bg-white shadow-inner">
                <div
                  className={`h-full rounded-full bg-gradient-to-r ${toneClass[macro.tone]}`}
                  style={{ width: `${Math.min(percent, 100)}%` }}
                />
              </div>
            </article>
          );
        })}
      </div>
    </section>
  );
}

function MealTimeline({ meals }: { meals: DashboardSnapshot["meals"] }) {
  return (
    <section className="animate-rise-in rounded-[32px] border border-white/80 bg-white p-6 shadow-[0_24px_70px_rgba(30,41,59,0.07)]">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-medium text-slate-500">Meal history</p>
          <h2 className="mt-1 text-2xl font-semibold tracking-tight">
            {"Today's plate"}
          </h2>
        </div>
        <Link
          className="inline-flex size-10 items-center justify-center rounded-full bg-blue-50 text-blue-600 transition hover:bg-blue-100"
          href="/meals"
          title="Add meal"
        >
          <Plus size={18} aria-hidden />
          <span className="sr-only">Add meal</span>
        </Link>
      </div>

      <div className="mt-6 grid gap-4">
        {meals.map((meal) => (
          <article
            className="grid gap-4 rounded-3xl border border-slate-100 bg-slate-50/70 p-4 sm:grid-cols-[auto_minmax(0,1fr)_auto] sm:items-center"
            key={`${meal.name}-${meal.time}`}
          >
            <div
              className="size-3 rounded-full shadow-[0_0_0_6px_rgba(148,163,184,0.12)]"
              style={{ background: meal.accent }}
            />
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
                <h3 className="font-semibold text-slate-950">{meal.name}</h3>
                <span className="inline-flex items-center gap-1 text-sm text-slate-500">
                  <Clock3 size={14} aria-hidden />
                  {meal.time}
                </span>
              </div>
              <p className="mt-1 truncate text-sm text-slate-500">
                {meal.items.join(" | ")}
              </p>
            </div>
            <div className="rounded-2xl bg-white px-4 py-3 text-sm shadow-sm">
              <p className="font-semibold text-slate-950">{meal.calories} kcal</p>
              <p className="text-slate-500">{meal.protein}g protein</p>
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}

function HydrationPanel({
  hydration,
}: {
  hydration: DashboardSnapshot["hydration"];
}) {
  const percent = Math.round((hydration.currentMl / hydration.goalMl) * 100);

  return (
    <section className="animate-rise-in overflow-hidden rounded-[32px] border border-blue-100 bg-gradient-to-br from-white to-blue-50 p-6 shadow-[0_24px_70px_rgba(37,99,235,0.09)]">
      <div className="flex items-center justify-between gap-4">
        <div>
          <p className="text-sm font-medium text-blue-600">Hydration</p>
          <h2 className="mt-1 text-2xl font-semibold tracking-tight">
            {hydration.currentMl.toLocaleString()} ml
          </h2>
          <p className="mt-1 text-sm text-slate-500">
            {`${percent}% of today's ${hydration.goalMl.toLocaleString()} ml goal.`}
          </p>
        </div>
        <div className="relative h-24 w-16 overflow-hidden rounded-b-3xl rounded-t-xl border border-blue-200 bg-white shadow-inner">
          <div
            className="water-fill absolute bottom-0 left-0 right-0 rounded-t-2xl bg-gradient-to-t from-blue-500 to-cyan-300"
            style={{ height: `${Math.min(percent, 100)}%` }}
          />
        </div>
      </div>

      <div className="mt-6 flex flex-wrap gap-2">
        {hydration.quickAdds.map((amount) => (
          <form action={addHydrationAction} key={amount}>
            <input name="amountMl" type="hidden" value={amount} />
            <PendingSubmitButton
              className="rounded-full border border-blue-100 bg-white px-4 py-2 text-sm font-medium text-blue-700 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md disabled:cursor-wait disabled:opacity-70"
              pendingLabel="Adding..."
            >
              +{amount} ml
            </PendingSubmitButton>
          </form>
        ))}
      </div>
      <Link
        className="mt-4 inline-flex text-sm font-semibold text-blue-700"
        href="/hydration"
      >
        Open hydration tracker
      </Link>
    </section>
  );
}

function WeeklyPanel({ values }: { values: number[] }) {
  const max = Math.max(...values, 1);
  const days = ["M", "T", "W", "T", "F", "S", "S"];

  return (
    <section className="animate-rise-in rounded-[32px] border border-white/80 bg-white p-6 shadow-[0_24px_70px_rgba(30,41,59,0.07)]">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-medium text-slate-500">Weekly summary</p>
          <h2 className="mt-1 text-2xl font-semibold tracking-tight">Consistency curve</h2>
        </div>
        <span className="rounded-full bg-emerald-50 px-3 py-1 text-sm font-medium text-emerald-700">
          +8%
        </span>
      </div>

      <div className="mt-8 flex h-44 items-end gap-3">
        {values.map((value, index) => (
          <div className="flex flex-1 flex-col items-center gap-2" key={`${days[index]}-${index}`}>
            <div className="flex h-36 w-full items-end rounded-full bg-slate-100 p-1">
              <div
                className="w-full rounded-full bg-gradient-to-t from-slate-950 to-blue-500"
                style={{ height: `${Math.max((value / max) * 100, value ? 10 : 4)}%` }}
              />
            </div>
            <span className="text-xs font-medium text-slate-400">{days[index]}</span>
          </div>
        ))}
      </div>
    </section>
  );
}

function SupplementPanel({
  supplements,
}: {
  supplements: DashboardSnapshot["supplements"];
}) {
  return (
    <section className="animate-rise-in rounded-[32px] border border-white/80 bg-white p-6 shadow-[0_24px_70px_rgba(30,41,59,0.07)]">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-medium text-slate-500">Supplements</p>
          <h2 className="mt-1 text-2xl font-semibold tracking-tight">Schedule</h2>
        </div>
        <Link className="text-sm font-medium text-blue-600" href="/supplements">
          Manage
        </Link>
      </div>

      <div className="mt-5 grid gap-3">
        {supplements.map((supplement) => (
          <article
            className="flex items-center justify-between gap-3 rounded-3xl border border-slate-100 bg-slate-50/70 p-4"
            key={supplement.name}
          >
            <div>
              <h3 className="font-semibold text-slate-950">{supplement.name}</h3>
              <p className="text-sm text-slate-500">
                {supplement.dose} | {supplement.time}
              </p>
            </div>
            <span
              className={`inline-flex items-center gap-1 rounded-full px-3 py-1 text-sm font-medium ${
                supplement.status === "taken"
                  ? "bg-emerald-50 text-emerald-700"
                  : "bg-amber-50 text-amber-700"
              }`}
            >
              {supplement.status === "taken" && <Check size={14} aria-hidden />}
              {supplement.status}
            </span>
          </article>
        ))}
      </div>
    </section>
  );
}

function SignalsPanel({ signals }: { signals: DashboardSnapshot["signals"] }) {
  return (
    <section className="animate-rise-in grid grid-cols-2 gap-3">
      {signals.map((signal) => {
        const Icon = signal.icon;

        return (
          <article
            className="rounded-[26px] border border-white/80 bg-white/80 p-4 shadow-[0_18px_50px_rgba(30,41,59,0.06)] backdrop-blur"
            key={signal.label}
          >
            <Icon className="text-blue-500" size={20} aria-hidden />
            <p className="mt-4 text-xs font-medium uppercase tracking-[0.16em] text-slate-400">
              {signal.label}
            </p>
            <p className="mt-1 text-lg font-semibold text-slate-950">{signal.value}</p>
          </article>
        );
      })}
    </section>
  );
}

function QuickActions({ actions }: { actions: DashboardSnapshot["quickActions"] }) {
  return (
    <section className="animate-rise-in rounded-[32px] border border-white/80 bg-white/80 p-4 shadow-[0_24px_70px_rgba(30,41,59,0.07)] backdrop-blur">
      <div className="grid grid-cols-2 gap-2">
        {actions.map((action) => {
          const Icon = action.icon;

          return (
            action.label === "Add meal" ? (
              <Link
                className="flex min-h-24 flex-col items-start justify-between rounded-3xl border border-slate-100 bg-slate-50/80 p-4 text-left transition hover:-translate-y-0.5 hover:bg-white hover:shadow-md"
                href="/meals"
                key={action.label}
              >
                <Icon className="text-slate-700" size={20} aria-hidden />
                <span className="text-sm font-semibold text-slate-950">{action.label}</span>
              </Link>
            ) : action.label === "Water" ? (
              <Link
                className="flex min-h-24 flex-col items-start justify-between rounded-3xl border border-slate-100 bg-slate-50/80 p-4 text-left transition hover:-translate-y-0.5 hover:bg-white hover:shadow-md"
                href="/hydration"
                key={action.label}
              >
                <Icon className="text-slate-700" size={20} aria-hidden />
                <span className="text-sm font-semibold text-slate-950">{action.label}</span>
              </Link>
            ) : action.label === "Supplement" ? (
              <Link
                className="flex min-h-24 flex-col items-start justify-between rounded-3xl border border-slate-100 bg-slate-50/80 p-4 text-left transition hover:-translate-y-0.5 hover:bg-white hover:shadow-md"
                href="/supplements"
                key={action.label}
              >
                <Icon className="text-slate-700" size={20} aria-hidden />
                <span className="text-sm font-semibold text-slate-950">{action.label}</span>
              </Link>
          ) : action.label === "Ask coach" ? (
              <Link
                className="flex min-h-24 flex-col items-start justify-between rounded-3xl border border-slate-100 bg-slate-50/80 p-4 text-left transition hover:-translate-y-0.5 hover:bg-white hover:shadow-md"
                href="/coach"
                key={action.label}
              >
                <Icon className="text-slate-700" size={20} aria-hidden />
                <span className="text-sm font-semibold text-slate-950">{action.label}</span>
              </Link>
            ) : null
          );
        })}
      </div>
    </section>
  );
}

function MobileTodayActions() {
  return (
    <section className="animate-rise-in grid grid-cols-2 gap-3 lg:hidden">
      <Link
        className="rounded-[26px] border border-white/80 bg-white/82 p-4 shadow-[0_18px_50px_rgba(30,41,59,0.06)]"
        href="/meals"
      >
        <p className="text-sm font-medium text-blue-600">Meals</p>
        <h2 className="mt-2 text-xl font-semibold tracking-tight">Log food</h2>
        <p className="mt-1 text-sm text-slate-500">Open your daily meal timeline.</p>
      </Link>
      <Link
        className="rounded-[26px] border border-white/80 bg-white/82 p-4 shadow-[0_18px_50px_rgba(30,41,59,0.06)]"
        href="/hydration"
      >
        <p className="text-sm font-medium text-blue-600">Water</p>
        <h2 className="mt-2 text-xl font-semibold tracking-tight">Quick add</h2>
        <p className="mt-1 text-sm text-slate-500">Track hydration without scrolling.</p>
      </Link>
      <Link
        className="rounded-[26px] border border-white/80 bg-white/82 p-4 shadow-[0_18px_50px_rgba(30,41,59,0.06)]"
        href="/supplements"
      >
        <p className="text-sm font-medium text-blue-600">Stack</p>
        <h2 className="mt-2 text-xl font-semibold tracking-tight">Supplements</h2>
        <p className="mt-1 text-sm text-slate-500">Mark doses and adjust timing.</p>
      </Link>
      <Link
        className="rounded-[26px] border border-slate-950 bg-slate-950 p-4 text-white shadow-[0_18px_50px_rgba(15,23,42,0.2)]"
        href="/coach"
      >
        <p className="text-sm font-medium text-blue-200">Coach</p>
        <h2 className="mt-2 text-xl font-semibold tracking-tight">Ask AI</h2>
        <p className="mt-1 text-sm text-slate-300">Chat and log naturally.</p>
      </Link>
    </section>
  );
}
