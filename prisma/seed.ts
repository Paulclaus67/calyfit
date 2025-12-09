// prisma/seed.ts
import "dotenv/config";
import { prisma } from "../lib/prisma";
import bcrypt from "bcryptjs";
import { demoExercises, demoSessions, demoWeekPlan } from "../lib/demo-data";

async function main() {
  console.log("🔁 Reset des données…");

  await prisma.sessionHistory.deleteMany();
  await prisma.weekDay.deleteMany();
  await prisma.weekPlan.deleteMany();
  await prisma.sessionExercise.deleteMany();
  await prisma.session.deleteMany();
  await prisma.exercise.deleteMany();
  await prisma.user.deleteMany();

  console.log("👤 Création de l'utilisateur Paul…");

  const passwordHash = await bcrypt.hash("calyfit123", 10);

  const user = await prisma.user.create({
    data: {
      email: "paul@example.com",
      name: "Paul",
      passwordHash,
    },
  });

  console.log("🏋️‍♂️ Insertion des exercices…");

  const exerciseIdMap = new Map<string, string>(); // id démo -> id DB

  for (const ex of demoExercises) {
    const created = await prisma.exercise.create({
      data: {
        slug: ex.slug,
        name: ex.name,
        description: ex.description ?? null,
        tags: Array.isArray((ex as any).tags)
          ? (ex as any).tags.join(";")
          : (ex as any).tags ?? null,
      },
    });

    // ex.id = identifiant utilisé dans demoSessions.items.exerciseId
    exerciseIdMap.set(ex.id, created.id);
  }

  console.log("🧩 Insertion des séances…");

  const sessionIdMap = new Map<string, string>(); // id démo -> id DB

  for (const s of demoSessions) {
    const created = await prisma.session.create({
      data: {
        slug: s.slug,
        name: s.name,
        type: s.type, // "classic" | "circuit"
        estimatedDurationMinutes: s.estimatedDurationMinutes ?? null,
        rounds: s.rounds ?? null,
        restBetweenExercisesSeconds: s.restBetweenExercisesSeconds ?? null,
        restBetweenRoundsSeconds: s.restBetweenRoundsSeconds ?? null,
      },
    });

    sessionIdMap.set(s.id, created.id);

    // Items (exos de la séance)
    for (const item of s.items) {
      const exerciseDbId = exerciseIdMap.get(item.exerciseId);
      if (!exerciseDbId) {
        console.warn(
          `⚠️ Impossible de trouver l'exercice ${item.exerciseId} pour la séance ${s.id}`
        );
        continue;
      }

      // on extrait repsValue / repsText à partir de ta structure
      let repsType = item.reps.type; // "reps" | "time"
      let repsValue: number | null = null;
      let repsText: string | null = null;

      if (item.reps.type === "reps") {
        if (typeof item.reps.value === "number") {
          repsValue = item.reps.value;
        } else if (typeof item.reps.value === "string") {
          repsText = item.reps.value; // ex: "max", "5-8", etc.
        }
      } else if (item.reps.type === "time") {
        repsValue = item.reps.seconds ?? null;
      }

      await prisma.sessionExercise.create({
        data: {
          sessionId: created.id,
          exerciseId: exerciseDbId,
          order: item.order,
          sets: item.sets ?? null,
          repsType,
          repsValue,
          repsText,
          restSeconds: item.restSeconds ?? null,
          note: item.note ?? null,
        },
      });
    }
  }

  console.log("🗓️ Insertion du planning hebdo…");

  const weekPlan = await prisma.weekPlan.create({
    data: {
      name: demoWeekPlan.name,
      userId: user.id,
    },
  });

  for (const d of demoWeekPlan.days) {
    const sessionDbId = d.sessionId
      ? sessionIdMap.get(d.sessionId) ?? null
      : null;

    await prisma.weekDay.create({
      data: {
        weekPlanId: weekPlan.id,
        day: d.day,
        isRest: d.isRest,
        warmupMinutes: d.warmupMinutes ?? null,
        warmupDescription: d.warmupDescription ?? null,
        sessionId: sessionDbId,
      },
    });
  }

  console.log("✅ Seed terminé !");
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (e) => {
    console.error("❌ Erreur pendant le seed :", e);
    await prisma.$disconnect();
    process.exit(1);
  });
