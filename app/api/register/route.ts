// app/api/register/route.ts
import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { email, password, name } = body ?? {};

    // Validation basique
    if (
      typeof email !== "string" ||
      !email.includes("@") ||
      typeof password !== "string" ||
      password.length < 8
    ) {
      return NextResponse.json(
        { error: "Email ou mot de passe invalide" },
        { status: 400 }
      );
    }

    const existing = await prisma.user.findUnique({
      where: { email },
    });

    if (existing) {
      return NextResponse.json(
        { error: "Un compte existe déjà avec cet email" },
        { status: 400 }
      );
    }

    const passwordHash = await bcrypt.hash(password, 10);

    // 1) Créer le nouvel utilisateur
    const newUser = await prisma.user.create({
      data: {
        email,
        name: name ?? null,
        passwordHash,
      },
    });

    // 2) Onboarding : copier TON planning de base, si dispo
    try {
      // On prend Paul comme "template" de base
      const baseUser = await prisma.user.findUnique({
        where: { email: "paul@example.com" },
        include: {
          weekPlans: {
            include: {
              days: true,
            },
          },
        },
      });

      if (baseUser && baseUser.weekPlans.length > 0) {
        const basePlan = baseUser.weekPlans[0];

        // Créer un WeekPlan pour le nouveau user
        const newPlan = await prisma.weekPlan.create({
          data: {
            name: basePlan.name,
            userId: newUser.id,
          },
        });

        // Copier les jours (en pointant vers les mêmes sessions)
        for (const d of basePlan.days) {
          await prisma.weekDay.create({
            data: {
              weekPlanId: newPlan.id,
              day: d.day,
              isRest: d.isRest,
              warmupMinutes: d.warmupMinutes,
              warmupDescription: d.warmupDescription,
              sessionId: d.sessionId, // on réutilise les mêmes séances
            },
          });
        }
      }
    } catch (copyError) {
      console.error("[API register] Erreur lors de la copie du planning:", copyError);
      // On n'échoue pas l'inscription pour ça, on ignore juste la copie
    }

    return NextResponse.json(
      { ok: true, id: newUser.id },
      { status: 201 }
    );
  } catch (e) {
    console.error("[API register] Erreur:", e);
    return NextResponse.json(
      { error: "Erreur serveur" },
      { status: 500 }
    );
  }
}
