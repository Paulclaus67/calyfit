"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { demoSessions, demoExercises } from "@/lib/demo-data";
import type { Session, SessionExercise } from "@/lib/types";
import {
  getLastSessionEntry,
  getSessionDoneToday,
} from "@/lib/history";

type Props = {
  sessionId: string;
};

type SessionMeta = {
  doneToday: boolean;
  lastLabel?: string;
};

function formatReps(item: SessionExercise, session: Session): string {
  if (item.reps.type === "reps") {
    const reps =
      typeof item.reps.value === "number"
        ? `${item.reps.value} reps`
        : `${item.reps.value}`;
    if (session.type === "classic") {
      const sets = item.sets ?? 1;
      return `${sets} × ${reps}`;
    }
    return reps;
  } else {
    const seconds = item.reps.seconds;
    if (session.type === "classic") {
      const sets = item.sets ?? 1;
      return `${sets} × ${seconds}s`;
    }
    return `${seconds}s`;
  }
}

function formatRest(seconds?: number): string {
  const s = seconds ?? 0;
  if (s === 0) return "pas de repos";
  if (s < 60) return `${s}s`;
  const m = Math.floor(s / 60);
  const rem = s % 60;
  if (rem === 0) return `${m} min`;
  return `${m} min ${rem}s`;
}

export function SessionDetail({ sessionId }: Props) {
  const session = demoSessions.find((s) => s.id === sessionId);

  const [meta, setMeta] = useState<SessionMeta>({
    doneToday: false,
  });

  useEffect(() => {
    if (!session) return;
    const done = getSessionDoneToday(session.id);
    const last = getLastSessionEntry(session.id);
    let lastLabel: string | undefined = undefined;
    if (last) {
      const d = new Date(last.finishedAt);
      lastLabel = d.toLocaleDateString("fr-FR", {
        weekday: "short",
        day: "2-digit",
        month: "short",
      });
    }
    setMeta({
      doneToday: done,
      lastLabel,
    });
  }, [session]);

  if (!session) {
    return (
      <main className="px-4 pb-4">
        <header className="pt-3 mb-3">
          <Link
            href="/sessions"
            className="inline-flex items-center gap-1 rounded-full border border-slate-800 bg-slate-950/80 px-3 py-1 text-[11px] text-slate-300 hover:bg-slate-900"
          >
            <span className="text-sm">←</span>
            <span>Retour aux séances</span>
          </Link>
        </header>
        <section className="rounded-2xl border border-red-900 bg-red-950/40 p-4">
          <h1 className="text-lg font-semibold mb-1">Séance introuvable</h1>
          <p className="text-sm text-red-100">
            Impossible de trouver cette séance. Retourne à la liste des séances.
          </p>
        </section>
      </main>
    );
  }

  const typeLabel =
    session.type === "circuit" ? "Circuit" : "Séance classique";

  let statusText = "Jamais effectuée";
  let statusColor = "text-slate-400";
  if (meta.doneToday) {
    statusText = "Séance effectuée aujourd'hui ✅";
    statusColor = "text-emerald-400";
  } else if (meta.lastLabel) {
    statusText = `Dernière fois : ${meta.lastLabel}`;
    statusColor = "text-slate-300";
  }

  return (
    <main className="px-4 pb-4 space-y-4">
      {/* HEADER + RETOUR */}
      <header className="pt-3 space-y-3">
        <div>
          <Link
            href="/sessions"
            className="inline-flex items-center gap-1 rounded-full border border-slate-800 bg-slate-950/80 px-3 py-1 text-[11px] text-slate-300 hover:bg-slate-900"
          >
            <span className="text-sm">←</span>
            <span>Retour aux séances</span>
          </Link>
        </div>

        <div className="space-y-1">
          <p className="text-[11px] uppercase tracking-[0.18em] text-slate-500">
            Séance
          </p>
          <h1 className="text-2xl font-semibold text-slate-50">
            {session.name}
          </h1>
          <p className="text-xs text-slate-400">
            {typeLabel}
            {session.estimatedDurationMinutes &&
              ` · ~${session.estimatedDurationMinutes} min`}
          </p>
          <p className={`text-[11px] ${statusColor}`}>{statusText}</p>
        </div>

        <div className="flex gap-2">
          <Link
            href={`/sessions/${session.slug}/run`}
            className="inline-flex flex-1 items-center justify-center rounded-xl bg-sky-500 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-sky-400 active:scale-[0.99]"
          >
            Démarrer la séance
          </Link>
        </div>
      </header>

      {/* LISTE DES EXOS */}
      <section className="space-y-2">
        <h2 className="text-sm font-semibold text-slate-100">
          Exercices de la séance
        </h2>
        <ul className="space-y-2">
          {session.items.map((item) => {
            const exo = demoExercises.find((e) => e.id === item.exerciseId);
            const repsLabel = formatReps(item, session);
            const restLabel = formatRest(item.restSeconds);

            return (
              <li
                key={item.id}
                className="flex items-start justify-between rounded-2xl border border-slate-800 bg-slate-950/80 px-3 py-2"
              >
                <div className="flex-1 pr-2">
                  <div className="flex items-center gap-2">
                    <span className="inline-flex h-6 w-6 items-center justify-center rounded-full bg-slate-900 text-[11px] text-slate-300">
                      {item.order}
                    </span>
                    <div>
                      <p className="text-sm font-medium text-slate-50">
                        {exo?.name ?? item.exerciseId}
                      </p>
                      <p className="text-[11px] text-slate-400">
                        {repsLabel}
                      </p>
                    </div>
                  </div>
                  {item.note && (
                    <p className="mt-1 text-[11px] text-slate-500 italic">
                      {item.note}
                    </p>
                  )}
                  {exo?.description && (
                    <p className="mt-1 text-[11px] text-slate-500">
                      {exo.description}
                    </p>
                  )}
                </div>
                <div className="text-right">
                  <p className="text-[11px] text-slate-400">
                    Repos {restLabel}
                  </p>
                </div>
              </li>
            );
          })}
        </ul>
      </section>

      {/* FOOTER / CTA SECONDAIRE */}
      <section>
        <Link
          href="/planning"
          className="block rounded-2xl border border-slate-800 bg-slate-950/80 px-3 py-3 text-[11px] text-slate-300 hover:bg-slate-900"
        >
          Voir cette séance dans le planning →
        </Link>
      </section>
    </main>
  );
}
