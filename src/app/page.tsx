import { DashboardExperience } from "@/features/dashboard/components/dashboard-experience";
import { getTodayDashboardSnapshot } from "@/features/dashboard/queries";
import { getCurrentAppUserWithActiveGoal } from "@/lib/auth/current-user";
import { redirect } from "next/navigation";

export const dynamic = "force-dynamic";

export default async function Home() {
  const signedInUser = await getCurrentAppUserWithActiveGoal();

  if (signedInUser && signedInUser.goals.length === 0) {
    redirect("/onboarding");
  }

  const snapshot = await getTodayDashboardSnapshot();

  return <DashboardExperience snapshot={snapshot} />;
}
