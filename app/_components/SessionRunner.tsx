"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { demoSessions, demoExercises } from "@/lib/demo-data";
import type { Session } from "@/lib/types";
import { addHistoryEntry } from "@/lib/history";

type Phase = "exercise" | "rest" | "roundRest" | "done";

type Props = {
  sessionId: string;
};

type PersistedState = {
  sessionId: string;
  phase: Phase;
  currentExerciseIndex: number;
  currentSetOrRound: number;
  restRemaining: number | null;
  startedAt: number | null;
  finishedAt: number | null;
  totalCompletedSets: number;
};

function formatRest(seconds: number): string {
  const min = Math.floor(seconds / 60);
  const sec = seconds % 60;
  if (min === 0) return `${sec}s`;
  if (sec === 0) return `${min} min`;
  return `${min} min ${sec}s`;
}

export function SessionRunner({ sessionId }: Props) {
  const session = demoSessions.find((s) => s.id === sessionId);

  const [phase, setPhase] = useState<Phase>("exercise");
  const [currentExerciseIndex, setCurrentExerciseIndex] = useState(0);
  const [currentSetOrRound, setCurrentSetOrRound] = useState(1);
  const [restRemaining, setRestRemaining] = useState<number | null>(null);
  const [startedAt, setStartedAt] = useState<number | null>(null);
  const [finishedAt, setFinishedAt] = useState<number | null>(null);
  const [totalCompletedSets, setTotalCompletedSets] = useState(0);

  const storageKey = `calyfit_session_${sessionId}`;

  // 🔁 Charger la progression depuis localStorage au montage
  useEffect(() => {
    if (typeof window === "undefined" || !session) return;
    try {
      const raw = window.localStorage.getItem(storageKey);
      if (!raw) {
        setStartedAt(Date.now());
        return;
      }
      const parsed: PersistedState = JSON.parse(raw);

      if (parsed.sessionId !== sessionId) {
        setStartedAt(Date.now());
        return;
      }

      setPhase(parsed.phase);
      setCurrentExerciseIndex(parsed.currentExerciseIndex);
      setCurrentSetOrRound(parsed.currentSetOrRound);
      setRestRemaining(parsed.restRemaining);
      setStartedAt(parsed.startedAt ?? Date.now());
      setFinishedAt(parsed.finishedAt ?? null);
      setTotalCompletedSets(parsed.totalCompletedSets ?? 0);
    } catch {
      setStartedAt(Date.now());
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sessionId, session]);

  // 🧠 Si on n'a pas encore de startedAt, on le met dès qu'on est en cours
  useEffect(() => {
    if (phase !== "done" && startedAt === null) {
      setStartedAt(Date.now());
    }
  }, [phase, startedAt]);

  // 💾 Sauvegarder la progression à chaque changement de state
  useEffect(() => {
    if (typeof window === "undefined" || !session) return;
    const data: PersistedState = {
      sessionId,
      phase,
      currentExerciseIndex,
      currentSetOrRound,
      restRemaining,
      startedAt,
      finishedAt,
      totalCompletedSets,
    };
    try {
      window.localStorage.setItem(storageKey, JSON.stringify(data));
    } catch {
      // ignore
    }
  }, [
    session,
    sessionId,
    storageKey,
    phase,
    currentExerciseIndex,
    currentSetOrRound,
    restRemaining,
    startedAt,
    finishedAt,
    totalCompletedSets,
  ]);

  // ⏱️ Timer de repos
  useEffect(() => {
    if ((phase !== "rest" && phase !== "roundRest") || restRemaining === null)
      return;
    if (restRemaining <= 0) {
      if (phase === "rest") {
        handleExerciseRestFinished();
      } else {
        handleRoundRestFinished();
      }
      return;
    }
    const id = setInterval(() => {
      setRestRemaining((prev) => (prev === null ? prev : prev - 1));
    }, 1000);
    return () => clearInterval(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [phase, restRemaining]);

  if (!session) {
    return (
      <main className="min-h-screen p-4">
        <h1 className="text-2xl font-semibold mb-2">Séance introuvable</h1>
        <p className="text-sm text-slate-300">
          Aucun programme ne correspond à l&apos;id <code>{sessionId}</code>.
        </p>
      </main>
    );
  }

  const isCircuit = session.type === "circuit";
  const totalExercises = session.items.length;
  const totalRounds = isCircuit && session.rounds ? session.rounds : 1;

  const currentItem = session.items[currentExerciseIndex];
  const exercise = demoExercises.find((e) => e.id === currentItem.exerciseId);

  const currentSet = isCircuit ? 1 : currentSetOrRound;
  const currentRound = isCircuit ? currentSetOrRound : 1;

  const isLastExerciseInRound = currentExerciseIndex === totalExercises - 1;
  const isLastSetForClassic =
    !isCircuit && currentSet >= (currentItem.sets ?? 1);
  const isLastRound = isCircuit && currentRound >= totalRounds;

  const exerciseProgress = (() => {
    if (phase === "done") return 100;
    if (totalExercises === 0) return 0;
    return (currentExerciseIndex / totalExercises) * 100;
  })();

  function clearStorage() {
    if (typeof window === "undefined") return;
    try {
      window.localStorage.removeItem(storageKey);
    } catch {
      // ignore
    }
  }

  function markSessionDone() {
    // éviter de doubler l'entrée d'historique
    if (finishedAt !== null) {
      setPhase("done");
      setRestRemaining(null);
      return;
    }

    const end = Date.now();
    const durationSeconds =
      startedAt != null ? Math.max(0, Math.round((end - startedAt) / 1000)) : 0;

    setPhase("done");
    setFinishedAt(end);
    setRestRemaining(null);

    try {
      addHistoryEntry({
        id: `${sessionId}-${end}`,
        sessionId,
        finishedAt: end,
        durationSeconds,
        totalCompletedSets,
      });
    } catch {
      // ignore
    }
  }

  function resetSession() {
    setPhase("exercise");
    setCurrentExerciseIndex(0);
    setCurrentSetOrRound(1);
    setRestRemaining(null);
    setStartedAt(Date.now());
    setFinishedAt(null);
    setTotalCompletedSets(0);
    clearStorage();
  }

  function goToNextExerciseClassic() {
    if (currentExerciseIndex + 1 >= totalExercises) {
      markSessionDone();
      return;
    }
    setCurrentExerciseIndex((prev) => prev + 1);
    setCurrentSetOrRound(1);
    setPhase("exercise");
    setRestRemaining(null);
  }

  function handleExerciseRestFinished() {
    if (isCircuit) {
      if (!isLastExerciseInRound) {
        setCurrentExerciseIndex((prev) => prev + 1);
        setPhase("exercise");
        setRestRemaining(null);
      } else {
        if (!isLastRound) {
          setPhase("roundRest");
          setRestRemaining(session.restBetweenRoundsSeconds ?? 0);
        } else {
          markSessionDone();
        }
      }
      return;
    }

    if (!isLastSetForClassic) {
      setCurrentSetOrRound((prev) => prev + 1);
      setPhase("exercise");
      setRestRemaining(null);
    } else {
      goToNextExerciseClassic();
    }
  }

  function handleRoundRestFinished() {
    if (!isCircuit) {
      setPhase("exercise");
      setRestRemaining(null);
      return;
    }

    if (!isLastRound) {
      setCurrentSetOrRound((prev) => prev + 1);
      setCurrentExerciseIndex(0);
      setPhase("exercise");
      setRestRemaining(null);
    } else {
      markSessionDone();
    }
  }

  function handleSetDone() {
    // On compte chaque click comme une "série" / "bloc" validé
    setTotalCompletedSets((prev) => prev + 1);

    if (isCircuit) {
      if (!isLastExerciseInRound) {
        const restSeconds =
          session.restBetweenExercisesSeconds ?? currentItem.restSeconds ?? 0;
        if (restSeconds > 0) {
          setPhase("rest");
          setRestRemaining(restSeconds);
        } else {
          setCurrentExerciseIndex((prev) => prev + 1);
          setPhase("exercise");
        }
      } else {
        if (!isLastRound) {
          const roundRest =
            session.restBetweenRoundsSeconds ??
            currentItem.restSeconds ??
            0;
          if (roundRest > 0) {
            setPhase("roundRest");
            setRestRemaining(roundRest);
          } else {
            setCurrentSetOrRound((prev) => prev + 1);
            setCurrentExerciseIndex(0);
            setPhase("exercise");
          }
        } else {
          markSessionDone();
        }
      }
      return;
    }

    const restSeconds = currentItem.restSeconds ?? 0;
    if (restSeconds > 0) {
      setPhase("rest");
      setRestRemaining(restSeconds);
    } else {
      handleExerciseRestFinished();
    }
  }

  function skipRest() {
    if (phase === "rest") {
      handleExerciseRestFinished();
    } else if (phase === "roundRest") {
      handleRoundRestFinished();
    }
  }

  function skipExercise() {
    if (isCircuit) {
      if (!isLastExerciseInRound) {
        setCurrentExerciseIndex((prev) => prev + 1);
        setPhase("exercise");
        setRestRemaining(null);
      } else {
        if (!isLastRound) {
          setCurrentSetOrRound((prev) => prev + 1);
          setCurrentExerciseIndex(0);
          setPhase("exercise");
          setRestRemaining(null);
        } else {
          markSessionDone();
        }
      }
      return;
    }

    goToNextExerciseClassic();
  }

  // === ÉCRAN FIN DE SÉANCE AVEC RÉSUMÉ ===

  if (phase === "done") {
    const end = finishedAt ?? Date.now();
    const durationSeconds =
      startedAt != null ? Math.max(0, Math.round((end - startedAt) / 1000)) : null;
    const durationMinutes =
      durationSeconds != null ? Math.floor(durationSeconds / 60) : null;
    const durationRemainder =
      durationSeconds != null ? durationSeconds % 60 : null;

    return (
      <main className="min-h-screen p-4">
        <header className="mb-4">
          <p className="text-xs text-slate-400 uppercase tracking-wide">
            Séance terminée
          </p>
          <h1 className="text-2xl font-semibold">{session.name}</h1>
        </header>

        <div className="rounded-2xl border border-emerald-700 bg-emerald-950/40 p-4 mb-4">
          <p className="text-lg font-semibold text-emerald-100 mb-1">
            Bien joué 💪
          </p>
          <p className="text-sm text-emerald-100 mb-3">
            Tu as terminé cette séance. Bois un coup, respire et profite de la
            récup.
          </p>

          <div className="space-y-1 text-sm text-emerald-100">
            {durationSeconds != null && (
              <p>
                Temps total :{" "}
                <span className="font-semibold">
                  {durationMinutes && durationMinutes > 0
                    ? `${durationMinutes} min `
                    : ""}
                  {durationRemainder != null
                    ? `${durationRemainder}s`
                    : ""}
                </span>
              </p>
            )}
            <p>
              Séries / blocs validés :{" "}
              <span className="font-semibold">
                {totalCompletedSets}
              </span>
            </p>
          </div>
        </div>

        <div className="space-y-2">
          <button
            onClick={resetSession}
            className="w-full rounded-xl border border-slate-700 bg-slate-900 px-4 py-2 text-sm font-medium text-slate-100 hover:bg-slate-800"
          >
            Recommencer la séance
          </button>
          <Link
            href="/"
            className="block w-full rounded-xl bg-sky-600 px-4 py-2 text-center text-sm font-semibold text-white hover:bg-sky-500 active:scale-[0.99]"
          >
            Revenir au menu
          </Link>
        </div>
      </main>
    );
  }

  // === ÉCRAN EN COURS DE SÉANCE ===

  const repsLabel =
    currentItem.reps.type === "reps"
      ? `${currentItem.reps.value} reps`
      : `${currentItem.reps.seconds}s`;

  const nextExerciseInCircuit =
    isCircuit && !isLastExerciseInRound
      ? session.items[currentExerciseIndex + 1]
      : null;
  const nextExerciseEntity =
    nextExerciseInCircuit &&
    demoExercises.find((e) => e.id === nextExerciseInCircuit.exerciseId);

  return (
    <main className="min-h-screen p-4">
      <header className="mb-3">
        <p className="text-xs text-slate-400 uppercase tracking-wide">
          En cours
        </p>
        <h1 className="text-xl font-semibold">{session.name}</h1>
        {isCircuit && (
          <p className="text-xs text-slate-400 mt-1">
            Circuit • Tour {currentRound} / {totalRounds}
          </p>
        )}
      </header>

      {/* Progression exos */}
      <div className="mb-4">
        <div className="flex justify-between text-[11px] text-slate-400 mb-1">
          <span>
            Exercice {currentExerciseIndex + 1} / {totalExercises}
          </span>
          {isCircuit ? (
            <span>
              Tour {currentRound} / {totalRounds}
            </span>
          ) : (
            <span>
              Série {currentSet} / {currentItem.sets}
            </span>
          )}
        </div>
        <div className="h-2 w-full overflow-hidden rounded-full bg-slate-900">
          <div
            className="h-full rounded-full bg-sky-500"
            style={{ width: `${exerciseProgress}%` }}
          />
        </div>
      </div>

      {/* Carte principale */}
      <section className="rounded-2xl border border-slate-800 bg-slate-950/70 p-4 mb-4">
        {phase === "exercise" && (
          <>
            <p className="text-xs text-sky-400 font-medium mb-1">
              {isCircuit
                ? `Tour ${currentRound} • Exercice ${currentExerciseIndex + 1}/${totalExercises}`
                : `Série ${currentSet} / ${currentItem.sets}`}
            </p>
            <h2 className="text-lg font-semibold mb-1">
              {exercise?.name ?? currentItem.exerciseId}
            </h2>
            <p className="text-sm text-slate-300 mb-2">
              {isCircuit
                ? `${repsLabel} par tour`
                : `${currentItem.sets} séries • ${repsLabel}`}
              {" • "}
              Repos{" "}
              {formatRest(
                isCircuit
                  ? session.restBetweenExercisesSeconds ??
                      currentItem.restSeconds ??
                      0
                  : currentItem.restSeconds ?? 0
              )}
            </p>

            {exercise?.description && (
              <p className="text-xs text-slate-400 mb-2">
                {exercise.description}
              </p>
            )}

            {currentItem.note && (
              <p className="text-xs text-slate-400 italic mb-2">
                {currentItem.note}
              </p>
            )}

            <button
              onClick={handleSetDone}
              className="mt-2 w-full rounded-xl bg-sky-600 px-4 py-2 text-sm font-semibold text-white hover:bg-sky-500 active:scale-[0.99]"
            >
              Série / bloc terminé
            </button>

            <button
              onClick={skipExercise}
              className="mt-2 w-full rounded-xl border border-slate-700 bg-slate-900 px-4 py-2 text-xs text-slate-200 hover:bg-slate-800"
            >
              Passer cet exercice
            </button>
          </>
        )}

        {phase === "rest" && (
          <>
            <p className="text-xs text-slate-400 mb-1">Repos entre exercices</p>
            <h2 className="text-4xl font-semibold mb-1">
              {restRemaining !== null && restRemaining > 0
                ? restRemaining
                : 0}
              s
            </h2>

            {isCircuit && nextExerciseInCircuit && (
              <p className="text-xs text-slate-400 mb-2">
                Prochain :{" "}
                <span className="font-medium">
                  {nextExerciseEntity?.name ??
                    nextExerciseInCircuit.exerciseId}
                </span>{" "}
                (tour {currentRound})
              </p>
            )}

            {!isCircuit && (
              <p className="text-xs text-slate-400 mb-2">
                Prochaine série :{" "}
                <span className="font-medium">
                  {exercise?.name ?? currentItem.exerciseId}
                </span>
              </p>
            )}

            <button
              onClick={skipRest}
              className="mt-2 w-full rounded-xl border border-slate-700 bg-slate-900 px-4 py-2 text-sm text-slate-100 hover:bg-slate-800"
            >
              Passer le repos
            </button>
          </>
        )}

        {phase === "roundRest" && (
          <>
            <p className="text-xs text-slate-400 mb-1">Repos entre tours</p>
            <h2 className="text-4xl font-semibold mb-1">
              {restRemaining !== null && restRemaining > 0
                ? restRemaining
                : 0}
              s
            </h2>
            <p className="text-xs text-slate-400 mb-2">
              Prochain tour : {currentRound + 1} / {totalRounds}
            </p>

            <button
              onClick={skipRest}
              className="mt-2 w-full rounded-xl border border-slate-700 bg-slate-900 px-4 py-2 text-sm text-slate-100 hover:bg-slate-800"
            >
              Passer le repos entre tours
            </button>
          </>
        )}
      </section>
    </main>
  );
}
