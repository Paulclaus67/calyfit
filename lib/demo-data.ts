// lib/demo-data.ts

import type {
  Exercise,
  Session,
  WeekPlan,
  MuscleMap,
  DayPlan,
} from "./types";

//
// 1) Exercices de base
//

const musclesTractions: MuscleMap = {
  back: 3,
  biceps: 2,
  core: 1,
  forearms: 2,
};

const musclesTractionsAustraliennes: MuscleMap = {
  back: 2,
  biceps: 2,
  core: 1,
  forearms: 1,
};

const musclesRelevesGenoux: MuscleMap = {
  core: 3,
  hip_flexors: 2,
  forearms: 2,
  back: 1,
};

const musclesPompes: MuscleMap = {
  chest: 3,
  triceps: 2,
  shoulders: 2,
  core: 1,
};

const musclesPompesTriceps: MuscleMap = {
  chest: 2,
  triceps: 3,
  shoulders: 1,
  core: 1,
};

const musclesJambes: MuscleMap = {
  legs: 3,
  glutes: 2,
  core: 1,
};

const musclesBiceps: MuscleMap = {
  biceps: 3,
  back: 1,
  forearms: 2,
};

export const demoExercises: Exercise[] = [
  // Tractions
  {
    id: "tractions_pronation",
    name: "Tractions pronation",
    slug: "tractions_pronation",
    category: "pull",
    difficulty: "intermediate",
    equipment: ["bar"],
    description:
      "Tractions à la barre en prise pronation, mains légèrement plus larges que les épaules.",
    cues: [
      "Poitrine vers la barre",
      "Épaules basses et serrées",
      "Ne pas tirer uniquement avec les bras",
    ],
    muscles: musclesTractions,
    tags: ["dos", "biceps", "pronation", "max reps"],
    imageUrl: "/images/exercises/tractions_pronation.png",
  },
  {
    id: "tractions_australiennes",
    name: "Tractions australiennes (pronation)",
    slug: "tractions_australiennes_pronation",
    category: "pull",
    difficulty: "beginner",
    equipment: ["low_bar"],
    description:
      "Tractions à la barre basse, corps incliné, pieds au sol. Permet de travailler le dos avec moins de charge.",
    cues: [
      "Corps gainé en planche",
      "Poitrine vers la barre",
      "Garder les coudes proches du corps",
    ],
    muscles: musclesTractionsAustraliennes,
    tags: ["dos", "biceps", "australienne"],
    imageUrl: "/images/exercises/tractions_australiennes.png",
  },
  {
    id: "releves_genoux_suspendu",
    name: "Relevés de genoux suspendu",
    slug: "releves_genoux_suspendu",
    category: "core",
    difficulty: "intermediate",
    equipment: ["bar"],
    description:
      "Suspension à la barre, relevé contrôlé des genoux vers la poitrine pour cibler les abdos.",
    cues: [
      "Ne pas balancer le corps",
      "Monter les genoux avec contrôle",
      "Garder les épaules engagées",
    ],
    muscles: musclesRelevesGenoux,
    tags: ["abdos", "suspendu", "core"],
    imageUrl: "/images/exercises/releves_genoux.png",
  },

  // Jambes
  {
    id: "pistol_squat",
    name: "Pistol squat",
    slug: "pistol_squat",
    category: "legs",
    difficulty: "advanced",
    equipment: ["none"],
    description:
      "Squat sur une jambe, l'autre jambe tendue devant, pour un gros travail de force et d'équilibre.",
    cues: [
      "Garder le buste le plus droit possible",
      "Contrôler la descente",
      "Ne pas s'effondrer en bas du mouvement",
    ],
    muscles: musclesJambes,
    tags: ["jambes", "unilatéral", "équilibre"],
    imageUrl: "/images/exercises/pistol_squat.png",
  },
  {
    id: "squat_saute",
    name: "Squats sautés",
    slug: "squat_saute",
    category: "legs",
    difficulty: "intermediate",
    equipment: ["none"],
    description:
      "Squats avec extension explosive et saut, pour travailler la puissance des jambes.",
    cues: [
      "Amortir le saut en douceur",
      "Garder les genoux alignés avec les pieds",
      "Rester gainé pendant tout le mouvement",
    ],
    muscles: musclesJambes,
    tags: ["jambes", "explosif"],
    imageUrl: "/images/exercises/squats_saute.png",
  },

  // Pompes & triceps
  {
    id: "pompes_classiques",
    name: "Pompes classiques",
    slug: "pompes_classiques",
    category: "push",
    difficulty: "beginner",
    equipment: ["none"],
    description:
      "Pompes standards en prise neutre, mains légèrement plus larges que les épaules.",
    cues: [
      "Corps bien gainé",
      "Poitrine qui se rapproche du sol",
      "Coude ni trop écartés ni collés",
    ],
    muscles: musclesPompes,
    tags: ["pompes", "classique"],
    imageUrl: "/images/exercises/pompes_classiques.png",
  },
  {
    id: "pompes_diamant",
    name: "Pompes diamant",
    slug: "pompes_diamant",
    category: "push",
    difficulty: "intermediate",
    equipment: ["none"],
    description:
      "Pompes avec les mains serrées en forme de diamant sous la poitrine, forte sollicitation des triceps.",
    cues: [
      "Garder les coudes proches du corps",
      "Descendre poitrine vers les mains",
      "Mains bien stables",
    ],
    muscles: musclesPompesTriceps,
    tags: ["pompes", "triceps", "serré"],
    imageUrl: "/images/exercises/pompes_diamant.png",
  },
  {
    id: "pompes_archer",
    name: "Pompes archer alternées",
    slug: "pompes_archer",
    category: "push",
    difficulty: "intermediate",
    equipment: ["none"],
    description:
      "Pompes avec une grande ouverture des mains, le poids du corps voyage d'un côté à l'autre.",
    cues: [
      "Garder le bras opposé presque tendu",
      "Contrôler la descente sur le côté chargé",
    ],
    muscles: musclesPompes,
    tags: ["pompes", "unilatéral", "archer"],
    imageUrl: "/images/exercises/pompes_archer.png",
  },
  {
    id: "pompes_epaule",
    name: "Pompes touché d’épaule alterné",
    slug: "pompes_epaule",
    category: "push",
    difficulty: "beginner",
    equipment: ["none"],
    description:
      "Pompes où tu touches une épaule avec la main opposée entre les répétitions, pour travailler le gainage.",
    cues: [
      "Éviter de trop tourner le bassin",
      "Garder les hanches stables",
    ],
    muscles: musclesPompes,
    tags: ["pompes", "gainage"],
    imageUrl: "/images/exercises/pompes_epaule.png",
  },
  {
    id: "pompes_explosives_negatives",
    name: "Pompes explosives négatives",
    slug: "pompes_explosives_negatives",
    category: "push",
    difficulty: "intermediate",
    equipment: ["none"],
    description:
      "Descente contrôlée (3–4s), puis remontée explosive, parfois avec décollage des mains.",
    cues: [
      "Descente très contrôlée",
      "Remontée la plus rapide possible",
      "Rester gainé",
    ],
    muscles: musclesPompes,
    tags: ["pompes", "explosif", "negatives"],
    imageUrl: "/images/exercises/pompes_explosives.png",
  },
  {
    id: "pompes_explosives_volantes",
    name: "Pompes volantes",
    slug: "pompes_volantes",
    category: "push",
    difficulty: "advanced",
    equipment: ["none"],
    description:
      "Pompes explosives avec décollage des mains, parfois atterrissage en prise serrée.",
    cues: [
      "Bien chauffer les poignets",
      "Amortir la réception",
      "Ne pas sacrifier la technique pour la hauteur",
    ],
    muscles: musclesPompes,
    tags: ["pompes", "explosif", "volant"],
    imageUrl: "/images/exercises/pompes_volantes.png",
  },
  {
    id: "pompes_90",
    name: "Pompes 90°",
    slug: "pompes_90",
    category: "push",
    difficulty: "advanced",
    equipment: ["none"],
    description:
      "Pompes avec buste penché vers l’avant, forte sollicitation des épaules et du haut des pecs.",
    cues: [
      "Pencher le poids vers l'avant",
      "Garder le gainage serré",
      "Descendre contrôlé",
    ],
    muscles: {
      chest: 2,
      shoulders: 3,
      triceps: 2,
      core: 2,
    },
    tags: ["pompes", "épaules"],
    imageUrl: "/images/exercises/pompes_90.png",
  },
  {
    id: "extension_triceps_sol",
    name: "Extension triceps au sol",
    slug: "extension_triceps_sol",
    category: "push",
    difficulty: "intermediate",
    equipment: ["none"],
    description:
      "Depuis une planche haute, descente sur les avant-bras puis retour en planche pour cibler les triceps.",
    cues: [
      "Garder les coudes sous les épaules",
      "Ne pas creuser le bas du dos",
    ],
    muscles: musclesPompesTriceps,
    tags: ["triceps", "gainage"],
    imageUrl: "/images/exercises/extension_triceps.png",
  },
  {
    id: "dips_paralleles",
    name: "Dips sur barres parallèles",
    slug: "dips_paralleles",
    category: "push",
    difficulty: "intermediate",
    equipment: ["dip_bars"],
    description:
      "Dips classiques sur barres parallèles pour travailler les triceps et les pecs inférieurs.",
    cues: [
      "Descendre avec contrôle",
      "Ne pas laisser les épaules monter vers les oreilles",
    ],
    muscles: {
      chest: 2,
      triceps: 3,
      shoulders: 1,
      core: 1,
    },
    tags: ["dips", "triceps", "pecs"],
    imageUrl: "/images/exercises/dips.png",
  },
  {
    id: "skullcrusher_pdc",
    name: "Skull-crusher au poids du corps",
    slug: "skullcrusher_pdc",
    category: "push",
    difficulty: "intermediate",
    equipment: ["bar", "low_bar"],
    description:
      "Variation d'extension triceps en amenant le front vers la barre puis en repoussant.",
    cues: [
      "Garder les coudes serrés",
      "Ne pas tirer avec les épaules",
    ],
    muscles: musclesPompesTriceps,
    tags: ["triceps", "isolation"],
    imageUrl: "/images/exercises/skullcrusher_pdc.png",
  },

  // Biceps / traction spécifiques circuit
  {
    id: "front_lever_tentative",
    name: "Tentative front lever / tirage",
    slug: "front_lever_tentative",
    category: "pull",
    difficulty: "advanced",
    equipment: ["bar"],
    description:
      "Tentatives de tirage type front lever pour surcharger les biceps et le dos.",
    cues: [
      "Garder les épaules engagées",
      "Ne pas cambrer exagérément",
    ],
    muscles: musclesBiceps,
    tags: ["biceps", "statique"],
    imageUrl: "/images/exercises/front_lever.png",
  },
  {
    id: "tuck_up_negatif",
    name: "Tuck-up négatif",
    slug: "tuck_up_negatif",
    category: "pull",
    difficulty: "advanced",
    equipment: ["bar"],
    description:
      "Mouvement contrôlé de type front lever en tuck, en mettant l'accent sur la phase négative.",
    cues: ["Contrôler la descente", "Garder les bras tendus"],
    muscles: musclesBiceps,
    tags: ["biceps", "negatives"],
    imageUrl: "/images/exercises/tuck_up.png",
  },
  {
    id: "traction_australienne_supination",
    name: "Tractions australiennes supination",
    slug: "traction_australienne_supination",
    category: "pull",
    difficulty: "beginner",
    equipment: ["low_bar"],
    description:
      "Variante d'australienne en prise supination pour charger davantage les biceps.",
    cues: [
      "Poitrine vers la barre",
      "Coudes proches du corps",
    ],
    muscles: musclesBiceps,
    tags: ["biceps", "australienne"],
    imageUrl: "/images/exercises/australienne_supination.png",
  },
  {
    id: "tractions_5_5_5",
    name: "Tractions 5–5–5",
    slug: "tractions_5_5_5",
    category: "pull",
    difficulty: "intermediate",
    equipment: ["bar"],
    description:
      "Bloc de tractions : 5 prise large, 5 prise moyenne, 5 supination.",
    cues: ["Changer de prise sans trop de repos"],
    muscles: musclesTractions,
    tags: ["dos", "biceps", "volume"],
    imageUrl: "/images/exercises/tractions_5_5_5.png",
  },
  {
    id: "curl_barre_australienne",
    name: "Curl à la barre australienne",
    slug: "curl_barre_australienne",
    category: "pull",
    difficulty: "intermediate",
    equipment: ["low_bar"],
    description:
      "Curl au poids du corps en suspension sous la barre, pieds au sol.",
    cues: ["Garder les coudes fixes", "Ne pas tricher avec le dos"],
    muscles: musclesBiceps,
    tags: ["biceps", "curl"],
    imageUrl: "/images/exercises/curl_australienne.png",
  },
  {
    id: "traction_commando",
    name: "Traction commando",
    slug: "traction_commando",
    category: "pull",
    difficulty: "advanced",
    equipment: ["bar"],
    description:
      "Tractions avec prise serrée parallèle, en alternant côté gauche et droit de la barre.",
    cues: [
      "Monter la tête d'un côté puis de l'autre",
      "Garder le corps gainé",
    ],
    muscles: musclesBiceps,
    tags: ["biceps", "unilatéral"],
    imageUrl: "/images/exercises/traction_commando.png",
  },
];

//
// 2) Séances
//

export const demoSessionSeanceDos: Session = {
  id: "seance_dos",
  name: "Séance dos",
  slug: "seance_dos",
  type: "classic",
  estimatedDurationMinutes: 45,
  notes:
    "Si tu fatigues sur les tractions, termine les séries en négatives. Qualité > quantité.",

  items: [
    {
      id: "seance_dos_exo_1",
      exerciseId: "tractions_pronation",
      order: 1,
      sets: 4,
      reps: {
        type: "reps",
        value: "max",
      },
      restSeconds: 105, // 1'45
      note: "Finir certaines séries en négatives si nécessaire.",
    },
    {
      id: "seance_dos_exo_2",
      exerciseId: "tractions_australiennes",
      order: 2,
      sets: 4,
      reps: {
        type: "reps",
        value: "max",
      },
      restSeconds: 105,
      note: "Prise plutôt large pour cibler le milieu du dos et les trapèzes.",
    },
    {
      id: "seance_dos_exo_3",
      exerciseId: "releves_genoux_suspendu",
      order: 3,
      sets: 5,
      reps: {
        type: "reps",
        value: 10,
      },
      restSeconds: 105,
      note: "Contrôle la montée et la descente, évite de balancer.",
    },
  ],
};

export const demoSessionSeanceJambes: Session = {
  id: "seance_jambes",
  name: "Séance jambes",
  slug: "seance_jambes",
  type: "classic",
  estimatedDurationMinutes: 30,
  notes:
    "Séance simple mais efficace : un exo de force unilatérale + un exo explosif.",

  items: [
    {
      id: "seance_jambes_exo_1",
      exerciseId: "pistol_squat",
      order: 1,
      sets: 4,
      reps: {
        type: "reps",
        value: 10,
      },
      restSeconds: 45,
      note: "≈ 10 reps par jambe si possible.",
    },
    {
      id: "seance_jambes_exo_2",
      exerciseId: "squat_saute",
      order: 2,
      sets: 4,
      reps: {
        type: "reps",
        value: 15,
      },
      restSeconds: 60,
      note: "Entre 15 et 20 reps selon la forme.",
    },
  ],
};

export const demoSessionCircuitPecTriceps: Session = {
  id: "circuit_pec_triceps",
  name: "Circuit pec / triceps",
  slug: "circuit_pec_triceps",
  type: "circuit",
  estimatedDurationMinutes: 40,
  rounds: 3,
  restBetweenExercisesSeconds: 30,
  restBetweenRoundsSeconds: 120,
  notes:
    "Garde le même nombre de reps sur tous les exos pour un tour. Vise 10–20 reps selon ton niveau.",

  items: [
    {
      id: "cpt_exo_1",
      exerciseId: "pompes_explosives_negatives",
      order: 1,
      sets: 1,
      reps: { type: "reps", value: 12 },
      restSeconds: 30,
      note: "Entre 10 et 20 reps. Descente lente, montée explosive.",
    },
    {
      id: "cpt_exo_2",
      exerciseId: "dips_paralleles",
      order: 2,
      sets: 1,
      reps: { type: "reps", value: 12 },
      restSeconds: 30,
      note: "Entre 10 et 20 reps.",
    },
    {
      id: "cpt_exo_3",
      exerciseId: "pompes_diamant",
      order: 3,
      sets: 1,
      reps: { type: "reps", value: 12 },
      restSeconds: 30,
      note: "Entre 10 et 20 reps.",
    },
    {
      id: "cpt_exo_4",
      exerciseId: "pompes_90",
      order: 4,
      sets: 1,
      reps: { type: "reps", value: 8 },
      restSeconds: 30,
      note: "Sur ton papier c'est ~5–10 reps.",
    },
    {
      id: "cpt_exo_5",
      exerciseId: "extension_triceps_sol",
      order: 5,
      sets: 1,
      reps: { type: "reps", value: 10 },
      restSeconds: 30,
      note: "8–10 reps selon la forme.",
    },
    {
      id: "cpt_exo_6",
      exerciseId: "pompes_explosives_negatives",
      order: 6,
      sets: 1,
      reps: { type: "reps", value: 12 },
      restSeconds: 30,
      note: "Variante avec pieds surélevés possible.",
    },
    {
      id: "cpt_exo_7",
      exerciseId: "skullcrusher_pdc",
      order: 7,
      sets: 1,
      reps: { type: "reps", value: 10 },
      restSeconds: 30,
      note: "8–10 reps.",
    },
  ],
};

export const demoSessionCircuitBiceps: Session = {
  id: "circuit_biceps",
  name: "Circuit biceps",
  slug: "circuit_biceps",
  type: "circuit",
  estimatedDurationMinutes: 40,
  rounds: 3,
  restBetweenExercisesSeconds: 30,
  restBetweenRoundsSeconds: 120,
  notes:
    "Gros volume biceps/dos. Reste propre sur les tirages, même en fin de circuit.",

  items: [
    {
      id: "cb_exo_1",
      exerciseId: "front_lever_tentative",
      order: 1,
      sets: 1,
      reps: { type: "time", seconds: 7 },
      restSeconds: 30,
      note: "Tentatives / maintiens courts.",
    },
    {
      id: "cb_exo_2",
      exerciseId: "tuck_up_negatif",
      order: 2,
      sets: 1,
      reps: { type: "reps", value: 4 },
      restSeconds: 30,
      note: "4 négatives contrôlées.",
    },
    {
      id: "cb_exo_3",
      exerciseId: "traction_australienne_supination",
      order: 3,
      sets: 1,
      reps: { type: "reps", value: 7 },
      restSeconds: 30,
    },
    {
      id: "cb_exo_4",
      exerciseId: "tractions_5_5_5",
      order: 4,
      sets: 1,
      reps: { type: "reps", value: 5 },
      restSeconds: 30,
      note: "5 large, 5 moyenne, 5 supination.",
    },
    {
      id: "cb_exo_5",
      exerciseId: "curl_barre_australienne",
      order: 5,
      sets: 1,
      reps: { type: "reps", value: 7 },
      restSeconds: 30,
    },
    {
      id: "cb_exo_6",
      exerciseId: "traction_commando",
      order: 6,
      sets: 1,
      reps: { type: "reps", value: 5 },
      restSeconds: 30,
      note: "≈ 5 reps de chaque côté.",
    },
  ],
};

export const demoSessionRoutinePompes: Session = {
  id: "routine_pompes",
  name: "Routine pompes maison",
  slug: "routine_pompes",
  type: "circuit",
  estimatedDurationMinutes: 30,
  rounds: 3,
  restBetweenExercisesSeconds: 30,
  restBetweenRoundsSeconds: 120,
  notes:
    "Routine full pompes. Vise 10–20 reps par exo selon la forme. Toujours garder le même nombre de reps sur tout le circuit.",

  items: [
    {
      id: "rp_exo_1",
      exerciseId: "pompes_explosives_negatives",
      order: 1,
      sets: 1,
      reps: { type: "reps", value: 12 },
      restSeconds: 30,
      note: "10–20 reps. Descente lente, montée explosive.",
    },
    {
      id: "rp_exo_2",
      exerciseId: "pompes_diamant",
      order: 2,
      sets: 1,
      reps: { type: "reps", value: 12 },
      restSeconds: 30,
      note: "10–20 reps.",
    },
    {
      id: "rp_exo_3",
      exerciseId: "pompes_archer",
      order: 3,
      sets: 1,
      reps: { type: "reps", value: 12 },
      restSeconds: 30,
      note: "10–20 reps (alterné gauche/droite).",
    },
    {
      id: "rp_exo_4",
      exerciseId: "pompes_epaule",
      order: 4,
      sets: 1,
      reps: { type: "reps", value: 12 },
      restSeconds: 30,
      note: "10–20 reps.",
    },
    {
      id: "rp_exo_5",
      exerciseId: "pompes_explosives_volantes",
      order: 5,
      sets: 1,
      reps: { type: "reps", value: 10 },
      restSeconds: 30,
      note: "10–20 reps selon la maîtrise.",
    },
    {
      id: "rp_exo_6",
      exerciseId: "pompes_classiques",
      order: 6,
      sets: 1,
      reps: { type: "reps", value: 12 },
      restSeconds: 30,
      note: "10–20 reps pour finir le circuit.",
    },
  ],
};

export const demoSessions: Session[] = [
  demoSessionSeanceDos,
  demoSessionSeanceJambes,
  demoSessionCircuitPecTriceps,
  demoSessionCircuitBiceps,
  demoSessionRoutinePompes,
];

//
// 3) WeekPlan qui reprend ton planning
//

const monday: DayPlan = {
  day: "monday",
  sessionId: "seance_dos",
  warmupMinutes: 10,
  warmupDescription: "Étirements + posture générale.",
  isRest: false,
};

const tuesday: DayPlan = {
  day: "tuesday",
  sessionId: "circuit_pec_triceps",
  warmupMinutes: 10,
  warmupDescription: "Mobilité épaules + scapula.",
  isRest: false,
};

const wednesday: DayPlan = {
  day: "wednesday",
  sessionId: "seance_jambes",
  warmupMinutes: 10,
  warmupDescription: "Mobilité hanches + genoux, petit gainage.",
  isRest: false,
};

const thursday: DayPlan = {
  day: "thursday",
  sessionId: "circuit_biceps",
  warmupMinutes: 10,
  warmupDescription: "Posture + mobilisation du haut du dos.",
  isRest: false,
};

const friday: DayPlan = {
  day: "friday",
  sessionId: "routine_pompes",
  warmupMinutes: 10,
  warmupDescription: "Posture épaules + poignets.",
  isRest: false,
};

const saturday: DayPlan = {
  day: "saturday",
  sessionId: undefined, // jour libre / optionnel
  warmupMinutes: undefined,
  warmupDescription: "Optionnel : mobilité générale ou séance libre.",
  isRest: false,
};

const sunday: DayPlan = {
  day: "sunday",
  sessionId: undefined,
  warmupMinutes: undefined,
  warmupDescription: "Repos complet.",
  isRest: true,
};

export const demoWeekPlan: WeekPlan = {
  id: "week_plan_principal",
  name: "Programme street-workout 5 jours",
  description:
    "Planning hebdo basé sur ton programme papier : dos, pec/triceps, jambes, biceps, routine pompes, avec un jour libre et un jour repos.",
  days: [monday, tuesday, wednesday, thursday, friday, saturday, sunday],
};
