"use client";

import { useEffect, useState } from "react";
import { getSessionsDoneThisWeek } from "@/lib/history";
import type { DayName } from "@/lib/types";
import Link from "next/link";

const DAY_LABELS_FR: Record<DayName, string> = {
  monday: "Lundi",
  tuesday: "Mardi",
  wednesday: "Mercredi",
  thursday: "Jeudi",
  friday: "Vendredi",
  saturday: "Samedi",
  sunday: "Dimanche",
};

const DAY_LABELS_SHORT: Record<DayName, string> = {
  monday: "Lun",
  tuesday: "Mar",
  wednesday: "Mer",
  thursday: "Jeu",
  friday: "Ven",
  saturday: "Sam",
  sunday: "Dim",
};

const DAY_ORDER: DayName[] = [
  "monday",
  "tuesday",
  "wednesday",
  "thursday",
  "friday",
  "saturday",
  "sunday",
];

function getTodayDayName(): DayName | null {
  const jsDay = new Date().getDay(); // 0 = Sunday, 1 = Monday, ...
  const map: (DayName | null)[] = [
    "sunday",
    "monday",
    "tuesday",
    "wednesday",
    "thursday",
    "friday",
    "saturday",
  ];
  return map[jsDay] ?? null;
}

type SessionForDay = {
  id: string;
  slug: string;
  name: string;
  type: string;
  estimatedDurationMinutes: number | null;
};

export type WeekPlanClient = {
  name: string;
  days: {
    day: DayName;
    isRest: boolean;
    warmupMinutes: number | null;
    warmupDescription: string | null;
    session: SessionForDay | null;
  }[];
};

type DayView = {
  day: DayName;
  isRest: boolean;
  warmupText?: string;
  session: SessionForDay | null;
};

type Props = {
  weekPlan: WeekPlanClient;
};

export default function PlanningClient({ weekPlan }: Props) {
  const todayName = getTodayDayName();
  const [doneThisWeekIds, setDoneThisWeekIds] = useState<string[]>([]);

    useEffect(() => {
    // 1) d'abord les slugs locaux (réactivité immédiate)
    const localIds = getSessionsDoneThisWeek();
    setDoneThisWeekIds(localIds);

    // 2) puis on synchronise avec la BDD
    void (async () => {
      try {
        const res = await fetch("/api/stats/summary");
        if (!res.ok) return;
        const data = await res.json();
        const dbSlugs: string[] =
          data.week?.sessionsDoneThisWeekSlugs ?? [];
        const merged = Array.from(new Set([...localIds, ...dbSlugs]));
        setDoneThisWeekIds(merged);
      } catch (e) {
        console.error("[Planning] Erreur stats DB:", e);
      }
    })();
  }, []);


  // On force l'ordre lundi -> dimanche et on normalise les données
  const dayViews: DayView[] = DAY_ORDER.map((day) => {
    const d = weekPlan.days.find((x) => x.day === day) ?? null;
    if (!d) {
      return {
        day,
        isRest: true,
        warmupText: undefined,
        session: null,
      };
    }

    const warmupText =
      d.warmupMinutes && d.warmupDescription
        ? `${d.warmupMinutes} min · ${d.warmupDescription}`
        : undefined;

    // règle : si pas de session => repos
    const isRest = d.isRest || !d.session;

    return {
      day,
      isRest,
      warmupText,
      session: d.session,
    };
  });

  const trainingDays = dayViews.filter((d) => !d.isRest && d.session).length;
  const restDays = dayViews.length - trainingDays;

  return (
    <main className="px-4 pb-4 space-y-5">
      {/* HEADER */}
      <header className="pt-3">
        <p className="text-[11px] uppercase tracking-[0.18em] text-slate-500">
          Planning
        </p>
        <h1 className="mt-1 text-2xl font-semibold text-slate-50">
          Semaine type
        </h1>
        <p className="text-xs text-slate-400">
          {trainingDays} jour{trainingDays > 1 ? "s" : ""} d&apos;entraînement ·{" "}
          {restDays} jour{restDays > 1 ? "s" : ""} de repos
        </p>
      </header>

      {/* MINI BARRE DES JOURS */}
      <section>
        <div className="flex justify-between rounded-2xl border border-slate-800 bg-slate-950/80 px-3 py-2 text-center">
          {dayViews.map((d) => {
            const isToday = d.day === todayName;
            const isTraining = !d.isRest && d.session;
            const isDoneThisWeek =
              isTraining &&
              d.session &&
              doneThisWeekIds.includes(d.session.slug);

            let barColor = "bg-slate-700";
            if (isTraining && !isDoneThisWeek) barColor = "bg-sky-500";
            if (isTraining && isDoneThisWeek) barColor = "bg-emerald-500";

            let chipClasses =
              "mb-1 rounded-full px-2 py-0.5 border text-[10px] ";
            if (isToday) {
              chipClasses +=
                "bg-sky-500/20 text-sky-200 border-sky-500/50";
            } else if (isDoneThisWeek) {
              chipClasses +=
                "bg-emerald-500/15 text-emerald-200 border-emerald-500/40";
            } else if (isTraining) {
              chipClasses +=
                "bg-slate-900/80 text-slate-300 border-slate-700";
            } else {
              chipClasses +=
                "bg-slate-950 text-slate-500 border-slate-800";
            }

            return (
              <div
                key={d.day}
                className="flex flex-1 flex-col items-center text-[10px]"
              >
                <span className={chipClasses}>
                  {DAY_LABELS_SHORT[d.day]}
                </span>
                <span className={`h-1.5 w-7 rounded-full ${barColor}`} />
              </div>
            );
          })}
        </div>
      </section>

      {/* LISTE DÉTAILLÉE PAR JOUR */}
      <section className="space-y-3">
        {dayViews.map((d) => {
          const isToday = d.day === todayName;
          const isTraining = !d.isRest && d.session;
          const hasSession = Boolean(d.session);
          const isDoneThisWeek =
            isTraining &&
            d.session &&
            doneThisWeekIds.includes(d.session.slug);

          let containerClasses =
            "flex items-start gap-3 rounded-2xl border px-3 py-3 transition-colors ";
          if (d.isRest) {
            containerClasses += "border-slate-800 bg-slate-950/80";
          } else if (isDoneThisWeek) {
            containerClasses += "border-emerald-600/50 bg-emerald-950/25";
          } else {
            containerClasses += "border-sky-600/40 bg-sky-950/30";
          }

          let dotColor = "bg-slate-500";
          if (isTraining && !isDoneThisWeek) dotColor = "bg-sky-400";
          if (isDoneThisWeek) dotColor = "bg-emerald-400";

          const dotClasses = `mt-1 h-2.5 w-2.5 rounded-full ${dotColor}`;

          let badgeLabel = "Repos";
          let badgeClasses =
            "inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-medium ";
          if (d.isRest) {
            badgeClasses +=
              "bg-slate-900 text-slate-300 border border-slate-700";
          } else if (isDoneThisWeek) {
            badgeLabel = "Fait cette semaine";
            badgeClasses +=
              "bg-emerald-500/20 text-emerald-100 border border-emerald-500/50";
          } else {
            badgeLabel = "Séance";
            badgeClasses +=
              "bg-sky-500/20 text-sky-100 border border-sky-500/50";
          }

          return (
            <article key={d.day} className={containerClasses}>
              {/* Colonne jour */}
              <div className="flex w-16 flex-col items-center">
                <span className="text-[11px] font-medium text-slate-400">
                  {DAY_LABELS_SHORT[d.day]}
                </span>
                <span className={dotClasses} />
                {isToday && (
                  <span className="mt-1 rounded-full bg-sky-500/20 px-2 py-0.5 text-[9px] font-medium text-sky-300">
                    Aujourd&apos;hui
                  </span>
                )}
              </div>

              {/* Contenu jour */}
              <div className="flex-1 space-y-1.5">
                <div className="flex items-center justify-between gap-2">
                  <div>
                    <p className="text-sm font-semibold text-slate-50">
                      {DAY_LABELS_FR[d.day]}
                    </p>
                    {isTraining && hasSession && d.session && (
                      <p className="text-xs text-slate-200">
                        {d.session.name}
                      </p>
                    )}
                    {!isTraining && (
                      <p className="text-xs text-slate-400">
                        Jour de repos
                        {!hasSession
                          ? " (aucune séance prévue)"
                          : ""}
                      </p>
                    )}
                  </div>

                  <div className="text-right">
                    <span className={badgeClasses}>{badgeLabel}</span>
                  </div>
                </div>

                {d.warmupText && (
                  <p className="text-[11px] text-slate-400">
                    Échauffement : {d.warmupText}
                  </p>
                )}

                {isTraining && hasSession && d.session && (
                  <div className="pt-1">
                    <Link
                      href={`/sessions/${d.session.slug}`}
                      className="inline-flex items-center rounded-xl bg-slate-900/80 px-3 py-1.5 text-[11px] font-semibold text-slate-50 hover:bg-slate-800 active:scale-[0.99]"
                    >
                      Ouvrir la séance
                    </Link>
                  </div>
                )}

                {!isTraining && !d.warmupText && (
                  <p className="pt-1 text-[11px] text-slate-500">
                    Tu peux faire un peu de mobilité légère ou simplement te
                    reposer.
                  </p>
                )}
              </div>
            </article>
          );
        })}
      </section>
    </main>
  );
}
