# Goal-Based Workouts (V2) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add Strength / Hypertrophy / Fat Loss modes that change set count, rep range, and rest interval when a workout is generated, with the prescription snapshotted onto each exercise entry.

**Architecture:** A new `MODES` catalog in `src/data/modes.js` defines per-mode `{ sets, repsMin, repsMax, restMin, restMax }`. `settings.mode` (default `hypertrophy`) tracks the user's choice; a Dashboard segmented control writes it. `generateWorkout(prev, modeId)` reads the mode, attaches `workout.mode` plus `entry.prescription` to every exercise entry. `ExerciseCard`, `WorkoutCard`, `WorkoutHistoryCard`, and `Progress` read from those snapshotted fields and degrade gracefully when they're absent (pre-V2 workouts).

**Tech Stack:** React 19, Vite, Tailwind v4, shadcn/ui (Card, Badge, Button), LocalStorage. No new dependencies.

**Spec:** `docs/superpowers/specs/2026-06-06-goal-based-workouts-design.md` (commit `f923a65`).

**Testing approach:** The project has no test runner. Per spec §7, verification is `npm run lint` + `npm run build` + manual smoke probes via the dev server. Each task ends with a lint+build check and a commit.

---

## File map

| Path | Action |
|---|---|
| `src/data/modes.js` | NEW — mode catalog + formatters |
| `src/lib/storage.js` | MODIFY — add `mode` to `DEFAULT_SETTINGS` |
| `src/lib/workout.js` | MODIFY — `generateWorkout` accepts mode, stamps `workout.mode` + `entry.prescription` |
| `src/pages/Dashboard.jsx` | MODIFY — mode segmented control, pass mode to `generateWorkout` |
| `src/components/ExerciseCard.jsx` | MODIFY — prescription line |
| `src/components/WorkoutCard.jsx` | MODIFY — mode badge |
| `src/components/WorkoutHistoryCard.jsx` | MODIFY — mode badge |
| `src/pages/Progress.jsx` | MODIFY — mode-mix line |

---

### Task 1: Mode catalog

**Files:**
- Create: `src/data/modes.js`

- [x] **Step 1: Create the catalog file**

Write `src/data/modes.js`:

```js
export const MODES = {
  strength: {
    id: "strength",
    label: "Strength",
    sets: 5,
    repsMin: 3,
    repsMax: 5,
    restMin: 180,
    restMax: 300,
  },
  hypertrophy: {
    id: "hypertrophy",
    label: "Hypertrophy",
    sets: 4,
    repsMin: 8,
    repsMax: 12,
    restMin: 60,
    restMax: 90,
  },
  "fat-loss": {
    id: "fat-loss",
    label: "Fat Loss",
    sets: 3,
    repsMin: 12,
    repsMax: 20,
    restMin: 30,
    restMax: 45,
  },
};

export const MODE_ORDER = ["strength", "hypertrophy", "fat-loss"];
export const DEFAULT_MODE = "hypertrophy";

export function getMode(id) {
  return MODES[id] ?? MODES[DEFAULT_MODE];
}

export function formatRepRange({ repsMin, repsMax }) {
  return `${repsMin}-${repsMax}`;
}

export function formatRestRange({ restMin, restMax }) {
  if (restMin >= 60 && restMin % 60 === 0 && restMax % 60 === 0) {
    return `${restMin / 60}-${restMax / 60}m`;
  }
  return `${restMin}-${restMax}s`;
}
```

- [x] **Step 2: Lint passes**

Run: `npm run lint`
Expected: 0 errors.

- [x] **Step 3: Build passes**

Run: `npm run build`
Expected: Vite reports success; bundle still builds (the new module is unused so far, just confirms valid syntax).

- [x] **Step 4: Commit**

```bash
git add src/data/modes.js
git -c user.email="unnik@switchpt.com" -c user.name="Unni K" commit -m "feat(v2): add mode catalog (strength/hypertrophy/fat-loss)"
```

---

### Task 2: Default settings include mode

**Files:**
- Modify: `src/lib/storage.js:71-73`

- [x] **Step 1: Extend DEFAULT_SETTINGS**

In `src/lib/storage.js`, change the `DEFAULT_SETTINGS` constant from:

```js
const DEFAULT_SETTINGS = {
  theme: "dark",
};
```

to:

```js
const DEFAULT_SETTINGS = {
  theme: "dark",
  mode: "hypertrophy",
};
```

> Note: keep the value as a literal rather than importing `DEFAULT_MODE` from `src/data/modes.js` — avoids any future cyclic-import risk between `storage.js` and `modes.js`. The spec calls this out in §9.

- [x] **Step 2: Lint passes**

Run: `npm run lint`
Expected: 0 errors.

- [x] **Step 3: Manual probe — defaults**

Run the app: `npm run dev` then in a fresh browser tab DevTools console (or a fresh incognito window):

```js
JSON.parse(localStorage.getItem("balamai:settings"))
```

If the key doesn't exist yet, the app should still hand out `mode: "hypertrophy"` from `loadSettings()`. To verify directly, in the console of the running app run:

```js
// loadSettings is not exported globally, so smoke-test via a fresh write:
localStorage.removeItem("balamai:settings");
location.reload();
// After reload, persist a no-op save (will trigger via Task 4's toggle later).
```

For this task it's sufficient that lint + build pass; behavioural validation happens once the Dashboard toggle exists in Task 4.

- [x] **Step 4: Build passes**

Run: `npm run build`
Expected: success.

- [x] **Step 5: Commit**

```bash
git add src/lib/storage.js
git -c user.email="unnik@switchpt.com" -c user.name="Unni K" commit -m "feat(v2): default settings include mode='hypertrophy'"
```

---

### Task 3: generateWorkout accepts mode + snapshots prescription

**Files:**
- Modify: `src/lib/workout.js:1-38`

- [x] **Step 1: Import mode helpers**

At the top of `src/lib/workout.js`, change:

```js
import { CATEGORIES, EXERCISES, getExerciseById } from "@/data/exercises";
```

to:

```js
import { CATEGORIES, EXERCISES, getExerciseById } from "@/data/exercises";
import { getMode } from "@/data/modes";
```

- [x] **Step 2: Update generateWorkout to accept and apply mode**

Replace the existing `generateWorkout` function (currently lines 11-38) with:

```js
export function generateWorkout(previousWorkout, modeId) {
  const mode = getMode(modeId);
  const previousIds = new Set(
    (previousWorkout?.exercises || []).map((e) => e.exerciseId),
  );

  const picked = CATEGORIES.map((category) => {
    const pool = EXERCISES.filter((e) => e.category === category);
    const fresh = pool.filter((e) => !previousIds.has(e.id));
    const chosen = pickRandom(fresh.length > 0 ? fresh : pool);
    return {
      id: newId("ex"),
      exerciseId: chosen.id,
      prescription: {
        repsMin: mode.repsMin,
        repsMax: mode.repsMax,
        restMin: mode.restMin,
        restMax: mode.restMax,
      },
      sets: Array.from({ length: mode.sets }, () => ({
        id: newId("set"),
        weight: 0,
        reps: 0,
        completed: false,
      })),
    };
  });

  return {
    id: newId("wo"),
    createdAt: new Date().toISOString(),
    startedAt: null,
    completedAt: null,
    mode: mode.id,
    exercises: picked,
  };
}
```

Important: `replaceExercise`, `addSet`, `removeSet`, `updateSet`, `computeWorkoutVolume`, `finishWorkout`, and `workoutSummary` are **unchanged** — `prescription` lives on the entry, not on individual sets, so `addSet` cloning the last set works as-is.

- [x] **Step 3: Lint passes**

Run: `npm run lint`
Expected: 0 errors.

- [x] **Step 4: Build passes**

Run: `npm run build`
Expected: success.

- [x] **Step 5: Manual probe — generation**

Start dev server: `npm run dev`.

In a browser tab open the app, then in DevTools console:

```js
// Sanity: generateWorkout is not exported globally. Trigger by clicking
// "Generate new" on the Dashboard, then inspect localStorage:
const w = JSON.parse(localStorage.getItem("balamai:current-workout"));
console.log(w.mode, w.exercises[0]);
```

Expected:
- `w.mode === "hypertrophy"` (mode wiring isn't connected yet; Task 4 fixes that. For this task we just verify the default fall-through via `getMode(undefined)` produced a hypertrophy prescription).
- `w.exercises[0].prescription` has `repsMin: 8`, `repsMax: 12`, `restMin: 60`, `restMax: 90`.
- `w.exercises[0].sets.length === 4`.

- [x] **Step 6: Commit**

```bash
git add src/lib/workout.js
git -c user.email="unnik@switchpt.com" -c user.name="Unni K" commit -m "feat(v2): generateWorkout snapshots mode prescription onto entries"
```

---

### Task 4: Dashboard mode toggle

**Files:**
- Modify: `src/pages/Dashboard.jsx`

- [x] **Step 1: Add imports**

In `src/pages/Dashboard.jsx`, add to the existing import block at the top:

```js
import { useState } from "react";
import { MODE_ORDER, MODES } from "@/data/modes";
import { loadSettings, saveSettings } from "@/lib/storage";
```

Existing `useMemo` import stays. Final import section should read:

```js
import { useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Calendar, Dumbbell, Flame, Play, RotateCcw, Trophy } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { StatsCard } from "@/components/StatsCard";
import { WorkoutCard } from "@/components/WorkoutCard";
import { useCurrentWorkout } from "@/hooks/useCurrentWorkout";
import { useWorkoutHistory } from "@/hooks/useWorkoutHistory";
import { generateWorkout } from "@/lib/workout";
import { computeStreak, formatRelativeDate, lastWorkoutDate } from "@/lib/stats";
import { MODE_ORDER, MODES } from "@/data/modes";
import { loadSettings, saveSettings } from "@/lib/storage";
```

- [x] **Step 2: Add mode state via lazy initializer**

Inside the `Dashboard` function, immediately after `const { workouts } = useWorkoutHistory();`, add:

```js
const [mode, setMode] = useState(() => loadSettings().mode);

function handleSelectMode(nextMode) {
  setMode(nextMode);
  saveSettings({ mode: nextMode });
}
```

> Why lazy init (`useState(() => ...)`) instead of `useEffect`: project memory documents `react-hooks/set-state-in-effect` blocking the load-from-localStorage pattern. Lazy initializer reads once at mount and writes through `saveSettings`.

- [x] **Step 3: Update handleGenerate to pass mode**

Change:

```js
function handleGenerate() {
  const previous = workouts[0] || workout;
  const fresh = generateWorkout(previous);
  setWorkout(fresh);
  navigate("/workout");
}
```

to:

```js
function handleGenerate() {
  const previous = workouts[0] || workout;
  const fresh = generateWorkout(previous, mode);
  setWorkout(fresh);
  navigate("/workout");
}
```

- [x] **Step 4: Render the segmented control**

In the JSX, between the StatsCard grid (ends at `</div>` after the three StatsCards, currently line 70) and the `<Card className="border-border/80">` block, insert:

```jsx
<div className="flex flex-col gap-2">
  <div className="flex items-center justify-between">
    <span className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
      Training mode
    </span>
    <span className="text-[11px] text-muted-foreground">
      {MODES[mode].sets} sets · {MODES[mode].repsMin}-{MODES[mode].repsMax} reps
    </span>
  </div>
  <div
    role="radiogroup"
    aria-label="Training mode"
    className="flex rounded-lg border border-border/70 bg-muted/30 p-1"
  >
    {MODE_ORDER.map((id) => {
      const selected = id === mode;
      return (
        <button
          key={id}
          type="button"
          role="radio"
          aria-checked={selected}
          onClick={() => handleSelectMode(id)}
          className={
            "flex-1 rounded-md px-3 py-1.5 text-xs font-medium transition-colors " +
            (selected
              ? "bg-background text-foreground shadow-sm"
              : "text-muted-foreground hover:text-foreground")
          }
        >
          {MODES[id].label}
        </button>
      );
    })}
  </div>
</div>
```

- [x] **Step 5: Lint passes**

Run: `npm run lint`
Expected: 0 errors. If `react-hooks/set-state-in-effect` flags anything, you've used `useEffect` instead of the lazy initializer — go back to Step 2.

- [x] **Step 6: Build passes**

Run: `npm run build`
Expected: success.

- [x] **Step 7: Manual probe — toggle persists**

Start `npm run dev`. In the browser:

1. Open `/`. Confirm the segmented control shows Strength / Hypertrophy / Fat Loss with Hypertrophy active by default.
2. Click "Strength". Reload the page. Strength should still be active.
3. In DevTools: `JSON.parse(localStorage.getItem("balamai:settings"))` → `{ theme: "dark", mode: "strength" }`.
4. Click "Generate new". Then in DevTools: `JSON.parse(localStorage.getItem("balamai:current-workout")).mode` → `"strength"`. `.exercises[0].sets.length` → `5`. `.exercises[0].prescription.repsMin` → `3`.
5. Switch to Fat Loss, Generate new. Confirm `sets.length === 3`, `repsMin === 12`, `restMin === 30`.

- [x] **Step 8: Commit**

```bash
git add src/pages/Dashboard.jsx
git -c user.email="unnik@switchpt.com" -c user.name="Unni K" commit -m "feat(v2): Dashboard mode toggle (persists to settings)"
```

---

### Task 5: ExerciseCard prescription line

**Files:**
- Modify: `src/components/ExerciseCard.jsx`

- [x] **Step 1: Import formatters**

Change the existing import line:

```js
import { CATEGORY_LABELS, getExerciseById } from "@/data/exercises";
```

to add the formatters import below it:

```js
import { CATEGORY_LABELS, getExerciseById } from "@/data/exercises";
import { formatRepRange, formatRestRange } from "@/data/modes";
```

- [x] **Step 2: Render the prescription line**

In the `<CardHeader>` block, the existing structure is:

```jsx
<p className="mt-1 text-[11px] text-muted-foreground">
  {exercise.equipment.join(" · ")} · {exercise.muscles.slice(0, 3).join(", ")}
</p>
```

Immediately after that `<p>` (still inside the `<div className="min-w-0 flex-1">`), add:

```jsx
{entry.prescription ? (
  <p className="mt-1 text-[11px] font-medium text-foreground/80">
    {entry.sets.length} sets · {formatRepRange(entry.prescription)} reps · Rest {formatRestRange(entry.prescription)}
  </p>
) : null}
```

> Legacy workouts have no `entry.prescription` — line is omitted entirely (spec §5).

- [x] **Step 3: Lint passes**

Run: `npm run lint`
Expected: 0 errors.

- [x] **Step 4: Build passes**

Run: `npm run build`
Expected: success.

- [x] **Step 5: Manual probe**

Start `npm run dev`. On the Dashboard pick **Strength**, click Generate new (navigates to `/workout`). Each exercise card should show:

```
Bench Press                                    [push]
barbell · chest, triceps, front-delts
5 sets · 3-5 reps · Rest 3-5m
```

Switch back, pick **Hypertrophy**, Generate new. Cards should show `4 sets · 8-12 reps · Rest 60-90s`.
Switch to **Fat Loss**, Generate new. Cards should show `3 sets · 12-20 reps · Rest 30-45s`.

- [x] **Step 6: Manual probe — legacy workout**

In DevTools, inject a workout missing `prescription`:

```js
const legacy = {
  id: "wo_legacy",
  createdAt: new Date().toISOString(),
  startedAt: new Date().toISOString(),
  completedAt: null,
  exercises: [{
    id: "ex_legacy",
    exerciseId: "bench-press",
    sets: [{ id: "set_legacy", weight: 0, reps: 0, completed: false }],
  }],
};
localStorage.setItem("balamai:current-workout", JSON.stringify(legacy));
location.reload();
```

Navigate to `/workout`. The Bench Press card should render normally **without** the prescription line and **without** crashing.

Clean up afterwards: click "Generate new" to overwrite the legacy entry.

- [x] **Step 7: Commit**

```bash
git add src/components/ExerciseCard.jsx
git -c user.email="unnik@switchpt.com" -c user.name="Unni K" commit -m "feat(v2): ExerciseCard shows prescription line"
```

---

### Task 6: WorkoutCard mode badge

**Files:**
- Modify: `src/components/WorkoutCard.jsx`

- [x] **Step 1: Import getMode**

Change:

```js
import { getExerciseById, CATEGORY_LABELS } from "@/data/exercises";
```

to add:

```js
import { getExerciseById, CATEGORY_LABELS } from "@/data/exercises";
import { MODES } from "@/data/modes";
```

- [x] **Step 2: Render the mode badge**

In the `<CardHeader>` block, the existing inner `<div className="flex items-center justify-between">` contains `<CardTitle>` and the "N exercises" badge. Replace that entire `<div>` with:

```jsx
<div className="flex items-center justify-between gap-2">
  <div className="flex items-center gap-2 min-w-0">
    <CardTitle className="text-base">{title}</CardTitle>
    {workout.mode && MODES[workout.mode] ? (
      <Badge variant="outline" className="text-[10px] uppercase">
        {MODES[workout.mode].label}
      </Badge>
    ) : null}
  </div>
  <Badge variant="secondary" className="text-[11px]">
    {workout.exercises.length} exercises
  </Badge>
</div>
```

- [x] **Step 3: Lint passes**

Run: `npm run lint`
Expected: 0 errors.

- [x] **Step 4: Build passes**

Run: `npm run build`
Expected: success.

- [x] **Step 5: Manual probe**

`npm run dev`. On Dashboard, pick **Fat Loss** → Generate new → go back to Dashboard. The "Today's plan" card should show a `FAT LOSS` outline badge next to the title.

Repeat with each mode to verify the label switches.

- [x] **Step 6: Commit**

```bash
git add src/components/WorkoutCard.jsx
git -c user.email="unnik@switchpt.com" -c user.name="Unni K" commit -m "feat(v2): WorkoutCard shows mode badge"
```

---

### Task 7: WorkoutHistoryCard mode badge

**Files:**
- Modify: `src/components/WorkoutHistoryCard.jsx`

- [x] **Step 1: Import MODES**

Add below the existing data imports:

```js
import { getExerciseById, CATEGORY_LABELS } from "@/data/exercises";
import { MODES } from "@/data/modes";
```

- [x] **Step 2: Render the badge in the header row**

The existing collapsed header row contains:

```jsx
<div className="flex items-center gap-2">
  <span className="text-sm font-semibold tracking-tight">
    {formatRelativeDate(date)}
  </span>
  <span className="text-xs text-muted-foreground">
    {new Date(date).toLocaleDateString(undefined, {
      month: "short",
      day: "numeric",
      year: "numeric",
    })}
  </span>
</div>
```

Replace it with:

```jsx
<div className="flex items-center gap-2 flex-wrap">
  <span className="text-sm font-semibold tracking-tight">
    {formatRelativeDate(date)}
  </span>
  <span className="text-xs text-muted-foreground">
    {new Date(date).toLocaleDateString(undefined, {
      month: "short",
      day: "numeric",
      year: "numeric",
    })}
  </span>
  {workout.mode && MODES[workout.mode] ? (
    <Badge variant="outline" className="text-[10px] uppercase">
      {MODES[workout.mode].label}
    </Badge>
  ) : null}
</div>
```

- [x] **Step 3: Lint passes**

Run: `npm run lint`
Expected: 0 errors.

- [x] **Step 4: Build passes**

Run: `npm run build`
Expected: success.

- [x] **Step 5: Manual probe**

`npm run dev`. Generate a workout in **Strength** mode, complete (or finish without completing sets — duration just needs to record), navigate to `/history`. The history card should show a `STRENGTH` badge alongside the date.

If you don't have any history, in DevTools:

```js
const wo = JSON.parse(localStorage.getItem("balamai:current-workout"));
wo.completedAt = new Date().toISOString();
wo.duration = 60_000;
wo.totalVolume = 0;
const all = JSON.parse(localStorage.getItem("balamai:workouts") || "[]");
localStorage.setItem("balamai:workouts", JSON.stringify([wo, ...all]));
location.reload();
```

Then navigate to `/history` and confirm the badge.

- [x] **Step 6: Legacy probe**

Inject a legacy workout into history:

```js
const all = JSON.parse(localStorage.getItem("balamai:workouts") || "[]");
const legacy = {
  id: "wo_hist_legacy",
  createdAt: new Date(Date.now() - 86400_000).toISOString(),
  completedAt: new Date(Date.now() - 86400_000).toISOString(),
  duration: 30_000,
  totalVolume: 0,
  exercises: [{ id: "ex_legacy", exerciseId: "bench-press", sets: [] }],
};
localStorage.setItem("balamai:workouts", JSON.stringify([...all, legacy]));
location.reload();
```

The legacy card should render normally with **no** mode badge.

- [x] **Step 7: Commit**

```bash
git add src/components/WorkoutHistoryCard.jsx
git -c user.email="unnik@switchpt.com" -c user.name="Unni K" commit -m "feat(v2): WorkoutHistoryCard shows mode badge"
```

---

### Task 8: Progress page — mode mix line

**Files:**
- Modify: `src/pages/Progress.jsx`

- [x] **Step 1: Import mode helpers**

Add below the existing imports:

```js
import { MODE_ORDER, MODES } from "@/data/modes";
```

- [x] **Step 2: Compute mode counts in the summary memo**

Replace the existing `useMemo` block (currently:

```js
const summary = useMemo(() => {
  return {
    total: workouts.length,
    volume: totalVolume(workouts),
    most: mostPerformedExercise(workouts),
    frequency: exerciseFrequency(workouts).slice(0, 10),
  };
}, [workouts]);
```

) with:

```js
const summary = useMemo(() => {
  const modeCounts = MODE_ORDER.reduce((acc, id) => {
    acc[id] = 0;
    return acc;
  }, {});
  for (const w of workouts) {
    if (w.mode && modeCounts[w.mode] !== undefined) {
      modeCounts[w.mode] += 1;
    }
  }
  return {
    total: workouts.length,
    volume: totalVolume(workouts),
    most: mostPerformedExercise(workouts),
    frequency: exerciseFrequency(workouts).slice(0, 10),
    modeCounts,
  };
}, [workouts]);
```

- [x] **Step 3: Render the mode-mix card**

Between the StatsCard grid (`</div>` after the three `<StatsCard>`s) and the `<Card className="border-border/80">` containing "Exercise frequency", insert:

```jsx
<Card className="border-border/80">
  <CardHeader className="pb-2">
    <CardTitle className="text-base">By mode</CardTitle>
  </CardHeader>
  <CardContent>
    <div className="flex flex-wrap gap-2">
      {MODE_ORDER.map((id) => (
        <div
          key={id}
          className="flex items-center gap-2 rounded-md border border-border/60 bg-muted/30 px-3 py-1.5 text-xs"
        >
          <span className="font-medium">{MODES[id].label}</span>
          <span className="text-muted-foreground">
            {summary.modeCounts[id]}
          </span>
        </div>
      ))}
    </div>
  </CardContent>
</Card>
```

- [x] **Step 4: Lint passes**

Run: `npm run lint`
Expected: 0 errors.

- [x] **Step 5: Build passes**

Run: `npm run build`
Expected: success.

- [x] **Step 6: Manual probe**

`npm run dev`. Navigate to `/progress`.

- With no saved workouts, the By mode card shows `Strength 0  ·  Hypertrophy 0  ·  Fat Loss 0`.
- Save a couple of workouts in different modes (use the inline DevTools snippet from Task 7 step 5 to fast-forward if needed).
- Reload `/progress`. Counts should match.
- Legacy workouts (no `mode`) should NOT appear in any bucket.

- [x] **Step 7: Commit**

```bash
git add src/pages/Progress.jsx
git -c user.email="unnik@switchpt.com" -c user.name="Unni K" commit -m "feat(v2): Progress page shows mode mix"
```

---

### Task 9: Final smoke pass

**Files:** none — verification only.

- [x] **Step 1: Clean lint + build**

```bash
npm run lint
npm run build
```

Both must pass with 0 errors / 0 warnings (warnings that pre-existed before V2 are acceptable; new ones are not).

- [x] **Step 2: End-to-end smoke checklist**

`npm run dev`. Walk through each item — every box must check:

1. **Fresh state.** Open in incognito or `localStorage.clear()`. Dashboard shows mode toggle with **Hypertrophy** active.
2. **Persistence.** Click Strength → reload → still Strength. Verify in DevTools: `JSON.parse(localStorage.getItem("balamai:settings")).mode === "strength"`.
3. **Generate in each mode.**
   - Strength → workout has 5 sets per exercise, `prescription.repsMin === 3`, ExerciseCard shows `5 sets · 3-5 reps · Rest 3-5m`.
   - Hypertrophy → 4 sets, `repsMin === 8`, card shows `4 sets · 8-12 reps · Rest 60-90s`.
   - Fat Loss → 3 sets, `repsMin === 12`, card shows `3 sets · 12-20 reps · Rest 30-45s`.
4. **Replace exercise.** On the Workout page, replace one exercise via Smart Swap. The new exercise inherits the same prescription line (no change).
5. **Add Set / Remove Set.** Both work as before; prescription line still reflects the original `entry.sets.length`. (Note: `entry.sets.length` updates live, so the "N sets" portion of the line tracks reality — this is intended, since it shows current planned sets.)
6. **Finish workout.** Save the workout. History page shows a mode badge next to the date.
7. **Progress page.** "By mode" card shows correct counts for the saved workouts.
8. **Legacy workout in history.** Inject one (spec §5; snippet in Task 7 step 6). History card renders without crash, no mode badge. Progress mode mix does NOT count it.
9. **Legacy current workout.** Inject one (snippet in Task 5 step 6). Workout page renders without crash, no prescription line, no mode badge in the WorkoutCard preview.

- [x] **Step 3: No partial commits left**

```bash
git status
```

Expected: working tree clean except for any pre-existing un-V2 changes (MVP code that's been uncommitted since before this plan started).

- [x] **Step 4: Final marker commit (only if there are uncommitted V2 changes)**

If `git status` shows V2-related modifications you forgot to commit during the tasks above, group them now:

```bash
git add <files>
git -c user.email="unnik@switchpt.com" -c user.name="Unni K" commit -m "feat(v2): smoke-pass cleanup"
```

Otherwise skip — Task 9 is verification only.

---

## Self-review (already run)

- **Spec coverage:** Each of spec §1–§5 maps to Task 1 (catalog/formatters), Task 2 (settings default), Task 3 (generation + prescription), Task 4 (Dashboard toggle), Tasks 5–7 (UI surfaces), Task 8 (Progress), and is exercised in Task 9's smoke checklist. Spec §6 file map is reflected in this plan's file map. Spec §7 testing approach is honored (lint + build + manual probes per task). Spec §8 has no open questions. Spec §9 risks (lint gotcha, cyclic import, rest unit) are called out in Tasks 4 (lazy init) and 2 (literal default), and the rest unit is set once in seconds in Task 1.
- **Placeholder scan:** No TBD/TODO/"add appropriate error handling" anywhere. Every code change shows full code; every command lists expected output.
- **Type consistency:** `mode.sets` / `mode.repsMin` / `mode.repsMax` / `mode.restMin` / `mode.restMax` named the same way in Task 1 (catalog), Task 3 (consumer), and Tasks 5/8 (formatters). `entry.prescription` shape (`{ repsMin, repsMax, restMin, restMax }`) is consistent between Task 3 (producer) and Task 5 (consumer). `workout.mode` is a string id, consistent across Tasks 3 / 6 / 7 / 8.
