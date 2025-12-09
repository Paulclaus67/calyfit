"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import type { DayName } from "@/lib/types";
import { getSessionDoneToday } from "@/lib/history";
import { CalendarDays, Dumbbell, User } from "lucide-react";

const DAY_LABELS_FR: Record<DayName, string> = {
  monday: "Lundi",
  tuesday: "Mardi",
  wednesday: "Mercredi",
  thursday: "Jeudi",
  friday: "Vendredi",
  saturday: "Samedi",
  sunday: "Dimanche",
};

const DAY_LABELS_SHORT_FR: Record<DayName, string> = {
  monday: "Lun",
  tuesday: "Mar",
  wednesday: "Mer",
  thursday: "Jeu",
  friday: "Ven",
  saturday: "Sam",
  sunday: "Dim",
};

export type HomeSessionItemPreview = {
  id: string;
  order: number;
  exerciseName: string;
  sets: number | null;
  repsType: "reps" | "time";
  repsValue: number | null;
  repsText: string | null;
  restSeconds: number | null;
};

export type HomeSession = {
  id: string;
  slug: string;
  name: string;
  type: "classic" | "circuit";
  estimatedDurationMinutes: number | null;
  itemsPreview: HomeSessionItemPreview[];
};

export type HomeWeekDay = {
  day: DayName;
  hasSession: boolean;
  isRest: boolean;
  sessionId: string | null;
  sessionSlug: string | null;
  sessionName: string | null;
};

export type HomeData = {
  dayName: DayName;
  dateHuman: string;
  isRestDay: boolean;
  warmupMinutes: number | null;
  warmupDescription: string | null;
  session: HomeSession | null;
  weekOverview: HomeWeekDay[];
};

type Props = {
  home: HomeData;
};

type HistoryApiResponse = {
  sessionsDoneThisWeek?: string[];
  sessionsDoneToday?: string[];
};

export default function HomeClient({ home }: Props) {
  const {
    dayName,
    dateHuman,
    isRestDay,
    warmupMinutes,
    warmupDescription,
    session,
    weekOverview,
  } = home;

  const dayNameFr = DAY_LABELS_FR[dayName];

  const warmupText =
    warmupMinutes && warmupDescription
      ? `${warmupMinutes} min · ${warmupDescription}`
      : undefined;

  const [doneToday, setDoneToday] = useState(false);
  const [doneThisWeekIds, setDoneThisWeekIds] = useState<string[]>([]);

  // 1) lecture locale (instantané)
  useEffect(() => {
    if (session) {
      setDoneToday(getSessionDoneToday(session.id));
    } else {
      setDoneToday(false);
    }
  }, [session?.id]);

  // 2) lecture depuis la BDD via /api/history (comme le planning)
  useEffect(() => {
    let cancelled = false;

    async function loadHistoryFromServer() {
      try {
        const res = await fetch("/api/history", { cache: "no-store" });
        if (!res.ok) return;

        const data: HistoryApiResponse = await res.json();
        if (cancelled) return;

        if (Array.isArray(data.sessionsDoneThisWeek)) {
          setDoneThisWeekIds(data.sessionsDoneThisWeek);
        }

        if (session && Array.isArray(data.sessionsDoneToday)) {
          if (data.sessionsDoneToday.includes(session.id)) {
            setDoneToday(true);
          }
        }
      } catch (e) {
        console.error("[Home] Erreur chargement historique", e);
      }
    }

    loadHistoryFromServer();
    return () => {
      cancelled = true;
    };
  }, [session?.id]);

  // ordre L -> D
  const orderedWeek = useMemo(() => {
    const order: DayName[] = [
      "monday",
      "tuesday",
      "wednesday",
      "thursday",
      "friday",
      "saturday",
      "sunday",
    ];
    const byDay = new Map<DayName, HomeWeekDay>();
    weekOverview.forEach((d) => byDay.set(d.day, d));
    return order.map(
      (d) =>
        byDay.get(d) ?? {
          day: d,
          hasSession: false,
          isRest: true,
          sessionId: null,
          sessionSlug: null,
          sessionName: null,
        }
    );
  }, [weekOverview]);

  const plannedTrainingDays = orderedWeek.filter(
    (d) => d.hasSession && !d.isRest
  ).length;

  const doneThisWeekCount = orderedWeek.filter(
    (d) => d.sessionId && doneThisWeekIds.includes(d.sessionId)
  ).length;

  const todayWeekEntry = orderedWeek.find((d) => d.day === dayName);
  const todayHasSession = !!todayWeekEntry?.hasSession && !!session;
  const todayIsRest = isRestDay || !todayHasSession;

  const weekSummaryText =
    plannedTrainingDays > 0
      ? `${doneThisWeekCount} / ${plannedTrainingDays} séance${
          plannedTrainingDays > 1 ? "s" : ""
        } prévues complétées cette semaine`
      : doneThisWeekCount > 0
      ? `${doneThisWeekCount} séance${
          doneThisWeekCount > 1 ? "s" : ""
        } faite${
          doneThisWeekCount > 1 ? "s" : ""
        } cette semaine`
      : "Tu démarres une nouvelle semaine 💪";

  return (
    <main className="px-4 pb-4 space-y-5">
      {/* HEADER */}
      <header className="pt-3 space-y-2">
        <p className="text-[11px] uppercase tracking-[0.18em] text-slate-500">
          Calyfit
        </p>
        <div className="flex items-baseline justify-between gap-3">
          <div>
            <h1 className="text-2xl font-semibold text-slate-50">
              {dayNameFr}
            </h1>
            <p className="text-xs text-slate-400">{dateHuman}</p>
          </div>
          <div className="text-right">
            <span className="inline-flex items-center rounded-full border border-sky-500/40 bg-sky-500/10 px-3 py-1 text-[11px] font-medium text-sky-200">
              Street workout · Outdoor
            </span>
            {plannedTrainingDays > 0 && (
              <p className="mt-1 text-[11px] text-slate-500">
                {weekSummaryText}
              </p>
            )}
          </div>
        </div>
      </header>

      {/* BLOC PRINCIPAL : SÉANCE DU JOUR */}
      <section>
        <div className="relative overflow-hidden rounded-3xl border border-slate-800 bg-gradient-to-br from-slate-900 via-slate-950 to-slate-950 px-4 py-4 shadow-[0_18px_40px_rgba(0,0,0,0.65)]">
          <div className="pointer-events-none absolute -right-10 -top-8 h-40 w-40 rounded-full bg-sky-500/20 blur-3xl" />

          <div className="relative z-10 space-y-3">
            <div className="flex items-start justify-between gap-3">
              <div className="flex-1 space-y-1">
                <p className="text-[11px] font-medium uppercase tracking-[0.16em] text-sky-400">
                  {todayIsRest
                    ? "Aujourd'hui : repos"
                    : doneToday
                    ? "Séance du jour · déjà faite ✅"
                    : "Séance du jour"}
                </p>

                {todayIsRest ? (
                  <>
                    <p className="text-lg font-semibold text-slate-50">
                      Récupération active 😌
                    </p>
                    <p className="text-sm text-slate-300">
                      Marche, mobilité, respiration. Laisse ton corps assimiler
                      le travail de la semaine.
                    </p>
                  </>
                ) : session ? (
                  <>
                    <p className="text-lg font-semibold text-slate-50">
                      {session.name}
                    </p>
                    <p className="text-xs text-slate-400">
                      {session.type === "circuit"
                        ? "Circuit"
                        : "Séance classique"}
                      {session.estimatedDurationMinutes &&
                        ` · ~${session.estimatedDurationMinutes} min`}
                    </p>
                    {warmupText && (
                      <p className="text-[11px] text-slate-400">
                        Échauffement : {warmupText}
                      </p>
                    )}
                  </>
                ) : (
                  <>
                    <p className="text-lg font-semibold text-slate-50">
                      Pas de séance prévue
                    </p>
                    <p className="text-sm text-slate-300">
                      Tu peux ajouter une séance pour aujourd&apos;hui dans ton
                      planning.
                    </p>
                  </>
                )}
              </div>

              {!todayIsRest && session && (
                <div className="flex flex-col items-end text-right">
                  <span className="inline-flex h-10 w-10 items-center justify-center rounded-full bg-sky-500/20 text-xl">
                    💪
                  </span>
                  {doneToday && (
                    <span className="mt-2 rounded-full bg-emerald-500/15 px-2 py-[2px] text-[10px] font-medium text-emerald-200 border border-emerald-500/40">
                      Fait aujourd&apos;hui
                    </span>
                  )}
                </div>
              )}
            </div>

            <Link
              href={
                todayIsRest
                  ? "/planning"
                  : session
                  ? `/sessions/${session.slug}`
                  : "/planning"
              }
              className={
                "mt-1 inline-flex w-full items-center justify-center rounded-xl px-4 py-2.5 text-sm font-semibold transition active:scale-[0.98] " +
                (todayIsRest
                  ? "border border-slate-700 bg-slate-900/80 text-slate-100 hover:bg-slate-800"
                  : "bg-sky-500 text-white shadow-sm hover:bg-sky-400")
              }
            >
              {todayIsRest
                ? "Voir le planning de la semaine"
                : doneToday
                ? "Refaire la séance"
                : "Lancer la séance"}
            </Link>
          </div>
        </div>
      </section>

      {/* PROGRESSION DE LA SEMAINE */}
      <section className="space-y-2">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-semibold text-slate-100">
            Ta semaine
          </h2>
          <Link
            href="/planning"
            className="text-[11px] text-sky-400 underline underline-offset-2"
          >
            Voir le planning
          </Link>
        </div>

        <div className="grid grid-cols-7 gap-1.5 text-center">
          {orderedWeek.map((d) => {
            const isTodayDay = d.day === dayName;
            const isRest = d.isRest || !d.hasSession;
            const isDone =
              !!d.sessionId && doneThisWeekIds.includes(d.sessionId);

            let classes =
              "flex flex-col items-center justify-center rounded-xl border px-1.5 py-1.5 text-[10px] transition-colors";
            let dotClasses = "mt-1 h-1.5 w-1.5 rounded-full";
            let labelClasses = "";

            if (isRest) {
              classes += " border-slate-800 bg-slate-950/80 text-slate-500";
              dotClasses += " bg-slate-700/60";
            } else if (isDone) {
              classes +=
                " border-emerald-500/60 bg-emerald-950/40 text-emerald-100";
              dotClasses += " bg-emerald-400";
            } else if (isTodayDay) {
              classes +=
                " border-sky-500/60 bg-sky-950/40 text-sky-100 shadow-[0_0_0_1px_rgba(56,189,248,0.5)]";
              dotClasses += " bg-sky-400";
            } else {
              classes +=
                " border-slate-800 bg-slate-950/80 text-slate-200";
              dotClasses += " bg-slate-500";
            }

            if (isTodayDay) {
              labelClasses = "font-semibold";
            }

            return (
              <div key={d.day} className={classes}>
                <span className={labelClasses}>
                  {DAY_LABELS_SHORT_FR[d.day]}
                </span>
                <span className={dotClasses} />
              </div>
            );
          })}
        </div>

        <p className="text-[11px] text-slate-400">{weekSummaryText}</p>
      </section>

      {/* ACCÈS RAPIDE */}
      <section className="space-y-2">
        <h2 className="text-sm font-semibold text-slate-100">
          Accès rapide
        </h2>
        <div className="grid grid-cols-3 gap-2">
          {/* même ordre que la BottomNav, sans "Aujourd'hui" */}
          <Link
            href="/planning"
            className="flex flex-col items-center justify-center rounded-2xl border border-slate-800 bg-slate-950/90 px-3 py-2 text-[11px] text-slate-200 hover:bg-slate-900"
          >
            <CalendarDays className="h-5 w-5 mb-1 text-slate-100" />
            <span>Planning</span>
          </Link>
          <Link
            href="/sessions"
            className="flex flex-col items-center justify-center rounded-2xl border border-slate-800 bg-slate-950/90 px-3 py-2 text-[11px] text-slate-200 hover:bg-slate-900"
          >
            <Dumbbell className="h-5 w-5 mb-1 text-slate-100" />
            <span>Séances</span>
          </Link>
          <Link
            href="/profile"
            className="flex flex-col items-center justify-center rounded-2xl border border-slate-800 bg-slate-950/90 px-3 py-2 text-[11px] text-slate-200 hover:bg-slate-900"
          >
            <User className="h-5 w-5 mb-1 text-slate-100" />
            <span>Profil</span>
          </Link>
        </div>
      </section>
    </main>
  );
}
