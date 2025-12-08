"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { demoWeekPlan, demoSessions } from "@/lib/demo-data";
import type { DayName, DayPlan } from "@/lib/types";
import { getSessionsDoneThisWeek } from "@/lib/history";

const DAY_ORDER: DayName[] = [
  "monday",
  "tuesday",
  "wednesday",
  "thursday",
  "friday",
  "saturday",
  "sunday",
];

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

type DayView = {
  day: DayName;
  plan: DayPlan | null;
  isRest: boolean;
  sessionId?: string;
  sessionName?: string;
  sessionSlug?: string;
  warmupText?: string;
};

export default function PlanningPage() {
  const todayName = getTodayDayName();
  const [doneThisWeekIds, setDoneThisWeekIds] = useState<string[]>([]);

  useEffect(() => {
    const ids = getSessionsDoneThisWeek();
    setDoneThisWeekIds(ids);
  }, []);

  // On reconstruit une vue propre de la semaine
  const daysMap = new Map<DayName, DayPlan>();
  for (const d of demoWeekPlan.days) {
    daysMap.set(d.day, d);
  }

  const dayViews: DayView[] = DAY_ORDER.map((day) => {
    const plan = daysMap.get(day) ?? null;

    const hasSession = !!plan?.sessionId;
    const session = hasSession
      ? demoSessions.find((s) => s.id === plan!.sessionId)
      : undefined;

    // 🔴 règle importante : si pas de session => jour de repos
    const isRest = Boolean(plan?.isRest) || !hasSession;

    const warmupText =
      plan && plan.warmupMinutes && plan.warmupDescription
        ? `${plan.warmupMinutes} min · ${plan.warmupDescription}`
        : undefined;

    return {
      day,
      plan,
      isRest,
      sessionId: session?.id,
      sessionName: session?.name,
      sessionSlug: session?.slug,
      warmupText,
    };
  });

  const trainingDays = dayViews.filter((d) => !d.isRest).length;
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

      {/* MINI BARRE DES JOURS (vue globale) */}
      <section>
        <div className="flex justify-between rounded-2xl border border-slate-800 bg-slate-950/80 px-3 py-2 text-center">
          {dayViews.map((d) => {
            const isToday = d.day === todayName;
            const isTraining = !d.isRest;
            const isDoneThisWeek =
              isTraining &&
              d.sessionId &&
              doneThisWeekIds.includes(d.sessionId);

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
          const isTraining = !d.isRest;
          const hasSession = Boolean(d.sessionSlug);
          const isDoneThisWeek =
            isTraining &&
            d.sessionId &&
            doneThisWeekIds.includes(d.sessionId);

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
                    {isTraining && hasSession && (
                      <p className="text-xs text-slate-200">
                        {d.sessionName}
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

                  {/* Badge type */}
                  <div className="text-right">
                    <span className={badgeClasses}>{badgeLabel}</span>
                  </div>
                </div>

                {/* Échauffement / description */}
                {d.warmupText && (
                  <p className="text-[11px] text-slate-400">
                    Échauffement : {d.warmupText}
                  </p>
                )}

                {/* Lien vers séance si entraînement */}
                {isTraining && hasSession && (
                  <div className="pt-1">
                    <Link
                      href={`/sessions/${d.sessionSlug}`}
                      className="inline-flex items-center rounded-xl bg-slate-900/80 px-3 py-1.5 text-[11px] font-semibold text-slate-50 hover:bg-slate-800 active:scale-[0.99]"
                    >
                      Ouvrir la séance
                    </Link>
                  </div>
                )}

                {/* Petit texte si repos sans échauffement */}
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
