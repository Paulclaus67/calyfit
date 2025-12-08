// lib/history.ts

export type SessionHistoryEntry = {
  id: string;
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
  // on recule jusqu'au lundi
  d.setDate(d.getDate() + 1 - day);
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

export function addHistoryEntry(entry: SessionHistoryEntry): void {
  const entries = loadHistory();
  entries.push(entry);
  saveHistory(entries);
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

// 🔹 nouvelles stats : quelles séances ont été faites cette semaine ?
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
