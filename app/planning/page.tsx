import Link from "next/link";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth-server";

type DayName =
  | "monday"
  | "tuesday"
  | "wednesday"
  | "thursday"
  | "friday"
  | "saturday"
  | "sunday";

const DAY_ORDER: { key: DayName; label: string; short: string }[] = [
  { key: "monday", label: "Lundi", short: "Lun" },
  { key: "tuesday", label: "Mardi", short: "Mar" },
  { key: "wednesday", label: "Mercredi", short: "Mer" },
  { key: "thursday", label: "Jeudi", short: "Jeu" },
  { key: "friday", label: "Vendredi", short: "Ven" },
  { key: "saturday", label: "Samedi", short: "Sam" },
  { key: "sunday", label: "Dimanche", short: "Dim" },
];

// mapping Date.getDay() -> DayName
const JS_TO_DAYNAME: DayName[] = [
  "sunday", // 0
  "monday", // 1
  "tuesday",
  "wednesday",
  "thursday",
  "friday",
  "saturday",
];

export default async function PlanningPage() {
  const user = await getCurrentUser();
  if (!user) {
    redirect("/login");
  }

  const userId = user.id;

  // 1) Planning actif en base
  let dbWeekPlan = await prisma.weekPlan.findFirst({
    where: { userId, isActive: true },
    include: {
      days: {
        include: {
          session: true,
        },
      },
    },
  });

  // 2) Fallback pour anciens comptes
  if (!dbWeekPlan) {
    dbWeekPlan = await prisma.weekPlan.findFirst({
      where: { userId },
      include: {
        days: {
          include: {
            session: true,
          },
        },
      },
    });

    if (!dbWeekPlan) {
      redirect("/onboarding");
    }
  }

  const weekPlanForClient = {
    id: dbWeekPlan!.id,
    name: dbWeekPlan!.name,
    days: dbWeekPlan!.days.map((d) => ({
      id: d.id,
      day: d.day as DayName,
      isRest: d.isRest,
      session: d.session
        ? {
            id: d.session.id,
            name: d.session.name,
            slug: d.session.slug,
          }
        : null,
    })),
  };

  // 3) Jour actuel
  const now = new Date();
  const todayJs = now.getDay();
  const todayKey: DayName = JS_TO_DAYNAME[todayJs];

  // 4) Récupérer les séances FAITES cette semaine (en base)
  const weekStart = new Date(now);
  weekStart.setHours(0, 0, 0, 0);
  const jsDay = weekStart.getDay(); // 0=dim,1=lun...
  // on se ramène au lundi
  const diffToMonday = (jsDay + 6) % 7; // lundi => 0, mardi => 1, ...
  weekStart.setDate(weekStart.getDate() - diffToMonday);

  const weekEnd = new Date(weekStart);
  weekEnd.setDate(weekEnd.getDate() + 7);

  const historyThisWeek = await prisma.sessionHistory.findMany({
    where: {
      userId,
      finishedAt: {
        gte: weekStart,
        lt: weekEnd,
      },
    },
    include: {
      session: {
        select: { slug: true },
      },
    },
  });

  const doneThisWeekSlugs = new Set(
    historyThisWeek
      .map((h) => h.session?.slug)
      .filter((s): s is string => Boolean(s))
  );

  // 5) Normaliser l'ordre des jours
  const daysMap = new Map<
    DayName,
    (typeof weekPlanForClient)["days"][number]
  >();
  weekPlanForClient.days.forEach((d) => daysMap.set(d.day, d));

  const orderedDays = DAY_ORDER.map(({ key, label, short }) => {
    const found = daysMap.get(key);
    const base =
      found ?? {
        id: `${weekPlanForClient.id}-${key}`,
        day: key,
        isRest: true,
        session: null,
      };
    return { ...base, label, short };
  });

  return (
    <main className="px-4 pb-4 pt-3 space-y-4">
      {/* HEADER */}
      <header className="space-y-1 pb-2">
        <p className="text-[11px] uppercase tracking-[0.18em] text-slate-500">
          Planning
        </p>

        <div className="flex items-center justify-between gap-3">
          <h1 className="text-2xl font-semibold text-slate-50">
            Ta semaine type
          </h1>

          <a
            href="/planning/manage"
            className="rounded-full border border-slate-700 bg-slate-900/80 px-3 py-1.5 text-[11px] text-slate-200 hover:bg-slate-800"
          >
            Gérer
          </a>
        </div>

        <p className="text-xs text-slate-400">
          Vue rapide de tes séances prévues pour chaque jour.
        </p>
      </header>

      {/* RUBAN JOURS DE LA SEMAINE */}
      <section className="flex items-center justify-between gap-1 rounded-2xl border border-slate-800 bg-slate-950/80 px-2 py-2">
        {orderedDays.map((d) => {
          const isRest = d.isRest || !d.session;
          const isToday = d.day === todayKey;
          const isDoneThisWeek =
            !isRest && d.session && doneThisWeekSlugs.has(d.session.slug);

          let pillClasses =
            "flex flex-1 flex-col items-center gap-0.5 rounded-xl px-1.5 py-1 text-[10px] border ";

          if (isRest) {
            pillClasses += "border-transparent text-slate-500";
          } else if (isDoneThisWeek) {
            pillClasses +=
              "border-emerald-500/40 bg-emerald-500/15 text-emerald-100";
          } else {
            pillClasses +=
              "border-sky-500/30 bg-sky-500/10 text-sky-100";
          }

          if (isToday) {
            pillClasses +=
              " ring-1 ring-sky-400/80 shadow-[0_0_0_1px_rgba(56,189,248,0.4)]";
          }

          return (
            <div key={d.day} className={pillClasses}>
              <span className="uppercase tracking-[0.14em] text-[9px]">
                {d.short}
              </span>
              <span
                className={
                  "h-1 w-1 rounded-full " +
                  (isDoneThisWeek
                    ? "bg-emerald-300"
                    : isToday
                    ? "bg-sky-300"
                    : "bg-slate-700")
                }
              />
            </div>
          );
        })}
      </section>

      {/* DÉTAILS PAR JOUR */}
      <section className="space-y-2">
        {orderedDays.map((d) => {
          const isRest = d.isRest || !d.session;
          const isToday = d.day === todayKey;
          const isDoneThisWeek =
            !isRest && d.session && doneThisWeekSlugs.has(d.session.slug);
          const sessionName = d.session?.name ?? "Jour de repos";

          let containerClasses =
            "flex items-center justify-between gap-3 rounded-2xl border px-3 py-2.5 text-sm transition-colors ";

          if (isRest) {
            containerClasses +=
              "border-slate-800 bg-slate-950/90 text-slate-300";
          } else if (isDoneThisWeek) {
            containerClasses +=
              "border-emerald-500/50 bg-emerald-500/10 text-emerald-50";
          } else {
            containerClasses +=
              "border-sky-500/30 bg-sky-500/8 text-slate-50";
          }

          if (isToday) {
            containerClasses += " ring-1 ring-sky-500/70 shadow-md";
          }

          const content = (
            <div className={containerClasses}>
              <div className="flex flex-col">
                <span className="text-[11px] font-medium text-slate-100">
                  {d.label}
                  {isToday && (
                    <span className="ml-1.5 rounded-full bg-sky-500/20 px-2 py-[1px] text-[9px] font-normal text-sky-100">
                      Aujourd&apos;hui
                    </span>
                  )}
                </span>
                <span className="text-[11px] text-slate-400">
                  {sessionName}
                </span>
              </div>

              {/* Badge côté droit */}
              {isRest && (
                <span className="rounded-full border border-slate-700 bg-slate-900/80 px-2 py-1 text-[10px] text-slate-300">
                  Repos
                </span>
              )}
              {!isRest && !isDoneThisWeek && (
                <span className="rounded-full border border-sky-500/40 bg-sky-500/15 px-2 py-1 text-[10px] text-sky-100">
                  Séance prévue
                </span>
              )}
              {!isRest && isDoneThisWeek && (
                <span className="rounded-full border border-emerald-500/60 bg-emerald-500/20 px-2 py-1 text-[10px] text-emerald-100">
                  Séance faite
                </span>
              )}
            </div>
          );

          // Si repos → pas cliquable
          if (isRest || !d.session) {
            return (
              <div key={d.day}>
                {content}
              </div>
            );
          }

          // Si séance prévue → la carte entière devient un lien vers la séance
          return (
            <Link
              key={d.day}
              href={`/sessions/${d.session.slug}`}
              className="block"
            >
              {content}
            </Link>
          );
        })}
      </section>

      {/* CARTE EN BAS : PROGRAMME ACTIF, BIEN DISTINCTE */}
      {weekPlanForClient && (
        <section className="mt-3 rounded-3xl border border-sky-700/80 bg-gradient-to-r from-sky-950 via-slate-950 to-slate-950 px-3 py-3 shadow-[0_14px_40px_rgba(15,23,42,0.9)]">
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <span className="h-2 w-2 rounded-full bg-emerald-400 shadow-[0_0_12px_rgba(52,211,153,0.7)]" />
              <div className="flex flex-col">
                <span className="text-[11px] text-sky-200">
                  Programme actuellement utilisé
                </span>
                <span className="text-xs font-semibold text-slate-50 truncate max-w-[180px]">
                  {weekPlanForClient.name}
                </span>
              </div>
            </div>

            <a
              href="/planning/manage"
              className="rounded-full border border-sky-400 bg-sky-500/20 px-3 py-1.5 text-[11px] font-semibold text-sky-50 hover:bg-sky-400/30"
            >
              Modifier ce programme
            </a>
          </div>

          <p className="mt-1.5 text-[10px] text-slate-200">
            Ce programme sert de base pour l&apos;accueil, la séance du jour
            et tes statistiques.
          </p>
        </section>
      )}
    </main>
  );
}
