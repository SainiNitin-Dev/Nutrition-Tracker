"use client";

import Link from "next/link";
import { Bot, Droplets, LayoutDashboard, Pill, Utensils } from "lucide-react";
import { usePathname } from "next/navigation";

const tabs = [
  { label: "Today", href: "/", icon: LayoutDashboard },
  { label: "Meals", href: "/meals", icon: Utensils },
  { label: "Water", href: "/hydration", icon: Droplets },
  { label: "Stack", href: "/supplements", icon: Pill },
  { label: "Coach", href: "/coach", icon: Bot },
];

export function MobileTabBar() {
  const pathname = usePathname();

  if (
    pathname.startsWith("/coach") ||
    pathname.startsWith("/login") ||
    pathname.startsWith("/onboarding")
  ) {
    return null;
  }

  return (
    <nav
      aria-label="Primary"
      className="fixed inset-x-3 bottom-3 z-40 rounded-[28px] border border-white/80 bg-white/88 px-2 pb-[calc(env(safe-area-inset-bottom)+0.35rem)] pt-2 shadow-[0_18px_60px_rgba(15,23,42,0.18)] backdrop-blur-xl lg:hidden"
    >
      <div className="grid grid-cols-5 gap-1">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive =
            tab.href === "/"
              ? pathname === "/"
              : pathname.startsWith(tab.href);

          return (
            <Link
              aria-current={isActive ? "page" : undefined}
              className={`flex min-h-14 flex-col items-center justify-center gap-1 rounded-2xl text-[11px] font-semibold transition ${
                isActive
                  ? "bg-slate-950 text-white shadow-lg shadow-slate-300"
                  : "text-slate-500 active:bg-slate-100"
              }`}
              href={tab.href}
              key={tab.label}
            >
              <Icon size={18} aria-hidden />
              <span>{tab.label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
