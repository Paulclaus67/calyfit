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
    const {
      sessionSlug,
      finishedAt,
      durationSeconds,
      totalCompletedSets,
    } = body ?? {};

    if (typeof sessionSlug !== "string" || sessionSlug.length === 0) {
      return NextResponse.json(
        { error: "sessionSlug manquant ou invalide" },
        { status: 400 }
      );
    }

    const sessionDb = await prisma.session.findUnique({
      where: { slug: sessionSlug },
    });

    if (!sessionDb) {
      console.error("[API history] Session introuvable pour slug:", sessionSlug);
      return NextResponse.json(
        { error: "Séance inconnue en base" },
        { status: 404 }
      );
    }

    const finishedDate =
      typeof finishedAt === "number" || typeof finishedAt === "string"
        ? new Date(finishedAt)
        : new Date();

    const entry = await prisma.sessionHistory.create({
      data: {
        sessionId: sessionDb.id,
        userId: user.id,
        finishedAt: finishedDate,
        durationSeconds:
          typeof durationSeconds === "number" ? durationSeconds : 0,
        totalCompletedSets:
          typeof totalCompletedSets === "number"
            ? totalCompletedSets
            : 0,
      },
    });

    return NextResponse.json({ ok: true, id: entry.id });
  } catch (e) {
    console.error("[API history] Erreur serveur:", e);
    return NextResponse.json(
      { error: "Erreur serveur lors de l'enregistrement" },
      { status: 500 }
    );
  }
}
