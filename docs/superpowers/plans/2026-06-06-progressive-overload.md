# Progressive Overload (V3.1) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Pre-fill every set's weight and reps in newly generated workouts using a classic double-progression rule driven by the user's same-mode history. Render a contextual "↑ bumped" / "→ hold" / "→ bodyweight" line on each ExerciseCard.

**Architecture:** A new pure module `src/lib/overload.js` exports `recommendForExercise(history, exerciseId, modeId, increment)`. `generateWorkout` now accepts a `history` argument and calls the helper once per picked exercise, using its return value to seed all of the entry's sets and to snapshot an `entry.recommendation` field. `replaceExercise` does the same so Smart Swap recomputes recommendations. The exercise catalog gains an `increment` field (kg) per entry — 0 for bodyweight-primary, 2.5 for barbell-upper / dumbbell, 5 for barbell-legs / machine / cable. `ExerciseCard` renders one more line below the prescription line when `entry.recommendation` is present.

**Tech Stack:** React 19, Vite, Tailwind v4, shadcn/ui, LocalStorage. No new dependencies.

**Spec:** `docs/superpowers/specs/2026-06-06-progressive-overload-design.md` (commit `5b7396d`).

**Testing approach:** The project has no test runner. Per spec §7, verification is `npm run lint` + `npm run build` + manual smoke probes via the dev server. Each task ends with a lint+build check and a commit.

---

## File map

| Path | Action |
|---|---|
| `src/data/exercises.js` | MODIFY — add `increment: number` to every exercise |
| `src/lib/overload.js` | NEW — `recommendForExercise` pure helper |
| `src/lib/workout.js` | MODIFY — `generateWorkout(prev, modeId, history)`; `replaceExercise(workout, entryId, newExerciseId, history)`; both apply recommendation |
| `src/pages/Dashboard.jsx` | MODIFY — pass `workouts` into `generateWorkout` |
| `src/pages/Workout.jsx` | MODIFY — pass `history` into `replaceExercise` |
| `src/components/ExerciseCard.jsx` | MODIFY — render the recommendation line |

---

### Task 1: Add `increment` field to the exercise catalog

**Files:**
- Modify: `src/data/exercises.js`

- [x] **Step 1: Add `increment` to every exercise definition**

For each `EXERCISES` entry, add `increment: <value>,` immediately after the `equipment: [...]` line. The full per-id mapping is below. Implementers: this is mechanical insertion — every existing object gains exactly one new key with the value from this table.

> Rule used to derive the table (provided for understanding, not for re-deriving): take the first entry of `equipment`. `bodyweight` → 0. `barbell` + `category==="legs"` → 5. `machine` or `cable` → 5. Everything else (barbell upper, any dumbbell) → 2.5.

| Exercise id | increment |
|---|---|
| `bench-press` | `2.5` |
| `incline-bench-press` | `2.5` |
| `dumbbell-bench-press` | `2.5` |
| `incline-dumbbell-press` | `2.5` |
| `push-up` | `0` |
| `machine-chest-press` | `5` |
| `cable-fly` | `5` |
| `dumbbell-fly` | `2.5` |
| `pec-deck` | `5` |
| `dips` | `0` |
| `close-grip-bench-press` | `2.5` |
| `tricep-pushdown` | `5` |
| `skull-crusher` | `2.5` |
| `pull-up` | `0` |
| `lat-pulldown` | `5` |
| `assisted-pull-up` | `5` |
| `barbell-row` | `2.5` |
| `cable-row` | `5` |
| `dumbbell-row` | `2.5` |
| `t-bar-row` | `2.5` |
| `face-pull-cable` | `5` |
| `reverse-pec-deck` | `5` |
| `bent-over-rear-delt-fly` | `2.5` |
| `barbell-curl` | `2.5` |
| `dumbbell-curl` | `2.5` |
| `hammer-curl` | `2.5` |
| `cable-curl` | `5` |
| `back-squat` | `5` |
| `front-squat` | `5` |
| `goblet-squat` | `2.5` |
| `bodyweight-squat` | `0` |
| `leg-press` | `5` |
| `hack-squat` | `5` |
| `walking-lunges` | `2.5` |
| `reverse-lunge` | `2.5` |
| `bulgarian-split-squat` | `2.5` |
| `romanian-deadlift` | `5` |
| `hamstring-curl` | `5` |
| `leg-extension` | `5` |
| `hip-thrust` | `5` |
| `glute-bridge` | `0` |
| `calf-raise` | `5` |
| `good-morning` | `5` |
| `overhead-press` | `2.5` |
| `dumbbell-shoulder-press` | `2.5` |
| `arnold-press` | `2.5` |
| `machine-shoulder-press` | `5` |
| `lateral-raise` | `2.5` |
| `cable-lateral-raise` | `5` |
| `machine-lateral-raise` | `5` |
| `face-pull` | `5` |
| `upright-row` | `2.5` |
| `shrug` | `2.5` |
| `front-raise` | `2.5` |
| `plank` | `0` |
| `side-plank` | `0` |
| `russian-twist` | `0` |
| `dead-bug` | `0` |
| `leg-raise` | `0` |
| `hanging-leg-raise` | `0` |
| `bicycle-crunch` | `0` |
| `ab-rollout` | `0` |
| `cable-crunch` | `5` |
| `mountain-climber` | `0` |

> If the catalog contains an exercise not listed above, fall back to the rule in the note above this table to derive its value. If new entries are added later, they must include `increment`.

Example shape for `bench-press` after editing:

```js
{
  id: "bench-press",
  name: "Bench Press",
  category: "push",
  muscles: ["chest", "triceps", "front-delts"],
  equipment: ["barbell"],
  increment: 2.5,
  alternatives: ["dumbbell-bench-press", "push-up", "machine-chest-press", "incline-bench-press"],
  videoUrl: yt("bench press"),
},
```

- [x] **Step 2: Verify all entries gained the field**

Run:

```bash
grep -c '^\s*id:' src/data/exercises.js
grep -c '^\s*increment:' src/data/exercises.js
```

Expected: both counts equal (one `increment` per `id`). If counts differ, find the entry that was missed.

- [x] **Step 3: Lint passes**

Run: `npm run lint`
Expected: 0 errors.

- [x] **Step 4: Build passes**

Run: `npm run build`
Expected: Vite reports success.

- [x] **Step 5: Commit**

```bash
git add src/data/exercises.js
git -c user.email="unnik@switchpt.com" -c user.name="Unni K" commit -m "feat(v3): add per-exercise increment to catalog"
```

---

### Task 2: `recommendForExercise` pure helper

**Files:**
- Create: `src/lib/overload.js`

- [x] **Step 1: Create the file**

Write `src/lib/overload.js`:

```js
// Pure helper: given workout history (newest first), find the most recent
// completed session of `exerciseId` in mode `modeId` and return a
// recommendation for today's prefill values.
//
// Returns one of:
//   { weight, reps, source: "first-time" }                         // no usable history
//   { weight, reps, source: "bumped",  fromWeight, fromReps }      // earned a weight bump
//   { weight, reps, source: "hold",    fromWeight, fromReps }      // stay at same weight
//   { weight, reps, source: "bodyweight", fromWeight, fromReps }   // increment===0 path
export function recommendForExercise(history, exerciseId, modeId, increment) {
  const last = findLastSession(history, exerciseId, modeId);
  if (!last) return { weight: 0, reps: 0, source: "first-time" };

  const { entry } = last;
  const completed = entry.sets.filter((s) => s.completed);
  if (completed.length === 0) {
    return { weight: 0, reps: 0, source: "first-time" };
  }

  const topWeight = completed.reduce((m, s) => Math.max(m, Number(s.weight) || 0), 0);
  const working = completed.filter((s) => (Number(s.weight) || 0) === topWeight);
  const bestReps = working.reduce((m, s) => Math.max(m, Number(s.reps) || 0), 0);
  const repsMax = entry.prescription.repsMax;
  const repsMin = entry.prescription.repsMin;

  const inc = Number(increment);
  if (!inc || inc === 0) {
    return {
      weight: 0,
      reps: bestReps,
      source: "bodyweight",
      fromWeight: topWeight,
      fromReps: bestReps,
    };
  }

  const everyWorkingSetHitTop = working.every((s) => (Number(s.reps) || 0) >= repsMax);
  if (everyWorkingSetHitTop) {
    return {
      weight: topWeight + inc,
      reps: repsMin,
      source: "bumped",
      fromWeight: topWeight,
      fromReps: bestReps,
    };
  }

  return {
    weight: topWeight,
    reps: bestReps,
    source: "hold",
    fromWeight: topWeight,
    fromReps: bestReps,
  };
}

// Walk newest-first history; return the first matching workout+entry, or null.
function findLastSession(history, exerciseId, modeId) {
  for (const workout of history || []) {
    if (!workout || !workout.mode) continue;        // skip pre-V2 legacy (no mode)
    if (workout.mode !== modeId) continue;          // cross-mode isolation
    const entry = (workout.exercises || []).find((e) => e.exerciseId === exerciseId);
    if (!entry) continue;
    if (!entry.prescription) continue;              // skip pre-V2 entries
    return { workout, entry };
  }
  return null;
}
```

- [x] **Step 2: Lint passes**

Run: `npm run lint`
Expected: 0 errors.

- [x] **Step 3: Build passes**

Run: `npm run build`
Expected: success. The module is unused so far — this just confirms valid syntax.

- [x] **Step 4: Manual probe — pure-function sanity via DevTools**

Start dev server: `npm run dev`. In the running app's DevTools console:

```js
const m = await import("/src/lib/overload.js");

// 1. First time (no history) → first-time
console.log("A:", m.recommendForExercise([], "bench-press", "hypertrophy", 2.5));
// Expected: { weight: 0, reps: 0, source: "first-time" }

// 2. Bump: every completed working set hit repsMax (12)
const histBump = [{
  mode: "hypertrophy",
  exercises: [{
    exerciseId: "bench-press",
    prescription: { repsMin: 8, repsMax: 12, restMin: 60, restMax: 90 },
    sets: [
      { weight: 60, reps: 12, completed: true },
      { weight: 60, reps: 12, completed: true },
      { weight: 60, reps: 12, completed: true },
      { weight: 60, reps: 12, completed: true },
    ],
  }],
}];
console.log("B:", m.recommendForExercise(histBump, "bench-press", "hypertrophy", 2.5));
// Expected: { weight: 62.5, reps: 8, source: "bumped", fromWeight: 60, fromReps: 12 }

// 3. Hold: last working set fell short
const histHold = [{
  mode: "hypertrophy",
  exercises: [{
    exerciseId: "bench-press",
    prescription: { repsMin: 8, repsMax: 12, restMin: 60, restMax: 90 },
    sets: [
      { weight: 60, reps: 12, completed: true },
      { weight: 60, reps: 11, completed: true },
      { weight: 60, reps: 10, completed: true },
      { weight: 60, reps: 10, completed: true },
    ],
  }],
}];
console.log("C:", m.recommendForExercise(histHold, "bench-press", "hypertrophy", 2.5));
// Expected: { weight: 60, reps: 12, source: "hold", fromWeight: 60, fromReps: 12 }

// 4. Bodyweight: increment 0
const histBw = [{
  mode: "hypertrophy",
  exercises: [{
    exerciseId: "push-up",
    prescription: { repsMin: 8, repsMax: 12, restMin: 60, restMax: 90 },
    sets: [{ weight: 0, reps: 20, completed: true }],
  }],
}];
console.log("D:", m.recommendForExercise(histBw, "push-up", "hypertrophy", 0));
// Expected: { weight: 0, reps: 20, source: "bodyweight", fromWeight: 0, fromReps: 20 }

// 5. Cross-mode isolation: hypertrophy history, ask strength
console.log("E:", m.recommendForExercise(histBump, "bench-press", "strength", 2.5));
// Expected: { weight: 0, reps: 0, source: "first-time" }

// 6. Legacy pre-V2 workout (no mode) skipped
const histLegacy = [{
  exercises: [{
    exerciseId: "bench-press",
    sets: [{ weight: 60, reps: 12, completed: true }],
  }],
}];
console.log("F:", m.recommendForExercise(histLegacy, "bench-press", "hypertrophy", 2.5));
// Expected: { weight: 0, reps: 0, source: "first-time" }
```

All six logs must match the "Expected" comment. If any drift, fix the helper before continuing.

- [x] **Step 5: Commit**

```bash
git add src/lib/overload.js
git -c user.email="unnik@switchpt.com" -c user.name="Unni K" commit -m "feat(v3): recommendForExercise pure helper (double-progression)"
```

---

### Task 3: `generateWorkout` accepts history + applies recommendation

**Files:**
- Modify: `src/lib/workout.js`

- [x] **Step 1: Add imports**

In `src/lib/workout.js`, change:

```js
import { CATEGORIES, EXERCISES, getExerciseById } from "@/data/exercises";
import { getMode } from "@/data/modes";
```

to:

```js
import { CATEGORIES, EXERCISES, getExerciseById } from "@/data/exercises";
import { getMode } from "@/data/modes";
import { recommendForExercise } from "@/lib/overload";
```

- [x] **Step 2: Replace `generateWorkout` body**

Current `generateWorkout` (the function exported on lines 12-48):

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

Replace it with:

```js
export function generateWorkout(previousWorkout, modeId, history = []) {
  const mode = getMode(modeId);
  const previousIds = new Set(
    (previousWorkout?.exercises || []).map((e) => e.exerciseId),
  );

  const picked = CATEGORIES.map((category) => {
    const pool = EXERCISES.filter((e) => e.category === category);
    const fresh = pool.filter((e) => !previousIds.has(e.id));
    const chosen = pickRandom(fresh.length > 0 ? fresh : pool);
    return buildEntry(chosen, mode, history);
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

// Build a fresh exercise entry with prescription, recommended pre-fill values,
// and an optional `recommendation` snapshot.
function buildEntry(exerciseDef, mode, history) {
  const rec = recommendForExercise(history, exerciseDef.id, mode.id, exerciseDef.increment);

  const entry = {
    id: newId("ex"),
    exerciseId: exerciseDef.id,
    prescription: {
      repsMin: mode.repsMin,
      repsMax: mode.repsMax,
      restMin: mode.restMin,
      restMax: mode.restMax,
    },
    sets: Array.from({ length: mode.sets }, () => ({
      id: newId("set"),
      weight: rec.weight,
      reps: rec.reps,
      completed: false,
    })),
  };

  if (rec.source !== "first-time") {
    entry.recommendation = {
      source: rec.source,
      fromWeight: rec.fromWeight,
      fromReps: rec.fromReps,
    };
  }

  return entry;
}
```

> `buildEntry` is also called by Task 5's updated `replaceExercise`, so leave the helper in this module.

- [x] **Step 3: Lint passes**

Run: `npm run lint`
Expected: 0 errors.

- [x] **Step 4: Build passes**

Run: `npm run build`
Expected: success.

- [x] **Step 5: Manual probe — defaults still work (no history)**

`npm run dev`. With an empty `balamai:workouts` (the default for a fresh user, or after `localStorage.removeItem("balamai:workouts"); location.reload();`), click "Generate new" on the Dashboard. In DevTools:

```js
const w = JSON.parse(localStorage.getItem("balamai:current-workout"));
console.log(w.exercises.map(e => ({ id: e.exerciseId, sets: e.sets.length, w0: e.sets[0].weight, r0: e.sets[0].reps, rec: e.recommendation })));
```

Every entry should show `w0: 0`, `r0: 0`, `rec: undefined`. Sets count matches the mode (4 for hypertrophy default).

- [x] **Step 6: Manual probe — with injected history, the bump applies**

Still in `npm run dev`. In DevTools:

```js
// Wipe any current workout and inject one completed hypertrophy bench session.
localStorage.removeItem("balamai:current-workout");
const past = {
  id: "wo_seed",
  createdAt: new Date(Date.now() - 86400_000).toISOString(),
  startedAt: new Date(Date.now() - 86400_000).toISOString(),
  completedAt: new Date(Date.now() - 86400_000).toISOString(),
  duration: 3_600_000,
  totalVolume: 60 * 12 * 4,
  mode: "hypertrophy",
  exercises: [{
    id: "ex_seed",
    exerciseId: "bench-press",
    prescription: { repsMin: 8, repsMax: 12, restMin: 60, restMax: 90 },
    sets: Array.from({length:4}, () => ({ id: "set_seed", weight: 60, reps: 12, completed: true })),
  }],
};
localStorage.setItem("balamai:workouts", JSON.stringify([past]));
location.reload();
```

After the reload, click Generate new. In DevTools:

```js
const w = JSON.parse(localStorage.getItem("balamai:current-workout"));
const bench = w.exercises.find(e => e.exerciseId === "bench-press");
console.log(bench);
```

If `bench` exists (push category randomly picked Bench Press), it must have:
- `sets[0].weight === 62.5`, `sets[0].reps === 8` (and all sets share these values).
- `recommendation.source === "bumped"`, `recommendation.fromWeight === 60`, `recommendation.fromReps === 12`.

If push category picked another exercise (random), regenerate until Bench Press appears. Or temporarily seed `previousIds` to force fresh picks elsewhere.

Cleanup: `localStorage.removeItem("balamai:workouts"); localStorage.removeItem("balamai:current-workout"); location.reload();`.

- [x] **Step 7: Commit**

```bash
git add src/lib/workout.js
git -c user.email="unnik@switchpt.com" -c user.name="Unni K" commit -m "feat(v3): generateWorkout applies overload recommendation"
```

---

### Task 4: Dashboard passes history into `generateWorkout`

**Files:**
- Modify: `src/pages/Dashboard.jsx`

- [x] **Step 1: Update `handleGenerate`**

The current `handleGenerate` looks like:

```js
function handleGenerate() {
  const previous = workouts[0] || workout;
  const fresh = generateWorkout(previous, mode);
  setWorkout(fresh);
  navigate("/workout");
}
```

Change it to:

```js
function handleGenerate() {
  const previous = workouts[0] || workout;
  const fresh = generateWorkout(previous, mode, workouts);
  setWorkout(fresh);
  navigate("/workout");
}
```

> No new imports needed: `workouts` is already in scope from `const { workouts } = useWorkoutHistory();` higher up in the component.

- [x] **Step 2: Lint passes**

Run: `npm run lint`
Expected: 0 errors.

- [x] **Step 3: Build passes**

Run: `npm run build`
Expected: success.

- [x] **Step 4: Manual probe — end-to-end through the UI**

`npm run dev`. Walk this in the browser:

1. `localStorage.clear(); location.reload();`
2. Pick **Hypertrophy** (the default). Click Generate new. Open `/workout` (the navigation does this). Every set starts at weight 0, reps 0. No recommendation line on any card (Task 7 hasn't shipped yet, but `entry.recommendation` is also `undefined` on every entry — verify via DevTools: `JSON.parse(localStorage.getItem("balamai:current-workout")).exercises.every(e => e.recommendation === undefined)` → `true`).
3. Without changing anything, mark all 4 Bench Press sets `completed` with `weight: 60`, `reps: 12` (use the UI). Click Finish workout. You're back on Dashboard.
4. Click Generate new again. Open `/workout`. The new Bench Press entry's first set should show `60` and `12` already pre-filled (or `62.5` and `8` if the same Bench Press happened to be re-picked — the avoid-previous logic still applies, so this scenario requires a re-roll). To force it, swap or regenerate until Bench Press appears again in the push slot. Then verify via DevTools:

```js
const bench = JSON.parse(localStorage.getItem("balamai:current-workout"))
  .exercises.find(e => e.exerciseId === "bench-press");
console.log(bench?.recommendation, bench?.sets[0]);
```

Expected: `recommendation: { source: "bumped", fromWeight: 60, fromReps: 12 }` and `sets[0]: { weight: 62.5, reps: 8, completed: false }`.

> If "avoid previous workout" keeps swapping bench out, that's expected behaviour — see Task 9's smoke checklist for the manual injection technique used to force this case.

- [x] **Step 5: Commit**

```bash
git add src/pages/Dashboard.jsx
git -c user.email="unnik@switchpt.com" -c user.name="Unni K" commit -m "feat(v3): Dashboard passes history into generateWorkout"
```

---

### Task 5: `replaceExercise` accepts history + re-pre-fills sets

**Files:**
- Modify: `src/lib/workout.js`

- [x] **Step 1: Replace `replaceExercise` body**

The current export:

```js
export function replaceExercise(workout, exerciseEntryId, newExerciseId) {
  return {
    ...workout,
    exercises: workout.exercises.map((entry) =>
      entry.id === exerciseEntryId
        ? { ...entry, exerciseId: newExerciseId }
        : entry,
    ),
  };
}
```

Replace it with:

```js
export function replaceExercise(workout, exerciseEntryId, newExerciseId, history = []) {
  const mode = getMode(workout.mode);
  const newDef = getExerciseById(newExerciseId);
  return {
    ...workout,
    exercises: workout.exercises.map((entry) => {
      if (entry.id !== exerciseEntryId) return entry;
      const rec = recommendForExercise(history, newDef.id, mode.id, newDef.increment);
      const next = {
        ...entry,
        exerciseId: newExerciseId,
        sets: entry.sets.map((s) => ({
          ...s,
          weight: rec.weight,
          reps: rec.reps,
          completed: false,
        })),
      };
      if (rec.source !== "first-time") {
        next.recommendation = {
          source: rec.source,
          fromWeight: rec.fromWeight,
          fromReps: rec.fromReps,
        };
      } else {
        delete next.recommendation;
      }
      return next;
    }),
  };
}
```

> Behaviour change vs. today: prior to this task, `replaceExercise` only changed `exerciseId` and left stale set values from the previous exercise. Now it also resets each set's `weight`/`reps`/`completed` and updates the recommendation. The number of sets is preserved (`entry.sets.map`, not regenerating), so the user's earlier "+Add set" actions still hold. The `delete next.recommendation` branch covers swapping into a first-time exercise after a previously-recommended one.

- [x] **Step 2: Lint passes**

Run: `npm run lint`
Expected: 0 errors.

- [x] **Step 3: Build passes**

Run: `npm run build`
Expected: success.

- [x] **Step 4: Commit (lib only — UI wiring lands in Task 6)**

```bash
git add src/lib/workout.js
git -c user.email="unnik@switchpt.com" -c user.name="Unni K" commit -m "feat(v3): replaceExercise re-prefills via recommendation"
```

---

### Task 6: Workout.jsx passes history into `replaceExercise`

**Files:**
- Modify: `src/pages/Workout.jsx`

- [x] **Step 1: Update the `onReplace` callback**

The current call site is around line 140:

```jsx
onReplace={(entryId, newExerciseId) =>
  update((prev) => replaceExercise(prev, entryId, newExerciseId))
}
```

Change it to:

```jsx
onReplace={(entryId, newExerciseId) =>
  update((prev) => replaceExercise(prev, entryId, newExerciseId, history))
}
```

> `history` is already in scope from `const { addWorkout, workouts: history } = useWorkoutHistory();` near the top of the component. No new imports needed.

- [x] **Step 2: Lint passes**

Run: `npm run lint`
Expected: 0 errors.

- [x] **Step 3: Build passes**

Run: `npm run build`
Expected: success.

- [x] **Step 4: Manual probe — Smart Swap recomputes recommendation**

`npm run dev`. In the browser:

1. `localStorage.clear(); location.reload();`
2. Inject history that includes both a Bench Press session and a Push-Up session, in hypertrophy mode:

```js
const past = {
  id: "wo_seed",
  createdAt: new Date().toISOString(),
  startedAt: new Date().toISOString(),
  completedAt: new Date().toISOString(),
  duration: 60_000,
  totalVolume: 0,
  mode: "hypertrophy",
  exercises: [
    {
      id: "ex_bench",
      exerciseId: "bench-press",
      prescription: { repsMin: 8, repsMax: 12, restMin: 60, restMax: 90 },
      sets: Array.from({length:4}, () => ({ id: "s", weight: 60, reps: 12, completed: true })),
    },
    {
      id: "ex_pushup",
      exerciseId: "push-up",
      prescription: { repsMin: 8, repsMax: 12, restMin: 60, restMax: 90 },
      sets: Array.from({length:4}, () => ({ id: "s", weight: 0, reps: 15, completed: true })),
    },
  ],
};
localStorage.setItem("balamai:workouts", JSON.stringify([past]));
location.reload();
```

3. Click Generate new. Navigate to `/workout` if not already there.
4. On any push entry, click the Replace button and swap to Bench Press. In DevTools:

```js
const w = JSON.parse(localStorage.getItem("balamai:current-workout"));
const bench = w.exercises.find(e => e.exerciseId === "bench-press");
console.log(bench.recommendation, bench.sets[0]);
```

Expected: `recommendation: { source: "bumped", fromWeight: 60, fromReps: 12 }` and `sets[0].weight === 62.5`, `sets[0].reps === 8`.

5. Now swap that same entry to Push-Up. Re-check DevTools:

```js
const w = JSON.parse(localStorage.getItem("balamai:current-workout"));
const pu = w.exercises.find(e => e.exerciseId === "push-up");
console.log(pu.recommendation, pu.sets[0]);
```

Expected: `recommendation: { source: "bodyweight", fromWeight: 0, fromReps: 15 }` and `sets[0].weight === 0`, `sets[0].reps === 15`.

6. Cleanup: `localStorage.clear(); location.reload();`.

- [x] **Step 5: Commit**

```bash
git add src/pages/Workout.jsx
git -c user.email="unnik@switchpt.com" -c user.name="Unni K" commit -m "feat(v3): Workout passes history into replaceExercise"
```

---

### Task 7: ExerciseCard renders the recommendation line

**Files:**
- Modify: `src/components/ExerciseCard.jsx`

- [x] **Step 1: Inspect the current header structure**

Open `src/components/ExerciseCard.jsx` and locate the `<CardHeader>` block. The V2 prescription line was inserted as:

```jsx
{entry.prescription ? (
  <p className="mt-1 text-[11px] font-medium text-foreground/80">
    {entry.sets.length} sets · {formatRepRange(entry.prescription)} reps · Rest {formatRestRange(entry.prescription)}
  </p>
) : null}
```

The recommendation line goes immediately after this `<p>` (still inside the same `<div className="min-w-0 flex-1">`).

- [x] **Step 2: Add the recommendation render**

Immediately after the closing `)}` of the prescription block above, insert:

```jsx
{entry.recommendation ? (() => {
  const r = entry.recommendation;
  const targetWeight = entry.sets[0]?.weight ?? 0;
  const targetReps = entry.sets[0]?.reps ?? 0;
  if (r.source === "bumped") {
    return (
      <p className="mt-1 text-[11px] font-medium text-emerald-500">
        ↑ {targetWeight}kg × {targetReps} — last {r.fromWeight}kg × {r.fromReps}
      </p>
    );
  }
  if (r.source === "hold") {
    return (
      <p className="mt-1 text-[11px] text-muted-foreground">
        → {targetWeight}kg × {targetReps} — last {r.fromWeight}kg × {r.fromReps}
      </p>
    );
  }
  if (r.source === "bodyweight") {
    return (
      <p className="mt-1 text-[11px] text-muted-foreground">
        → {targetReps} reps — last {r.fromReps} reps
      </p>
    );
  }
  return null;
})() : null}
```

> Numbers render with native JS `toString()` — `60` shows as `"60"`, `62.5` shows as `"62.5"`. No `toFixed` is desired.

- [x] **Step 3: Lint passes**

Run: `npm run lint`
Expected: 0 errors. Note: the IIFE pattern (`(() => { ... })()`) is intentional to keep the conditional rendering colocated; if `react/jsx-no-leaked-render` or similar rules complain, switch to a small named function above the JSX block.

- [x] **Step 4: Build passes**

Run: `npm run build`
Expected: success.

- [x] **Step 5: Manual probe — bumped (green ↑)**

`npm run dev`. In the browser:

1. `localStorage.clear(); location.reload();`
2. Inject the bump history snippet from Task 3 Step 6.
3. Click Generate new. Re-roll until Bench Press appears in push slot (refresh and regenerate if needed — or temporarily edit the `previousIds` Set to force a re-pick).
4. On the Workout page, the Bench Press card should show, below the prescription line:

```
↑ 62.5kg × 8 — last 60kg × 12
```

The text should be green (emerald-500).

- [x] **Step 6: Manual probe — hold (muted →)**

In DevTools, with the bump history seeded, edit the past workout so reps drop below 12:

```js
const past = JSON.parse(localStorage.getItem("balamai:workouts"))[0];
past.exercises[0].sets = past.exercises[0].sets.map((s, i) => ({ ...s, reps: i === 0 ? 12 : 10 }));
localStorage.setItem("balamai:workouts", JSON.stringify([past]));
localStorage.removeItem("balamai:current-workout");
location.reload();
```

Generate new. On the Bench Press card (re-roll if needed):

```
→ 60kg × 12 — last 60kg × 12
```

Text should be muted (text-muted-foreground, not green).

- [x] **Step 7: Manual probe — bodyweight**

Replace the seeded history with the push-up bodyweight history:

```js
const past = {
  id: "wo_seed_pu",
  createdAt: new Date().toISOString(),
  startedAt: new Date().toISOString(),
  completedAt: new Date().toISOString(),
  duration: 60_000,
  totalVolume: 0,
  mode: "hypertrophy",
  exercises: [{
    id: "ex_pu",
    exerciseId: "push-up",
    prescription: { repsMin: 8, repsMax: 12, restMin: 60, restMax: 90 },
    sets: [{ id: "s", weight: 0, reps: 18, completed: true }],
  }],
};
localStorage.setItem("balamai:workouts", JSON.stringify([past]));
localStorage.removeItem("balamai:current-workout");
location.reload();
```

Generate new. On a Push-Up card if it appears (regenerate if push picks something else), the line should read:

```
→ 18 reps — last 18 reps
```

- [x] **Step 8: Manual probe — first-time renders nothing extra**

`localStorage.clear(); location.reload();`. Generate new. No card should have a third line beneath the prescription line. The cards should look exactly like they did at the end of V2.

- [x] **Step 9: Manual probe — legacy V2 entry stays clean**

Inject a current workout that has prescription but no recommendation (V2 shape):

```js
const legacy = {
  id: "wo_legacy",
  createdAt: new Date().toISOString(),
  startedAt: new Date().toISOString(),
  completedAt: null,
  mode: "hypertrophy",
  exercises: [{
    id: "ex_legacy",
    exerciseId: "bench-press",
    prescription: { repsMin: 8, repsMax: 12, restMin: 60, restMax: 90 },
    sets: [{ id: "s", weight: 0, reps: 0, completed: false }],
  }],
};
localStorage.setItem("balamai:current-workout", JSON.stringify(legacy));
location.reload();
```

Navigate to `/workout`. The Bench Press card should render its prescription line and **no** recommendation line. No crash.

Cleanup: `localStorage.clear(); location.reload();`.

- [x] **Step 10: Commit**

```bash
git add src/components/ExerciseCard.jsx
git -c user.email="unnik@switchpt.com" -c user.name="Unni K" commit -m "feat(v3): ExerciseCard shows overload recommendation line"
```

---

### Task 8: Final smoke pass

**Files:** none — verification only.

- [x] **Step 1: Clean lint + build**

```bash
npm run lint
npm run build
```

Both must pass with 0 errors. Warnings that pre-existed before V3 are acceptable; new ones are not.

- [x] **Step 2: End-to-end smoke checklist**

`npm run dev`. Walk the following — every box must check:

1. **Fresh state.** `localStorage.clear(); location.reload();`. Dashboard shows mode toggle with Hypertrophy active. Generate new → cards have no recommendation line, all sets start at `0×0`.
2. **Bump path.** Inject the bump history snippet (Task 3 Step 6). Generate new — if Bench Press doesn't appear in push slot, regenerate until it does. The Bench Press card shows `↑ 62.5kg × 8 — last 60kg × 12` in green; `sets[0].weight === 62.5`, `sets[0].reps === 8`.
3. **Hold path.** Edit the seed so reps fall short (Task 7 Step 6 snippet). Regenerate. Bench Press card shows `→ 60kg × 12 — last 60kg × 12` in muted text; `sets[0].weight === 60`, `sets[0].reps === 12`.
4. **Bodyweight path.** Replace seed with push-up history (Task 7 Step 7). Regenerate. Push-Up card shows `→ N reps — last N reps`, weight stays 0, no auto bump.
5. **Cross-mode isolation.** Seed bump history (hypertrophy). Switch Dashboard mode to **Strength**. Generate new. Bench Press card shows no recommendation line and starts at `0×0`. Then switch back to Hypertrophy and Generate — bump line returns.
6. **Smart Swap.** With bump history seeded and a current workout open, swap one entry's exercise to Bench Press. The entry pre-fills `62.5kg × 8` and shows the green ↑ line. Swap to Push-Up: weight 0, reps mirror last, muted bodyweight line.
7. **Live editing.** On a "bumped" Bench Press card, manually edit set 1 to `60kg × 12` and mark it completed. The recommendation line should NOT change — it is a snapshot of generation-time data, not live.
8. **Finish workout still records.** Complete a workout (any state). Confirm `/history` shows it with the mode badge. Confirm `/progress` "By mode" count increments by 1. PO doesn't touch these surfaces.
9. **Legacy pre-V2 workout in history.** Inject `{ exercises: [{exerciseId: "bench-press", sets: [{weight: 60, reps: 12, completed: true}]}] }` (no `mode`, no `prescription`) into `balamai:workouts`. Generate new. Bench Press recommendation should be `first-time` (no line, sets at 0). No crash.
10. **Legacy V2 workout (no recommendation) in current workout.** Inject the snippet from Task 7 Step 9. `/workout` renders cleanly with prescription line, no recommendation line, no crash.

- [x] **Step 3: No partial commits left**

```bash
git status
```

Expected: working tree clean.

- [x] **Step 4: Final marker commit (only if V3 changes remain uncommitted)**

If `git status` shows V3-related modifications grouped from a probe gone wrong, commit them:

```bash
git add <files>
git -c user.email="unnik@switchpt.com" -c user.name="Unni K" commit -m "feat(v3): smoke-pass cleanup"
```

Otherwise skip.

---

## Self-review (already run)

- **Spec coverage:**
  - Spec §1 (architecture) → Task 2 creates the pure helper; Task 3 wires it into `generateWorkout`.
  - Spec §2 (lookup rule) → Task 2's `findLastSession` implements the exact filter chain.
  - Spec §3 (double-progression) → Task 2's `recommendForExercise` body implements bodyweight/bump/hold branches.
  - Spec §4 (data model: `increment` catalog field, `entry.recommendation` shape) → Task 1 (catalog) + Task 3 (stamp on entry).
  - Spec §5 (ExerciseCard line) → Task 7.
  - Spec §6 (generateWorkout signature + replaceExercise change) → Tasks 3, 4, 5, 6.
  - Spec §7 (testing approach — lint + build + manual probes per task) → encoded in every task plus the consolidated checklist in Task 8.
  - Spec §8 (risks/limitations) — these are documented constraints, not features to implement; no task needed.
  - Spec §10 (success criteria) → covered by Task 8's smoke checklist (items 1–10 map to the 7 criteria, with the smoke checklist adding edge cases).
- **Placeholder scan:** No TBD / TODO / "appropriate" / "similar to" anywhere. Every code change shows full code; every command lists expected output.
- **Type consistency:** `recommendation.source` values (`"bumped" | "hold" | "first-time" | "bodyweight"`) are spelled identically in Task 2 (producer), Task 3 (stamper), and Task 7 (consumer). `fromWeight`/`fromReps` shape is consistent. `increment` is `number` everywhere. `entry.sets[i].weight`/`.reps` are `number`. `mode.id` is the string from the catalog (`"hypertrophy"` etc.) — consistent with `workout.mode`.
- **Risks anticipated:**
  - Tasks 5 and 6 land sequentially: shipping 5 alone would change `replaceExercise` behaviour for existing Workout.jsx callers (they'd lose the new history-aware recommendation). Acceptable — the function signature is backward-compatible (`history = []`), so callers that don't pass history just get `first-time` recommendations, which means sets are reset to `0×0` and no recommendation stamp. This is mildly worse than today but still a working state. Task 6 fixes it. If executing serially, the gap is one commit wide.
  - Task 7's IIFE pattern is intentional but may trip strict React lint rules. Fallback (named helper above the JSX block) is mentioned in Task 7 Step 3.
  - The "regenerate until Bench Press appears" guidance in manual probes is annoying; the alternative is exposing `generateWorkout` for direct console use, which is not currently a stable API. Stick with regenerate-or-edit-history. Future ergonomic improvement, not blocking.
