import Link from "next/link";
import { ArrowLeft, Flame, Plus, Salad, Sparkles, Trash2 } from "lucide-react";
import { addManualMealAction, deleteMealAction } from "@/features/meals/actions";
import { getMealTrackerData } from "@/features/meals/queries";

export const dynamic = "force-dynamic";

type MealsPageProps = {
  searchParams: Promise<{
    created?: string;
    deleted?: string;
    error?: string;
  }>;
};

export default async function MealsPage({ searchParams }: MealsPageProps) {
  const params = await searchParams;
  const data = await getMealTrackerData();
  const caloriePercent = Math.round((data.totals.calories / data.calorieGoal) * 100);
  const proteinPercent = Math.round((data.totals.protein / data.proteinGoal) * 100);

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
                <p className="text-sm font-medium text-blue-600">Meal tracking</p>
                <h1 className="text-3xl font-semibold tracking-tight">
                  Build today’s nutrition log
                </h1>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2 sm:flex">
              <SummaryPill
                icon={<Flame size={16} aria-hidden />}
                label="Calories"
                value={`${Math.round(data.totals.calories)} / ${data.calorieGoal}`}
                percent={caloriePercent}
              />
              <SummaryPill
                icon={<Sparkles size={16} aria-hidden />}
                label="Protein"
                value={`${Math.round(data.totals.protein)}g / ${data.proteinGoal}g`}
                percent={proteinPercent}
              />
            </div>
          </div>
        </header>

        {params.created && <Notice tone="success">Meal added to today’s log.</Notice>}
        {params.deleted && <Notice tone="success">Meal removed from today’s log.</Notice>}
        {params.error && (
          <Notice tone="error">
            Something in the meal form needs attention. Check the numbers and try again.
          </Notice>
        )}

        <section className="grid gap-5 lg:grid-cols-[420px_minmax(0,1fr)]">
          <MealForm />
          <MealList meals={data.meals} />
        </section>
      </div>
    </main>
  );
}

function SummaryPill({
  icon,
  label,
  value,
  percent,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  percent: number;
}) {
  return (
    <div className="rounded-2xl border border-slate-100 bg-white px-4 py-3 shadow-sm">
      <div className="flex items-center gap-2 text-sm font-medium text-slate-500">
        <span className="text-blue-600">{icon}</span>
        {label}
      </div>
      <p className="mt-1 text-base font-semibold text-slate-950">{value}</p>
      <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-slate-100">
        <div
          className="h-full rounded-full bg-blue-600"
          style={{ width: `${Math.min(percent, 100)}%` }}
        />
      </div>
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

function MealForm() {
  return (
    <form
      action={addManualMealAction}
      className="rounded-[32px] border border-white/80 bg-white p-6 shadow-[0_24px_70px_rgba(30,41,59,0.08)]"
    >
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-medium text-slate-500">Manual entry</p>
          <h2 className="mt-1 text-2xl font-semibold tracking-tight">Add a meal</h2>
        </div>
        <div className="grid size-11 place-items-center rounded-2xl bg-blue-50 text-blue-600">
          <Salad size={20} aria-hidden />
        </div>
      </div>

      <div className="mt-6 grid gap-4">
        <label className="grid gap-2 text-sm font-medium text-slate-700">
          Meal type
          <select
            className="h-12 rounded-2xl border border-slate-200 bg-slate-50 px-4 text-slate-950 outline-none transition focus:border-blue-300 focus:ring-4 focus:ring-blue-100"
            name="mealType"
            required
          >
            <option value="breakfast">Breakfast</option>
            <option value="lunch">Lunch</option>
            <option value="dinner">Dinner</option>
            <option value="snack">Snack</option>
          </select>
        </label>

        <TextInput label="Meal title" name="title" placeholder="Salmon rice bowl" />
        <TextInput label="Food item" name="itemName" placeholder="Salmon, rice, greens" />

        <div className="grid grid-cols-[1fr_0.8fr] gap-3">
          <NumberInput label="Quantity" name="quantity" placeholder="1" />
          <TextInput label="Unit" name="unit" placeholder="bowl" />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <NumberInput label="Calories" name="calories" placeholder="520" />
          <NumberInput label="Protein" name="protein" placeholder="42" suffix="g" />
          <NumberInput label="Carbs" name="carbs" placeholder="58" suffix="g" />
          <NumberInput label="Fat" name="fat" placeholder="16" suffix="g" />
          <NumberInput label="Fiber" name="fiber" placeholder="8" suffix="g" />
          <NumberInput label="Sodium" name="sodium" placeholder="420" suffix="mg" />
        </div>
      </div>

      <button className="mt-6 inline-flex h-12 w-full items-center justify-center gap-2 rounded-full bg-slate-950 px-5 text-sm font-semibold text-white shadow-lg shadow-slate-300 transition hover:-translate-y-0.5 hover:bg-slate-800">
        <Plus size={17} aria-hidden />
        Add meal
      </button>
    </form>
  );
}

function TextInput({
  label,
  name,
  placeholder,
}: {
  label: string;
  name: string;
  placeholder: string;
}) {
  return (
    <label className="grid gap-2 text-sm font-medium text-slate-700">
      {label}
      <input
        className="h-12 rounded-2xl border border-slate-200 bg-slate-50 px-4 text-slate-950 outline-none transition placeholder:text-slate-400 focus:border-blue-300 focus:ring-4 focus:ring-blue-100"
        name={name}
        placeholder={placeholder}
        required
      />
    </label>
  );
}

function NumberInput({
  label,
  name,
  placeholder,
  suffix,
}: {
  label: string;
  name: string;
  placeholder: string;
  suffix?: string;
}) {
  return (
    <label className="grid gap-2 text-sm font-medium text-slate-700">
      {label}
      <span className="relative">
        <input
          inputMode="decimal"
          className="h-12 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 text-slate-950 outline-none transition placeholder:text-slate-400 focus:border-blue-300 focus:ring-4 focus:ring-blue-100"
          name={name}
          placeholder={placeholder}
          required={name !== "fiber" && name !== "sodium"}
          type="text"
        />
        {suffix && (
          <span
            aria-hidden
            className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 text-xs font-semibold uppercase text-slate-400"
          >
            {suffix}
          </span>
        )}
      </span>
    </label>
  );
}

function MealList({
  meals,
}: {
  meals: Awaited<ReturnType<typeof getMealTrackerData>>["meals"];
}) {
  return (
    <section className="rounded-[32px] border border-white/80 bg-white p-6 shadow-[0_24px_70px_rgba(30,41,59,0.08)]">
      <div className="flex items-center justify-between gap-4">
        <div>
          <p className="text-sm font-medium text-slate-500">Today</p>
          <h2 className="mt-1 text-2xl font-semibold tracking-tight">Meal timeline</h2>
        </div>
        <span className="rounded-full bg-blue-50 px-3 py-1 text-sm font-semibold text-blue-700">
          {meals.length} meals
        </span>
      </div>

      <div className="mt-6 grid gap-4">
        {meals.length === 0 ? (
          <div className="rounded-3xl border border-dashed border-slate-200 bg-slate-50 p-8 text-center">
            <p className="font-semibold text-slate-950">No meals logged yet.</p>
            <p className="mt-2 text-sm text-slate-500">
              Add your first meal and the dashboard will update automatically.
            </p>
          </div>
        ) : (
          meals.map((meal) => (
            <article
              className="rounded-3xl border border-slate-100 bg-slate-50/80 p-4"
              key={meal.id}
            >
              <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                <div>
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="rounded-full bg-white px-3 py-1 text-xs font-semibold uppercase tracking-[0.14em] text-blue-600">
                      {meal.mealType}
                    </span>
                    <span className="text-sm text-slate-500">{meal.time}</span>
                  </div>
                  <h3 className="mt-3 text-xl font-semibold tracking-tight text-slate-950">
                    {meal.title}
                  </h3>
                  <p className="mt-1 text-sm text-slate-500">
                    {meal.items
                      .map((item) => `${item.name} (${item.quantity}${item.unit})`)
                      .join(" · ")}
                  </p>
                </div>

                <form action={deleteMealAction}>
                  <input name="mealId" type="hidden" value={meal.id} />
                  <button
                    aria-label={`Delete ${meal.title}`}
                    className="grid size-10 place-items-center rounded-full border border-rose-100 bg-white text-rose-500 transition hover:-translate-y-0.5 hover:bg-rose-50"
                    title="Delete meal"
                    type="submit"
                  >
                    <Trash2 size={16} aria-hidden />
                    <span className="sr-only">Delete meal</span>
                  </button>
                </form>
              </div>

              <div className="mt-5 grid grid-cols-2 gap-2 sm:grid-cols-4">
                <NutrientStat label="Calories" value={Math.round(meal.totals.calories)} />
                <NutrientStat label="Protein" value={`${Math.round(meal.totals.protein)}g`} />
                <NutrientStat label="Carbs" value={`${Math.round(meal.totals.carbs)}g`} />
                <NutrientStat label="Fat" value={`${Math.round(meal.totals.fat)}g`} />
              </div>
            </article>
          ))
        )}
      </div>
    </section>
  );
}

function NutrientStat({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="rounded-2xl bg-white px-4 py-3 shadow-sm">
      <p className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-400">
        {label}
      </p>
      <p className="mt-1 text-lg font-semibold text-slate-950">{value}</p>
    </div>
  );
}
