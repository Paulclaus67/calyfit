// lib/program-import.ts

import type {
  WeekPlan,
  Session,
  SessionExercise,
  DayPlan,
  DayName,
  Exercise,
} from "./types";

type ParseResult = {
  weekPlan: WeekPlan;
  sessions: Session[];
};

const DAY_MAP: Record<string, DayName> = {
  monday: "monday",
  tuesday: "tuesday",
  wednesday: "wednesday",
  thursday: "thursday",
  friday: "friday",
  saturday: "saturday",
  sunday: "sunday",

  // français
  lundi: "monday",
  mardi: "tuesday",
  mercredi: "wednesday",
  jeudi: "thursday",
  vendredi: "friday",
  samedi: "saturday",
  dimanche: "sunday",
};

function normalizeDayToken(token: string): DayName | undefined {
  const key = token.trim().toLowerCase();
  return DAY_MAP[key];
}

function parseWeekLine(line: string): DayPlan | null {
  // Exemple :
  // monday: seance_dos | 10 | Étirements + posture
  const [left, restRaw] = line.split(":", 2);
  if (!restRaw) return null;

  const day = normalizeDayToken(left);
  if (!day) return null;

  const parts = restRaw.split("|").map((p) => p.trim());
  const sessionIdPart = parts[0] ?? "";
  const warmupMinutesPart = parts[1] ?? "";
  const warmupDescriptionPart = parts[2] ?? "";

  const isRestToken = sessionIdPart.toLowerCase() === "rest";
  const isDash = sessionIdPart === "-" || sessionIdPart === "";

  const isRest = isRestToken;
  const sessionId =
    isRest || isDash ? undefined : sessionIdPart.length > 0 ? sessionIdPart : undefined;

  const warmupMinutes =
    warmupMinutesPart && warmupMinutesPart !== "-" && !isRest
      ? Number.parseInt(warmupMinutesPart, 10)
      : undefined;

  const warmupDescription =
    warmupDescriptionPart && warmupDescriptionPart !== "-"
      ? warmupDescriptionPart
      : undefined;

  return {
    day,
    sessionId,
    warmupMinutes,
    warmupDescription,
    isRest,
  };
}

type SessionHeader = {
  id: string;
  name: string;
  type: "classic" | "circuit";
  estimatedDurationMinutes?: number;
};

function parseSessionHeader(line: string): SessionHeader | null {
  // Exemple : [SESSION seance_dos "Séance dos" classic 45]
  const match = line.match(
    /^\[SESSION\s+(\S+)\s+"([^"]+)"\s+(\w+)(?:\s+(\d+))?\]$/i
  );
  if (!match) return null;

  const [, id, name, typeRaw, durationRaw] = match;
  const typeLower = typeRaw.toLowerCase();
  const type = typeLower === "circuit" ? "circuit" : "classic";

  const estimatedDurationMinutes = durationRaw
    ? Number.parseInt(durationRaw, 10)
    : undefined;

  return {
    id,
    name,
    type,
    estimatedDurationMinutes,
  };
}

function parseSessionExerciseLine(
  line: string,
  order: number,
  sessionId: string
): SessionExercise | null {
  // Exemple :
  // 4 x max @ 105 : tractions_pronation | note
  // 5 x 10 @ 60 : releves_genoux_suspendu
  const [mainPart, rightPartRaw] = line.split(":", 2);
  if (!rightPartRaw) return null;

  const [exerciseIdPartRaw, noteRaw] = rightPartRaw.split("|", 2);
  const exerciseId = exerciseIdPartRaw.trim();
  const note = noteRaw ? noteRaw.trim() : undefined;

  const [repsSetsPartRaw, restPartRaw] = mainPart.split("@", 2);
  if (!restPartRaw) return null;

  const restSeconds = Number.parseInt(restPartRaw.trim(), 10);
  const repsSetsPart = repsSetsPartRaw.trim();

  const [setsPartRaw, repsPartRaw] = repsSetsPart.split("x", 2);
  if (!repsPartRaw) return null;

  const sets = Number.parseInt(setsPartRaw.trim(), 10);
  const repsToken = repsPartRaw.trim().toLowerCase();

  const repsValue =
    repsToken === "max"
      ? "max"
      : Number.isNaN(Number.parseInt(repsToken, 10))
      ? "max"
      : Number.parseInt(repsToken, 10);

  const exercise: SessionExercise = {
    id: `${sessionId}_exo_${order}`,
    exerciseId,
    order,
    sets,
    reps: {
      type: "reps",
      value: repsValue,
    },
    restSeconds: Number.isNaN(restSeconds) ? 0 : restSeconds,
    note,
  };

  return exercise;
}

/**
 * Parse un texte de programme au format "CalyLang v1"
 * et renvoie un WeekPlan + les Sessions associées.
 */
export function parseProgramText(text: string): ParseResult {
  const lines = text
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter((l) => l.length > 0 && !l.startsWith("#")); // support commentaires avec '#'

  const days: DayPlan[] = [];
  const sessions: Session[] = [];

  let currentSession: Session | null = null;
  let mode: "none" | "week" | "session" = "none";
  let orderCounter = 1;

  for (const line of lines) {
    if (line === "[WEEK]") {
      // On ferme une éventuelle session précédente
      if (currentSession) {
        sessions.push(currentSession);
        currentSession = null;
      }
      mode = "week";
      continue;
    }

    if (line.startsWith("[SESSION")) {
      // On ferme l'ancienne session, si elle existe
      if (currentSession) {
        sessions.push(currentSession);
      }
      const header = parseSessionHeader(line);
      if (!header) {
        mode = "none";
        continue;
      }

      currentSession = {
        id: header.id,
        name: header.name,
        slug: header.id,
        type: header.type,
        estimatedDurationMinutes: header.estimatedDurationMinutes,
        items: [],
        notes: undefined,
      };
      orderCounter = 1;
      mode = "session";
      continue;
    }

    if (line === "[END]" || line === "END") {
      if (currentSession) {
        sessions.push(currentSession);
        currentSession = null;
      }
      mode = "none";
      continue;
    }

    // Selon le mode :
    if (mode === "week") {
      const dayPlan = parseWeekLine(line);
      if (dayPlan) {
        days.push(dayPlan);
      }
      continue;
    }

    if (mode === "session" && currentSession) {
      const ex = parseSessionExerciseLine(line, orderCounter, currentSession.id);
      if (ex) {
        currentSession.items.push(ex);
        orderCounter += 1;
      }
      continue;
    }

    // mode = "none" ou autre : on ignore la ligne
  }

  // Fin de fichier : on push la session encore ouverte
  if (currentSession) {
    sessions.push(currentSession);
  }

  const weekPlan: WeekPlan = {
    id: "imported_week_plan",
    name: "Programme importé",
    description: "Programme créé à partir d'un texte d'import.",
    days,
  };

  return { weekPlan, sessions };
}

/**
 * Exemple de texte d'import que tu peux utiliser comme base
 */
export const exampleProgramText = `
[WEEK]
monday: seance_dos        | 10 | Étirements + posture générale
tuesday: circuit_pec_triceps | 10 | Mobilité épaules + scapula
wednesday: seance_jambes  | 10 | Mobilité hanches + genoux, petit gainage
thursday: circuit_biceps  | 10 | Posture + mobilisation du haut du dos
friday: routine_pompes    | 10 | Posture épaules + poignets
saturday: -               | -  | Optionnel : mobilité générale ou séance libre
sunday: rest              | -  | Repos complet

[SESSION seance_dos "Séance dos" classic 45]
4 x max @ 105 : tractions_pronation        | Finir certaines séries en négatives
4 x max @ 105 : tractions_australiennes    | Prise plutôt large pour le milieu du dos
5 x 10  @ 105 : releves_genoux_suspendu    | Contrôle la montée et la descente
`;
