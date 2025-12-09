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
    const { planId } = body ?? {};

    if (typeof planId !== "string" || planId.length === 0) {
      return NextResponse.json(
        { error: "planId manquant" },
        { status: 400 }
      );
    }

    const plan = await prisma.weekPlan.findFirst({
      where: { id: planId, userId: user.id },
    });

    if (!plan) {
      return NextResponse.json(
        { error: "Planning introuvable" },
        { status: 404 }
      );
    }

    await prisma.weekPlan.updateMany({
      where: { userId: user.id },
      data: { isActive: false },
    });

    await prisma.weekPlan.update({
      where: { id: plan.id },
      data: { isActive: true },
    });

    return NextResponse.json({ ok: true });
  } catch (e) {
    console.error("[API plans/set-active] Erreur:", e);
    return NextResponse.json(
      { error: "Erreur serveur" },
      { status: 500 }
    );
  }
}
