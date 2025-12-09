"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

type Props = {
  name: string | null;
  email: string;
  createdAtLabel: string | null;
};

type StatsSummary = {
  month: {
    sessionsDone: number;
    totalSets: number;
    totalDurationSeconds: number;
  };
  year: {
    sessionsDone: number;
    totalSets: number;
    totalDurationSeconds: number;
  };
  week: {
    sessionsDoneThisWeekSlugs: string[];
  };
};

export default function ProfileClient({ name, email, createdAtLabel }: Props) {
  const router = useRouter();
  const [loggingOut, setLoggingOut] = useState(false);
  const [stats, setStats] = useState<StatsSummary | null>(null);
  const [loadingStats, setLoadingStats] = useState(true);

  async function handleLogout() {
    if (loggingOut) return;
    setLoggingOut(true);
    try {
      await fetch("/api/logout", { method: "POST" });

      if (typeof window !== "undefined") {
        window.localStorage.removeItem("calyfit_history_v1");
      }

      router.push("/login");
      router.refresh();
    } catch (e) {
      console.error("[Profil] Erreur logout:", e);
      setLoggingOut(false);
    }
  }

  // Charger les stats depuis l'API
  useEffect(() => {
    let cancelled = false;

    async function loadStats() {
      try {
        const res = await fetch("/api/stats/summary");
        if (!res.ok) {
          if (!cancelled) setLoadingStats(false);
          return;
        }
        const data = await res.json();
        if (cancelled) return;

        const summary: StatsSummary = {
          month: {
            sessionsDone: data.month?.sessionsDone ?? 0,
            totalSets: data.month?.totalSets ?? 0,
            totalDurationSeconds: data.month?.totalDurationSeconds ?? 0,
          },
          year: {
            sessionsDone: data.year?.sessionsDone ?? 0,
            totalSets: data.year?.totalSets ?? 0,
            totalDurationSeconds: data.year?.totalDurationSeconds ?? 0,
          },
          week: {
            sessionsDoneThisWeekSlugs:
              data.week?.sessionsDoneThisWeekSlugs ?? [],
          },
        };

        setStats(summary);
        setLoadingStats(false);
      } catch (e) {
        console.error("[Profil] Erreur chargement stats:", e);
        if (!cancelled) setLoadingStats(false);
      }
    }

    loadStats();
    return () => {
      cancelled = true;
    };
  }, []);

  const initial = (name || email || "?").charAt(0).toUpperCase();

  // helpers format
  function formatMinutesShort(totalSeconds: number): string {
    const minutes = Math.round(totalSeconds / 60);
    if (minutes <= 0) return "0 min";
    if (minutes < 60) return `${minutes} min`;
    const hours = Math.floor(minutes / 60);
    const restMin = minutes % 60;
    if (restMin === 0) return `${hours} h`;
    return `${hours} h ${restMin} min`;
  }

  const weekCount = stats?.week.sessionsDoneThisWeekSlugs.length ?? 0;

  return (
    <div className="space-y-5">
      {/* Carte profil */}
      <section className="rounded-3xl border border-slate-800 bg-slate-950/90 px-4 py-4">
        <div className="flex items-center gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-full bg-sky-500/20 text-lg font-semibold text-sky-200 border border-sky-500/40">
            {initial}
          </div>
          <div className="flex-1">
            <p className="text-xs text-slate-400">Connecté en tant que</p>
            <p className="text-sm font-semibold text-slate-50">
              {name || "Utilisateur Calyfit"}
            </p>
            <p className="text-[11px] text-slate-500">{email}</p>
          </div>
        </div>

        {createdAtLabel && (
          <p className="mt-3 text-[11px] text-slate-500">
            Sur Calyfit depuis&nbsp;: {createdAtLabel}
          </p>
        )}
      </section>

      {/* Bloc stats */}
      <section className="rounded-3xl border border-slate-800 bg-slate-950/90 px-4 py-4 space-y-3">
        <div className="flex items-center justify-between gap-2">
          <div>
            <p className="text-xs font-semibold text-slate-100">
              Stats perso
            </p>
            <p className="mt-0.5 text-[11px] text-slate-400">
              Un aperçu rapide de ton volume d&apos;entraînement.
            </p>
          </div>
          {loadingStats ? (
            <span className="text-[10px] text-slate-500">Chargement…</span>
          ) : (
            <span className="text-[10px] text-slate-500">
              Mis à jour automatiquement
            </span>
          )}
        </div>

        {loadingStats || !stats ? (
          // petite skeleton state légère
          <div className="mt-2 grid grid-cols-2 gap-2 text-[11px]">
            <div className="rounded-2xl bg-slate-900/80 px-3 py-2.5 animate-pulse" />
            <div className="rounded-2xl bg-slate-900/80 px-3 py-2.5 animate-pulse" />
            <div className="rounded-2xl bg-slate-900/80 px-3 py-2.5 animate-pulse col-span-2" />
          </div>
        ) : (
          <div className="mt-2 grid grid-cols-2 gap-2 text-[11px]">
            {/* Ce mois-ci */}
            <div className="rounded-2xl bg-slate-900/80 px-3 py-2.5 border border-sky-500/20">
              <p className="text-[10px] uppercase tracking-[0.14em] text-sky-300/80">
                Ce mois-ci
              </p>
              <p className="mt-1 text-base font-semibold text-slate-50">
                {stats.month.sessionsDone} séance
                {stats.month.sessionsDone > 1 ? "s" : ""}
              </p>
              <p className="mt-0.5 text-[11px] text-slate-400">
                {stats.month.totalSets} série
                {stats.month.totalSets > 1 ? "s" : ""} ·{" "}
                {formatMinutesShort(stats.month.totalDurationSeconds)}
              </p>
            </div>

            {/* Cette année */}
            <div className="rounded-2xl bg-slate-900/80 px-3 py-2.5 border border-emerald-500/20">
              <p className="text-[10px] uppercase tracking-[0.14em] text-emerald-300/80">
                Cette année
              </p>
              <p className="mt-1 text-base font-semibold text-slate-50">
                {stats.year.sessionsDone} séance
                {stats.year.sessionsDone > 1 ? "s" : ""}
              </p>
              <p className="mt-0.5 text-[11px] text-slate-400">
                {formatMinutesShort(stats.year.totalDurationSeconds)}
                {" · "}
                {stats.year.totalSets} série
                {stats.year.totalSets > 1 ? "s" : ""}
              </p>
            </div>

            {/* Cette semaine */}
            <div className="col-span-2 rounded-2xl bg-slate-900/80 px-3 py-2.5 border border-slate-700/70">
              <p className="text-[10px] uppercase tracking-[0.14em] text-slate-300/80">
                Cette semaine
              </p>
              <p className="mt-1 text-sm font-semibold text-slate-50">
                {weekCount === 0 && "Aucune séance enregistrée pour l'instant"}
                {weekCount === 1 &&
                  "1 séance différente complétée cette semaine"}
                {weekCount > 1 &&
                  `${weekCount} séances différentes complétées cette semaine`}
              </p>
              <p className="mt-0.5 text-[11px] text-slate-400">
                Basé sur ton historique d&apos;entraînement enregistré.
              </p>
            </div>
          </div>
        )}
      </section>

      {/* Bloc sécurité / session */}
      <section className="rounded-3xl border border-slate-800 bg-slate-950/90 px-4 py-4 space-y-3">
        <div>
          <p className="text-xs font-semibold text-slate-100">
            Compte &amp; session
          </p>
          <p className="mt-1 text-[11px] text-slate-400">
            Ton historique d&apos;entraînement est lié à ce compte. Tu peux
            te déconnecter sur cet appareil à tout moment.
          </p>
        </div>

        <button
          onClick={handleLogout}
          disabled={loggingOut}
          className="w-full rounded-xl bg-red-500/90 px-4 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-red-400 active:scale-[0.99] disabled:opacity-60 disabled:cursor-not-allowed transition"
        >
          {loggingOut ? "Déconnexion…" : "Se déconnecter"}
        </button>
      </section>
    </div>
  );
}
