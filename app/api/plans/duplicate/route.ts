import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth-server";

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
    const { planId, name } = body ?? {};

    if (typeof planId !== "string" || planId.length === 0) {
      return NextResponse.json(
        { error: "planId manquant" },
        { status: 400 }
      );
    }

    const fromPlan = await prisma.weekPlan.findFirst({
      where: { id: planId, userId: user.id },
      include: { days: true },
    });

    if (!fromPlan) {
      return NextResponse.json(
        { error: "Planning introuvable" },
        { status: 404 }
      );
    }

    await prisma.weekPlan.updateMany({
      where: { userId: user.id },
      data: { isActive: false },
    });

    const newName =
      typeof name === "string" && name.trim().length > 0
        ? name.trim()
        : `${fromPlan.name} (copie)`;

    const newPlan = await prisma.weekPlan.create({
      data: {
        name: newName,
        userId: user.id,
        isActive: true,
        templateType: fromPlan.templateType ?? "custom",
      },
    });

    for (const d of fromPlan.days) {
      await prisma.weekDay.create({
        data: {
          weekPlanId: newPlan.id,
          day: d.day,
          isRest: d.isRest,
          warmupMinutes: d.warmupMinutes,
          warmupDescription: d.warmupDescription,
          sessionId: d.sessionId,
        },
      });
    }

    return NextResponse.json({ ok: true, id: newPlan.id, name: newPlan.name });
  } catch (e) {
    console.error("[API plans/duplicate] Erreur:", e);
    return NextResponse.json(
      { error: "Erreur serveur" },
      { status: 500 }
    );
  }
}
