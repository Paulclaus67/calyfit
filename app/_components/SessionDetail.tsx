"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

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

type SessionDetailProps = {
  slug: string;
};

export default function SessionDetail({ slug }: SessionDetailProps) {
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [sessionSummary, setSessionSummary] =
    useState<SessionSummaryFromApi | null>(null);
  const [detail, setDetail] = useState<SessionDetailFromApi | null>(null);

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
          throw new Error(
            "Cette séance n'existe pas (slug introuvable dans la BDD)."
          );
        }

        if (cancelled) return;
        setSessionSummary(found);

        const detailRes = await fetch(
          `/api/sessions/detail?sessionId=${found.id}`
        );
        if (!detailRes.ok) {
          throw new Error("Impossible de charger le détail de cette séance.");
        }
        const d: SessionDetailFromApi = await detailRes.json();
        if (cancelled) return;

        setDetail(d);
        setLoading(false);
      } catch (e: any) {
        console.error("[SessionDetail] load error:", e);
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

  if (loading) {
    return (
      <main className="space-y-3 px-4 pb-4 pt-3">
        <Link
          href="/sessions"
          className="inline-flex items-center gap-1 rounded-full border border-slate-800 bg-slate-950/80 px-3 py-1 text-[11px] text-slate-300 hover:bg-slate-900"
        >
          <span className="text-sm">←</span>
          <span>Retour aux séances</span>
        </Link>
        <p className="text-sm text-slate-200">Chargement de la séance…</p>
      </main>
    );
  }

  if (errorMsg || !sessionSummary || !detail) {
    return (
      <main className="space-y-3 px-4 pb-4 pt-3">
        <Link
          href="/sessions"
          className="inline-flex items-center gap-1 rounded-full border border-slate-800 bg-slate-950/80 px-3 py-1 text-[11px] text-slate-300 hover:bg-slate-900"
        >
          <span className="text-sm">←</span>
          <span>Retour aux séances</span>
        </Link>
        <p className="text-sm text-red-300">
          {errorMsg ?? "Impossible de charger cette séance."}
        </p>
      </main>
    );
  }

  const isCircuit = detail.type === "circuit";

  return (
    <main className="space-y-4 px-4 pb-4 pt-3">
      {/* Bouton retour */}
      <button
        type="button"
        onClick={() => history.back()}
        className="inline-flex items-center gap-1 rounded-full border border-slate-800 bg-slate-950/80 px-3 py-1 text-[11px] text-slate-300 hover:bg-slate-900"
      >
        <span className="text-sm">←</span>
        <span>Retour aux séances</span>
      </button>

      {/* Header séance */}
      <header className="space-y-1">
        <p className="text-[11px] uppercase tracking-[0.18em] text-slate-500">
          Séance
        </p>
        <h1 className="text-2xl font-semibold text-slate-50">
          {detail.name}
        </h1>
        <p className="text-xs text-slate-400">
          {isCircuit ? "Circuit" : "Séance classique"}
          {detail.estimatedDurationMinutes &&
            ` · ~${detail.estimatedDurationMinutes} min`}
          {isCircuit && detail.rounds
            ? ` · ${detail.rounds} tour${detail.rounds > 1 ? "s" : ""}`
            : ""}
        </p>
      </header>

      {/* CTA lancer la séance */}
      <section className="rounded-3xl border border-emerald-600/70 bg-gradient-to-r from-emerald-950 via-slate-950 to-slate-950 px-3 py-3 shadow-[0_14px_40px_rgba(15,23,42,0.9)]">
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <span className="h-2 w-2 rounded-full bg-emerald-400 shadow-[0_0_12px_rgba(52,211,153,0.7)]" />
            <div className="flex flex-col">
              <span className="text-[11px] text-emerald-200">
                Prêt à lancer ?
              </span>
              <span className="text-xs font-semibold text-slate-50 truncate max-w-[180px]">
                Mode entraînement avec chrono et progression
              </span>
            </div>
          </div>

          <Link
            href={`/sessions/${sessionSummary.slug}/run`}
            className="rounded-full border border-emerald-400 bg-emerald-500/20 px-3 py-1.5 text-[11px] font-semibold text-emerald-50 hover:bg-emerald-400/30"
          >
            Lancer la séance
          </Link>
        </div>

        <p className="mt-1.5 text-[10px] text-slate-200">
          Affichage optimisé pour le street workout : chrono lisible, phases
          travail/repos bien visibles, sonnerie à la fin des repos.
        </p>
      </section>

      {/* Détails des exercices */}
      <section className="space-y-2 rounded-3xl border border-slate-800 bg-slate-950/90 px-3 py-3">
        <p className="text-[11px] text-slate-400 uppercase tracking-[0.14em]">
          Plan de la séance
        </p>

        {detail.items.length === 0 && (
          <p className="text-[11px] text-slate-500">
            Aucun exercice n&apos;est encore configuré pour cette séance.
          </p>
        )}

        <div className="space-y-2">
          {detail.items.map((it, index) => (
            <div
              key={`${it.exerciseId}-${index}`}
              className="flex items-center justify-between rounded-2xl border border-slate-800 bg-slate-900/80 px-3 py-2"
            >
              <div className="flex-1">
                <p className="text-[12px] font-medium text-slate-100">
                  {it.exerciseName}
                </p>
                <p className="text-[10px] text-slate-500">
                  {it.muscleGroup || "Street workout"}
                </p>
                <p className="mt-1 text-[10px] text-slate-400">
                  {it.sets} série{it.sets > 1 ? "s" : ""} ·{" "}
                  {it.reps || "reps libres"}
                  {typeof it.restSeconds === "number" &&
                  it.restSeconds > 0
                    ? ` · Repos ${it.restSeconds}s`
                    : ""}
                </p>
              </div>
              <span className="ml-2 text-[11px] text-slate-500">
                #{index + 1}
              </span>
            </div>
          ))}
        </div>
      </section>
    </main>
  );
}
