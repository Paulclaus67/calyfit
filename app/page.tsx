"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { demoWeekPlan, demoExercises } from "@/lib/demo-data";
import { getDayPlanForDate, getSessionForDayPlan } from "@/lib/week-utils";
import { getMonthStats, getYearStats } from "@/lib/history";

const DAY_LABELS_FR: Record<string, string> = {
  monday: "Lundi",
  tuesday: "Mardi",
  wednesday: "Mercredi",
  thursday: "Jeudi",
  friday: "Vendredi",
  saturday: "Samedi",
  sunday: "Dimanche",
};

type Stats = {
  sessionsDone: number;
  totalSets: number;
  totalDurationSeconds: number;
};

function formatDuration(seconds: number): string {
  if (seconds === 0) return "—";
  const minutes = Math.floor(seconds / 60);
  const s = seconds % 60;
  if (minutes === 0) return `${s}s`;
  if (minutes < 60) return `${minutes} min`;
  const hours = Math.floor(minutes / 60);
  const remMin = minutes % 60;
  return `${hours}h${remMin > 0 ? ` ${remMin}min` : ""}`;
}

export default function HomePage() {
  const today = new Date();

  const dayPlan = getDayPlanForDate(demoWeekPlan, today);
  const session = getSessionForDayPlan(dayPlan);

  const dayNameFr = dayPlan
    ? DAY_LABELS_FR[dayPlan.day]
    : today.toLocaleDateString("fr-FR", { weekday: "long" });

  const dateHuman = today.toLocaleDateString("fr-FR", {
    day: "numeric",
    month: "long",
  });

  const warmupText =
    dayPlan?.warmupMinutes && dayPlan?.warmupDescription
      ? `${dayPlan.warmupMinutes} min · ${dayPlan.warmupDescription}`
      : undefined;

  const [monthStats, setMonthStats] = useState<Stats>({
    sessionsDone: 0,
    totalSets: 0,
    totalDurationSeconds: 0,
  });

  const [yearStats, setYearStats] = useState<Stats>({
    sessionsDone: 0,
    totalSets: 0,
    totalDurationSeconds: 0,
  });

  useEffect(() => {
    const m = getMonthStats();
    const y = getYearStats();
    setMonthStats(m);
    setYearStats(y);
  }, []);

  const monthName = today.toLocaleDateString("fr-FR", {
    month: "long",
    year: "numeric",
  });
  const yearLabel = today.getFullYear();

  const hasAnySession = monthStats.sessionsDone > 0 || yearStats.sessionsDone > 0;

  const motivationMessage =
    monthStats.sessionsDone === 0
      ? "Commence ton premier entraînement du mois 💪"
      : monthStats.sessionsDone < 8
      ? "Tu es en train de construire une vraie habitude, continue."
      : "Tu es régulier, ton toi du futur te dira merci.";

  return (
    <main className="px-4 pb-4 space-y-5">
      {/* HEADER APP */}
      <header className="pt-3">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-[11px] uppercase tracking-[0.18em] text-slate-500">
              Calyfit
            </p>
            <h1 className="mt-1 text-2xl font-semibold text-slate-50">
              {dayNameFr}
            </h1>
            <p className="text-xs text-slate-400">{dateHuman}</p>
          </div>
          <div className="flex flex-col items-end text-right">
            <span className="rounded-full bg-sky-500/15 px-3 py-1 text-[11px] font-medium text-sky-300 border border-sky-500/30">
              Calisthénie · Outdoor
            </span>
            {hasAnySession && (
              <p className="mt-1 text-[11px] text-slate-500">
                {monthStats.sessionsDone} séance
                {monthStats.sessionsDone > 1 ? "s" : ""} ce mois-ci
              </p>
            )}
          </div>
        </div>
      </header>

      {/* SÉANCE DU JOUR */}
      <section>
        <div className="relative overflow-hidden rounded-2xl border border-slate-800 bg-gradient-to-br from-slate-900 via-slate-950 to-slate-950 px-4 py-4 shadow-sm">
          <div className="pointer-events-none absolute -right-6 -top-6 h-24 w-24 rounded-full bg-sky-500/15 blur-3xl" />
          <div className="flex items-start justify-between gap-3">
            <div className="relative z-10 flex-1">
              <p className="text-[11px] font-medium uppercase tracking-wide text-sky-400">
                {dayPlan?.isRest ? "Jour de repos" : "Séance du jour"}
              </p>

              {dayPlan?.isRest ? (
                <>
                  <p className="mt-1 text-lg font-semibold text-slate-50">
                    Récupération active 😌
                  </p>
                  <p className="mt-1 text-sm text-slate-300">
                    Mobilité légère, respiration, marche tranquille. Laisse ton
                    corps assimiler le travail.
                  </p>
                </>
              ) : session ? (
                <>
                  <p className="mt-1 text-lg font-semibold text-slate-50">
                    {session.name}
                  </p>
                  <p className="mt-1 text-xs text-slate-400">
                    {session.type === "circuit" ? "Circuit" : "Séance classique"}
                    {session.estimatedDurationMinutes &&
                      ` · ~${session.estimatedDurationMinutes} min`}
                  </p>
                  {warmupText && (
                    <p className="mt-2 text-[11px] text-slate-400">
                      Échauffement : {warmupText}
                    </p>
                  )}
                </>
              ) : (
                <>
                  <p className="mt-1 text-lg font-semibold text-slate-50">
                    Pas de séance prévue
                  </p>
                  <p className="mt-1 text-sm text-slate-300">
                    Tu peux ajouter une séance dans le planning pour cette
                    journée.
                  </p>
                </>
              )}
            </div>

            {!dayPlan?.isRest && session && (
              <div className="relative z-10 flex flex-col items-end text-right">
                <span className="inline-flex h-9 w-9 items-center justify-center rounded-full bg-sky-500/20 text-lg">
                  💪
                </span>
              </div>
            )}
          </div>

          {!dayPlan?.isRest && session && (
            <Link
              href={`/sessions/${session.slug}`}
              className="relative z-10 mt-4 inline-flex w-full items-center justify-center rounded-xl bg-sky-500 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-sky-400 active:scale-[0.99] transition"
            >
              Lancer la séance
            </Link>
          )}

          {dayPlan?.isRest && (
            <Link
              href="/planning"
              className="relative z-10 mt-4 inline-flex w-full items-center justify-center rounded-xl border border-slate-700 bg-slate-900/70 px-4 py-2 text-xs font-medium text-slate-100 hover:bg-slate-800 active:scale-[0.99] transition"
            >
              Voir le planning de la semaine
            </Link>
          )}
        </div>
      </section>

      {/* BLOC STATS GLOBAL (MOIS & ANNÉE) */}
      <section className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-semibold text-slate-100">
            Progression
          </h2>
          <p className="text-[11px] text-slate-500">{motivationMessage}</p>
        </div>

        {/* Carte mois */}
        <div className="rounded-2xl border border-slate-800 bg-slate-950/90 p-3">
          <div className="flex items-center justify-between">
            <p className="text-[11px] uppercase tracking-wide text-slate-400">
              Ce mois-ci
            </p>
            <p className="text-[11px] text-slate-500">{monthName}</p>
          </div>
          <div className="mt-2 grid grid-cols-3 gap-2 text-center">
            <div className="rounded-xl bg-slate-900/80 px-2 py-2">
              <p className="text-[11px] text-slate-400">Séances</p>
              <p className="mt-0.5 text-lg font-semibold text-slate-50">
                {monthStats.sessionsDone}
              </p>
            </div>
            <div className="rounded-xl bg-slate-900/80 px-2 py-2">
              <p className="text-[11px] text-slate-400">Séries / blocs</p>
              <p className="mt-0.5 text-lg font-semibold text-slate-50">
                {monthStats.totalSets}
              </p>
            </div>
            <div className="rounded-xl bg-slate-900/80 px-2 py-2">
              <p className="text-[11px] text-slate-400">Temps actif</p>
              <p className="mt-0.5 text-xs font-semibold text-slate-50">
                {formatDuration(monthStats.totalDurationSeconds)}
              </p>
            </div>
          </div>
        </div>

        {/* Bande année */}
        <div className="flex items-center justify-between rounded-2xl border border-slate-850 bg-slate-950/80 px-3 py-2">
          <div>
            <p className="text-[11px] uppercase tracking-wide text-slate-500">
              Cette année · {yearLabel}
            </p>
            <p className="mt-0.5 text-xs text-slate-400">
              {yearStats.sessionsDone} séance
              {yearStats.sessionsDone > 1 ? "s" : ""} complétée
              {yearStats.sessionsDone > 1 ? "s" : ""} ·{" "}
              {formatDuration(yearStats.totalDurationSeconds)} d&apos;effort
            </p>
          </div>
          <span className="text-lg">📈</span>
        </div>
      </section>

      {/* FOCUS DU JOUR / APERÇU EXOS */}
      {session && !dayPlan?.isRest && (
        <section className="space-y-2">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-semibold text-slate-100">
              Focus de la séance
            </h2>
            <Link
              href={`/sessions/${session.slug}`}
              className="text-[11px] text-sky-400 underline underline-offset-2"
            >
              Voir le détail
            </Link>
          </div>

          <ul className="space-y-2">
            {session.items.slice(0, 3).map((item) => {
              const exo = demoExercises.find((e) => e.id === item.exerciseId);
              const labelReps =
                item.reps.type === "reps"
                  ? `${item.reps.value} reps`
                  : `${item.reps.seconds}s`;

              return (
                <li
                  key={item.id}
                  className="flex items-center justify-between rounded-2xl border border-slate-800 bg-slate-950/80 px-3 py-2"
                >
                  <div className="flex-1">
                    <p className="text-sm font-medium text-slate-50">
                      {exo?.name ?? item.exerciseId}
                    </p>
                    <p className="mt-0.5 text-[11px] text-slate-400">
                      {session.type === "classic"
                        ? `${item.sets} séries · ${labelReps}`
                        : labelReps}
                    </p>
                  </div>
                  <div className="ml-2 text-right">
                    <p className="text-[10px] text-slate-500">
                      Repos {Math.round((item.restSeconds ?? 0) / 60)} min
                    </p>
                    <p className="mt-0.5 text-[10px] text-slate-500">
                      Exo {item.order}
                    </p>
                  </div>
                </li>
              );
            })}
          </ul>
        </section>
      )}

      {/* LIEN PLANNING */}
      <section>
        <Link
          href="/planning"
          className="block rounded-2xl border border-slate-800 bg-slate-950/80 px-3 py-3 text-xs text-slate-300 hover:bg-slate-900 transition"
        >
          Voir le planning de la semaine →
        </Link>
      </section>
    </main>
  );
}
