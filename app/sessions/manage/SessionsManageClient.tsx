"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";

type SessionOption = {
  id: string;
  slug: string;
  name: string;
  type: string;
  estimatedDurationMinutes: number | null;
};

type SessionItemForm = {
  exerciseId: string;
  exerciseName: string;
  muscleGroup: string;
  sets: number;
  reps: string;
  restSeconds: number | null;
};

type ExerciseOption = {
  id: string;
  name: string;
  muscleGroup: string;
};

type ExerciseGroups = Record<string, ExerciseOption[]>;

type SessionDetailResponse = {
  id: string;
  name: string;
  items: {
    exerciseId: string;
    exerciseName: string;
    muscleGroup: string;
    sets: number;
    reps: string;
    restSeconds: number | null;
  }[];
};

export default function SessionsManageClient() {
  const router = useRouter();

  const [sessions, setSessions] = useState<SessionOption[]>([]);
  const [selectedSessionId, setSelectedSessionId] = useState<string | null>(
    null
  );
  const [sessionName, setSessionName] = useState("");
  const [items, setItems] = useState<SessionItemForm[]>([]);
  const [exerciseGroups, setExerciseGroups] = useState<ExerciseGroups>({});
  const [activeMuscleGroup, setActiveMuscleGroup] = useState<string | null>(
    null
  );
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Charger les séances + exos
  useEffect(() => {
    let cancelled = false;

    async function load() {
      try {
        const [sessionsRes, exercisesRes] = await Promise.all([
          fetch("/api/sessions/all"),
          fetch("/api/exercises/by-muscle"),
        ]);

        if (!sessionsRes.ok || !exercisesRes.ok) {
          if (!cancelled) {
            setErrorMsg("Impossible de charger les données des séances.");
            setLoading(false);
          }
          return;
        }

        const sessionsData = await sessionsRes.json();
        const exercisesData = await exercisesRes.json();

        if (cancelled) return;

        const sessionList: SessionOption[] = sessionsData.sessions ?? [];
        const groups: ExerciseGroups = exercisesData.groups ?? {};

        setSessions(sessionList);
        setExerciseGroups(groups);

        const defaultSession = sessionList[0] ?? null;
        if (defaultSession) {
          setSelectedSessionId(defaultSession.id);
        }

        const muscleKeys = Object.keys(groups);
        if (muscleKeys.length > 0) {
          setActiveMuscleGroup(muscleKeys[0]);
        }

        setLoading(false);
      } catch (e) {
        console.error(e);
        if (!cancelled) {
          setErrorMsg("Erreur lors du chargement des séances.");
          setLoading(false);
        }
      }
    }

    load();
    return () => {
      cancelled = true;
    };
  }, []);

  // Charger le détail de la séance sélectionnée
  useEffect(() => {
    let cancelled = false;

    async function loadDetail(sessionId: string) {
      setItems([]);
      setErrorMsg(null);
      try {
        const res = await fetch(`/api/sessions/detail?sessionId=${sessionId}`);
        if (!res.ok) {
          if (!cancelled) {
            setErrorMsg("Impossible de charger cette séance.");
          }
          return;
        }
        const data: SessionDetailResponse = await res.json();
        if (cancelled) return;

        setSessionName(data.name ?? "");

        const mapped: SessionItemForm[] = data.items.map((it) => ({
          exerciseId: it.exerciseId,
          exerciseName: it.exerciseName,
          muscleGroup: it.muscleGroup,
          sets: it.sets,
          reps: it.reps,
          restSeconds: it.restSeconds,
        }));

        setItems(mapped);
      } catch (e) {
        console.error(e);
        if (!cancelled) {
          setErrorMsg("Erreur lors du chargement du détail de la séance.");
        }
      }
    }

    if (selectedSessionId) {
      loadDetail(selectedSessionId);
    }
    return () => {
      cancelled = true;
    };
  }, [selectedSessionId]);

  const muscleTabs = useMemo(
    () => Object.keys(exerciseGroups),
    [exerciseGroups]
  );

  function handleAddExercise(ex: ExerciseOption) {
    setItems((prev) => [
      ...prev,
      {
        exerciseId: ex.id,
        exerciseName: ex.name,
        muscleGroup: ex.muscleGroup,
        sets: 3,
        reps: "8-12",
        restSeconds: 90,
      },
    ]);
  }

  function handleChangeItem(index: number, patch: Partial<SessionItemForm>) {
    setItems((prev) =>
      prev.map((it, i) => (i === index ? { ...it, ...patch } : it))
    );
  }

  function handleRemoveItem(index: number) {
    setItems((prev) => prev.filter((_, i) => i !== index));
  }

  async function handleSave() {
    if (!selectedSessionId) return;
    if (items.length === 0) {
      setErrorMsg("Ajoute au moins un exercice à la séance.");
      return;
    }
    setSaving(true);
    setErrorMsg(null);

    try {
      const payload = {
        sessionId: selectedSessionId,
        name: sessionName,
        items: items.map((it) => ({
          exerciseId: it.exerciseId,
          sets: it.sets,
          reps: it.reps,
          restSeconds: it.restSeconds,
        })),
      };

      const res = await fetch("/api/sessions/update", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        setErrorMsg(
          data.error || "Impossible d'enregistrer la séance."
        );
        setSaving(false);
        return;
      }

      setSaving(false);
      router.refresh();
    } catch (e) {
      console.error(e);
      setErrorMsg("Erreur inattendue lors de l'enregistrement.");
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <main className="px-4 pb-4 pt-3">
        <p className="text-sm text-slate-200">Chargement des séances…</p>
      </main>
    );
  }

  if (!sessions.length) {
    return (
      <main className="px-4 pb-4 pt-3 space-y-3">
        <p className="text-sm text-slate-200">
          Aucune séance trouvée pour l&apos;instant.
        </p>
      </main>
    );
  }

  const selectedSession = sessions.find((s) => s.id === selectedSessionId);

  return (
    <main className="px-4 pb-4 pt-3 space-y-4">
      {/* Bouton retour */}
      <button
        type="button"
        onClick={() => router.push("/sessions")}
        className="inline-flex items-center gap-1 rounded-full border border-slate-800 bg-slate-950/80 px-3 py-1 text-[11px] text-slate-300 hover:bg-slate-900"
      >
        <span className="text-sm">←</span>
        <span>Retour aux séances</span>
      </button>

      {/* HEADER */}
      <header className="space-y-1">
        <p className="text-[11px] uppercase tracking-[0.18em] text-slate-500">
          Séances
        </p>
        <h1 className="text-2xl font-semibold text-slate-50">
          Personnalise tes séances
        </h1>
        <p className="text-xs text-slate-400">
          Adapte les exercices, séries et repos à ton niveau et à ta façon de
          t&apos;entraîner.
        </p>
      </header>

      {errorMsg && <p className="text-[11px] text-red-300">{errorMsg}</p>}

      {/* Séance à personnaliser */}
      <section className="rounded-3xl border border-slate-800 bg-slate-950/90 px-3 py-3 space-y-2">
        <p className="text-[11px] text-slate-400 uppercase tracking-[0.14em]">
          Séance à personnaliser
        </p>
        <div className="flex flex-wrap gap-2">
          {sessions.map((s) => {
            const active = s.id === selectedSessionId;
            return (
              <button
                key={s.id}
                type="button"
                onClick={() => {
                  setSelectedSessionId(s.id);
                  setSessionName(s.name);
                }}
                className={
                  "rounded-full border px-3 py-1.5 text-[11px] transition " +
                  (active
                    ? "border-sky-500 bg-sky-500/15 text-sky-100"
                    : "border-slate-700 bg-slate-900/80 text-slate-300")
                }
              >
                {s.name}
              </button>
            );
          })}
        </div>
      </section>

      {/* Détails de la séance */}
      <section className="rounded-3xl border border-slate-800 bg-slate-950/90 px-3 py-3 space-y-3">
        <p className="text-[11px] text-slate-400 uppercase tracking-[0.14em]">
          Détails de la séance
        </p>
        <input
          type="text"
          value={sessionName}
          onChange={(e) => setSessionName(e.target.value)}
          className="w-full rounded-2xl border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-slate-100 outline-none focus:border-sky-500"
          placeholder={selectedSession?.name ?? "Nom de la séance"}
        />
        <p className="text-[10px] text-slate-500">
          Donne un nom qui te parle (ex: “Dos + biceps lourd”, “Full body
          rapide”…).
        </p>
      </section>

      {/* Exercices de la séance */}
      <section className="rounded-3xl border border-slate-800 bg-slate-950/90 px-3 py-3 space-y-3">
        <div className="flex items-center justify-between">
          <p className="text-[11px] text-slate-400 uppercase tracking-[0.14em]">
            Exercices de la séance
          </p>
          <p className="text-[10px] text-slate-500">
            {items.length} exercice{items.length > 1 ? "s" : ""}
          </p>
        </div>

        {items.length === 0 && (
          <p className="text-[11px] text-slate-500">
            Ajoute des exercices depuis la bibliothèque en dessous 👇
          </p>
        )}

        <div className="space-y-2">
          {items.map((it, index) => (
            <div
              key={index}
              className="rounded-2xl border border-slate-800 bg-slate-900/80 px-3 py-2 space-y-1"
            >
              <div className="flex items-center justify-between gap-2">
                <div>
                  <p className="text-[12px] font-medium text-slate-100">
                    {it.exerciseName}
                  </p>
                  <p className="text-[10px] text-slate-500">
                    {it.muscleGroup}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    const ok = window.confirm(
                      "Tu es sûr de vouloir supprimer cet exercice de la séance ?"
                    );
                    if (!ok) return;
                    handleRemoveItem(index);
                  }}
                  className="
                    flex h-7 w-7 items-center justify-center
                    rounded-full border border-red-500/60
                    bg-red-500/10 text-[12px] font-bold
                    text-red-300 hover:bg-red-500/20
                    active:scale-95 transition
                  "
                  aria-label="Supprimer cet exercice"
                >
                  ✕
                </button>
              </div>

              <div className="flex items-center gap-2 text-[11px]">
                <div className="flex flex-1 flex-col">
                  <span className="text-[10px] text-slate-500">Séries</span>
                  <input
                    type="number"
                    min={1}
                    max={20}
                    value={it.sets}
                    onChange={(e) =>
                      handleChangeItem(index, {
                        sets: Number(e.target.value) || 1,
                      })
                    }
                    className="w-full rounded-xl border border-slate-700 bg-slate-950 px-2 py-1 text-[11px] text-slate-100"
                  />
                </div>
                <div className="flex flex-1 flex-col">
                  <span className="text-[10px] text-slate-500">Reps</span>
                  <input
                    type="text"
                    value={it.reps}
                    onChange={(e) =>
                      handleChangeItem(index, { reps: e.target.value })
                    }
                    className="w-full rounded-xl border border-slate-700 bg-slate-950 px-2 py-1 text-[11px] text-slate-100"
                    placeholder="8-12"
                  />
                </div>
                <div className="flex flex-1 flex-col">
                  <span className="text-[10px] text-slate-500">
                    Repos (sec)
                  </span>
                  <input
                    type="number"
                    min={0}
                    max={600}
                    value={it.restSeconds ?? ""}
                    onChange={(e) =>
                      handleChangeItem(index, {
                        restSeconds:
                          e.target.value === ""
                            ? null
                            : Number(e.target.value),
                      })
                    }
                    className="w-full rounded-xl border border-slate-700 bg-slate-950 px-2 py-1 text-[11px] text-slate-100"
                    placeholder="90"
                  />
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

            {/* Bibliothèque d'exercices par muscle */}
      <section className="rounded-3xl border border-slate-800 bg-slate-950/90 px-3 py-3 space-y-3">
        <p className="text-[11px] text-slate-400 uppercase tracking-[0.14em]">
          Ajouter un exercice
        </p>

        {/* Onglets de muscles */}
        {muscleTabs.length > 0 && (
          <div className="flex flex-wrap gap-1.5">
            {muscleTabs.map((mg) => {
              const active = mg === activeMuscleGroup;

              // petit emoji en fonction du groupe
              let emoji = "🏋️‍♂️";
              if (mg === "Dos") emoji = "🦴";
              else if (mg === "Pecs") emoji = "💪";
              else if (mg === "Épaules") emoji = "🏹";
              else if (mg === "Biceps") emoji = "🦾";
              else if (mg === "Triceps") emoji = "🔱";
              else if (mg === "Jambes") emoji = "🦵";
              else if (mg === "Abdos / Core") emoji = "🧱";
              else if (mg === "Full body") emoji = "🔥";
              else if (mg === "Autres") emoji = "✨";

              return (
                <button
                  key={mg}
                  type="button"
                  onClick={() => setActiveMuscleGroup(mg)}
                  className={
                    "inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-[11px] transition " +
                    (active
                      ? "border-emerald-500 bg-emerald-500/15 text-emerald-100"
                      : "border-slate-700 bg-slate-900/80 text-slate-300")
                  }
                >
                  <span>{emoji}</span>
                  <span>{mg}</span>
                </button>
              );
            })}
          </div>
        )}

        {/* Liste des exos du groupe sélectionné */}
        {activeMuscleGroup && (
          <div className="space-y-1.5 max-h-56 overflow-y-auto pr-1">
            {(exerciseGroups[activeMuscleGroup] ?? []).map((ex) => (
              <button
                key={ex.id}
                type="button"
                onClick={() => handleAddExercise(ex)}
                className="flex w-full items-center justify-between rounded-2xl border border-slate-800 bg-slate-900/80 px-3 py-1.5 text-left text-[11px] text-slate-100 hover:bg-slate-900"
              >
                <span>{ex.name}</span>
                <span className="rounded-full border border-slate-600 bg-slate-800/80 px-2 py-[2px] text-[10px] text-slate-200">
                  + Ajouter
                </span>
              </button>
            ))}
          </div>
        )}
      </section>


      {/* Bouton sauvegarde */}
      <button
        type="button"
        disabled={saving}
        onClick={handleSave}
        className="w-full rounded-xl bg-sky-500 px-4 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-sky-400 active:scale-[0.99] disabled:opacity-60 disabled:cursor-not-allowed"
      >
        {saving ? "Enregistrement…" : "Enregistrer la séance"}
      </button>
    </main>
  );
}
