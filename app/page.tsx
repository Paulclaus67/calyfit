import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth-server";
import { redirect } from "next/navigation";
import type { DayName } from "@/lib/types";
import HomeClient, {
  HomeData,
  HomeSessionItemPreview,
  HomeWeekDay,
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

const DAY_ORDER: DayName[] = [
  "monday",
  "tuesday",
  "wednesday",
  "thursday",
  "friday",
  "saturday",
  "sunday",
];

export default async function HomePage() {
  // 🔐 Récupérer l'utilisateur connecté via le cookie
  const user = await getCurrentUser();
  if (!user) {
    redirect("/login");
  }

  const userId = user.id;

  const today = new Date();
  const dayName = getTodayDayName();
  const dateHuman = today.toLocaleDateString("fr-FR", {
    day: "numeric",
    month: "long",
  });

  // 🔥 On cherche d'abord un plan actif, avec TOUS les jours
  let dbWeekPlan = await prisma.weekPlan.findFirst({
    where: { userId, isActive: true },
    include: {
      days: {
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

  // fallback si aucun plan actif (anciens comptes)
  if (!dbWeekPlan) {
    dbWeekPlan = await prisma.weekPlan.findFirst({
      where: { userId },
      include: {
        days: {
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

  const allDays = dbWeekPlan.days;

  // Jour courant dans ce planning
  const todayDay = allDays.find((d) => d.day === dayName) ?? null;
  const session = todayDay?.session ?? null;

  // Préview des exos du jour (pour le futur si besoin)
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

  // Vue d’ensemble de la semaine pour la home
  const weekOverview: HomeWeekDay[] = DAY_ORDER.map((dName) => {
    const rec = allDays.find((d) => d.day === dName);
    const sess = rec?.session ?? null;
    const hasSession = !!sess;
    const isRest = rec?.isRest ?? !hasSession;

    return {
      day: dName,
      hasSession,
      isRest,
      sessionId: sess?.id ?? null,
      sessionSlug: sess?.slug ?? null,
      sessionName: sess?.name ?? null,
    };
  });

  const isRestDay = !session || todayDay?.isRest || false;

  const homeData: HomeData = {
    dayName,
    dateHuman,
    isRestDay,
    warmupMinutes: todayDay?.warmupMinutes ?? null,
    warmupDescription: todayDay?.warmupDescription ?? null,
    session: session
      ? {
          id: session.id,
          slug: session.slug,
          name: session.name,
          type: session.type as "classic" | "circuit",
          estimatedDurationMinutes: session.estimatedDurationMinutes ?? null,
          itemsPreview,
        }
      : null,
    weekOverview,
  };

  return <HomeClient home={homeData} />;
}
