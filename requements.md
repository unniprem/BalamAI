# BalamAI Requirements

## Overview

BalamAI is a personal fitness coach that generates workouts, adapts when gym equipment is unavailable, and tracks workout progress.

The goal is to create a workout companion that feels useful inside a real gym environment rather than a simple workout logger.

### Core Principle

> The workout adapts to the gym, not the other way around.

---

# MVP Goals

## Primary Goals

- Generate daily workouts
- Replace exercises during workouts
- Track sets, reps, and weights
- Store workout history
- Display exercise form videos
- Work completely offline

## Non Goals (MVP)

- Authentication
- Backend
- Cloud sync
- Social features
- Nutrition tracking
- AI coaching
- Wearable integrations

---

# Technology Stack

- React 19
- Vite
- JavaScript
- Tailwind CSS
- shadcn/ui
- React Router
- Lucide Icons
- LocalStorage

Application must work completely offline.

---

# Pages

## Dashboard

Route: `/`

### Features

- Welcome section
- Today's workout preview
- Total workouts completed
- Current workout streak
- Last workout date

### Actions

- Start Workout
- Generate New Workout

---

## Workout

Route: `/workout`

### Features

- Display active workout
- Exercise cards
- Video links
- Replace exercise
- Track sets
- Track reps
- Track weight

### Actions

- Add Set
- Remove Set
- Replace Exercise
- Finish Workout

---

## History

Route: `/history`

### Features

- Previous workouts
- Workout date
- Workout duration
- Exercise count

### Actions

- View workout details

---

## Progress

Route: `/progress`

### Features

- Total workouts
- Total volume lifted
- Most performed exercise
- Exercise frequency

---

# Exercise Library

Minimum 50 exercises.

## Exercise Structure

```js
{
  id: "",
  name: "",
  category: "",
  muscles: [],
  equipment: [],
  alternatives: [],
  videoUrl: ""
}
```

## Categories

- push
- pull
- legs
- shoulders
- core

## Equipment Types

- barbell
- dumbbell
- machine
- cable
- bodyweight

---

# Workout Generation

Generate workouts using movement patterns.

Each workout should contain:

- 1 Push exercise
- 1 Pull exercise
- 1 Leg exercise
- 1 Shoulder exercise
- 1 Core exercise

## Rules

- Avoid repeating previous workout
- Randomize exercises
- Maintain balanced workout structure

---

# Smart Swap Feature

This is the primary differentiator of BalamAI.

Every exercise should provide a Replace Exercise option.

Example:

Bench Press

Alternatives:

- Dumbbell Bench Press
- Push Up
- Machine Chest Press

Requirements:

- Instant replacement
- No page reload
- Preserve workout category
- Preserve workout balance

---

# Exercise Videos

Every exercise must contain:

- Watch Form button

Behavior:

- Opens video in new tab
- Uses YouTube search URL

Example:

```text
https://www.youtube.com/results?search_query=bench+press+form
```

---

# Workout Tracking

Users can record:

- Weight
- Reps
- Sets

Example:

```js
{
  weight: 60,
  reps: 10
}
```

Actions:

- Add Set
- Remove Set
- Edit Set

---

# Workout Completion

When a workout is completed save:

```js
{
  id: "",
  date: "",
  duration: "",
  exercises: [],
  totalVolume: 0
}
```

to LocalStorage.

---

# Local Storage Layer

Create:

```text
src/lib/storage.js
```

Functions:

```js
saveWorkout();
loadWorkouts();

saveCurrentWorkout();
loadCurrentWorkout();

saveSettings();
loadSettings();
```

---

# Components

## WorkoutCard

Displays workout summary.

## ExerciseCard

Displays exercise information.

## ReplaceExerciseDialog

Handles Smart Swap functionality.

## SetTracker

Tracks weight and reps.

## StatsCard

Displays statistics.

## Navigation

Mobile and desktop navigation.

## WorkoutHistoryCard

Displays previous workout information.

---

# Navigation

## Mobile

Bottom navigation.

Items:

- Home
- Workout
- History
- Progress

## Desktop

Sidebar navigation.

---

# Folder Structure

```text
src/

components/
pages/
hooks/
data/
lib/

App.jsx
main.jsx
```

---

# UI Requirements

## Theme

Dark mode by default.

## Design

- Mobile-first
- Responsive
- Modern fitness aesthetic
- Large touch targets
- Fast navigation

## Preferred Components

Use shadcn/ui:

- Card
- Button
- Dialog
- Tabs
- Input
- Sheet
- Badge
- ScrollArea

---

# Seed Exercises

Include examples such as:

## Push

- Bench Press
- Incline Bench Press
- Dumbbell Bench Press
- Push Up
- Machine Chest Press

## Pull

- Pull Up
- Lat Pulldown
- Barbell Row
- Cable Row
- Dumbbell Row

## Legs

- Squat
- Leg Press
- Goblet Squat
- Walking Lunges
- Romanian Deadlift

## Shoulders

- Overhead Press
- Dumbbell Shoulder Press
- Arnold Press
- Lateral Raise
- Face Pull

## Core

- Plank
- Russian Twist
- Dead Bug
- Leg Raise
- Bicycle Crunch

---

# Success Criteria

The MVP is considered successful when a user can:

1. Generate a workout.
2. Replace any exercise instantly.
3. Track sets, reps, and weight.
4. Save completed workouts.
5. Review workout history.
6. View progress statistics.
7. Use the application completely offline.

---

# Future Enhancements

## Version 2

- Goal-based workouts
- Fat loss mode
- Strength mode
- Hypertrophy mode

## Version 3

- Progressive overload recommendations
- Recovery tracking
- Equipment availability profiles

## Version 4

- AI workout coach
- Voice assistant
- Form analysis
- Personalized coaching

BalamAI should evolve from a workout tracker into an adaptive fitness coach.
