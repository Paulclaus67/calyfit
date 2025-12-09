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

type RestPhase = "idle" | "running" | "done";

const BEEP_PATH = "/sounds/beep.mp3";

function playBeep() {
  try {
    const audio = new Audio(BEEP_PATH);
    void audio.play();
  } catch {
    // si le son ne se joue pas, on ne casse rien
  }
}

/**
 * Génère une description + quelques tips en fonction du type d'exercice.
 * C'est volontairement simple et générique, mais ça remplit bien la zone "Technique".
 */
function getExerciseTips(ex: RunnerExercise) {
  const name = ex.name.toLowerCase();
  const mg = (ex.muscleGroup || "").toLowerCase();

  // Tractions / Dos
  if (name.includes("traction") || mg.includes("dos") || name.includes("row")) {
    return {
      description:
        "Exercice de tirage qui cible principalement le dos et les biceps. Contrôle bien la montée et surtout la descente.",
      bullets: [
        "Garde la poitrine ouverte et les épaules vers l’arrière (pas d’épaules montées aux oreilles).",
        "Monte en conduisant les coudes vers le bas, pas en tirant juste avec les biceps.",
        "Contrôle la descente sur 2–3 secondes, ne te laisse pas tomber.",
        "Gaine les abdos et évite de balancer les jambes.",
      ],
    };
  }

  // Pompes / Pecs / Triceps
  if (
    name.includes("pompe") ||
    mg.includes("pec") ||
    mg.includes("triceps") ||
    name.includes("push-up")
  ) {
    return {
      description:
        "Exercice de poussée qui cible les pectoraux, les triceps et les épaules. Reste gainé du début à la fin.",
      bullets: [
        "Place les mains légèrement plus larges que les épaules, doigts orientés vers l’avant.",
        "Descends la poitrine entre les mains, coudes à ~45° du corps (ni collés, ni écartés à 90°).",
        "Garde un alignement tête–bassin–talons (pas de bassin qui tombe).",
        "Pense à inspirer en bas et à souffler en poussant.",
      ],
    };
  }

  // Jambes : Squats, fentes, etc.
  if (
    mg.includes("jambe") ||
    name.includes("squat") ||
    name.includes("fente") ||
    name.includes("pistol")
  ) {
    return {
      description:
        "Exercice pour les jambes qui sollicite quadriceps, ischios et fessiers. Le but : contrôle et amplitude propre.",
      bullets: [
        "Garde les pieds à largeur d’épaules (ou un peu plus), pointes légèrement vers l’extérieur.",
        "Descends en poussant les hanches vers l’arrière comme si tu t’assayais.",
        "Garde les genoux dans l’axe des orteils (ils ne rentrent pas vers l’intérieur).",
        "Remonte en poussant fort dans le sol, surtout avec les talons.",
      ],
    };
  }

  // Abdos / Gainage
  if (
    mg.includes("abdo") ||
    name.includes("gainage") ||
    name.includes("planche") ||
    name.includes("plank")
  ) {
    return {
      description:
        "Exercice de gainage qui renforce la sangle abdominale. Qualité de contraction > durée brute.",
      bullets: [
        "Rentre le nombril vers la colonne pour engager le transverse.",
        "Garde les épaules au-dessus des coudes ou des poignets (selon la variante).",
        "Ne laisse pas le bas du dos se creuser : gaine et serre les fessiers.",
        "Respire calmement, évite de bloquer la respiration.",
      ],
    };
  }

  // Défaut : tips génériques street workout
  return {
    description:
      "Exercice de street workout : privilégie le contrôle, la sensation musculaire et une belle amplitude plutôt que la vitesse.",
    bullets: [
      "Commence chaque série avec une position bien stable (prise, posture, gainage).",
      "Contrôle la phase excentrique (descente) plutôt que de te laisser tomber.",
      "Arrête la série 1–2 reps avant l’échec complet pour garder une bonne technique.",
      "Respire régulièrement, et garde la nuque dans l’alignement de la colonne.",
    ],
  };
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

  const [restPhase, setRestPhase] = useState<RestPhase>("idle");
  const [restRemaining, setRestRemaining] = useState<number | null>(null);
  const [totalRestSeconds, setTotalRestSeconds] = useState(0);

  const currentExercise = session.items[position.exercise];

  const percentDone = useMemo(() => {
  if (!totalPlannedSets) return 0;
  // on force l'affichage à 100% (c'est beaucoup plus satisfaisant).
  if (position.finished) return 100;

  const setsPerRound = session.items.reduce((sum, ex) => sum + ex.sets, 0);

  const setsDonePreviousRounds = position.round * setsPerRound;
  const setsDonePreviousExercises = session.items
    .slice(0, position.exercise)
    .reduce((sum, ex) => sum + ex.sets, 0);

  const setsDoneCurrentExercise = position.set; // la série en cours n’est pas comptée

  const raw =
    setsDonePreviousRounds +
    setsDonePreviousExercises +
    setsDoneCurrentExercise;

  const clamped = Math.min(raw, totalPlannedSets);
  return Math.round((clamped / totalPlannedSets) * 100);
}, [position, session.items, totalPlannedSets]);


  // Gestion du chrono de repos
  useEffect(() => {
    if (restPhase !== "running") return;

    const id = setInterval(() => {
      setRestRemaining((prev) => {
        if (prev == null) return prev;
        if (prev <= 1) {
          // fin du repos
          playBeep();
          setRestPhase("done");
          return 0;
        }
        return prev - 1;
      });

      setTotalRestSeconds((prev) => prev + 1);
    }, 1000);

    return () => clearInterval(id);
  }, [restPhase]);

  // En fin de séance → onFinish
  useEffect(() => {
    if (!position.finished || !onFinish) return;

    const stats = {
      totalSets: totalPlannedSets,
      totalExercises,
      totalRounds,
      elapsedSeconds: totalRestSeconds, // ici on enregistre le temps total de repos
    };

    void onFinish(stats);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [position.finished]);

  function formatSeconds(sec: number) {
    const m = Math.floor(sec / 60);
    const s = sec % 60;
    if (m === 0) {
      return `${s.toString().padStart(2, "0")}s`;
    }
    return `${m.toString().padStart(2, "0")}:${s
      .toString()
      .padStart(2, "0")}`;
  }

  function handleBack() {
    router.back();
  }

  function handleNextSet() {
    if (position.finished || !session.items.length) return;

    setRestPhase("idle");
    setRestRemaining(null);

    setPosition((prev) => {
      const exCount = session.items.length;
      const ex = session.items[prev.exercise];

      const lastSetForExercise = prev.set + 1 >= ex.sets;
      const lastExercise = prev.exercise + 1 >= exCount;
      const lastRound = prev.round + 1 >= totalRounds;

      // Encore des séries sur le même exo
      if (!lastSetForExercise) {
        return { ...prev, set: prev.set + 1 };
      }

      // Passage à l'exercice suivant
      if (!lastExercise) {
        return { ...prev, exercise: prev.exercise + 1, set: 0 };
      }

      // Fin des exos du tour actuel, mais encore des tours
      if (!lastRound) {
        return { round: prev.round + 1, exercise: 0, set: 0, finished: false };
      }

      // Vraiment tout terminé
      return { ...prev, finished: true };
    });
  }

  function handleStartRest() {
    if (!currentExercise || !currentExercise.restSeconds) {
      // pas de repos configuré → on passe direct à la suite
      handleNextSet();
      return;
    }

    setRestRemaining(currentExercise.restSeconds);
    setRestPhase("running");
  }

  function handleSkipRestToNext() {
    // on passe directement à la série suivante / exo suivant
    handleNextSet();
  }

  function handleResetSession() {
    setPosition({ round: 0, exercise: 0, set: 0, finished: false });
    setRestPhase("idle");
    setRestRemaining(null);
    setTotalRestSeconds(0);
  }

  const roundLabel =
    totalRounds > 1
      ? `Tour ${position.round + 1}/${totalRounds}`
      : "Séance";

  const setLabel =
    currentExercise?.sets != null
      ? `${position.set + 1}/${currentExercise.sets}`
      : `${position.set + 1}`;

  const hasRest =
    !!currentExercise && !!currentExercise.restSeconds && currentExercise.restSeconds > 0;

  const finished = position.finished;

  // Texte du bouton principal en bas
  let mainButtonLabel = "";
  if (!finished) {
    if (!hasRest) {
      mainButtonLabel = "Série terminée → étape suivante";
    } else {
      if (restPhase === "idle") {
        mainButtonLabel = "Série terminée → lancer le repos";
      } else if (restPhase === "running") {
        mainButtonLabel = "Passer le repos → prochaine série";
      } else if (restPhase === "done") {
        mainButtonLabel = "Repos terminé → prochaine série";
      }
    }
  }

  function handleMainButtonClick() {
    if (finished) return;

    if (!hasRest) {
      // pas de repos configuré : on avance simplement
      handleNextSet();
      return;
    }

    if (restPhase === "idle") {
      handleStartRest();
    } else {
      // running ou done → on avance
      handleSkipRestToNext();
    }
  }

  // Infos technique pour l'exercice courant
  const tips = currentExercise ? getExerciseTips(currentExercise) : null;

  // Ce qui s'affiche dans le gros rond du milieu
  let restTitle = "";
  let restSubtitle = "";
  let restValue: string | null = null;

  if (!hasRest) {
    restTitle = "Pas de repos chronométré";
    restSubtitle = "Tu peux enchaîner les séries à ton rythme.";
    restValue = null;
  } else {
    if (restPhase === "idle") {
      restTitle = "Repos prêt";
      restSubtitle = `Repos prévu : ${currentExercise!.restSeconds}s`;
      restValue = formatSeconds(currentExercise!.restSeconds!);
    } else if (restPhase === "running") {
      restTitle = "Repos en cours";
      restSubtitle = "Attends le bip pour repartir 💪";
      restValue = restRemaining != null ? formatSeconds(restRemaining) : null;
    } else if (restPhase === "done") {
      restTitle = "Repos terminé";
      restSubtitle = "Go, prochaine série !";
      restValue = "GO";
    }
  }

  return (
    // FULLSCREEN au-dessus de toute l’app (navbar incluse)
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
        {/* BLOC REST (gros chrono de repos) */}
        <section className="flex flex-col items-center justify-center rounded-3xl border border-slate-800 bg-gradient-to-b from-slate-900 via-slate-950 to-slate-950 px-6 py-6 shadow-[0_18px_45px_rgba(15,23,42,0.9)]">
          <p className="text-[11px] text-slate-400 uppercase tracking-[0.18em]">
            Temps de repos
          </p>

          {restValue && (
            <p className="mt-2 text-5xl font-mono tabular-nums text-slate-50">
              {restValue}
            </p>
          )}

          {!restValue && (
            <p className="mt-4 text-3xl font-semibold text-slate-100">
              —
            </p>
          )}

          <p className="mt-3 text-[12px] font-semibold text-slate-100">
            {restTitle}
          </p>
          <p className="mt-1 text-[11px] text-slate-400 text-center">
            {restSubtitle}
          </p>

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
        </section>

        {/* EXERCICE COURANT + TECHNIQUE */}
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
                  <p className="mt-1 text-[10px] text-slate-400">
                    {roundLabel}
                  </p>
                </div>
              </div>

              <div className="flex flex-wrap gap-2 text-[10px] text-slate-300">
                <span className="rounded-full bg-slate-900 px-2 py-1">
                  Objectif : {currentExercise.reps || "reps libres"}
                </span>
                {hasRest && (
                  <span className="rounded-full bg-slate-900 px-2 py-1">
                    Repos prévu : {currentExercise.restSeconds}s
                  </span>
                )}
              </div>

              {/* Bloc technique / description */}
              {tips && (
                <div className="rounded-2xl bg-slate-900 px-3 py-2">
                  <p className="text-[10px] uppercase tracking-[0.18em] text-slate-500">
                    Technique
                  </p>
                  <p className="mt-1 text-[12px] text-slate-200">
                    {tips.description}
                  </p>
                  <ul className="mt-2 space-y-1 text-[11px] text-slate-400 list-disc pl-4">
                    {tips.bullets.map((b, idx) => (
                      <li key={idx}>{b}</li>
                    ))}
                  </ul>
                </div>
              )}

              {finished && (
                <div className="mt-2 flex items-start gap-2 rounded-2xl border border-emerald-500/60 bg-emerald-500/10 px-3 py-2 text-[11px] text-emerald-100">
                  <CheckCircle2 className="mt-[2px] h-4 w-4" />
                  <div>
                    <p className="font-semibold">
                      Séance terminée, bien joué 👊
                    </p>
                    <p className="mt-1 text-[10px] text-emerald-100/80">
                      Temps total de repos : {formatSeconds(totalRestSeconds)} ·{" "}
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
            <button
              type="button"
              onClick={handleMainButtonClick}
              className="flex-1 rounded-2xl bg-emerald-500 px-4 py-2.5 text-sm font-semibold text-emerald-950 hover:bg-emerald-400 active:scale-[0.99]"
            >
              {mainButtonLabel}
            </button>

            {hasRest && restPhase === "running" && (
              <button
                type="button"
                onClick={handleSkipRestToNext}
                className="rounded-2xl border border-slate-600 bg-slate-900 px-4 py-2 text-[11px] font-medium text-slate-200 hover:bg-slate-800"
              >
                Passer repos
              </button>
            )}
          </>
        )}

        {finished && (
          <>
            <button
              type="button"
              onClick={() => router.push("/")}
              className="flex-1 rounded-2xl bg-emerald-500 px-4 py-2.5 text-sm font-semibold text-emerald-950 hover:bg-emerald-400 active:scale-[0.99]"
            >
              Retour à l&apos;accueil
            </button>
            <button
              type="button"
              onClick={handleResetSession}
              className="rounded-2xl border border-slate-600 bg-slate-900 px-4 py-2 text-[11px] font-medium text-slate-200 hover:bg-slate-800"
            >
              Refaire la séance
            </button>
          </>
        )}
      </div>
    </div>
  );
}
