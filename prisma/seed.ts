import { config } from "dotenv";
import { PrismaPg } from "@prisma/adapter-pg";
import {
  CoachMemoryType,
  GoalType,
  LogSource,
  MealType,
  PrismaClient,
  SupplementLogStatus,
} from "../src/generated/prisma/client";

config({ path: ".env.local" });

const adapter = new PrismaPg({
  connectionString: process.env.DATABASE_URL!,
});

const prisma = new PrismaClient({ adapter });

const demoUserEmail = "alex.demo@nourish.local";

function todayAt(hours: number, minutes: number) {
  const date = new Date();
  date.setHours(hours, minutes, 0, 0);
  return date;
}

async function main() {
  const user = await prisma.user.upsert({
    where: { email: demoUserEmail },
    update: {
      name: "Alex",
    },
    create: {
      email: demoUserEmail,
      name: "Alex",
      profile: {
        create: {
          activityLevel: "moderately_active",
          timezone: "Asia/Calcutta",
          dietaryPreference: "High-protein balanced",
          allergies: [],
          heightCm: 176,
          weightKg: 74,
        },
      },
    },
  });

  await prisma.goal.updateMany({
    where: { userId: user.id, isActive: true },
    data: { isActive: false },
  });

  await prisma.goal.create({
    data: {
      userId: user.id,
      type: GoalType.muscle_gain,
      targetCalories: 2300,
      proteinGrams: 165,
      carbsGrams: 240,
      fatGrams: 72,
      fiberGrams: 35,
      sugarGrams: 55,
      sodiumMg: 2300,
      waterMl: 3000,
      startDate: todayAt(0, 0),
      isActive: true,
    },
  });

  await prisma.meal.deleteMany({ where: { userId: user.id } });
  await prisma.hydrationLog.deleteMany({ where: { userId: user.id } });
  await prisma.supplement.deleteMany({ where: { userId: user.id } });
  await prisma.coachMemory.deleteMany({ where: { userId: user.id } });

  await prisma.meal.createMany({
    data: [
      {
        userId: user.id,
        date: todayAt(8, 10),
        mealType: MealType.breakfast,
        title: "Greek yogurt bowl",
        source: LogSource.manual,
      },
      {
        userId: user.id,
        date: todayAt(13, 5),
        mealType: MealType.lunch,
        title: "Chicken rice bowl",
        source: LogSource.manual,
      },
      {
        userId: user.id,
        date: todayAt(16, 20),
        mealType: MealType.snack,
        title: "Whey and banana",
        source: LogSource.coach,
      },
    ],
  });

  const meals = await prisma.meal.findMany({
    where: { userId: user.id },
    orderBy: { date: "asc" },
  });

  const mealItems = [
    {
      mealId: meals[0].id,
      name: "Greek yogurt, berries, chia, honey",
      quantity: 1,
      unit: "bowl",
      calories: 420,
      protein: 34,
      carbs: 52,
      fat: 10,
      fiber: 8,
      sugar: 26,
      sodium: 120,
      confidence: 0.95,
    },
    {
      mealId: meals[1].id,
      name: "Chicken bowl with rice, avocado, greens",
      quantity: 1,
      unit: "bowl",
      calories: 710,
      protein: 46,
      carbs: 82,
      fat: 24,
      fiber: 10,
      sugar: 8,
      sodium: 760,
      confidence: 0.92,
    },
    {
      mealId: meals[2].id,
      name: "Whey protein with banana",
      quantity: 1,
      unit: "serving",
      calories: 230,
      protein: 24,
      carbs: 28,
      fat: 2,
      fiber: 4,
      sugar: 16,
      sodium: 150,
      confidence: 0.9,
    },
  ];

  await prisma.mealItem.createMany({ data: mealItems });

  await prisma.hydrationLog.createMany({
    data: [
      { userId: user.id, amountMl: 500, loggedAt: todayAt(7, 45), source: LogSource.manual },
      { userId: user.id, amountMl: 700, loggedAt: todayAt(11, 30), source: LogSource.manual },
      { userId: user.id, amountMl: 700, loggedAt: todayAt(15, 20), source: LogSource.coach },
    ],
  });

  const vitaminD = await prisma.supplement.create({
    data: {
      userId: user.id,
      name: "Vitamin D3",
      dosageAmount: 2000,
      dosageUnit: "IU",
      purpose: "General wellness",
      schedules: {
        create: { timeOfDay: "08:00", daysOfWeek: [1, 2, 3, 4, 5, 6, 7] },
      },
    },
  });

  const creatine = await prisma.supplement.create({
    data: {
      userId: user.id,
      name: "Creatine",
      dosageAmount: 5,
      dosageUnit: "g",
      purpose: "Strength and power output",
      schedules: {
        create: { timeOfDay: "14:00", daysOfWeek: [1, 2, 3, 4, 5, 6, 7] },
      },
    },
  });

  const magnesium = await prisma.supplement.create({
    data: {
      userId: user.id,
      name: "Magnesium",
      dosageAmount: 300,
      dosageUnit: "mg",
      purpose: "Sleep and recovery",
      schedules: {
        create: { timeOfDay: "21:30", daysOfWeek: [1, 2, 3, 4, 5, 6, 7] },
      },
    },
  });

  await prisma.supplementLog.createMany({
    data: [
      {
        userId: user.id,
        supplementId: vitaminD.id,
        takenAt: todayAt(8, 5),
        amount: 2000,
        status: SupplementLogStatus.taken,
      },
      {
        userId: user.id,
        supplementId: creatine.id,
        takenAt: todayAt(14, 10),
        amount: 5,
        status: SupplementLogStatus.taken,
      },
      {
        userId: user.id,
        supplementId: magnesium.id,
        takenAt: todayAt(21, 30),
        amount: 300,
        status: SupplementLogStatus.planned,
      },
    ],
  });

  await prisma.coachMemory.createMany({
    data: [
      {
        userId: user.id,
        type: CoachMemoryType.preference,
        content: "Prefers high-protein meals with simple ingredients.",
        importance: 3,
      },
      {
        userId: user.id,
        type: CoachMemoryType.pattern,
        content: "Hydration often falls behind in the late afternoon.",
        importance: 2,
      },
    ],
  });

  console.log(`Seeded demo nutrition workspace for ${demoUserEmail}`);
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
