import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth-server";

type ItemInput = {
  exerciseId: string;
  sets: number;
  reps: string;
  restSeconds: number | null;
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
    const { sessionId, name, items } = body ?? {};

    if (typeof sessionId !== "string" || sessionId.length === 0) {
      return NextResponse.json(
        { error: "sessionId manquant" },
        { status: 400 }
      );
    }

    if (!Array.isArray(items) || items.length === 0) {
      return NextResponse.json(
        { error: "La séance doit contenir au moins un exercice" },
        { status: 400 }
      );
    }

    const session = await prisma.session.findUnique({
      where: { id: sessionId },
      select: { id: true },
    });

    if (!session) {
      return NextResponse.json(
        { error: "Séance introuvable" },
        { status: 404 }
      );
    }

    // Update nom si fourni
    if (typeof name === "string" && name.trim().length > 0) {
      await prisma.session.update({
        where: { id: sessionId },
        data: { name: name.trim() },
      });
    }

    // On reset les items de la séance
    await prisma.sessionItem.deleteMany({
      where: { sessionId },
    });

    // Recréation des items
    let order = 0;
    for (const raw of items as ItemInput[]) {
      if (!raw.exerciseId) continue;
      const sets = Number(raw.sets) || 0;
      const reps = String(raw.reps ?? "").trim();
      const restSeconds =
        raw.restSeconds === null || raw.restSeconds === undefined
          ? null
          : Number(raw.restSeconds);

      await prisma.sessionItem.create({
        data: {
          sessionId,
          exerciseId: raw.exerciseId,
          order,
          sets,
          reps,
          restSeconds,
        },
      });
      order += 1;
    }

    return NextResponse.json({ ok: true });
  } catch (e) {
    console.error("[API sessions/update] Erreur:", e);
    return NextResponse.json(
      { error: "Erreur serveur" },
      { status: 500 }
    );
  }
}
