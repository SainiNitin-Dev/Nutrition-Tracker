import {
  Activity,
  Apple,
  Bot,
  Droplets,
  Flame,
  GlassWater,
  HeartPulse,
  Pill,
  Plus,
  Salad,
  Sparkles,
  Utensils,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";

export type Macro = {
  label: string;
  current: number;
  goal: number;
  unit: string;
  tone: "blue" | "green" | "amber" | "rose";
};

export type Meal = {
  name: string;
  time: string;
  calories: number;
  protein: number;
  accent: string;
  items: string[];
};

export type Supplement = {
  name: string;
  dose: string;
  time: string;
  status: "taken" | "upcoming";
};

export type QuickAction = {
  label: string;
  icon: LucideIcon;
};

export type NutritionSignal = {
  label: string;
  value: string;
  icon: LucideIcon;
};

export type DashboardSnapshot = {
  userName: string;
  dateLabel: string;
  greeting: string;
  calories: {
    current: number;
    goal: number;
    remaining: number;
  };
  macros: Macro[];
  hydration: {
    currentMl: number;
    goalMl: number;
    quickAdds: number[];
  };
  meals: Meal[];
  supplements: Supplement[];
  weeklyCalories: number[];
  insights: string[];
  quickActions: QuickAction[];
  signals: NutritionSignal[];
};

export const dashboardSnapshot: DashboardSnapshot = {
  userName: "Alex",
  dateLabel: "Friday, May 15",
  greeting: "Good afternoon",
  calories: {
    current: 1680,
    goal: 2300,
    remaining: 620,
  },
  macros: [
    { label: "Protein", current: 118, goal: 165, unit: "g", tone: "blue" },
    { label: "Carbs", current: 176, goal: 240, unit: "g", tone: "green" },
    { label: "Fats", current: 54, goal: 72, unit: "g", tone: "amber" },
    { label: "Fiber", current: 22, goal: 35, unit: "g", tone: "rose" },
  ],
  hydration: {
    currentMl: 1900,
    goalMl: 3000,
    quickAdds: [250, 500, 750],
  },
  meals: [
    {
      name: "Breakfast",
      time: "8:10 AM",
      calories: 420,
      protein: 34,
      accent: "#3b82f6",
      items: ["Greek yogurt", "berries", "chia", "honey"],
    },
    {
      name: "Lunch",
      time: "1:05 PM",
      calories: 710,
      protein: 46,
      accent: "#14b8a6",
      items: ["Chicken bowl", "rice", "avocado", "greens"],
    },
    {
      name: "Snack",
      time: "4:20 PM",
      calories: 230,
      protein: 24,
      accent: "#f59e0b",
      items: ["Whey", "banana"],
    },
  ],
  supplements: [
    { name: "Vitamin D3", dose: "2000 IU", time: "8:00 AM", status: "taken" },
    { name: "Creatine", dose: "5 g", time: "2:00 PM", status: "taken" },
    { name: "Magnesium", dose: "300 mg", time: "9:30 PM", status: "upcoming" },
  ],
  weeklyCalories: [2180, 2290, 2010, 2350, 2225, 1680, 0],
  insights: [
    "Protein is tracking well, but dinner should carry roughly 45g to land your goal.",
    "Sodium looks moderate today. Keep the final meal simple if you choose a packaged snack.",
    "Hydration is slightly behind your usual pace. A 500ml add now gets you back on trend.",
  ],
  quickActions: [
    { label: "Add meal", icon: Utensils },
    { label: "Water", icon: GlassWater },
    { label: "Supplement", icon: Pill },
    { label: "Ask coach", icon: Bot },
  ],
  signals: [
    { label: "Streak", value: "0 days", icon: Flame },
    { label: "Hydration", value: "0%", icon: HeartPulse },
    { label: "Fiber", value: "0%", icon: Apple },
    { label: "Supplements", value: "0%", icon: Plus },
  ],
};

export const dashboardNav = [
  { label: "Today", icon: Activity },
  { label: "Meals", icon: Salad },
  { label: "Hydration", icon: Droplets },
  { label: "Supplements", icon: Pill },
  { label: "Coach", icon: Sparkles },
];

