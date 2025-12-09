// app/api/sessions/all/route.ts
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth-server";

export async function GET() {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json(
        { error: "Non authentifié" },
        { status: 401 }
      );
    }

    // 1) séances modèles (communes à tout le monde)
    const templateSessions = await prisma.session.findMany({
      where: { userId: null },
      select: {
        id: true,
        slug: true,
        name: true,
        type: true,
        estimatedDurationMinutes: true,
      },
    });

    // 2) séances personnalisées pour cet utilisateur
    const userSessions = await prisma.session.findMany({
      where: { userId: user.id },
      select: {
        id: true,
        slug: true,
        name: true,
        type: true,
        estimatedDurationMinutes: true,
      },
    });

    // 3) dédoublonnage par slug : la version user remplace la template
    const bySlug = new Map<string, (typeof templateSessions)[number]>();

    // d'abord les templates
    for (const s of templateSessions) {
      if (!bySlug.has(s.slug)) {
        bySlug.set(s.slug, s);
      }
    }

    // ensuite les séances perso, qui écrasent les templates du même slug
    for (const s of userSessions) {
      bySlug.set(s.slug, s);
    }

    const sessions = Array.from(bySlug.values()).sort((a, b) =>
      a.name.localeCompare(b.name, "fr")
    );

    return NextResponse.json({ sessions });
  } catch (e) {
    console.error("[API sessions/all] Erreur :", e);
    return NextResponse.json(
      { error: "Erreur lors du chargement des séances" },
      { status: 500 }
    );
  }
}
