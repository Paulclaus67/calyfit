// lib/types.ts

//
// 1) Types de base
//

// Groupes musculaires principaux
export type MuscleGroup =
  | "back"
  | "chest"
  | "shoulders"
  | "biceps"
  | "triceps"
  | "legs"
  | "glutes"
  | "core"
  | "forearms"
  | "hip_flexors";



// Intensité musculaire : 1 = +, 2 = ++, 3 = +++
export type MuscleIntensity = 1 | 2 | 3;

// Pour mapper un exercice -> muscles travaillés
export type MuscleMap = Partial<Record<MuscleGroup, MuscleIntensity>>;

// Catégorie “logique” de l’exercice
export type ExerciseCategory =
  | "pull"
  | "push"
  | "legs"
  | "core"
  | "full_body"
  | "other";

// Niveau de difficulté (pour filtrer plus tard)
export type DifficultyLevel = "beginner" | "intermediate" | "advanced";

// Matériel nécessaire (on pourra en rajouter si besoin)
export type Equipment =
  | "none"
  | "bar" // barre de traction
  | "low_bar" // barre basse pour australiennes
  | "dip_bars"
  | "bench"
  | "rings";

//
// 2) Exercise
//

export type ExerciseId = string;

export interface Exercise {
  id: ExerciseId;
  // Nom affiché (ex: "Tractions pronation")
  name: string;
  // Pour des URL propres / clés internes (ex: "tractions_pronation")
  slug: string;
  category: ExerciseCategory;
  difficulty: DifficultyLevel;

  // Matériel possible pour cet exo
  equipment: Equipment[];

  // Description courte de ce que c'est
  description?: string;

  // Quelques consignes techniques (liste courte)
  cues?: string[]; // ex: ["Poitrine vers la barre", "Épaules basses"]

  // Mapping vers les muscles travaillés (comme tes petits tableaux ++/+++)
  muscles?: MuscleMap;

  // Tags libres (ex: ["explosif", "negatives", "australienne"])
  tags?: string[];

  // Image / dessin éventuel
  imageUrl?: string;
}

//
// 3) Session & SessionExercise
//

// Type de séance : classique (séries) ou circuit
export type SessionType = "classic" | "circuit";

// Répétitions : nombre fixe, "max", ou work-by-time
export type RepetitionScheme =
  | {
      type: "reps";
      value: number | "max"; // ex: 10, 15, "max"
    }
  | {
      type: "time";
      seconds: number; // ex: planche 30s
    };

// Un exercice INSIDE une séance
export interface SessionExercise {
  id: string; // id unique de la ligne dans la séance
  exerciseId: ExerciseId; // référence vers Exercise

  order: number; // ordre dans la séance / circuit

  sets: number; // nombre de séries ou de tours pour cet exo
  reps: RepetitionScheme; // reps ou temps

  // Repos spécifique après cet exercice (en secondes)
  restSeconds: number;

  // Note spécifique (ex: "finir en négatives", "1s pause en bas")
  note?: string;
}

// La séance complète (dos, jambes, circuit pec/triceps, etc.)
export interface Session {
  id: string;
  name: string; // ex: "Séance dos"
  slug: string; // ex: "seance_dos"
  type: SessionType;

  // Estimation de durée, pour afficher "≈ 45 min"
  estimatedDurationMinutes?: number;

  // Pour les circuits : nb de tours, repos entre exos & entre tours
  rounds?: number;
  restBetweenExercisesSeconds?: number;
  restBetweenRoundsSeconds?: number;

  // Liste ordonnée des exos de la séance
  items: SessionExercise[];

  // Description / notes globales (ex: "Toujours garder le même nb de reps entre exos")
  notes?: string;
}

//
// 4) WeekPlan (planning hebdo)
//

// Nom des jours (on reste en anglais pour la cohérence du code)
export type DayName =
  | "monday"
  | "tuesday"
  | "wednesday"
  | "thursday"
  | "friday"
  | "saturday"
  | "sunday";

// Plan pour un jour : échauffement + séance + repos éventuel
export interface DayPlan {
  day: DayName;

  // Id de la séance principale (Séance dos, Circuit pec/triceps, etc.)
  sessionId?: string;

  // Échauffement / mobilité
  warmupMinutes?: number;
  warmupDescription?: string;

  // Si c’est un jour de repos
  isRest?: boolean;
}

// Un programme hebdo complet (comme ta feuille planning)
export interface WeekPlan {
  id: string;
  name: string; // ex: "Programme street-workout 5j"
  description?: string;

  // Les 7 jours
  days: DayPlan[];
}
