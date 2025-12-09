"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { CheckCircle2 } from "lucide-react";

type RunnerExercise = {
  id: string;
  name: string;
  muscleGroup?: string | null;
  sets: number;
  reps: string;
  restSeconds: number | null;
};

type RunnerSession = {
  id: string;
  name: string;
  type: "classic" | "circuit";
  rounds?: number | null;
  estimatedDurationMinutes?: number | null;
  items: RunnerExercise[];
};

type SessionRunnerProps = {
  session: RunnerSession;
  onFinish?: (stats: {
    totalSets: number;
    totalExercises: number;
    totalRounds: number;
    elapsedSeconds: number;
  }) => void | Promise<void>;
};

type PositionState = {
  round: number; // 0-based
  exercise: number; // 0-based
  set: number; // 0-based
  finished: boolean;
};

type Phase = "idle" | "countdown" | "running" | "paused" | "finished";

const BEEP_PATH = "/sounds/beep.mp3";

function playBeep() {
  try {
    const audio = new Audio(BEEP_PATH);
    void audio.play();
  } catch {
    // pas grave si le son ne se joue pas
  }
}

export default function SessionRunner({ session, onFinish }: SessionRunnerProps) {
  const router = useRouter();

  const totalRounds = session.type === "circuit" ? session.rounds ?? 1 : 1;
  const totalExercises = session.items.length;

  const totalPlannedSets = useMemo(() => {
    const baseSets = session.items.reduce((sum, ex) => sum + ex.sets, 0);
    return baseSets * totalRounds;
  }, [session, totalRounds]);

  const [position, setPosition] = useState<PositionState>({
    round: 0,
    exercise: 0,
    set: 0,
    finished: false,
  });

  const [phase, setPhase] = useState<Phase>("idle");
  const [countdown, setCountdown] = useState<number | null>(null);
  const [elapsedSeconds, setElapsedSeconds] = useState(0);

  const isRunning = phase === "running";

  // chrono global
  useEffect(() => {
    if (!isRunning) return;
    const id = setInterval(() => {
      setElapsedSeconds((s) => s + 1);
    }, 1000);
    return () => clearInterval(id);
  }, [isRunning]);

  // compte à rebours 3-2-1
  useEffect(() => {
    if (phase !== "countdown" || countdown === null) return;

    if (countdown <= 0) {
      // fin du compte à rebours → démarrer
      playBeep();
      setCountdown(null);
      setPhase("running");
      return;
    }

    const id = setTimeout(() => {
      setCountdown((c) => (c === null ? null : c - 1));
    }, 1000);

    return () => clearTimeout(id);
  }, [phase, countdown]);

  // appel onFinish quand tout est terminé
  useEffect(() => {
    if (!position.finished || !onFinish) return;

    setPhase("finished");

    const stats = {
      totalSets: totalPlannedSets,
      totalExercises,
      totalRounds,
      elapsedSeconds,
    };

    void onFinish(stats);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [position.finished]);

  const currentExercise = session.items[position.exercise];

  const percentDone = useMemo(() => {
    if (!totalPlannedSets) return 0;

    const setsPerRound = session.items.reduce((sum, ex) => sum + ex.sets, 0);

    const setsDonePreviousRounds = position.round * setsPerRound;
    const setsDonePreviousExercises = session.items
      .slice(0, position.exercise)
      .reduce((sum, ex) => sum + ex.sets, 0);

    const setsDoneCurrentExercise = position.set;
    const raw =
      setsDonePreviousRounds +
      setsDonePreviousExercises +
      setsDoneCurrentExercise;

    const clamped = Math.min(raw, totalPlannedSets);
    return Math.round((clamped / totalPlannedSets) * 100);
  }, [position, session.items, totalPlannedSets]);

  function formatTime(sec: number) {
    const m = Math.floor(sec / 60);
    const s = sec % 60;
    return `${m.toString().padStart(2, "0")}:${s
      .toString()
      .padStart(2, "0")}`;
  }

  function resetSession() {
    setPosition({ round: 0, exercise: 0, set: 0, finished: false });
    setElapsedSeconds(0);
    setPhase("idle");
    setCountdown(null);
  }

  function startWithCountdown() {
    if (position.finished) {
      resetSession();
    }
    setCountdown(3);
    setPhase("countdown");
  }

  function pauseSession() {
    if (phase === "running") {
      setPhase("paused");
    }
  }

  function handleNextSet() {
    if (position.finished || !session.items.length) return;

    setPosition((prev) => {
      const exCount = session.items.length;
      const ex = session.items[prev.exercise];

      const lastSetForExercise = prev.set + 1 >= ex.sets;
      const lastExercise = prev.exercise + 1 >= exCount;
      const lastRound = prev.round + 1 >= totalRounds;

      if (!lastSetForExercise) {
        return { ...prev, set: prev.set + 1 };
      }

      if (!lastExercise) {
        return { ...prev, exercise: prev.exercise + 1, set: 0 };
      }

      if (!lastRound) {
        return { round: prev.round + 1, exercise: 0, set: 0, finished: false };
      }

      return { ...prev, finished: true };
    });
  }

  function handleBeepRest() {
    playBeep();
  }

  function handleBack() {
    router.back();
  }

  const roundLabel =
    totalRounds > 1
      ? `Tour ${position.round + 1}/${totalRounds}`
      : "Séance";
  const setLabel =
    currentExercise?.sets != null
      ? `${position.set + 1}/${currentExercise.sets}`
      : `${position.set + 1}`;
  const finished = phase === "finished" || position.finished;

  const showCountdownOverlay = phase === "countdown" && countdown !== null;

  return (
    // FULLSCREEN overlay au-dessus de toute l’app (navbar incluse)
    <div className="fixed inset-0 z-40 flex flex-col bg-gradient-to-b from-slate-950 via-slate-950 to-black px-4 pb-4 pt-3">
      {/* HEADER */}
      <header className="mb-3 flex items-center justify-between">
        <button
          type="button"
          onClick={handleBack}
          className="inline-flex items-center gap-1 rounded-full border border-slate-800 bg-slate-950/80 px-3 py-1 text-[11px] text-slate-300 hover:bg-slate-900"
        >
          <span className="text-sm">←</span>
          <span>Retour</span>
        </button>

        <div className="text-right">
          <p className="text-[11px] uppercase tracking-[0.18em] text-slate-500">
            Entraînement
          </p>
          <p className="text-[13px] font-semibold text-slate-50 line-clamp-1">
            {session.name}
          </p>
        </div>
      </header>

      {/* CONTENU PRINCIPAL */}
      <div className="flex flex-1 flex-col gap-4">
        {/* BLOC CHRONO */}
        <section className="relative flex flex-col items-center justify-center rounded-3xl border border-slate-800 bg-gradient-to-b from-slate-900 via-slate-950 to-slate-950 px-6 py-6 shadow-[0_18px_45px_rgba(15,23,42,0.9)]">
          <p className="text-[11px] text-slate-400 uppercase tracking-[0.18em]">
            Temps total
          </p>
          <p className="mt-1 text-5xl font-mono tabular-nums text-slate-50">
            {formatTime(elapsedSeconds)}
          </p>

          <div className="mt-3 flex items-center gap-2 text-[11px] text-slate-300">
            <span className="rounded-full bg-slate-900/80 px-2 py-1">
              {roundLabel}
            </span>
            <span className="rounded-full bg-slate-900/80 px-2 py-1">
              Exo {position.exercise + 1}/{totalExercises || 1}
            </span>
            <span className="rounded-full bg-slate-900/80 px-2 py-1">
              Série {setLabel}
            </span>
          </div>

          <div className="mt-4 flex w-full items-center gap-2">
            <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-slate-800">
              <div
                className="h-full rounded-full bg-emerald-400 transition-all"
                style={{ width: `${percentDone}%` }}
              />
            </div>
            <span className="w-10 text-right text-[10px] text-slate-300">
              {percentDone}%
            </span>
          </div>

          {/* OVERLAY COMPTE À REBOURS */}
          {showCountdownOverlay && (
            <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/70">
              <p className="mb-2 text-[11px] uppercase tracking-[0.2em] text-slate-400">
                Prêt ?
              </p>
              <p className="text-6xl font-semibold text-slate-50">
                {countdown}
              </p>
            </div>
          )}
        </section>

        {/* EXERCICE COURANT */}
        <section className="flex-1 space-y-3 rounded-3xl border border-slate-800 bg-slate-950/95 px-4 py-3">
          <p className="text-[11px] text-slate-400 uppercase tracking-[0.14em]">
            Exercice en cours
          </p>

          {currentExercise ? (
            <div className="space-y-3">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <p className="text-base font-semibold text-slate-50">
                    {currentExercise.name}
                  </p>
                  <p className="text-[11px] text-slate-500">
                    {currentExercise.muscleGroup || "Street workout"}
                  </p>
                </div>
                <div className="rounded-2xl border border-slate-700 bg-slate-900/80 px-3 py-1 text-right">
                  <p className="text-[10px] uppercase text-slate-500">
                    Série
                  </p>
                  <p className="text-[13px] font-semibold text-slate-50">
                    {setLabel}
                  </p>
                </div>
              </div>

              <div className="flex flex-wrap gap-2 text-[10px] text-slate-300">
                <span className="rounded-full bg-slate-900 px-2 py-1">
                  Objectif : {currentExercise.reps || "reps libres"}
                </span>
                {typeof currentExercise.restSeconds === "number" &&
                  currentExercise.restSeconds > 0 && (
                    <span className="rounded-full bg-slate-900 px-2 py-1">
                      Repos conseillé : {currentExercise.restSeconds}s
                    </span>
                  )}
              </div>

              {!finished && (
                <button
                  type="button"
                  onClick={handleNextSet}
                  className="mt-2 w-full rounded-2xl bg-slate-100 px-4 py-2.5 text-sm font-semibold text-slate-900 hover:bg-white active:scale-[0.99]"
                >
                  Série terminée → étape suivante
                </button>
              )}

              {finished && (
                <div className="mt-2 flex items-start gap-2 rounded-2xl border border-emerald-500/60 bg-emerald-500/10 px-3 py-2 text-[11px] text-emerald-100">
                  <CheckCircle2 className="mt-[2px] h-4 w-4" />
                  <div>
                    <p className="font-semibold">
                      Séance terminée, bien joué 👊
                    </p>
                    <p className="mt-1 text-[10px] text-emerald-100/80">
                      Temps total : {formatTime(elapsedSeconds)} ·{" "}
                      {totalPlannedSets} séries prévues complétées.
                    </p>
                  </div>
                </div>
              )}
            </div>
          ) : (
            <p className="text-[11px] text-slate-500">
              Aucun exercice configuré pour cette séance.
            </p>
          )}
        </section>
      </div>

      {/* BARRE D’ACTIONS EN BAS */}
      <div className="mt-3 flex gap-2">
        {!finished && (
          <>
            {phase === "running" && (
              <button
                type="button"
                onClick={pauseSession}
                className="flex-1 rounded-2xl bg-slate-800 px-4 py-2 text-sm font-semibold text-slate-100 hover:bg-slate-700"
              >
                Pause
              </button>
            )}

            {(phase === "idle" || phase === "paused") && (
              <button
                type="button"
                onClick={startWithCountdown}
                className="flex-1 rounded-2xl bg-emerald-500 px-4 py-2 text-sm font-semibold text-emerald-950 hover:bg-emerald-400"
              >
                Démarrer la série
              </button>
            )}

            <button
              type="button"
              onClick={handleBeepRest}
              className="rounded-2xl border border-sky-500 bg-sky-500/10 px-4 py-2 text-xs font-medium text-sky-100 hover:bg-sky-500/20"
            >
              Beep repos
            </button>
          </>
        )}

        {finished && (
          <>
            <button
              type="button"
              onClick={() => router.push("/")}
              className="flex-1 rounded-2xl bg-emerald-500 px-4 py-2 text-sm font-semibold text-emerald-950 hover:bg-emerald-400"
            >
              Retour à l&apos;accueil
            </button>
            <button
              type="button"
              onClick={resetSession}
              className="rounded-2xl border border-slate-600 bg-slate-900 px-4 py-2 text-xs font-medium text-slate-200 hover:bg-slate-800"
            >
              Refaire la séance
            </button>
          </>
        )}
      </div>
    </div>
  );
}
