// lib/auth-server.ts
import { headers } from "next/headers";
import { prisma } from "./prisma";
import { SignJWT, jwtVerify } from "jose";

export const SESSION_COOKIE_NAME = "calyfit_session";

function getJwtSecret() {
  const secret = process.env.AUTH_SECRET;
  if (!secret) {
    throw new Error("AUTH_SECRET manquant dans l'environnement");
  }
  return new TextEncoder().encode(secret);
}

// Crée un token de session (JWT) avec l'id user
export async function createSessionToken(userId: string) {
  const secret = getJwtSecret();
  const token = await new SignJWT({ userId })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime("30d")
    .sign(secret);
  return token;
}

// Vérifie un token de session
export async function verifySessionToken(token: string) {
  try {
    const secret = getJwtSecret();
    const { payload } = await jwtVerify(token, secret);
    return payload as { userId?: string; iat?: number; exp?: number };
  } catch {
    return null;
  }
}

// Petit helper pour récupérer une valeur de cookie dans un header brut
function getCookieValueFromHeader(
  header: string | null,
  name: string
): string | null {
  if (!header) return null;
  const parts = header.split(";").map((p) => p.trim());
  const prefix = name + "=";
  const match = parts.find((p) => p.startsWith(prefix));
  if (!match) return null;
  return decodeURIComponent(match.substring(prefix.length));
}

// À utiliser dans les Server Components / routes API (lecture)
export async function getCurrentUser() {
  // ⬇⬇⬇ ICI on ajoute le await ⬇⬇⬇
  const headerStore = await headers();
  const cookieHeader = headerStore.get("cookie");
  const token = getCookieValueFromHeader(cookieHeader, SESSION_COOKIE_NAME);
  if (!token) return null;

  const payload = await verifySessionToken(token);
  if (!payload?.userId) return null;

  const user = await prisma.user.findUnique({
    where: { id: payload.userId },
  });

  return user;
}
