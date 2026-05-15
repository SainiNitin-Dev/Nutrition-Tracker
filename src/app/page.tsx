import { DashboardExperience } from "@/features/dashboard/components/dashboard-experience";
import { getTodayDashboardSnapshot } from "@/features/dashboard/queries";

export const dynamic = "force-dynamic";

export default async function Home() {
  const snapshot = await getTodayDashboardSnapshot();

  return <DashboardExperience snapshot={snapshot} />;
}
