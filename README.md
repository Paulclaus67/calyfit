# Calyfit 🏋️‍♂️📱

Calyfit est une PWA de street-workout pensée pour être utilisée **dehors sur iPhone** :  
planning hebdo, séances guidées, timer de repos plein écran, suivi d’historique et
personnalisation complète des séances.

> Objectif : remplacer un carnet papier par une appli ultra lisible, rapide et agréable à utiliser en situation réelle.

---

## ✨ Fonctionnalités

### 🗓 Accueil & séance du jour

- Affichage de **la séance du jour** (ou d’un jour de repos) en fonction du planning actif.
- Résumé : type de séance, durée estimée, échauffement conseillé.
- Bouton **“Lancer la séance”** qui ouvre le mode runner.
- Widget **“Ta semaine”** :
  - couleurs différentes pour :
    - jour de repos,
    - séance prévue,
    - séance déjà faite dans la semaine,
  - indication claire du jour actuel.

### 📅 Planning hebdomadaire

- Vue **“Ta semaine type”** :
  - un bloc par jour (Lun → Dim),
  - badges *Séance prévue* / *Séance faite* / *Repos*,
  - clic sur un jour avec séance → ouvre la séance correspondante.
- Bandeau en haut avec les jours de la semaine + état (fait, prévu, repos).
- Bloc en bas **“Programme actuel”** avec bouton `Modifier` vers la gestion du planning.

### 🧩 Gestion des plannings (manage)

- Onboarding simple qui crée un planning de base à partir d’un **template**.
- Possibilité de :
  - dupliquer un planning,
  - renommer le programme,
  - choisir quel planning est actif,
  - associer pour chaque jour une séance ou en faire un jour de repos.

### 🏋️‍♀️ Séances

- Page **Séances** :
  - liste des séances disponibles (dos, jambes, circuits, routine pompes…),
  - indicateurs :
    - *Fait aujourd’hui*,
    - *Dernière fois : date*,
  - type de séance (classique / circuit) + durée estimée.
- Carte en bas **“Personnalisation”** avec bouton `Personnaliser` vers la page de gestion.

### 🛠 Personnalisation des séances

- Choix de la séance à modifier (dos, jambes, etc.).
- Modification du **nom de la séance**.
- Liste des exercices de la séance :
  - nombre de séries,
  - reps (texte libre, ex. `8–12`, `max`, `30s`),
  - temps de repos (sec).
- Actions sur chaque exercice :
  - suppression (avec confirmation),
  - changement d’ordre (↑↓) adapté au tactile.
- Bibliothèque d’exercices :
  - organisée par **groupe musculaire** (dos, pecs, jambes, etc.),
  - ajout d’exos à la séance en un tap.

### ⏱ Runner de séance

- Mode entraînement optimisé mobile :
  - gros bloc **“Exercice en cours”**,
  - nombre de séries et reps visibles,
  - barre de progression de la séance.
- **Timer de repos** :
  - compte à rebours plein écran,
  - son **“beep”** en fin de repos,
  - option “Passer” / “+10s” selon le design courant.
- Zone **“Conseils / technique”** sous l’exercice  
  (prévue pour accueillir des descriptions d’exécution propre).
- Sauvegarde automatique en fin de séance :
  - dans **localStorage** (réactivité immédiate),
  - dans la **base de données** (`SessionHistory`) pour les stats.

### 👤 Authentification & profil

- Création de compte et login via **email + mot de passe**.
- Sessions gérées par **cookie signé** côté serveur.
- Page **Profil** :
  - infos de base de l’utilisateur,
  - mini bloc de stats (nombre de séances, séances sur le mois, etc.),
  - bouton de déconnexion.

> Aujourd’hui, le planning est déjà **par utilisateur**.  
> Les séances sont encore globales, mais la structure est prévue pour évoluer vers une personnalisation 100% par utilisateur.

---

## 🧱 Stack technique

- **Framework** : [Next.js 16](https://nextjs.org/) (App Router, TypeScript)
- **UI** : Tailwind CSS
- **Animations** : Framer Motion
- **Icônes** : lucide-react
- **PWA** : manifest, service worker (`register-sw.tsx`), installable sur iOS
- **DB** : SQLite + Prisma 7
- **Auth** : gestion maison (cookies signés + crypto)

---

## 🚀 Installation & lancement

### 1. Cloner le dépôt

```bash
git clone https://github.com/ton-compte/ton-repo.git
cd ton-repo
