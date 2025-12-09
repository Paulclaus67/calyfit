// lib/history.ts

export type SessionHistoryEntry = {
  id: string;
  // ⚠️ Ici on stocke le slug de la séance (ex: "seance_dos")
  sessionId: string;
  finishedAt: number; // timestamp ms
  durationSeconds: number;
  totalCompletedSets: number;
};

const HISTORY_KEY = "calyfit_history_v1";

function isSameDay(ts: number, refDate: Date = new Date()): boolean {
  const d = new Date(ts);
  return (
    d.getFullYear() === refDate.getFullYear() &&
    d.getMonth() === refDate.getMonth() &&
    d.getDate() === refDate.getDate()
  );
}

function isSameMonth(ts: number, refDate: Date = new Date()): boolean {
  const d = new Date(ts);
  return (
    d.getFullYear() === refDate.getFullYear() &&
    d.getMonth() === refDate.getMonth()
  );
}

function isSameYear(ts: number, refDate: Date = new Date()): boolean {
  const d = new Date(ts);
  return d.getFullYear() === refDate.getFullYear();
}

// Semaine : lundi → dimanche
function weekKeyFor(date: Date): string {
  const d = new Date(date.getFullYear(), date.getMonth(), date.getDate());
  let day = d.getDay();
  if (day === 0) day = 7; // dimanche = 7
  d.setDate(d.getDate() + 1 - day); // aller au lundi
  return `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`;
}

function isSameWeek(ts: number, refDate: Date = new Date()): boolean {
  const d = new Date(ts);
  return weekKeyFor(d) === weekKeyFor(refDate);
}

export function loadHistory(): SessionHistoryEntry[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(HISTORY_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed.filter((e) => e && typeof e.sessionId === "string");
  } catch {
    return [];
  }
}

export function saveHistory(entries: SessionHistoryEntry[]): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(HISTORY_KEY, JSON.stringify(entries));
  } catch {
    // ignore
  }
}

/**
 * Ajoute une entrée d'historique :
 * - toujours dans localStorage
 * - ET tente d'enregistrer en base via l'API /api/history
 *
 * sessionId = slug de la séance (ex: "seance_dos")
 */
export function addHistoryEntry(entry: SessionHistoryEntry): void {
  // 1) LocalStorage (inchangé)
  const entries = loadHistory();
  entries.push(entry);
  saveHistory(entries);

  // 2) Envoi vers l'API pour stocker en BDD
  if (typeof window !== "undefined") {
    console.log("[history] Ajout local + envoi API", entry);

    void (async () => {
      try {
        const res = await fetch("/api/history", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            sessionSlug: entry.sessionId, // ⚠️ ICI : on attend un SLUG
            finishedAt: entry.finishedAt,
            durationSeconds: entry.durationSeconds,
            totalCompletedSets: entry.totalCompletedSets,
          }),
        });

        if (!res.ok) {
          const err = await res.json().catch(() => ({}));
          console.error("[history] API history non OK", res.status, err);
        } else {
          console.log("[history] API history OK");
        }
      } catch (e) {
        console.error("[history] Erreur lors de l'envoi en BDD:", e);
      }
    })();
  }
}


export function getSessionDoneToday(
  sessionId: string,
  refDate: Date = new Date()
): boolean {
  const entries = loadHistory();
  return entries.some(
    (e) => e.sessionId === sessionId && isSameDay(e.finishedAt, refDate)
  );
}

export function getLastSessionEntry(
  sessionId: string
): SessionHistoryEntry | undefined {
  const entries = loadHistory().filter((e) => e.sessionId === sessionId);
  if (!entries.length) return undefined;
  return entries.reduce((a, b) =>
    a.finishedAt > b.finishedAt ? a : b
  );
}

export function getTodayStats(refDate: Date = new Date()): {
  sessionsDoneToday: number;
  totalSetsToday: number;
  totalDurationSecondsToday: number;
} {
  const entries = loadHistory().filter((e) =>
    isSameDay(e.finishedAt, refDate)
  );

  const sessionsDoneToday = entries.length;
  const totalSetsToday = entries.reduce(
    (sum, e) => sum + (e.totalCompletedSets || 0),
    0
  );
  const totalDurationSecondsToday = entries.reduce(
    (sum, e) => sum + (e.durationSeconds || 0),
    0
  );

  return {
    sessionsDoneToday,
    totalSetsToday,
    totalDurationSecondsToday,
  };
}

export function getMonthStats(refDate: Date = new Date()): {
  sessionsDone: number;
  totalSets: number;
  totalDurationSeconds: number;
} {
  const entries = loadHistory().filter((e) =>
    isSameMonth(e.finishedAt, refDate)
  );

  const sessionsDone = entries.length;
  const totalSets = entries.reduce(
    (sum, e) => sum + (e.totalCompletedSets || 0),
    0
  );
  const totalDurationSeconds = entries.reduce(
    (sum, e) => sum + (e.durationSeconds || 0),
    0
  );

  return {
    sessionsDone,
    totalSets,
    totalDurationSeconds,
  };
}

export function getYearStats(refDate: Date = new Date()): {
  sessionsDone: number;
  totalSets: number;
  totalDurationSeconds: number;
} {
  const entries = loadHistory().filter((e) =>
    isSameYear(e.finishedAt, refDate)
  );

  const sessionsDone = entries.length;
  const totalSets = entries.reduce(
    (sum, e) => sum + (e.totalCompletedSets || 0),
    0
  );
  const totalDurationSeconds = entries.reduce(
    (sum, e) => sum + (e.durationSeconds || 0),
    0
  );

  return {
    sessionsDone,
    totalSets,
    totalDurationSeconds,
  };
}

// 🔹 Séances faites cette semaine (en localStorage)
export function getSessionsDoneThisWeek(
  refDate: Date = new Date()
): string[] {
  const entries = loadHistory().filter((e) =>
    isSameWeek(e.finishedAt, refDate)
  );
  const ids = new Set<string>();
  for (const e of entries) {
    ids.add(e.sessionId);
  }
  return Array.from(ids);
}
