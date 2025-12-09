"use client";

import { useEffect, useState } from "react";
import SessionRunner from "./SessionRunner";

type SessionSummaryFromApi = {
  id: string;
  slug: string;
  name: string;
  type: "classic" | "circuit";
  estimatedDurationMinutes: number | null;
  rounds?: number | null;
};

type SessionDetailFromApi = {
  id: string;
  name: string;
  type: "classic" | "circuit";
  estimatedDurationMinutes: number | null;
  rounds?: number | null;
  items: {
    exerciseId: string;
    exerciseName: string;
    muscleGroup: string;
    sets: number;
    reps: string;
    restSeconds: number | null;
  }[];
};

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

type SessionRunClientProps = {
  slug: string;
};

export default function SessionRunClient({ slug }: SessionRunClientProps) {
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [runnerSession, setRunnerSession] = useState<RunnerSession | null>(
    null
  );
  const [baseSession, setBaseSession] = useState<SessionSummaryFromApi | null>(
    null
  );

  useEffect(() => {
    let cancelled = false;

    async function load() {
      try {
        setLoading(true);
        setErrorMsg(null);

        const sessionsRes = await fetch("/api/sessions/all");
        if (!sessionsRes.ok) {
          throw new Error("Impossible de charger la liste des séances.");
        }
        const sessionsData = await sessionsRes.json();
        const sessions: SessionSummaryFromApi[] = sessionsData.sessions ?? [];

        const found = sessions.find((s) => s.slug === slug);
        if (!found) {
          console.error(
            "[SessionRunClient] slug demandé:",
            slug,
            "Slugs disponibles:",
            sessions.map((s) => s.slug)
          );
          throw new Error(
            `Cette séance n'existe pas (slug introuvable dans la BDD).`
          );
        }

        if (cancelled) return;
        setBaseSession(found);

        const detailRes = await fetch(
          `/api/sessions/detail?sessionId=${found.id}`
        );
        if (!detailRes.ok) {
          throw new Error("Impossible de charger le détail de la séance.");
        }
        const detail: SessionDetailFromApi = await detailRes.json();
        if (cancelled) return;

        const runner: RunnerSession = {
          id: detail.id,
          name: detail.name,
          type: detail.type,
          rounds: detail.rounds ?? null,
          estimatedDurationMinutes: detail.estimatedDurationMinutes,
          items: detail.items.map((it) => ({
            id: it.exerciseId,
            name: it.exerciseName,
            muscleGroup: it.muscleGroup,
            sets: it.sets,
            reps: it.reps,
            restSeconds: it.restSeconds,
          })),
        };

        setRunnerSession(runner);
        setLoading(false);
      } catch (e: any) {
        console.error("[SessionRunClient] load error:", e);
        if (!cancelled) {
          setErrorMsg(e?.message ?? "Erreur inattendue lors du chargement.");
          setLoading(false);
        }
      }
    }

    load();

    return () => {
      cancelled = true;
    };
  }, [slug]);

  async function handleFinish(stats: {
    totalSets: number;
    totalExercises: number;
    totalRounds: number;
    elapsedSeconds: number;
  }) {
    try {
      if (!baseSession) return;

      await fetch("/api/history", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          sessionId: baseSession.id,
          elapsedSeconds: stats.elapsedSeconds,
          totalSets: stats.totalSets,
          totalRounds: stats.totalRounds,
        }),
      });
    } catch (e) {
      console.error("[SessionRunClient] error saving history:", e);
    }
  }

  if (loading) {
    return (
      <div className="flex h-full flex-col justify-center">
        <p className="text-center text-sm text-slate-200">
          Chargement de la séance…
        </p>
      </div>
    );
  }

  if (errorMsg || !runnerSession) {
    return (
      <div className="space-y-2">
        <p className="text-sm text-red-300">
          {errorMsg ?? "Impossible de charger cette séance."}
        </p>
        <p className="text-[11px] text-slate-400">
          Vérifie que la séance existe bien dans ta base et que le slug{" "}
          <code className="rounded bg-slate-900 px-1 py-[1px] text-[10px]">
            {slug}
          </code>{" "}
          correspond.
        </p>
      </div>
    );
  }

  return (
    <SessionRunner
      session={runnerSession}
      onFinish={handleFinish}
    />
  );
}
