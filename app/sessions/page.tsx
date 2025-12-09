"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Edit3 } from "lucide-react";
import { demoSessions } from "@/lib/demo-data";
import {
  getSessionDoneToday,
  getLastSessionEntry,
  getSessionsDoneThisWeek,
  type SessionHistoryEntry,
} from "@/lib/history";

type SessionStatus = {
  doneToday: boolean;
  lastEntry?: SessionHistoryEntry;
};

export default function SessionsListPage() {
  const [statusMap, setStatusMap] = useState<Record<string, SessionStatus>>({});
  const [doneThisWeekCount, setDoneThisWeekCount] = useState(0);

  useEffect(() => {
    const map: Record<string, SessionStatus> = {};
    demoSessions.forEach((session) => {
      map[session.id] = {
        doneToday: getSessionDoneToday(session.id),
        lastEntry: getLastSessionEntry(session.id),
      };
    });
    setStatusMap(map);

    const doneIds = getSessionsDoneThisWeek();
    const uniqueKnown = doneIds.filter((id) =>
      demoSessions.some((s) => s.id === id)
    );
    setDoneThisWeekCount(uniqueKnown.length);
  }, []);

  const totalSessions = demoSessions.length;

  return (
    <main className="px-4 pb-4 space-y-5">
      {/* HEADER + RETOUR */}
      <header className="pt-3 space-y-2">
        <div className="flex items-center justify-between">
          <Link
            href="/"
            className="inline-flex items-center gap-1 rounded-full border border-slate-800 bg-slate-950/80 px-3 py-1 text-[11px] text-slate-300 hover:bg-slate-900"
          >
            <span className="text-sm">←</span>
            <span>Retour à Aujourd&apos;hui</span>
          </Link>
        </div>

        <div>
          <p className="text-[11px] uppercase tracking-[0.18em] text-slate-500">
            Séances
          </p>
          <h1 className="mt-1 text-2xl font-semibold text-slate-50">
            Ton programme
          </h1>
          <p className="text-xs text-slate-400">
            {totalSessions} séance
            {totalSessions > 1 ? "s" : ""} dans ce bloc d&apos;entraînement
            {doneThisWeekCount > 0 && (
              <>
                {" "}
                · {doneThisWeekCount} différente
                {doneThisWeekCount > 1 ? "s" : ""} faite
                {doneThisWeekCount > 1 ? "s" : ""} cette semaine
              </>
            )}
          </p>
        </div>
      </header>

      {/* LISTE DES SÉANCES */}
      <section className="space-y-3">
        {demoSessions.map((session) => {
          const status = statusMap[session.id];
          const doneToday = status?.doneToday;
          const lastEntry = status?.lastEntry;

          let badgeText: string | null = null;
          let badgeClasses =
            "inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-medium ";
          if (doneToday) {
            badgeText = "Fait aujourd'hui";
            badgeClasses +=
              "bg-emerald-500/20 text-emerald-100 border border-emerald-500/60";
          } else if (lastEntry) {
            const d = new Date(lastEntry.finishedAt);
            const label = d.toLocaleDateString("fr-FR", {
              weekday: "short",
              day: "2-digit",
              month: "short",
            });
            badgeText = `Dernière fois : ${label}`;
            badgeClasses +=
              "bg-slate-900 text-slate-200 border border-slate-700";
          }

          const typeLabel =
            session.type === "circuit" ? "Circuit" : "Séance classique";

          return (
            <Link
              key={session.id}
              href={`/sessions/${session.slug}`}
              className="block rounded-2xl border border-slate-800 bg-slate-950/80 p-3 hover:bg-slate-900 transition-colors"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="flex-1 space-y-1">
                  <div className="flex items-center gap-2">
                    <h2 className="text-sm font-semibold text-slate-50">
                      {session.name}
                    </h2>
                    {doneToday && (
                      <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
                    )}
                  </div>
                  <p className="text-xs text-slate-400">
                    {typeLabel}
                    {session.estimatedDurationMinutes &&
                      ` · ~${session.estimatedDurationMinutes} min`}
                  </p>
                  {badgeText && (
                    <p className="pt-1">
                      <span className={badgeClasses}>{badgeText}</span>
                    </p>
                  )}
                </div>

                <div className="flex flex-col items-end justify-between">
                  <span className="text-slate-500 text-lg leading-none">
                    ›
                  </span>
                </div>
              </div>
            </Link>
          );
        })}
      </section>

      {/* CARTE EN BAS : PERSONNALISATION DES SÉANCES, STYLE ALIGNÉ AU PLANNING */}
      <section className="mt-2">
        <div className="rounded-3xl border border-slate-800 bg-slate-950/90 px-3 py-3">
          <div className="flex items-center justify-between gap-3">
            <div className="min-w-0 space-y-0.5">
              <p className="text-[10px] uppercase tracking-[0.16em] text-slate-500">
                Personnalisation
              </p>
              <p className="truncate text-sm font-medium text-slate-50">
                Ajuster les exercices des séances
              </p>
            </div>

            <Link
              href="/sessions/manage"
              className="inline-flex items-center gap-1.5 rounded-full border border-sky-500 bg-sky-500/10 px-3 py-1.5 text-[11px] font-medium text-sky-50 hover:bg-sky-500/20"
            >
              <Edit3 className="h-3.5 w-3.5" />
              <span>Personnaliser</span>
            </Link>
          </div>
        </div>
      </section>
    </main>
  );
}
