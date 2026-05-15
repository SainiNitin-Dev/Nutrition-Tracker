import Link from "next/link";
import { ArrowLeft, ArrowRight, Target, UserRound } from "lucide-react";
import { completeOnboardingAction } from "@/features/onboarding/actions";
import { requireCurrentAppUser } from "@/lib/auth/current-user";

export const dynamic = "force-dynamic";

type OnboardingPageProps = {
  searchParams: Promise<{
    error?: string;
  }>;
};

export default async function OnboardingPage({
  searchParams,
}: OnboardingPageProps) {
  const params = await searchParams;
  const user = await requireCurrentAppUser();

  return (
    <main className="min-h-screen bg-[radial-gradient(circle_at_top_left,_rgba(219,234,254,0.9),_transparent_30%),linear-gradient(135deg,_#fbfcff_0%,_#f5f7fb_48%,_#eef5ff_100%)] px-4 py-5 text-slate-950 sm:px-6 lg:px-8">
      <div className="mx-auto grid w-full max-w-6xl gap-5">
        <header className="rounded-[32px] border border-white/80 bg-white/80 p-5 shadow-[0_24px_70px_rgba(30,41,59,0.08)] backdrop-blur">
          <div className="flex items-center gap-4">
            <Link
              className="grid size-11 place-items-center rounded-full border border-slate-200 bg-white text-slate-600 transition hover:-translate-y-0.5 hover:shadow-md"
              href="/account"
              title="Back to account"
            >
              <ArrowLeft size={18} aria-hidden />
            </Link>
            <div>
              <p className="text-sm font-medium text-blue-600">Onboarding</p>
              <h1 className="text-3xl font-semibold tracking-tight">
                Personalize your nutrition targets
              </h1>
            </div>
          </div>
        </header>

        {params.error && (
          <div className="rounded-3xl border border-rose-100 bg-rose-50 px-5 py-4 text-sm font-medium text-rose-800 shadow-sm">
            Some values need attention. Check your targets and try again.
          </div>
        )}

        <section className="grid gap-5 lg:grid-cols-[360px_minmax(0,1fr)]">
          <aside className="rounded-[32px] border border-white/80 bg-white p-6 shadow-[0_24px_70px_rgba(30,41,59,0.08)]">
            <div className="grid size-14 place-items-center rounded-2xl bg-blue-50 text-blue-600">
              <UserRound size={24} aria-hidden />
            </div>
            <h2 className="mt-6 text-2xl font-semibold tracking-tight">
              Hi, {user.name ?? "there"}
            </h2>
            <p className="mt-3 text-sm leading-6 text-slate-500">
              These targets power the dashboard and give the AI coach useful context.
              You can refine them later as your body, training, or preferences change.
            </p>

            <div className="mt-6 rounded-3xl bg-slate-50 p-4">
              <p className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-400">
                Signed in as
              </p>
              <p className="mt-1 break-all text-sm font-semibold text-slate-950">
                {user.email}
              </p>
            </div>
          </aside>

          <form
            action={completeOnboardingAction}
            className="rounded-[32px] border border-white/80 bg-white p-6 shadow-[0_24px_70px_rgba(30,41,59,0.08)]"
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-slate-500">Setup</p>
                <h2 className="mt-1 text-2xl font-semibold tracking-tight">
                  Profile and goals
                </h2>
              </div>
              <div className="grid size-11 place-items-center rounded-2xl bg-blue-50 text-blue-600">
                <Target size={20} aria-hidden />
              </div>
            </div>

            <div className="mt-6 grid gap-6">
              <div className="grid gap-4 md:grid-cols-2">
                <TextInput label="Sex" name="sex" placeholder="Optional" required={false} />
                <NumberInput label="Age" name="age" placeholder="28" />
                <NumberInput label="Height" name="heightCm" placeholder="176" suffix="cm" />
                <NumberInput label="Weight" name="weightKg" placeholder="74" suffix="kg" />
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <SelectInput
                  label="Activity level"
                  name="activityLevel"
                  options={[
                    ["sedentary", "Sedentary"],
                    ["lightly_active", "Lightly active"],
                    ["moderately_active", "Moderately active"],
                    ["very_active", "Very active"],
                    ["athlete", "Athlete"],
                  ]}
                />
                <SelectInput
                  label="Goal"
                  name="goalType"
                  options={[
                    ["fat_loss", "Fat loss"],
                    ["muscle_gain", "Muscle gain"],
                    ["maintenance", "Maintenance"],
                    ["performance", "Performance"],
                    ["wellness", "Wellness"],
                  ]}
                />
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <TextInput
                  label="Diet preference"
                  name="dietaryPreference"
                  placeholder="High-protein vegetarian"
                  required={false}
                />
                <TextInput
                  label="Allergies"
                  name="allergies"
                  placeholder="Peanuts, lactose"
                  required={false}
                />
              </div>

              <div className="grid gap-4 rounded-3xl bg-slate-50 p-4 md:grid-cols-3">
                <NumberInput label="Calories" name="targetCalories" placeholder="2300" />
                <NumberInput label="Protein" name="proteinGrams" placeholder="165" suffix="g" />
                <NumberInput label="Carbs" name="carbsGrams" placeholder="240" suffix="g" />
                <NumberInput label="Fat" name="fatGrams" placeholder="72" suffix="g" />
                <NumberInput label="Fiber" name="fiberGrams" placeholder="35" suffix="g" />
                <NumberInput label="Water" name="waterMl" placeholder="3000" suffix="ml" />
              </div>
            </div>

            <button className="mt-6 inline-flex h-12 w-full items-center justify-between rounded-full bg-slate-950 px-5 text-sm font-semibold text-white shadow-lg shadow-slate-300 transition hover:-translate-y-0.5 hover:bg-slate-800">
              Save targets
              <ArrowRight size={17} aria-hidden />
            </button>
          </form>
        </section>
      </div>
    </main>
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
    <label className="grid gap-2 text-sm font-medium text-slate-700">
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
          className="h-12 w-full rounded-2xl border border-slate-200 bg-white px-4 text-slate-950 outline-none transition placeholder:text-slate-400 focus:border-blue-300 focus:ring-4 focus:ring-blue-100"
          inputMode="decimal"
          name={name}
          placeholder={placeholder}
          required
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

function SelectInput({
  label,
  name,
  options,
}: {
  label: string;
  name: string;
  options: Array<[string, string]>;
}) {
  return (
    <label className="grid gap-2 text-sm font-medium text-slate-700">
      {label}
      <select
        className="h-12 rounded-2xl border border-slate-200 bg-slate-50 px-4 text-slate-950 outline-none transition focus:border-blue-300 focus:ring-4 focus:ring-blue-100"
        name={name}
        required
      >
        {options.map(([value, labelText]) => (
          <option key={value} value={value}>
            {labelText}
          </option>
        ))}
      </select>
    </label>
  );
}
