import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth-server";

// 🟢 Enregistrer une séance terminée (appelé par le runner)
export async function POST(req: Request) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json(
        { error: "Non authentifié" },
        { status: 401 }
      );
    }

    const body = await req.json();
    const {
      sessionId,
      totalSets,
      totalExercises,
      totalRounds,
      elapsedSeconds,
      finishedAt,
    } = body ?? {};

    if (!sessionId) {
      return NextResponse.json(
        { error: "sessionId manquant" },
        { status: 400 }
      );
    }

    const finishedDate = finishedAt ? new Date(finishedAt) : new Date();

    await prisma.sessionHistory.create({
      data: {
        userId: user.id,
        sessionId,
        totalSets: totalSets ?? 0,
        totalExercises: totalExercises ?? 0,
        totalRounds: totalRounds ?? 1,
        elapsedSeconds: elapsedSeconds ?? 0,
        finishedAt: finishedDate,
      },
    });

    return NextResponse.json({ ok: true });
  } catch (e) {
    console.error("[API history POST] Erreur :", e);
    return NextResponse.json(
      { error: "Erreur serveur lors de l'enregistrement de la séance" },
      { status: 500 }
    );
  }
}

// 🟢 Récupérer les séances faites (pour la home & le planning)
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

    // début & fin de JOUR (local)
    const startOfDay = new Date(now);
    startOfDay.setHours(0, 0, 0, 0);
    const endOfDay = new Date(now);
    endOfDay.setHours(23, 59, 59, 999);

    // début de semaine (lundi) & fin (lundi suivant)
    // getDay() -> 0 (dim) ... 6 (sam)
    const jsDay = now.getDay();
    const offsetFromMonday = (jsDay + 6) % 7; // 0 = lundi, 6 = dimanche

    const startOfWeek = new Date(startOfDay);
    startOfWeek.setDate(startOfWeek.getDate() - offsetFromMonday);

    const endOfWeek = new Date(startOfWeek);
    endOfWeek.setDate(endOfWeek.getDate() + 7);

    const historyThisWeek = await prisma.sessionHistory.findMany({
      where: {
        userId: user.id,
        finishedAt: {
          gte: startOfWeek,
          lt: endOfWeek,
        },
      },
      select: {
        sessionId: true,
        finishedAt: true,
      },
    });

    const sessionsDoneThisWeek = Array.from(
      new Set(historyThisWeek.map((h) => h.sessionId))
    );

    const sessionsDoneToday = Array.from(
      new Set(
        historyThisWeek
          .filter((h) => h.finishedAt >= startOfDay && h.finishedAt <= endOfDay)
          .map((h) => h.sessionId)
      )
    );

    return NextResponse.json({
      sessionsDoneThisWeek,
      sessionsDoneToday,
    });
  } catch (e) {
    console.error("[API history GET] Erreur :", e);
    return NextResponse.json(
      { error: "Erreur serveur lors de la récupération de l'historique" },
      { status: 500 }
    );
  }
}
