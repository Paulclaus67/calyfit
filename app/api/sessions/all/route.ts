import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const sessions = await prisma.session.findMany({
      orderBy: {
        name: "asc",
      },
      select: {
        id: true,
        slug: true,
        name: true,
        type: true,
        estimatedDurationMinutes: true,
        // si tu as un champ rounds dans Session, tu peux décommenter :
        // rounds: true,
      },
    });

    return NextResponse.json({ sessions }, { status: 200 });
  } catch (error) {
    console.error("[API sessions/all] error:", error);
    return NextResponse.json(
      { error: "Erreur lors du chargement des séances." },
      { status: 500 }
    );
  }
}
