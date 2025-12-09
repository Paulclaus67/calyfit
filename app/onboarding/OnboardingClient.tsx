"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

type Level = "beginner" | "intermediate" | "advanced";
type SessionsPerWeek = 3 | 4 | 5;

export default function OnboardingClient() {
  const [level, setLevel] = useState<Level | null>(null);
  const [sessions, setSessions] = useState<SessionsPerWeek | null>(3);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const router = useRouter();

  const canSubmit = level !== null && sessions !== null && !loading;

  async function handleStart() {
    if (!canSubmit || !level) return;

    setLoading(true);
    setErrorMsg(null);

    try {
      // on ignore sessions pour l'instant en back, mais on pourrait adapter
      const res = await fetch("/api/plans/create-from-template", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ templateKey: level }),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        setErrorMsg(
          data.error || "Impossible de créer un planning pour le moment."
        );
        setLoading(false);
        return;
      }

      router.push("/");
      router.refresh();
    } catch (e) {
      console.error(e);
      setErrorMsg("Erreur inattendue, réessaie dans un instant.");
      setLoading(false);
    }
  }

  return (
    <main className="min-h-screen bg-slate-950 text-slate-50 flex items-center justify-center px-4">
      <div className="w-full max-w-sm rounded-3xl border border-slate-800 bg-slate-900/90 p-5 shadow-xl space-y-4">
        <header className="space-y-1">
          <p className="text-[11px] uppercase tracking-[0.2em] text-slate-500">
            Bienvenue sur Calyfit
          </p>
          <h1 className="text-xl font-semibold">
            Configurons ton premier planning
          </h1>
          <p className="text-xs text-slate-400">
            2 petites questions pour te proposer une base adaptée. Tu pourras
            tout modifier ensuite.
          </p>
        </header>

        {/* Niveau */}
        <section className="space-y-2">
          <p className="text-[11px] text-slate-400 uppercase tracking-[0.14em]">
            Ton niveau actuel
          </p>
          <div className="grid grid-cols-3 gap-2">
            {(
              [
                {
                  key: "beginner",
                  label: "Débutant",
                  desc: "Tu débutes ou reviens après une pause.",
                },
                {
                  key: "intermediate",
                  label: "Intermédiaire",
                  desc: "Tu pratiques déjà régulièrement.",
                },
                {
                  key: "advanced",
                  label: "Avancé",
                  desc: "Tu t'entraînes sérieusement depuis un moment.",
                },
              ] as const
            ).map((opt) => {
              const active = level === opt.key;
              return (
                <button
                  key={opt.key}
                  type="button"
                  onClick={() => setLevel(opt.key)}
                  className={
                    "flex flex-col rounded-2xl border px-2 py-2 text-left text-[10px] transition " +
                    (active
                      ? "border-sky-500 bg-sky-500/15 text-sky-50"
                      : "border-slate-700 bg-slate-900/80 text-slate-300")
                  }
                >
                  <span className="text-[11px] font-semibold">
                    {opt.label}
                  </span>
                  <span className="mt-1 text-[10px] text-slate-400">
                    {opt.desc}
                  </span>
                </button>
              );
            })}
          </div>
        </section>

        {/* Dispo */}
        <section className="space-y-2">
          <p className="text-[11px] text-slate-400 uppercase tracking-[0.14em]">
            Séances par semaine
          </p>
          <div className="flex gap-2">
            {([3, 4, 5] as SessionsPerWeek[]).map((n) => {
              const active = sessions === n;
              return (
                <button
                  key={n}
                  type="button"
                  onClick={() => setSessions(n)}
                  className={
                    "flex-1 rounded-2xl border px-3 py-2 text-center text-[11px] font-medium transition " +
                    (active
                      ? "border-emerald-500 bg-emerald-500/15 text-emerald-50"
                      : "border-slate-700 bg-slate-900/80 text-slate-300")
                  }
                >
                  {n}x / sem
                </button>
              );
            })}
          </div>
          <p className="text-[10px] text-slate-500">
            Les templates sont pensés pour ce volume, mais tu pourras toujours
            déplacer ou désactiver des jours.
          </p>
        </section>

        {errorMsg && (
          <p className="text-[11px] text-red-300">{errorMsg}</p>
        )}

        <button
          type="button"
          disabled={!canSubmit}
          onClick={handleStart}
          className="w-full rounded-xl bg-sky-500 px-4 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-sky-400 active:scale-[0.99] disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {loading ? "Création du planning…" : "Créer mon planning"}
        </button>
      </div>
    </main>
  );
}
