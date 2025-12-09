import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// Ordre des onglets muscles
const ORDERED_GROUPS = [
  "Dos",
  "Pecs",
  "Épaules",
  "Biceps",
  "Triceps",
  "Jambes",
  "Abdos / Core",
  "Full body",
  "Autres",
];

// essaie de deviner le groupe musculaire à partir du nom
function inferMuscleGroupFromName(name: string): string | null {
  const n = name.toLowerCase();

  if (
    n.includes("traction") ||
    n.includes("pull-up") ||
    n.includes("row") ||
    n.includes("australienne")
  ) {
    return "Dos";
  }

  if (
    n.includes("pompe") ||
    n.includes("push-up") ||
    n.includes("dips") ||
    n.includes("dip")
  ) {
    return "Pecs";
  }

  if (
    n.includes("épaules") ||
    n.includes("epaules") ||
    n.includes("shoulder") ||
    n.includes("handstand")
  ) {
    return "Épaules";
  }

  if (n.includes("biceps") || n.includes("curl")) {
    return "Biceps";
  }

  if (n.includes("triceps")) {
    return "Triceps";
  }

  if (
    n.includes("squat") ||
    n.includes("fente") ||
    n.includes("pistol") ||
    n.includes("jambe")
  ) {
    return "Jambes";
  }

  if (
    n.includes("gainage") ||
    n.includes("planche") ||
    n.includes("abdo") ||
    n.includes("crunch") ||
    n.includes("relevé de genoux") ||
    n.includes("releve de genoux")
  ) {
    return "Abdos / Core";
  }

  if (n.includes("full") || n.includes("circuit")) {
    return "Full body";
  }

  return null;
}

export async function GET() {
  try {
    const exercises = await prisma.exercise.findMany({
      orderBy: [{ name: "asc" }],
    });

    // 1) On classe chaque exo dans un groupe normalisé
    const rawGroups: Record<
      string,
      { id: string; name: string; muscleGroup: string }[]
    > = {};

    for (const ex of exercises) {
      const fromDb = ex.muscleGroup?.trim();
      const inferred = inferMuscleGroupFromName(ex.name);

      const group =
        fromDb && fromDb.length > 0
          ? fromDb
          : inferred
          ? inferred
          : "Autres";

      if (!rawGroups[group]) {
        rawGroups[group] = [];
      }
      rawGroups[group].push({
        id: ex.id,
        name: ex.name,
        muscleGroup: group,
      });
    }

    // 2) On renvoie les groupes dans un ordre propre (Dos, Pecs, Jambes, etc.)
    const orderedGroups: Record<
      string,
      { id: string; name: string; muscleGroup: string }[]
    > = {};

    for (const g of ORDERED_GROUPS) {
      if (rawGroups[g] && rawGroups[g].length > 0) {
        orderedGroups[g] = rawGroups[g];
      }
    }

    // Au cas où il y aurait des groupes exotiques qu'on n'a pas dans ORDERED_GROUPS
    for (const g of Object.keys(rawGroups)) {
      if (!orderedGroups[g]) {
        orderedGroups[g] = rawGroups[g];
      }
    }

    return NextResponse.json({ groups: orderedGroups });
  } catch (e) {
    console.error("[API exercises/by-muscle] Erreur:", e);
    return NextResponse.json(
      { error: "Erreur serveur" },
      { status: 500 }
    );
  }
}
