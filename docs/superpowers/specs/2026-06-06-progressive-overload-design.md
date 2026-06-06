# Progressive Overload (V3.1) — Design Spec

**Scope:** V3.1 of BalamAI. Adds automatic weight/rep recommendations to the workout generator using a classic double-progression rule, surfaced as pre-filled set inputs on the Workout page.

**Status:** Approved (pending review).

**Related docs:**
- `requements.md` §"Future Enhancements / Version 3" — lists "Progressive overload recommendations" as one of three V3 features. V3.2 (Recovery tracking) and V3.3 (Equipment availability) are out of scope for this spec.
- `docs/superpowers/specs/2026-06-06-goal-based-workouts-design.md` — V2 mode catalog this builds on.

---

## §1 Architecture

A new pure module `src/lib/overload.js` exports:

```js
recommendForExercise(history, exerciseId, modeId, increment) →
  { weight, reps, source, fromWeight?, fromReps? }
```

It is called once per generated exercise from inside `generateWorkout`. The returned weight/reps seed **every set** in the new entry (not only set 1). The `source` discriminator (`"bumped" | "hold" | "first-time" | "bodyweight"`) is stamped onto the entry as `entry.recommendation` so the UI can render contextual hints without re-walking history.

`recommendForExercise` is pure — no localStorage access. Storage knowledge stays in `Dashboard.jsx` and `Workout.jsx`. Mirrors V2's `getMode` pattern.

---

## §2 Lookup rule

To find "last session" of a given exercise:

1. Iterate `history` (already sorted newest-first by `useWorkoutHistory`).
2. Skip workouts where `workout.mode` is missing (pre-V2 legacy).
3. Skip workouts where `workout.mode !== modeId` (cross-mode isolation).
4. For each candidate workout, find the first `entry` with `entry.exerciseId === exerciseId`.
5. Skip the entry if it has no `prescription` (pre-V2 legacy).
6. Skip the entry if it has zero completed sets.
7. The first entry surviving all of the above is the "last session."

If no entry survives → return `{ weight: 0, reps: 0, source: "first-time" }` and do not stamp `entry.recommendation` on the new entry.

---

## §3 Double-progression rule

Given the "last session" entry:

```
completedSets = entry.sets.filter(s => s.completed)
topWeight = max(completedSets.map(s => s.weight))
workingSets = completedSets.filter(s => s.weight === topWeight)
repsMax = entry.prescription.repsMax
```

(`increment` is passed in from the catalog — see §4.)

### Bodyweight branch (`increment === 0`)

- `weight = 0`
- `reps = max(workingSets.map(s => s.reps))`
- `source = "bodyweight"`
- No automatic rep bump. The user pushes on their own.

### Bump branch (`increment > 0` AND every working set has `reps >= repsMax`)

- `weight = topWeight + increment`
- `reps = entry.prescription.repsMin` (== current mode's `repsMin` because §2 enforces same-mode lookup)
- `source = "bumped"`

### Hold branch (otherwise)

- `weight = topWeight`
- `reps = max(workingSets.map(s => s.reps))`
- `source = "hold"`

In all three branches, attach `fromWeight = topWeight` and `fromReps = max(workingSets.map(s => s.reps))` to the recommendation (skipped for `first-time`).

### Notes

- A failed top set (e.g. attempted 65kg but only got 5 reps when range is 8-12) is a "working set" with `reps < repsMax`, so it BLOCKS the bump. This is intentional: the user attempted that weight and didn't earn it.
- If `workingSets` contains a single set, the rule still works — "every working set" trivially holds.
- All weight/rep math returns integers / fixed-point as in the existing schema. No fractional reps. Weights inherit whatever decimals are in the catalog increments (currently all whole or `.5` kg).

---

## §4 Data model changes

### `src/data/exercises.js`

Add an `increment` field (kg) to every exercise. Defaults assigned by inspection:

| Equipment / category | `increment` (kg) |
|---|---|
| Barbell legs (squat, deadlift, leg press, RDL, lunges-loaded) | `5` |
| Barbell upper / shoulders (bench, OHP, row, etc.) | `2.5` |
| Dumbbell (any) | `2.5` |
| Machine / cable | `5` |
| Bodyweight-only (pushup, pullup, plank, dead bug, bicycle crunch, leg raise, russian twist) | `0` |

> Bodyweight EXERCISES that COULD be loaded (e.g. weighted pull-up) are not handled separately — if the catalog entry includes any non-bodyweight equipment option, treat it as the heaviest equipment in the list. For V3.1 the catalog has no such ambiguous entries; document the rule in the catalog comment for future entries.

Every catalog entry MUST have `increment` after the migration in this spec. `recommendForExercise` treats `undefined` increment defensively as `0` (bodyweight branch) — i.e. it never bumps when the catalog data is missing. The expected mode of operation is that the catalog is complete.

### `entry.recommendation` (new optional field on each exercise entry)

```js
{
  source: "bumped" | "hold" | "bodyweight",  // omitted for first-time
  fromWeight: number,                          // last session's working weight
  fromReps: number,                            // last session's best reps among working sets
}
```

Not present on `first-time` entries. Not present on pre-V3.1 workouts (read code handles absence — see §5).

### No new localStorage keys

Recommendations are derived at generate-time and snapshotted onto the entry — same pattern as V2's `entry.prescription`.

---

## §5 UI surfaces

### ExerciseCard

Below the existing prescription line, render one contextual line when `entry.recommendation` exists. Weights render as their stored numeric value with no forced precision (`60` → `"60"`, `62.5` → `"62.5"`).

| `source` | Rendered line | Styling |
|---|---|---|
| `bumped` | `↑ {weight}kg × {reps} — last {fromWeight}kg × {fromReps}` | green accent (text-emerald-500 or similar) |
| `hold` | `→ {weight}kg × {reps} — last {fromWeight}kg × {fromReps}` | muted-foreground |
| `bodyweight` | `→ {reps} reps — last {fromReps} reps` | muted-foreground; weight hidden |

If `entry.recommendation` is absent (first-time or pre-V3.1 workout) → render nothing extra. Legacy V2 workouts with `entry.prescription` continue to show the prescription line; the new recommendation line is simply absent.

### SetTracker

No change. Sets render with whatever `weight`/`reps` are stored, which `generateWorkout` has pre-filled per §6. User edits as needed and marks `completed`. `addSet` still clones the last set, so adding a 5th set carries the recommended weight forward unchanged.

### Dashboard, WorkoutCard, WorkoutHistoryCard, Progress

No changes in this spec. (A "last PR" widget on Progress is interesting but explicitly out of scope.)

---

## §6 generateWorkout integration

Current signature:

```js
generateWorkout(previousWorkout, modeId)
```

New signature:

```js
generateWorkout(previousWorkout, modeId, history = [])
```

`Dashboard.handleGenerate` already calls `useWorkoutHistory()` and has access to the list. The call becomes:

```js
const fresh = generateWorkout(previous, mode, workouts);
```

Inside the body, after `chosen` is selected for a category:

```js
const exDef = getExerciseById(chosen.id);
const rec = recommendForExercise(history, chosen.id, mode.id, exDef.increment);

const entry = {
  id: newId("ex"),
  exerciseId: chosen.id,
  prescription: { repsMin: mode.repsMin, repsMax: mode.repsMax, restMin: mode.restMin, restMax: mode.restMax },
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
```

### `replaceExercise`

Smart Swap should also recompute the recommendation for the swapped-in exercise. Current signature:

```js
replaceExercise(workout, exerciseEntryId, newExerciseId)
```

New signature:

```js
replaceExercise(workout, exerciseEntryId, newExerciseId, history = [])
```

Behaviour change: the swap also resets `entry.sets` to N sets pre-filled with the new recommendation (where N is `entry.sets.length` — i.e. preserve the user's current sets count, since they may have added or removed sets). It also re-stamps `entry.recommendation` accordingly.

> **Open behaviour question — answered:** If the user has already marked some sets `completed` for the old exercise before swapping, those completions are discarded. This is the existing behaviour; PO does not change it. (The current `replaceExercise` simply changes `exerciseId` and leaves sets intact — that's actually slightly worse than what we're proposing, since stale set values from a different exercise are kept.)

Callers of `replaceExercise`: search for it under `src/`; pass `workouts` through.

---

## §7 Testing approach

The project has no test runner. V2 verified via `npm run lint` + `npm run build` + manual smoke probes — same here. The implementation plan will encode the following probes (one per task as relevant):

1. **First-time exercise** — clear localStorage; generate any mode; confirm all sets are `0×0` and no recommendation line renders on the cards.
2. **Hold case** — inject a completed workout where reps fell short of `repsMax` on some working sets; generate same mode; confirm pre-fill `weight == fromWeight`, `reps == max(working set reps)`, `source === "hold"`, and the muted "→" line renders.
3. **Bump case** — inject a completed workout where every working set hit `reps == repsMax`; generate same mode; confirm `weight == fromWeight + increment`, `reps == repsMin`, `source === "bumped"`, and the green "↑" line renders.
4. **Bodyweight** — generate a workout containing a push-up entry on a fresh history; complete it at e.g. 20 reps; generate again; confirm `weight == 0`, `reps == 20`, no bump even though range top might be 20.
5. **Cross-mode isolation** — record a hypertrophy session at 60kg×12; switch mode to strength; generate; confirm Bench Press recommendation comes back as `first-time` (no carry-over from hypertrophy).
6. **Smart Swap mid-workout** — generate; on `/workout` swap an exercise; confirm the new entry gets its own recommendation and sets are re-pre-filled.
7. **Legacy pre-V2 workout in history** — inject a workout without `mode`; confirm the lookup skips it silently and the next generate returns `first-time` for everything (if it's the only history).
8. **Legacy V2 workout in history** — inject a V2 workout (has `mode`, `prescription`, completed sets) but no `entry.recommendation`; confirm the lookup uses it correctly to feed V3.1 recommendations on the next generate.

---

## §8 Risks & known limitations

- **kg only.** lb support is deferred to a later V3.x. The catalog hardcodes kg increments.
- **Integer reps only.** No fractional rep handling.
- **Partial set completion.** Only `completed === true` sets feed the rule. Uncompleted sets are invisible to PO. Intentional.
- **No "I lifted what was recommended" detection.** If the bump pre-fills 62.5kg but the user lifts 60kg, that's recorded as 60kg and next session works off 60kg. The system silently follows reality. No "you fell short of recommendation" UX.
- **No multi-session smoothing.** The rule only looks at the single most recent matching session. A bad day will hold you back one session; the session after will work off whatever you recorded then. No EMA or trend logic in V3.1.
- **No deload logic.** If the user fails to progress for N sessions, there is no automatic deload recommendation. Deferred.
- **Catalog `increment` is fixed per exercise.** No user override (e.g. micro-plates). Adding a settings UI for this is deferred.
- **Recommendation is generation-time-only.** If the user generates a workout, sits on it for a week, and meanwhile records other workouts (unlikely but possible), the snapshotted recommendation may be stale. We don't re-derive on `/workout` mount. Matches V2's prescription-snapshot semantics.

---

## §9 File map

| Path | Action |
|---|---|
| `src/lib/overload.js` | NEW — pure module exporting `recommendForExercise` |
| `src/data/exercises.js` | MODIFY — add `increment` field to every exercise |
| `src/lib/workout.js` | MODIFY — `generateWorkout` and `replaceExercise` accept `history`, apply recommendation |
| `src/pages/Dashboard.jsx` | MODIFY — pass `workouts` into `generateWorkout` |
| `src/pages/Workout.jsx` (or wherever `replaceExercise` is called) | MODIFY — pass history into `replaceExercise` |
| `src/components/ExerciseCard.jsx` | MODIFY — render the recommendation line when `entry.recommendation` exists |

No new dependencies.

---

## §10 Success criteria

V3.1 is done when, with a clean localStorage:

1. First generated workout in any mode shows all sets at `0×0`, no recommendation lines.
2. After completing a hypertrophy session of Bench Press at 60kg × 12 on all 4 working sets, the next hypertrophy generate pre-fills 62.5kg × 8 on every Bench Press set and shows the green "↑ 62.5kg × 8 — last 60kg × 12" line.
3. After completing a hypertrophy session of Bench Press at 60kg × 10/10/9/10, the next generate pre-fills 60kg × 10 on every set and shows the muted "→ 60kg × 10 — last 60kg × 10" line.
4. Switching from hypertrophy to strength resets recommendations to `first-time` for all exercises (since no strength-mode history exists yet).
5. Push-ups never auto-bump weight; recommendations only mirror last rep count.
6. Smart Swap mid-workout recomputes the recommendation for the new exercise.
7. `npm run lint` and `npm run build` pass with no new errors/warnings.
