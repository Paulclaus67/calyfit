// app/api/sessions/update/route.ts
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth-server";

type UpdateItemPayload = {
  exerciseId: string;
  sets: number;
  reps: string;
  restSeconds: number | null;
};

type UpdatePayload = {
  sessionId: string;
  name?: string;
  items: UpdateItemPayload[];
};

export async function POST(req: Request) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json(
        { error: "Non authentifié" },
        { status: 401 }
      );
    }

    const body = (await req.json()) as UpdatePayload | null;
    if (!body || !body.sessionId || !Array.isArray(body.items)) {
      return NextResponse.json(
        { error: "Données invalides" },
        { status: 400 }
      );
    }

    const { sessionId, name, items } = body;

    if (items.length === 0) {
      return NextResponse.json(
        { error: "Ajoute au moins un exercice" },
        { status: 400 }
      );
    }

    // 🔹 on récupère la séance de base (template ou perso)
    const baseSession = await prisma.session.findUnique({
      where: { id: sessionId },
    });

    if (!baseSession) {
      return NextResponse.json(
        { error: "Séance introuvable" },
        { status: 404 }
      );
    }

    const isTemplate = baseSession.userId === null;
    const isOwnedByUser = baseSession.userId === user.id;

    let targetSessionId = baseSession.id;

    if (isTemplate) {
      // 🧬 Cas 1 : on modifie une séance modèle → créer/mettre à jour une version perso

      // On regarde s'il existe déjà une version perso avec ce slug
      let userSession = await prisma.session.findFirst({
        where: {
          userId: user.id,
          slug: baseSession.slug,
        },
      });

      if (!userSession) {
        // Pas encore de version perso → on crée une nouvelle séance pour ce user
        userSession = await prisma.session.create({
          data: {
            userId: user.id,
            slug: baseSession.slug,
            name: name && name.trim().length > 0 ? name : baseSession.name,
            type: baseSession.type,
            estimatedDurationMinutes:
              baseSession.estimatedDurationMinutes ?? null,
          },
        });
      } else {
        // Déjà une version perso → on met à jour le nom si besoin
        if (name && name.trim().length > 0 && name !== userSession.name) {
          userSession = await prisma.session.update({
            where: { id: userSession.id },
            data: { name },
          });
        }
      }

      targetSessionId = userSession.id;
    } else if (isOwnedByUser) {
      // 🧬 Cas 2 : séance déjà personnalisée par ce user → on met à jour
      if (name && name.trim().length > 0 && name !== baseSession.name) {
        await prisma.session.update({
          where: { id: baseSession.id },
          data: { name },
        });
      }
      targetSessionId = baseSession.id;
    } else {
      // 🧬 Cas 3 : séance d’un autre user → on refuse
      return NextResponse.json(
        { error: "Accès non autorisé à cette séance" },
        { status: 403 }
      );
    }

    // On remplace entièrement les items de la séance cible
await prisma.sessionExercise.deleteMany({
  where: { sessionId: targetSessionId },
});

await prisma.sessionExercise.createMany({
  data: items.map((it, index) => ({
    sessionId: targetSessionId,
    exerciseId: it.exerciseId,
    order: index,
    sets: it.sets,
    reps: it.reps,
    // 🔹 valeur par défaut pour le champs obligatoire repsType
    repsType: "text",
    restSeconds: it.restSeconds ?? null,
  })),
});


    return NextResponse.json({ ok: true, sessionId: targetSessionId });
  } catch (e) {
    console.error("[API sessions/update] Erreur :", e);
    return NextResponse.json(
      { error: "Erreur serveur lors de la mise à jour de la séance" },
      { status: 500 }
    );
  }
}
