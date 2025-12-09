// app/api/logout/route.ts
import { NextResponse } from "next/server";
import { SESSION_COOKIE_NAME } from "@/lib/auth-server";

export async function POST() {
  try {
    const res = NextResponse.json({ ok: true });

    // On "écrase" le cookie avec maxAge = 0
    res.cookies.set(SESSION_COOKIE_NAME, "", {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: 0,
    });

    return res;
  } catch (e) {
    console.error("[API logout] Erreur:", e);
    return NextResponse.json(
      { error: "Erreur serveur" },
      { status: 500 }
    );
  }
}
