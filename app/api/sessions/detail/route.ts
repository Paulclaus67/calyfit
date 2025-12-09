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
    const sessionId = searchParams.get("sessionId");

    if (!sessionId) {
      return NextResponse.json(
        { error: "sessionId manquant" },
        { status: 400 }
      );
    }

    const session = await prisma.session.findUnique({
      where: { id: sessionId },
      include: {
        items: {
          orderBy: { order: "asc" },
          include: {
            exercise: true,
          },
        },
      },
    });

    if (!session) {
      return NextResponse.json(
        { error: "Séance introuvable" },
        { status: 404 }
      );
    }

    const items = session.items.map((it) => ({
      exerciseId: it.exerciseId,
      exerciseName: it.exercise.name,
      muscleGroup: it.exercise.muscleGroup,
      sets: it.sets,
      reps: it.reps,
      restSeconds: it.restSeconds,
    }));

    return NextResponse.json({
      id: session.id,
      name: session.name,
      items,
    });
  } catch (e) {
    console.error("[API sessions/detail] Erreur:", e);
    return NextResponse.json(
      { error: "Erreur serveur" },
      { status: 500 }
    );
  }
}
