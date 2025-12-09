import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth-server";

function weekKeyFor(date: Date): string {
  const d = new Date(date.getFullYear(), date.getMonth(), date.getDate());
  let day = d.getDay();
  if (day === 0) day = 7; // dimanche = 7
  d.setDate(d.getDate() + 1 - day); // aller au lundi
  return `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`;
}

export async function GET() {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json(
        { error: "Non authentifié" },
        { status: 401 }
      );
    }

    const now = new Date();
    const startOfYear = new Date(now.getFullYear(), 0, 1);

    const histories = await prisma.sessionHistory.findMany({
      where: {
        userId: user.id,
        finishedAt: {
          gte: startOfYear,
        },
      },
      include: {
        session: true,
      },
    });

    const isSameMonth = (d: Date) =>
      d.getFullYear() === now.getFullYear() && d.getMonth() === now.getMonth();

    const isSameYear = (d: Date) =>
      d.getFullYear() === now.getFullYear();

    const currentWeekKey = weekKeyFor(now);

    let monthSessions = 0;
    let monthTotalSets = 0;
    let monthTotalDuration = 0;

    let yearSessions = 0;
    let yearTotalSets = 0;
    let yearTotalDuration = 0;

    const weekSlugsSet = new Set<string>();

    for (const h of histories) {
      const d = new Date(h.finishedAt);

      if (isSameYear(d)) {
        yearSessions += 1;
        yearTotalSets += h.totalCompletedSets ?? 0;
        yearTotalDuration += h.durationSeconds ?? 0;
      }

      if (isSameMonth(d)) {
        monthSessions += 1;
        monthTotalSets += h.totalCompletedSets ?? 0;
        monthTotalDuration += h.durationSeconds ?? 0;
      }

      if (weekKeyFor(d) === currentWeekKey && h.session?.slug) {
        weekSlugsSet.add(h.session.slug);
      }
    }

    return NextResponse.json({
      month: {
        sessionsDone: monthSessions,
        totalSets: monthTotalSets,
        totalDurationSeconds: monthTotalDuration,
      },
      year: {
        sessionsDone: yearSessions,
        totalSets: yearTotalSets,
        totalDurationSeconds: yearTotalDuration,
      },
      week: {
        sessionsDoneThisWeekSlugs: Array.from(weekSlugsSet),
      },
    });
  } catch (e) {
    console.error("[API stats] Erreur:", e);
    return NextResponse.json(
      { error: "Erreur serveur lors du calcul des stats" },
      { status: 500 }
    );
  }
}
