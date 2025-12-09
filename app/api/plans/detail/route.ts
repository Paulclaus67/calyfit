import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth-server";

export async function GET(request: Request) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json(
        { error: "Non authentifié" },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(request.url);
    const planId = searchParams.get("planId");

    if (!planId) {
      return NextResponse.json(
        { error: "planId manquant" },
        { status: 400 }
      );
    }

    const plan = await prisma.weekPlan.findFirst({
      where: { id: planId, userId: user.id },
      include: {
        days: {
          include: {
            session: true,
          },
        },
      },
    });

    if (!plan) {
      return NextResponse.json(
        { error: "Planning introuvable" },
        { status: 404 }
      );
    }

    const days = plan.days.map((d) => ({
      id: d.id,
      day: d.day,
      isRest: d.isRest,
      session: d.session
        ? {
            id: d.session.id,
            slug: d.session.slug,
            name: d.session.name,
          }
        : null,
    }));

    return NextResponse.json({
      id: plan.id,
      name: plan.name,
      isActive: plan.isActive,
      templateType: plan.templateType,
      days,
    });
  } catch (e) {
    console.error("[API plans/detail] Erreur:", e);
    return NextResponse.json(
      { error: "Erreur serveur" },
      { status: 500 }
    );
  }
}
