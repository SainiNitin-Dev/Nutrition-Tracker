import { DashboardExperience } from "@/features/dashboard/components/dashboard-experience";
import { dashboardSnapshot } from "@/features/dashboard/data";

export default function Home() {
  return <DashboardExperience snapshot={dashboardSnapshot} />;
}
