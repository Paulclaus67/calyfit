import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth-server";

type DayName =
  | "monday"
  | "tuesday"
  | "wednesday"
  | "thursday"
  | "friday"
  | "saturday"
  | "sunday";

type DayUpdate = {
  day: DayName;
  isRest: boolean;
  sessionSlug: string | null;
};

export async function POST(request: Request) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json(
        { error: "Non authentifié" },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { planId, days, name } = body ?? {};

    if (typeof planId !== "string" || planId.length === 0) {
      return NextResponse.json(
        { error: "planId manquant" },
        { status: 400 }
      );
    }

    if (!Array.isArray(days) || days.length === 0) {
      return NextResponse.json(
        { error: "Liste de jours invalide" },
        { status: 400 }
      );
    }

    const plan = await prisma.weekPlan.findFirst({
      where: { id: planId, userId: user.id },
      include: { days: true },
    });

    if (!plan) {
      return NextResponse.json(
        { error: "Planning introuvable" },
        { status: 404 }
      );
    }

    // 🔥 Renommer le planning si un nom est fourni
    if (typeof name === "string" && name.trim().length > 0) {
      await prisma.weekPlan.update({
        where: { id: plan.id },
        data: { name: name.trim() },
      });
    }

    const existingDays = new Map(
      plan.days.map((d) => [d.day as DayName, d])
    );

    const neededSlugs = Array.from(
      new Set(
        days
          .map((d: DayUpdate) => d.sessionSlug)
          .filter(Boolean)
      )
    ) as string[];

    const sessions = await prisma.session.findMany({
      where: { slug: { in: neededSlugs } },
    });

    const sessionBySlug = new Map(
      sessions.map((s) => [s.slug, s])
    );

    for (const d of days as DayUpdate[]) {
      const existing = existingDays.get(d.day);
      const session =
        d.sessionSlug != null
          ? sessionBySlug.get(d.sessionSlug) ?? null
          : null;

      if (existing) {
        await prisma.weekDay.update({
          where: { id: existing.id },
          data: {
            isRest: d.isRest || !session,
            sessionId: session ? session.id : null,
          },
        });
      } else {
        await prisma.weekDay.create({
          data: {
            weekPlanId: plan.id,
            day: d.day,
            isRest: d.isRest || !session,
            sessionId: session ? session.id : null,
          },
        });
      }
    }

    return NextResponse.json({ ok: true });
  } catch (e) {
    console.error("[API plans/update-days] Erreur:", e);
    return NextResponse.json(
      { error: "Erreur serveur" },
      { status: 500 }
    );
  }
}
