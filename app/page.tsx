import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth-server";
import { redirect } from "next/navigation";
import type { DayName } from "@/lib/types";
import HomeClient, {
  HomeData,
  HomeSessionItemPreview,
} from "./HomeClient";

function getTodayDayName(): DayName {
  const jsDay = new Date().getDay(); // 0 = Sunday, 1 = Monday, ...
  const map: DayName[] = [
    "sunday",
    "monday",
    "tuesday",
    "wednesday",
    "thursday",
    "friday",
    "saturday",
  ];
  return map[jsDay]!;
}

export default async function HomePage() {
  // 🔐 Récupérer l'utilisateur connecté via le cookie
  const user = await getCurrentUser();
  if (!user) {
    // Pas connecté → direction /login
    redirect("/login");
  }

   const userId = user.id;

  const today = new Date();
  const dayName = getTodayDayName();
  const dateHuman = today.toLocaleDateString("fr-FR", {
    day: "numeric",
    month: "long",
  });

  // 🔥 d’abord on cherche un plan actif
  let dbWeekPlan = await prisma.weekPlan.findFirst({
    where: { userId, isActive: true },
    include: {
      days: {
        where: { day: dayName },
        include: {
          session: {
            include: {
              items: {
                include: {
                  exercise: true,
                },
              },
            },
          },
        },
      },
    },
  });

  // fallback si aucun plan actif (ancien comptes)
  if (!dbWeekPlan) {
    dbWeekPlan = await prisma.weekPlan.findFirst({
      where: { userId },
      include: {
        days: {
          where: { day: dayName },
          include: {
            session: {
              include: {
                items: { include: { exercise: true } },
              },
            },
          },
        },
      },
    });

    // si vraiment aucun plan, on redirige vers l'onboarding
    if (!dbWeekPlan) {
      redirect("/onboarding");
    }
  }

  const day = dbWeekPlan?.days[0] ?? null;
  const session = day?.session ?? null;

  let itemsPreview: HomeSessionItemPreview[] = [];

  if (session) {
    const itemsSorted = [...session.items].sort((a, b) => a.order - b.order);
    itemsPreview = itemsSorted.map((item) => ({
      id: item.id,
      order: item.order,
      exerciseName: item.exercise?.name ?? "Exercice",
      sets: item.sets,
      repsType: item.repsType as "reps" | "time",
      repsValue: item.repsValue,
      repsText: item.repsText,
      restSeconds: item.restSeconds,
    }));
  }

  const isRestDay = !session || day?.isRest || false;

  const homeData: HomeData = {
    dayName,
    dateHuman,
    isRestDay,
    warmupMinutes: day?.warmupMinutes ?? null,
    warmupDescription: day?.warmupDescription ?? null,
    session: session
      ? {
          slug: session.slug,
          name: session.name,
          type: session.type as "classic" | "circuit",
          estimatedDurationMinutes: session.estimatedDurationMinutes ?? null,
          itemsPreview,
        }
      : null,
  };

  return <HomeClient home={homeData} />;
}
