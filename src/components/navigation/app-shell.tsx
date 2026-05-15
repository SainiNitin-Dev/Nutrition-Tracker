"use client";

import { usePathname } from "next/navigation";
import { MobileTabBar } from "./mobile-tab-bar";

const fullScreenRoutes = ["/coach", "/login", "/onboarding"];

export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const isFullScreen = fullScreenRoutes.some((route) => pathname.startsWith(route));

  return (
    <>
      <div className={`min-h-full ${isFullScreen ? "" : "pb-28 lg:pb-0"}`}>
        {children}
      </div>
      <MobileTabBar />
    </>
  );
}
