"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

type PlanMeta = {
  id: string;
  name: string;
  isActive: boolean;
  templateType: string | null;
};

type DayName =
  | "monday"
  | "tuesday"
  | "wednesday"
  | "thursday"
  | "friday"
  | "saturday"
  | "sunday";

type DayDetail = {
  day: DayName;
  isRest: boolean;
  session: { id: string; slug: string; name: string } | null;
};

type SessionOption = {
  id: string;
  slug: string;
  name: string;
  type: string;
  estimatedDurationMinutes: number | null;
};

const DAY_LABEL: Record<DayName, string> = {
  monday: "Lundi",
  tuesday: "Mardi",
  wednesday: "Mercredi",
  thursday: "Jeudi",
  friday: "Vendredi",
  saturday: "Samedi",
  sunday: "Dimanche",
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

export default function PlanningManageClient() {
  const [plans, setPlans] = useState<PlanMeta[]>([]);
  const [selectedPlanId, setSelectedPlanId] = useState<string | null>(null);
  const [planName, setPlanName] = useState("");
  const [days, setDays] = useState<DayDetail[]>([]);
  const [sessions, setSessions] = useState<SessionOption[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const router = useRouter();

  // Charger plannings + séances
  useEffect(() => {
    let cancelled = false;

    async function load() {
      try {
        const [plansRes, sessionsRes] = await Promise.all([
          fetch("/api/plans/list"),
          fetch("/api/sessions/all"),
        ]);

        if (!plansRes.ok || !sessionsRes.ok) {
          if (!cancelled) {
            setErrorMsg("Impossible de charger les données du planning.");
            setLoading(false);
          }
          return;
        }

        const plansData = await plansRes.json();
        const sessionsData = await sessionsRes.json();

        if (cancelled) return;

        const planList: PlanMeta[] = plansData.plans ?? [];
        const sessionList: SessionOption[] = sessionsData.sessions ?? [];

        setPlans(planList);
        setSessions(sessionList);

        const active =
          planList.find((p) => p.isActive) ?? planList[0] ?? null;
        if (active) {
          setSelectedPlanId(active.id);
          setPlanName(active.name);
        }

        setLoading(false);
      } catch (e) {
        console.error(e);
        if (!cancelled) {
          setErrorMsg("Erreur lors du chargement du planning.");
          setLoading(false);
        }
      }
    }

    load();
    return () => {
      cancelled = true;
    };
  }, []);

  // Charger détails du planning sélectionné
  useEffect(() => {
    let cancelled = false;

    async function loadDetail(planId: string) {
      setDays([]);
      setErrorMsg(null);
      try {
        const res = await fetch(`/api/plans/detail?planId=${planId}`);
        if (!res.ok) {
          if (!cancelled) {
            setErrorMsg("Impossible de charger ce planning.");
          }
          return;
        }
        const data = await res.json();
        if (cancelled) return;

        const rawDays: DayDetail[] = data.days ?? [];
        const map = new Map<DayName, DayDetail>();
        rawDays.forEach((d) => map.set(d.day, d));

        const normalized: DayDetail[] = DAY_ORDER.map((day) => {
          const found = map.get(day);
          if (found) return found;
          return { day, isRest: true, session: null };
        });

        setDays(normalized);
        setPlanName(data.name ?? "");
      } catch (e) {
        console.error(e);
        if (!cancelled) {
          setErrorMsg("Erreur lors du chargement des jours.");
        }
      }
    }

    if (selectedPlanId) {
      loadDetail(selectedPlanId);
    }
    return () => {
      cancelled = true;
    };
  }, [selectedPlanId]);

  async function handleSetActive(planId: string) {
    try {
      await fetch("/api/plans/set-active", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ planId }),
      });
      setPlans((prev) =>
        prev.map((p) => ({ ...p, isActive: p.id === planId }))
      );
      setSelectedPlanId(planId);
      router.refresh();
    } catch (e) {
      console.error(e);
    }
  }

  async function handleDuplicate(planId: string) {
    try {
      const res = await fetch("/api/plans/duplicate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ planId }),
      });
      if (!res.ok) return;
      const data = await res.json();
      const newPlan: PlanMeta = {
        id: data.id,
        name: data.name,
        isActive: true,
        templateType: "custom",
      };
      setPlans((prev) =>
        prev.map((p) => ({ ...p, isActive: false })).concat(newPlan)
      );
      setSelectedPlanId(newPlan.id);
      setPlanName(newPlan.name);
      router.refresh();
    } catch (e) {
      console.error(e);
    }
  }

  async function handleSaveDays() {
    if (!selectedPlanId) return;
    setSaving(true);
    setErrorMsg(null);
    try {
      const payload = {
        planId: selectedPlanId,
        name: planName,
        days: days.map((d) => ({
          day: d.day,
          isRest: d.isRest || !d.session,
          sessionSlug: d.session ? d.session.slug : null,
        })),
      };

      const res = await fetch("/api/plans/update-days", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        setErrorMsg(
          data.error || "Impossible d'enregistrer les modifications."
        );
        setSaving(false);
        return;
      }

      setPlans((prev) =>
        prev.map((p) =>
          p.id === selectedPlanId ? { ...p, name: planName } : p
        )
      );

      setSaving(false);
      router.refresh();
    } catch (e) {
      console.error(e);
      setErrorMsg("Erreur lors de l'enregistrement.");
      setSaving(false);
    }
  }

  function handleChangeDaySession(day: DayName, value: string) {
    setDays((prev) =>
      prev.map((d) => {
        if (d.day !== day) return d;
        if (value === "rest") {
          return { ...d, isRest: true, session: null };
        }
        const s = sessions.find((s) => s.slug === value) ?? null;
        return { ...d, isRest: !s, session: s };
      })
    );
  }

  if (loading) {
    return (
      <main className="px-4 pb-4 pt-3">
        <p className="text-sm text-slate-200">Chargement du planning…</p>
      </main>
    );
  }

  if (!plans.length) {
    return (
      <main className="px-4 pb-4 pt-3 space-y-3">
        <p className="text-sm text-slate-200">
          Aucun planning trouvé. Tu peux en créer un depuis
          l&apos;onboarding.
        </p>
      </main>
    );
  }

  const activePlan = plans.find((p) => p.isActive) ?? plans[0];

  return (
    <main className="px-4 pb-4 pt-3 space-y-4">
      {/* Bouton retour */}
      <button
        type="button"
        onClick={() => router.push("/planning")}
        className="inline-flex items-center gap-1 rounded-full border border-slate-800 bg-slate-950/80 px-3 py-1 text-[11px] text-slate-300 hover:bg-slate-900"
      >
        <span className="text-sm">←</span>
        <span>Retour au planning</span>
      </button>

      {/* Header harmonisé avec /planning */}
      <header className="space-y-1">
        <p className="text-[11px] uppercase tracking-[0.18em] text-slate-500">
          Planning
        </p>
        <h1 className="text-2xl font-semibold text-slate-50">
          Gérer ton programme
        </h1>
        <p className="text-xs text-slate-400">
          Choisis quel planning est actif, renomme-le et décide de la
          séance prévue pour chaque jour de la semaine.
        </p>
      </header>

      {errorMsg && (
        <p className="text-[11px] text-red-300">{errorMsg}</p>
      )}

      {/* Liste des plannings */}
      <section className="rounded-3xl border border-slate-800 bg-slate-950/90 px-3 py-3 space-y-2">
        <div className="flex items-center justify-between">
          <p className="text-[11px] text-slate-400 uppercase tracking-[0.14em]">
            Tes plannings
          </p>
          <p className="text-[10px] text-slate-500">
            Actif : {activePlan.name}
          </p>
        </div>
        <div className="space-y-1.5">
          {plans.map((p) => {
            const isSelected = selectedPlanId === p.id;
            const isActive = p.isActive;

            return (
              <button
                key={p.id}
                type="button"
                onClick={() => {
                  setSelectedPlanId(p.id);
                  setPlanName(p.name);
                }}
                className={
                  "w-full flex items-center justify-between rounded-2xl border px-3 py-2 text-xs text-left transition " +
                  (isSelected
                    ? "border-sky-500/60 bg-sky-500/10"
                    : "border-slate-800 bg-slate-900/80")
                }
              >
                <div className="flex flex-col">
                  <span className="font-medium text-slate-50">
                    {p.name}
                  </span>
                  <span className="text-[10px] text-slate-400 flex items-center gap-1">
                    {isActive && (
                      <span className="inline-flex items-center rounded-full border border-emerald-500/60 bg-emerald-500/10 px-2 py-[1px] text-[9px] text-emerald-100">
                        Actif
                      </span>
                    )}
                    {isSelected && (
                      <span className="inline-flex items-center rounded-full border border-sky-500/60 bg-sky-500/10 px-2 py-[1px] text-[9px] text-sky-100">
                        En édition
                      </span>
                    )}
                    {p.templateType && !isSelected && (
                      <span className="text-[9px] text-slate-500">
                        {p.templateType}
                      </span>
                    )}
                  </span>
                </div>
                <div className="flex items-center gap-1.5">
                  {!isActive && (
                    <span
                      onClick={(e) => {
                        e.stopPropagation();
                        handleSetActive(p.id);
                      }}
                      className="inline-flex items-center rounded-full border border-emerald-600/70 bg-emerald-600/10 px-2 py-1 text-[10px] text-emerald-100"
                    >
                      Activer
                    </span>
                  )}
                  <span
                    onClick={(e) => {
                      e.stopPropagation();
                      handleDuplicate(p.id);
                    }}
                    className="inline-flex items-center rounded-full border border-slate-700 bg-slate-900/80 px-2 py-1 text-[10px] text-slate-200"
                  >
                    Dupliquer
                  </span>
                </div>
              </button>
            );
          })}
        </div>
      </section>

      {/* Édition du planning sélectionné */}
      <section className="rounded-3xl border border-slate-800 bg-slate-950/90 px-3 py-3 space-y-3">
        <div className="space-y-2">
          <p className="text-[11px] text-slate-400 uppercase tracking-[0.14em]">
            Planning sélectionné
          </p>
          <input
            type="text"
            value={planName}
            onChange={(e) => setPlanName(e.target.value)}
            className="w-full rounded-2xl border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-slate-100 outline-none focus:border-sky-500"
            placeholder="Nom du planning"
          />
          <p className="text-[10px] text-slate-500">
            Renomme ton programme pour t&apos;y retrouver facilement
            (ex: &quot;Programme street-workout 5 jours&quot;).
          </p>
        </div>

        <div className="space-y-1.5">
          {days.map((d) => (
            <div
              key={d.day}
              className="flex items-center justify-between gap-2 rounded-2xl border border-slate-800 bg-slate-900/80 px-2 py-1.5"
            >
              <div className="flex flex-col">
                <span className="text-[11px] font-medium text-slate-100">
                  {DAY_LABEL[d.day]}
                </span>
                <span className="text-[10px] text-slate-500">
                  {d.isRest || !d.session
                    ? "Jour de repos"
                    : d.session?.name}
                </span>
              </div>
              <select
                value={d.isRest || !d.session ? "rest" : d.session!.slug}
                onChange={(e) =>
                  handleChangeDaySession(d.day, e.target.value)
                }
                className="rounded-xl border border-slate-700 bg-slate-950 px-2 py-1 text-[11px] text-slate-100"
              >
                <option value="rest">Repos</option>
                {sessions.map((s) => (
                  <option key={s.id} value={s.slug}>
                    {s.name}
                  </option>
                ))}
              </select>
            </div>
          ))}
        </div>

        <button
          type="button"
          disabled={saving}
          onClick={handleSaveDays}
          className="mt-1 w-full rounded-xl bg-sky-500 px-4 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-sky-400 active:scale-[0.99] disabled:opacity-60 disabled:cursor-not-allowed"
        >
          {saving ? "Enregistrement…" : "Enregistrer les modifications"}
        </button>
      </section>
    </main>
  );
}
