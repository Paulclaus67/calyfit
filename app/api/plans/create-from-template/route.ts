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

type TemplateKey = "beginner" | "intermediate" | "advanced";

type TemplateDayDef = {
  day: DayName;
  sessionSlug: string | null;
  isRest: boolean;
  warmupMinutes?: number | null;
  warmupDescription?: string | null;
};

function getTemplateDays(template: TemplateKey): TemplateDayDef[] {
  const allDays: DayName[] = [
    "monday",
    "tuesday",
    "wednesday",
    "thursday",
    "friday",
    "saturday",
    "sunday",
  ];

  if (template === "beginner") {
    // 3 séances par semaine
    return allDays.map((day) => {
      switch (day) {
        case "monday":
          return {
            day,
            sessionSlug: "seance_dos",
            isRest: false,
          };
        case "wednesday":
          return {
            day,
            sessionSlug: "seance_jambes",
            isRest: false,
          };
        case "friday":
          return {
            day,
            sessionSlug: "circuit_pec_triceps",
            isRest: false,
          };
        default:
          return { day, sessionSlug: null, isRest: true };
      }
    });
  }

  if (template === "advanced") {
    // 5 séances par semaine
    return allDays.map((day) => {
      switch (day) {
        case "monday":
          return { day, sessionSlug: "seance_dos", isRest: false };
        case "tuesday":
          return { day, sessionSlug: "circuit_pec_triceps", isRest: false };
        case "thursday":
          return { day, sessionSlug: "circuit_biceps", isRest: false };
        case "friday":
          return { day, sessionSlug: "routine_pompes", isRest: false };
        case "saturday":
          return { day, sessionSlug: "seance_jambes", isRest: false };
        default:
          return { day, sessionSlug: null, isRest: true };
      }
    });
  }

  // intermediate = ton planning "standard"
  return allDays.map((day) => {
    switch (day) {
      case "monday":
        return { day, sessionSlug: "seance_dos", isRest: false };
      case "wednesday":
        return { day, sessionSlug: "circuit_pec_triceps", isRest: false };
      case "friday":
        return { day, sessionSlug: "circuit_biceps", isRest: false };
      case "saturday":
        return { day, sessionSlug: "seance_jambes", isRest: false };
      default:
        return { day, sessionSlug: null, isRest: true };
    }
  });
}

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
    const { templateKey, name } = body ?? {};

    const validTemplates: TemplateKey[] = [
      "beginner",
      "intermediate",
      "advanced",
    ];

    if (!validTemplates.includes(templateKey)) {
      return NextResponse.json(
        { error: "Template invalide" },
        { status: 400 }
      );
    }

    const daysDef = getTemplateDays(templateKey);

    // Récupérer toutes les séances nécessaires en 1 requête
    const neededSlugs = Array.from(
      new Set(daysDef.map((d) => d.sessionSlug).filter(Boolean))
    ) as string[];

    const sessions = await prisma.session.findMany({
      where: {
        slug: { in: neededSlugs },
      },
    });

    const sessionBySlug = new Map(
      sessions.map((s) => [s.slug, s])
    );

    // On désactive les autres plans de l'utilisateur
    await prisma.weekPlan.updateMany({
      where: { userId: user.id },
      data: { isActive: false },
    });

    const planName =
      typeof name === "string" && name.trim().length > 0
        ? name.trim()
        : templateKey === "beginner"
        ? "Programme débutant"
        : templateKey === "advanced"
        ? "Programme avancé"
        : "Programme intermédiaire";

    // Créer le nouveau WeekPlan
    const newPlan = await prisma.weekPlan.create({
      data: {
        name: planName,
        userId: user.id,
        isActive: true,
        templateType: templateKey,
      },
    });

    // Créer les jours
    for (const d of daysDef) {
      const session =
        d.sessionSlug != null
          ? sessionBySlug.get(d.sessionSlug) ?? null
          : null;

      await prisma.weekDay.create({
        data: {
          weekPlanId: newPlan.id,
          day: d.day,
          isRest: d.isRest || !session,
          warmupMinutes: d.warmupMinutes ?? null,
          warmupDescription: d.warmupDescription ?? null,
          sessionId: session ? session.id : null,
        },
      });
    }

    return NextResponse.json(
      {
        ok: true,
        id: newPlan.id,
        name: newPlan.name,
        templateType: newPlan.templateType,
      },
      { status: 201 }
    );
  } catch (e) {
    console.error("[API plans/create-from-template] Erreur:", e);
    return NextResponse.json(
      { error: "Erreur serveur" },
      { status: 500 }
    );
  }
}
