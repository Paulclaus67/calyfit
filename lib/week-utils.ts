// lib/week-utils.ts
import type { DayName, DayPlan, WeekPlan, Session } from "./types";
import {
  demoSessionSeanceDos,
  demoSessionSeanceJambes,
  demoSessionCircuitPecTriceps,
  demoSessionCircuitBiceps,
  demoSessionRoutinePompes,
} from "./demo-data";

// Map jour JS (0 = dimanche, 1 = lundi, ...) -> DayName
export function getDayNameFromDate(date: Date): DayName {
  const jsDay = date.getDay(); // 0 (dimanche) à 6 (samedi)
  switch (jsDay) {
    case 1:
      return "monday";
    case 2:
      return "tuesday";
    case 3:
      return "wednesday";
    case 4:
      return "thursday";
    case 5:
      return "friday";
    case 6:
      return "saturday";
    case 0:
    default:
      return "sunday";
  }
}

export function getDayPlanForDate(
  weekPlan: WeekPlan,
  date: Date
): DayPlan | undefined {
  const dayName = getDayNameFromDate(date);
  return weekPlan.days.find((d) => d.day === dayName);
}

const sessionMap: Record<string, Session> = {
  seance_dos: demoSessionSeanceDos,
  seance_jambes: demoSessionSeanceJambes,
  circuit_pec_triceps: demoSessionCircuitPecTriceps,
  circuit_biceps: demoSessionCircuitBiceps,
  routine_pompes: demoSessionRoutinePompes,
};

export function getSessionForDayPlan(dayPlan?: DayPlan): Session | undefined {
  if (!dayPlan?.sessionId) return undefined;
  return sessionMap[dayPlan.sessionId];
}
