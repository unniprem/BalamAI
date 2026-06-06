# Goal-Based Workouts (V2) — Design

**Date:** 2026-06-06
**Status:** Approved
**Project:** BalamAI

## Summary

Add three training modes — **Strength**, **Hypertrophy**, **Fat Loss** — that change set count, rep range, and rest interval at workout generation. Selection lives as a segmented control on the Dashboard, persists in `settings`, and is snapshotted onto each exercise entry so historical workouts stay frozen even if mode constants change.

Exercise pool is **unchanged** — modes affect prescription only, not which exercises get picked.

## Goals

1. User picks a mode on the Dashboard and the next generated workout reflects it.
2. Each saved workout remembers the mode it was generated under and renders a badge in History.
3. Exercise cards show the rep range and rest window so the user knows what to target.
4. Progress page summarises mode mix across saved workouts.
5. Pre-V2 workouts in localStorage continue to render without crashing.

## Non-Goals

- Rest timer / countdown — display only this round.
- Mode-aware exercise selection (e.g. "Strength prefers barbell compounds").
- Per-exercise prescription overrides.
- Migration of legacy workouts to attach a mode.
- Settings page redesign — toggle lives on Dashboard, not in a new Settings screen.

---

## 1. Mode Catalog

New file `src/data/modes.js`:

```js
export const MODES = {
  strength:    { id: "strength",    label: "Strength",    sets: 5, repsMin: 3,  repsMax: 5,  restMin: 180, restMax: 300 },
  hypertrophy: { id: "hypertrophy", label: "Hypertrophy", sets: 4, repsMin: 8,  repsMax: 12, restMin: 60,  restMax: 90  },
  "fat-loss":  { id: "fat-loss",    label: "Fat Loss",    sets: 3, repsMin: 12, repsMax: 20, restMin: 30,  restMax: 45  },
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
  const fmt = (s) => (s >= 60 && s % 60 === 0 ? `${s / 60}m` : `${s}s`);
  // If both convert cleanly to minutes, render "3-5m"; otherwise "60-90s".
  if (restMin >= 60 && restMin % 60 === 0 && restMax % 60 === 0) {
    return `${restMin / 60}-${restMax / 60}m`;
  }
  return `${restMin}-${restMax}s`;
}
```

Rest values are stored in **seconds** to keep one canonical unit; the formatter promotes to minutes for nicer display when values divide cleanly.

## 2. Settings + Dashboard Toggle

### Settings extension
`src/lib/storage.js`:

```js
const DEFAULT_SETTINGS = {
  theme: "dark",
  mode: "hypertrophy", // DEFAULT_MODE from modes.js — keep literal here to avoid cyclic import
};
```

`loadSettings()` already spreads defaults over stored values, so existing users without a `mode` key get `"hypertrophy"` automatically.

### Dashboard control
On `src/pages/Dashboard.jsx`, above the "Generate New Workout" action:

```
Mode: [ Strength | Hypertrophy* | Fat Loss ]
```

- Implemented as a small inline segmented control built from buttons + Tailwind (no new shadcn component).
- Reads current mode from `loadSettings()`; writing calls `saveSettings({ mode })`.
- Changing the mode does NOT regenerate the existing in-progress or preview workout — it only affects the next `Generate New Workout` click.

## 3. Workout Generation — Snapshotted Prescription (Approach B)

### `generateWorkout` signature change
```js
export function generateWorkout(previousWorkout, modeId) {
  const mode = getMode(modeId);
  // ... existing category loop ...
  return {
    id, createdAt, startedAt: null, completedAt: null,
    mode: mode.id,
    exercises: picked, // each entry includes `prescription`, see below
  };
}
```

### Per-exercise entry shape (new fields)
```js
{
  id: "ex_...",
  exerciseId: "bench-press",
  prescription: {
    repsMin: 8,
    repsMax: 12,
    restMin: 60,
    restMax: 90,
  },
  sets: Array(mode.sets).fill().map(() => ({
    id: newId("set"), weight: 0, reps: 0, completed: false,
  })),
}
```

### Existing functions
- `addSet(...)` — unchanged. Clones last set; prescription is per-entry, not per-set.
- `removeSet(...)` — unchanged.
- `updateSet(...)` — unchanged.
- `replaceExercise(workout, entryId, newExerciseId)` — keeps the existing `prescription` on the entry; only `exerciseId` changes.
- `finishWorkout(...)` — unchanged; `mode` and `prescription` flow through naturally.

### Callers
- `Dashboard.jsx` "Generate New Workout" passes `settings.mode`.
- Anywhere else `generateWorkout()` is called without a mode falls back to `getMode(undefined) → DEFAULT_MODE` — no crash.

## 4. UI Changes

### `ExerciseCard.jsx`
Header gains a prescription line below the exercise name:

```
Bench Press                                    [push]
Sets 4 × 8-12  ·  Rest 60-90s
```

- Reads `entry.prescription`; if missing (legacy workout), the line is omitted entirely (no crash).

### `WorkoutCard.jsx` and `WorkoutHistoryCard.jsx`
Add a small mode badge next to the existing title:

```
Today's workout  [Hypertrophy]
```

- Uses `getMode(workout.mode).label`. If `workout.mode` is absent, badge is omitted.

### `Progress.jsx`
One additive line above the existing frequency card:

```
By mode:  Strength 2  ·  Hypertrophy 7  ·  Fat Loss 1
```

- Counts saved workouts grouped by `workout.mode`. Modes with zero count are still shown for completeness.
- Workouts with no `mode` are excluded from the breakdown (not bucketed as "Unknown" — keeps display clean).

## 5. Backward Compatibility

- **Storage:** No schema migration. `loadSettings()` spreads defaults so missing `mode` keys resolve to default.
- **Workouts without `mode`/`prescription`:** ExerciseCard hides the prescription line; History card hides the mode badge; Progress excludes them from the mode breakdown. All else (sets, totals, history) renders as before.
- **New workouts** always carry both fields.

## 6. Files Touched

| Path | Change |
|---|---|
| `src/data/modes.js` | NEW — mode catalog + formatters |
| `src/lib/storage.js` | Add `mode` to `DEFAULT_SETTINGS` |
| `src/lib/workout.js` | `generateWorkout` accepts mode, stamps `workout.mode` + `entry.prescription` |
| `src/pages/Dashboard.jsx` | Mode segmented control, pass mode to `generateWorkout` |
| `src/pages/Progress.jsx` | Mode-mix line above frequency card |
| `src/components/ExerciseCard.jsx` | Prescription line (sets × reps · rest) |
| `src/components/WorkoutCard.jsx` | Mode badge |
| `src/components/WorkoutHistoryCard.jsx` | Mode badge |

## 7. Testing

No unit-test harness exists in the project today; this phase keeps the MVP's manual-verification approach.

Verification commands:
- `npm run lint`
- `npm run build`
- `npm run dev` + smoke probes via curl on the dev server (ARM64 Playwright unavailable per project memory).

Smoke checklist:
1. Fresh user: Dashboard shows Mode toggle with Hypertrophy active. Reload — still Hypertrophy.
2. Switch to Strength → reload — Strength persists.
3. Generate workout in each mode → ExerciseCard shows correct `Sets N × X-Y · Rest …`.
4. Replace an exercise → prescription on that slot persists.
5. Add Set / Remove Set → prescription unaffected.
6. Finish workout → History card shows correct mode badge.
7. Progress → mode-mix line counts correctly.
8. Manually inject a legacy workout (no `mode`) into localStorage → renders without crash, no badge, no prescription line, excluded from mode mix.

## 8. Open Questions

None — all clarified during brainstorming.

## 9. Risks / Notes

- **Lint gotcha (carried over from MVP):** `react-hooks/set-state-in-effect` forbids `setState` inside `useEffect` for load-from-localStorage. Dashboard mode toggle uses `useState(() => loadSettings().mode)` lazy initializer to stay compliant.
- **Cyclic import risk:** `storage.js` could import `DEFAULT_MODE` from `modes.js`, but `modes.js` should not import from `storage.js`. Keeping `mode: "hypertrophy"` as a literal in `DEFAULT_SETTINGS` sidesteps this entirely.
- **Rest unit:** seconds in storage, formatted to minutes for display. Don't mix.
