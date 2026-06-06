# Recovery Tracking (V3.2) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Surface a derived muscle-group recovery panel on the Dashboard and a "you trained this yesterday/today" warning banner on freshly generated workouts. Recovery is computed from workout history with zero new storage schema; the only new persisted field is one optional dismissal flag on the current workout.

**Architecture:** A new pure module `src/lib/recovery.js` exports `BUCKET_ORDER`, `BUCKET_LABELS`, `MUSCLE_BUCKET_MAP`, `recoveryStatus(history, nowMs)`, `recoveryLabel(entry, nowMs)`, and `workoutRedBuckets(workout, history, nowMs)`. Two new components — `<RecoveryPanel>` on Dashboard and `<RecoveryWarning>` on the Workout page — consume those helpers. Unlike V3.1's overload module, recovery is intentionally **mode-agnostic** (see spec §6).

**Tech Stack:** React 19, Vite, Tailwind v4, shadcn/ui, LocalStorage, lucide-react. No new dependencies.

**Spec:** `docs/superpowers/specs/2026-06-06-recovery-tracking-design.md` (commit `6812a10`).

**Testing approach:** The project has no test runner. Per spec §7, verification is `npm run lint` + `npm run build` + manual smoke probes via the dev server. Each task ends with a lint+build check and a commit.

---

## File map

| Path | Action |
|---|---|
| `src/lib/recovery.js` | NEW — pure helpers + bucket map |
| `src/components/RecoveryPanel.jsx` | NEW — Dashboard recovery panel |
| `src/components/RecoveryWarning.jsx` | NEW — Workout-page warning banner |
| `src/pages/Dashboard.jsx` | MODIFY — mount `<RecoveryPanel>` between stats grid and mode toggle |
| `src/pages/Workout.jsx` | MODIFY — mount `<RecoveryWarning>` above first exercise card |

---

### Task 1: `src/lib/recovery.js` — pure helpers

**Files:**
- Create: `src/lib/recovery.js`

- [x] **Step 1: Create the file**

Write `src/lib/recovery.js`:

```js
import { getExerciseById } from "@/data/exercises";

// V3.2 Recovery.
//
// IMPORTANT divergence from V3.1's `overload.js`: recovery is INTENTIONALLY
// mode-agnostic. A strength bench session trains your chest just as much as
// a hypertrophy bench session does, so `recoveryStatus` walks ALL workouts in
// `history` regardless of `workout.mode`. Pre-V2 workouts (no `mode` field at
// all) are included too — bucketing only needs `exercises[].exerciseId` and
// `sets[].completed`, which both legacy and current workouts have.

export const BUCKET_ORDER = [
  "chest",
  "back",
  "shoulders",
  "biceps",
  "triceps",
  "quads",
  "hams-glut",
  "core",
];

export const BUCKET_LABELS = {
  chest: "Chest",
  back: "Back",
  shoulders: "Shoulders",
  biceps: "Biceps",
  triceps: "Triceps",
  quads: "Quads",
  "hams-glut": "Hams+Glut",
  core: "Core",
};

// Catalog raw-tag → display bucket. Every distinct tag observed in
// `src/data/exercises.js` at the time of writing is mapped. `shoulders`
// is mapped defensively (not currently in the catalog).
export const MUSCLE_BUCKET_MAP = {
  chest: "chest",
  "upper-chest": "chest",
  lats: "back",
  "mid-back": "back",
  "upper-back": "back",
  "lower-back": "back",
  traps: "back",
  "front-delts": "shoulders",
  "side-delts": "shoulders",
  "rear-delts": "shoulders",
  shoulders: "shoulders",
  biceps: "biceps",
  forearms: "biceps",
  triceps: "triceps",
  quads: "quads",
  hamstrings: "hams-glut",
  glutes: "hams-glut",
  core: "core",
  abs: "core",
  "lower-abs": "core",
  obliques: "core",
  calves: "core",
};

const _warnedUnmapped = new Set();
function warnUnmapped(tag) {
  if (import.meta.env.PROD) return;
  if (_warnedUnmapped.has(tag)) return;
  _warnedUnmapped.add(tag);
  // eslint-disable-next-line no-console
  console.warn(`[recovery] Unmapped muscle tag: "${tag}"`);
}

function bucketsForExercise(exerciseId) {
  const def = getExerciseById(exerciseId);
  if (!def || !Array.isArray(def.muscles)) return [];
  const out = new Set();
  for (const tag of def.muscles) {
    const bucket = MUSCLE_BUCKET_MAP[tag];
    if (bucket) {
      out.add(bucket);
    } else {
      warnUnmapped(tag);
    }
  }
  return [...out];
}

// Returns { completedAtMs, buckets: [...] } for a workout that qualifies,
// or null if it doesn't (no completedAt, malformed completedAt, or no
// entry has any completed set).
function bucketsTrainedByWorkout(workout) {
  if (!workout || !workout.completedAt) return null;
  const completedAtMs = new Date(workout.completedAt).getTime();
  if (!Number.isFinite(completedAtMs)) return null;

  const bucketsHit = new Set();
  for (const entry of workout.exercises || []) {
    const anyCompleted = (entry.sets || []).some((s) => s.completed);
    if (!anyCompleted) continue;
    for (const b of bucketsForExercise(entry.exerciseId)) {
      bucketsHit.add(b);
    }
  }
  if (bucketsHit.size === 0) return null;
  return { completedAtMs, buckets: [...bucketsHit] };
}

function statusForHoursAgo(hoursAgo) {
  if (hoursAgo == null) return "ready";
  if (hoursAgo < 24) return "trained";
  if (hoursAgo < 48) return "recovering";
  return "ready";
}

// Public: one entry per bucket in BUCKET_ORDER. `hoursAgo` and
// `lastTrainedAt` are null when no qualifying history exists for the
// bucket. `status` ∈ {"ready" | "recovering" | "trained"}.
export function recoveryStatus(history, nowMs) {
  const lastTrainedAt = Object.fromEntries(BUCKET_ORDER.map((b) => [b, null]));

  for (const workout of history || []) {
    const trained = bucketsTrainedByWorkout(workout);
    if (!trained) continue;
    for (const b of trained.buckets) {
      const prev = lastTrainedAt[b];
      if (prev == null || trained.completedAtMs > prev) {
        lastTrainedAt[b] = trained.completedAtMs;
      }
    }
  }

  return BUCKET_ORDER.map((bucket) => {
    const last = lastTrainedAt[bucket];
    const hoursAgo = last == null ? null : (nowMs - last) / 3_600_000;
    return {
      bucket,
      lastTrainedAt: last,
      hoursAgo,
      status: statusForHoursAgo(hoursAgo),
    };
  });
}

// Public: a relative-time label derived from a single recoveryStatus entry.
// "ready" | "today" | "yesterday" | "1d ago" | ... | "7d+ ago"
export function recoveryLabel(entry, nowMs) {
  if (!entry || entry.lastTrainedAt == null) return "ready";
  const { lastTrainedAt, hoursAgo } = entry;
  if (hoursAgo < 24) {
    const sameCalendarDay =
      new Date(lastTrainedAt).toDateString() === new Date(nowMs).toDateString();
    return sameCalendarDay ? "today" : "yesterday";
  }
  if (hoursAgo < 48) return "1d ago";
  if (hoursAgo < 168) return `${Math.floor(hoursAgo / 24)}d ago`;
  return "7d+ ago";
}

// Public: the buckets a given workout TARGETS that are currently red
// (status === "trained") in the recovery table derived from `history`.
// Ordered by BUCKET_ORDER.
export function workoutRedBuckets(workout, history, nowMs) {
  if (!workout) return [];
  const statuses = recoveryStatus(history, nowMs);
  const redSet = new Set(
    statuses.filter((s) => s.status === "trained").map((s) => s.bucket),
  );

  const workoutBuckets = new Set();
  for (const entry of workout.exercises || []) {
    for (const b of bucketsForExercise(entry.exerciseId)) {
      workoutBuckets.add(b);
    }
  }

  return BUCKET_ORDER.filter((b) => redSet.has(b) && workoutBuckets.has(b));
}
```

- [x] **Step 2: Lint passes**

Run: `npm run lint`
Expected: 0 errors.

- [x] **Step 3: Build passes**

Run: `npm run build`
Expected: Vite reports success. The module is unused so far — this confirms valid syntax.

- [x] **Step 4: Manual probe — pure-function sanity via DevTools**

Start dev server: `npm run dev`. In the running app's DevTools console:

```js
const m = await import("/src/lib/recovery.js");
const now = Date.now();

// A. Empty history → every bucket "ready"
console.log("A:", m.recoveryStatus([], now).map(e => `${e.bucket}=${e.status}`).join(" "));
// Expected: chest=ready back=ready shoulders=ready biceps=ready triceps=ready quads=ready hams-glut=ready core=ready

// B. One completed bench session today → chest/triceps/shoulders red
const benchToday = {
  id: "wo1",
  completedAt: new Date(now - 3600_000).toISOString(),  // 1h ago, same calendar day
  exercises: [{
    id: "ex1",
    exerciseId: "bench-press",
    sets: [
      { id: "s1", weight: 60, reps: 12, completed: true },
      { id: "s2", weight: 60, reps: 12, completed: true },
    ],
  }],
};
console.log("B:", m.recoveryStatus([benchToday], now).map(e => `${e.bucket}=${e.status}`).join(" "));
// Expected: chest=trained back=ready shoulders=trained biceps=ready triceps=trained quads=ready hams-glut=ready core=ready

// C. 30h ago (different day) → those buckets amber, label "1d ago"
const benchYesterday = { ...benchToday, completedAt: new Date(now - 30*3600_000).toISOString() };
const C = m.recoveryStatus([benchYesterday], now);
console.log("C status:", C.find(e => e.bucket === "chest").status); // Expected: recovering
console.log("C label:", m.recoveryLabel(C.find(e => e.bucket === "chest"), now)); // Expected: 1d ago

// D. 50h ago → green again, label "2d ago"
const benchTwoDays = { ...benchToday, completedAt: new Date(now - 50*3600_000).toISOString() };
const D = m.recoveryStatus([benchTwoDays], now);
console.log("D status:", D.find(e => e.bucket === "chest").status); // Expected: ready
console.log("D label:", m.recoveryLabel(D.find(e => e.bucket === "chest"), now)); // Expected: 2d ago

// E. 10 days ago → "7d+ ago"
const benchOld = { ...benchToday, completedAt: new Date(now - 10*24*3600_000).toISOString() };
const E = m.recoveryStatus([benchOld], now);
console.log("E label:", m.recoveryLabel(E.find(e => e.bucket === "chest"), now)); // Expected: 7d+ ago

// F. completedAt null (in-progress workout) → ignored
const inProgress = { ...benchToday, completedAt: null };
console.log("F:", m.recoveryStatus([inProgress], now).find(e => e.bucket === "chest").status); // Expected: ready

// G. No completed sets → ignored
const noneCompleted = {
  ...benchToday,
  exercises: [{ ...benchToday.exercises[0], sets: [{ id: "s1", weight: 0, reps: 0, completed: false }] }],
};
console.log("G:", m.recoveryStatus([noneCompleted], now).find(e => e.bucket === "chest").status); // Expected: ready

// H. Pre-V2 legacy (no mode, no prescription, no completedAt? — well, completed history workouts DO have completedAt)
// The "pre-V2" case here means a workout missing `mode`/`prescription` but with completedAt + completed sets.
const legacy = {
  id: "wo_legacy",
  completedAt: new Date(now - 2*3600_000).toISOString(),
  exercises: [{ id: "ex", exerciseId: "bench-press", sets: [{ id: "s", weight: 60, reps: 12, completed: true }] }],
};
console.log("H:", m.recoveryStatus([legacy], now).find(e => e.bucket === "chest").status); // Expected: trained

// I. workoutRedBuckets — current workout hits chest+shoulders, history says chest+triceps+shoulders are red
const currentWo = {
  id: "wo_current",
  exercises: [
    { id: "ex_b", exerciseId: "bench-press", sets: [] },                  // hits chest+shoulders+triceps
    { id: "ex_q", exerciseId: "back-squat", sets: [] },                    // hits quads+hams-glut+core (no overlap)
  ],
};
console.log("I:", m.workoutRedBuckets(currentWo, [benchToday], now));
// Expected: ["chest", "shoulders", "triceps"]  (ordered by BUCKET_ORDER)

// J. Most-recent wins across multiple workouts
const olderBench = { ...benchToday, completedAt: new Date(now - 5*24*3600_000).toISOString() };
const newerBench = { ...benchToday, completedAt: new Date(now - 1*3600_000).toISOString() };
const J = m.recoveryStatus([olderBench, newerBench], now);
console.log("J:", m.recoveryLabel(J.find(e => e.bucket === "chest"), now)); // Expected: today
```

All ten log lines must match their expected output. If any drifts, fix the helper before continuing.

- [x] **Step 5: Commit**

```bash
git add src/lib/recovery.js
git -c user.email="unnik@switchpt.com" -c user.name="Unni K" commit -m "feat(v3): recovery.js pure helpers + bucket map"
```

---

### Task 2: `<RecoveryPanel>` component

**Files:**
- Create: `src/components/RecoveryPanel.jsx`

- [x] **Step 1: Create the file**

Write `src/components/RecoveryPanel.jsx`:

```jsx
import { useMemo, useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import {
  BUCKET_LABELS,
  recoveryLabel,
  recoveryStatus,
} from "@/lib/recovery";
import { cn } from "@/lib/utils";

const DOT_BY_STATUS = {
  trained: "bg-rose-500",
  recovering: "bg-amber-500",
  ready: "bg-emerald-500",
};

export function RecoveryPanel({ history }) {
  // Captured once on mount — `react-hooks/purity` rejects a bare `Date.now()`
  // during render. Re-mount on nav refreshes this naturally.
  const [nowMs] = useState(() => Date.now());
  const rows = useMemo(() => recoveryStatus(history, nowMs), [history, nowMs]);

  if (!history || history.length === 0) return null;

  return (
    <Card className="border-border/80">
      <CardContent className="flex flex-col gap-3 p-5">
        <span className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
          Recovery
        </span>
        <div className="grid grid-cols-1 gap-x-6 gap-y-2 sm:grid-cols-2">
          {rows.map((row) => (
            <div key={row.bucket} className="flex items-center gap-2">
              <span
                className={cn("size-2 shrink-0 rounded-full", DOT_BY_STATUS[row.status])}
                aria-hidden
              />
              <span className="text-sm">{BUCKET_LABELS[row.bucket]}</span>
              <span className="ml-auto text-xs text-muted-foreground">
                {recoveryLabel(row, nowMs)}
              </span>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
```

> The `nowMs` is captured once per render, which means the panel labels won't tick from "today" to "yesterday" if the user leaves the dashboard open across midnight. That's acceptable for V3.2; any nav action re-renders the panel.

- [x] **Step 2: Lint passes**

Run: `npm run lint`
Expected: 0 errors.

- [x] **Step 3: Build passes**

Run: `npm run build`
Expected: success.

- [x] **Step 4: Commit (component only — Dashboard wiring lands in Task 3)**

```bash
git add src/components/RecoveryPanel.jsx
git -c user.email="unnik@switchpt.com" -c user.name="Unni K" commit -m "feat(v3): RecoveryPanel component"
```

---

### Task 3: Mount `<RecoveryPanel>` on Dashboard

**Files:**
- Modify: `src/pages/Dashboard.jsx`

- [x] **Step 1: Add the import**

In `src/pages/Dashboard.jsx`, add a line to the imports block (alphabetically near `StatsCard` and `WorkoutCard`):

```jsx
import { RecoveryPanel } from "@/components/RecoveryPanel";
```

- [x] **Step 2: Mount the panel between stats grid and mode toggle**

Find the JSX block that ends the 3-card stats grid (`</div>` after the three `<StatsCard>` elements, currently around line 80). Immediately after that `</div>` and before the next `<div className="flex flex-col gap-2">` (the Training mode block), insert:

```jsx
      <RecoveryPanel history={workouts} />
```

> `workouts` is already in scope from `const { workouts } = useWorkoutHistory();` at the top of the component. No new imports needed beyond `RecoveryPanel`.

The resulting region of `Dashboard.jsx` reads:

```jsx
        <StatsCard
          icon={Calendar}
          label="Last workout"
          value={formatRelativeDate(stats.last)}
          hint={stats.last ? new Date(stats.last).toLocaleDateString() : "No history yet"}
        />
      </div>

      <RecoveryPanel history={workouts} />

      <div className="flex flex-col gap-2">
        <div className="flex items-center justify-between">
          <span className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
            Training mode
          </span>
```

- [x] **Step 3: Lint passes**

Run: `npm run lint`
Expected: 0 errors.

- [x] **Step 4: Build passes**

Run: `npm run build`
Expected: success.

- [x] **Step 5: Manual probe — empty history hides the panel**

`npm run dev`. In DevTools:

```js
localStorage.clear();
location.reload();
```

The Dashboard should render: header → stats grid → Training mode toggle → CTA card. No "RECOVERY" panel anywhere.

- [x] **Step 6: Manual probe — one completed workout shows the panel**

Still in `npm run dev`. In DevTools:

```js
const now = Date.now();
const past = {
  id: "wo_seed",
  createdAt: new Date(now - 3600_000).toISOString(),
  startedAt: new Date(now - 3600_000).toISOString(),
  completedAt: new Date(now - 3600_000).toISOString(),
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

The Dashboard now shows a "RECOVERY" card between the stats row and the Training mode toggle. Expected dots:
- Chest = red, label `today`
- Back = green, label `ready`
- Shoulders = red, label `today` (bench's front-delts)
- Biceps = green, label `ready`
- Triceps = red, label `today` (bench's secondary)
- Quads = green, label `ready`
- Hams+Glut = green, label `ready`
- Core = green, label `ready`

- [x] **Step 7: Manual probe — 50h-ago session shows green "2d ago"**

In DevTools:

```js
const past = JSON.parse(localStorage.getItem("balamai:workouts"))[0];
const newCompletedAt = new Date(Date.now() - 50*3600_000).toISOString();
past.completedAt = newCompletedAt;
past.startedAt = newCompletedAt;
past.createdAt = newCompletedAt;
localStorage.setItem("balamai:workouts", JSON.stringify([past]));
location.reload();
```

Recovery panel: Chest/Shoulders/Triceps all green, label `2d ago`. Others green `ready`.

- [x] **Step 8: Cleanup**

```js
localStorage.clear();
location.reload();
```

- [x] **Step 9: Commit**

```bash
git add src/pages/Dashboard.jsx
git -c user.email="unnik@switchpt.com" -c user.name="Unni K" commit -m "feat(v3): mount RecoveryPanel on Dashboard"
```

---

### Task 4: `<RecoveryWarning>` component

**Files:**
- Create: `src/components/RecoveryWarning.jsx`

- [x] **Step 1: Create the file**

Write `src/components/RecoveryWarning.jsx`:

```jsx
import { useMemo, useState } from "react";
import { TriangleAlert } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  BUCKET_LABELS,
  recoveryLabel,
  recoveryStatus,
  workoutRedBuckets,
} from "@/lib/recovery";

function joinOxford(parts) {
  if (parts.length === 0) return "";
  if (parts.length === 1) return parts[0];
  if (parts.length === 2) return `${parts[0]} and ${parts[1]}`;
  return `${parts.slice(0, -1).join(", ")}, and ${parts[parts.length - 1]}`;
}

// "today" if any red bucket was trained today; otherwise "yesterday".
// Red status (hoursAgo < 24) means it can only be one of those two.
function worstRedLabel(redBuckets, history, nowMs) {
  const statuses = recoveryStatus(history, nowMs);
  for (const b of redBuckets) {
    const entry = statuses.find((s) => s.bucket === b);
    if (entry && recoveryLabel(entry, nowMs) === "today") return "today";
  }
  return "yesterday";
}

export function RecoveryWarning({ workout, history, onRegenerate, onKeep }) {
  // Captured once on mount — `react-hooks/purity` rejects a bare `Date.now()`
  // during render. The Workout page remounts this on navigation.
  const [nowMs] = useState(() => Date.now());
  const reds = useMemo(
    () => workoutRedBuckets(workout, history, nowMs),
    [workout, history, nowMs],
  );

  if (!workout) return null;
  if (workout.recoveryWarningDismissed === true) return null;
  if (reds.length === 0) return null;

  const labels = reds.map((b) => BUCKET_LABELS[b]);
  const when = worstRedLabel(reds, history, nowMs);

  return (
    <div className="flex flex-col gap-2 rounded-xl border border-amber-500/40 bg-amber-500/10 p-4">
      <div className="flex items-center gap-2 text-sm font-medium text-amber-500">
        <TriangleAlert className="size-4" aria-hidden />
        Recently trained
      </div>
      <p className="text-sm text-foreground/90">
        This workout hits {joinOxford(labels)}, which you trained {when}.
      </p>
      <div className="mt-1 flex flex-wrap gap-2">
        <Button size="sm" onClick={onRegenerate}>
          Regenerate
        </Button>
        <Button size="sm" variant="outline" onClick={onKeep}>
          Keep workout
        </Button>
      </div>
    </div>
  );
}
```

- [x] **Step 2: Lint passes**

Run: `npm run lint`
Expected: 0 errors.

- [x] **Step 3: Build passes**

Run: `npm run build`
Expected: success.

- [x] **Step 4: Commit (component only — Workout wiring lands in Task 5)**

```bash
git add src/components/RecoveryWarning.jsx
git -c user.email="unnik@switchpt.com" -c user.name="Unni K" commit -m "feat(v3): RecoveryWarning component"
```

---

### Task 5: Mount `<RecoveryWarning>` on Workout page

**Files:**
- Modify: `src/pages/Workout.jsx`

- [x] **Step 1: Add the import**

In `src/pages/Workout.jsx`, add to the existing imports block (near the `ExerciseCard` import):

```jsx
import { RecoveryWarning } from "@/components/RecoveryWarning";
```

- [x] **Step 2: Add the regenerate/keep handlers**

Inside the `Workout` component, immediately AFTER the existing `handleFinish` function and BEFORE the `if (!workout)` block, add:

```jsx
  function handleRecoveryRegenerate() {
    if (!workout) return;
    const fresh = generateWorkout(workout, workout.mode, history);
    // Don't carry the dismissal flag across regeneration.
    setWorkout(startWorkout(fresh));
  }

  function handleRecoveryKeep() {
    update((prev) => (prev ? { ...prev, recoveryWarningDismissed: true } : prev));
  }
```

> `generateWorkout` and `startWorkout` are already imported at the top of the file. `setWorkout`, `update`, and `history` are already in scope.

- [x] **Step 3: Render the warning above the first exercise card**

Locate the JSX block that renders `workout.exercises.map(...)`:

```jsx
      <div className="flex flex-col gap-3">
        {workout.exercises.map((entry) => (
```

Immediately BEFORE that `<div className="flex flex-col gap-3">` (so the warning sits between the workout-header `<header>` and the exercise list), insert:

```jsx
      <RecoveryWarning
        workout={workout}
        history={history}
        onRegenerate={handleRecoveryRegenerate}
        onKeep={handleRecoveryKeep}
      />
```

The resulting region reads:

```jsx
        <h1 className="text-2xl font-semibold tracking-tight md:text-3xl">
          Today's session
        </h1>
      </header>

      <RecoveryWarning
        workout={workout}
        history={history}
        onRegenerate={handleRecoveryRegenerate}
        onKeep={handleRecoveryKeep}
      />

      <div className="flex flex-col gap-3">
        {workout.exercises.map((entry) => (
```

- [x] **Step 4: Lint passes**

Run: `npm run lint`
Expected: 0 errors.

- [x] **Step 5: Build passes**

Run: `npm run build`
Expected: success.

- [x] **Step 6: Manual probe — banner appears, Regenerate works, Keep persists**

`npm run dev`. In DevTools:

```js
localStorage.clear();
const now = Date.now();
const past = {
  id: "wo_seed",
  createdAt: new Date(now - 3600_000).toISOString(),
  startedAt: new Date(now - 3600_000).toISOString(),
  completedAt: new Date(now - 3600_000).toISOString(),
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

On the Dashboard, click **Generate new**. You arrive on `/workout`.

1. **Banner visible:** A "Recently trained" amber banner sits above the first exercise card. Text reads something like `This workout hits Chest, Shoulders, and Triceps, which you trained today.` (push-slot exercise determines which buckets show; this is the case if the push slot is bench/incline/decline/dumbbell-press/dips — almost any push exercise hits at least Chest+Triceps).
2. **Regenerate:** Click `Regenerate`. The workout content changes. If the new workout still hits red buckets, the banner stays (text may update). Verify via DevTools:
    ```js
    const w = JSON.parse(localStorage.getItem("balamai:current-workout"));
    console.log(w.exercises.map(e => e.exerciseId));
    ```
    The list should differ from before.
3. **Keep workout:** Click `Keep workout`. The banner disappears immediately. Verify:
    ```js
    const w = JSON.parse(localStorage.getItem("balamai:current-workout"));
    console.log(w.recoveryWarningDismissed);  // Expected: true
    ```
4. **Persistence:** Reload the page (`location.reload()`). The banner stays gone (flag persisted on the workout).

- [x] **Step 7: Manual probe — pluralization variants**

While still on `/workout` with the bench-today seed in history:

```js
// Force the current workout to have exactly the push slot hitting red buckets
// by editing it directly.
const w = JSON.parse(localStorage.getItem("balamai:current-workout"));
delete w.recoveryWarningDismissed;
// Single-bucket variant: only an exercise that ONLY hits triceps.
w.exercises = [
  { id: "e1", exerciseId: "tricep-pushdown", sets: [{ id: "s", weight: 0, reps: 0, completed: false }] },
];
localStorage.setItem("balamai:current-workout", JSON.stringify(w));
location.reload();
```

Banner text: `This workout hits Triceps, which you trained today.`

```js
const w = JSON.parse(localStorage.getItem("balamai:current-workout"));
delete w.recoveryWarningDismissed;
// Two-bucket variant
w.exercises = [
  { id: "e1", exerciseId: "tricep-pushdown", sets: [{ id: "s", weight: 0, reps: 0, completed: false }] },
  { id: "e2", exerciseId: "dumbbell-fly", sets: [{ id: "s", weight: 0, reps: 0, completed: false }] },
];
localStorage.setItem("balamai:current-workout", JSON.stringify(w));
location.reload();
```

Banner text: `This workout hits Chest and Triceps, which you trained today.` (Chest comes before Triceps in BUCKET_ORDER.)

```js
const w = JSON.parse(localStorage.getItem("balamai:current-workout"));
delete w.recoveryWarningDismissed;
// Three-bucket variant (push category bench → chest, shoulders, triceps)
w.exercises = [
  { id: "e1", exerciseId: "bench-press", sets: [{ id: "s", weight: 0, reps: 0, completed: false }] },
];
localStorage.setItem("balamai:current-workout", JSON.stringify(w));
location.reload();
```

Banner text: `This workout hits Chest, Shoulders, and Triceps, which you trained today.` (Oxford comma + BUCKET_ORDER.)

- [x] **Step 8: Manual probe — no red buckets → no banner**

```js
localStorage.clear();
const now = Date.now();
const past = {
  id: "wo_old",
  createdAt: new Date(now - 50*3600_000).toISOString(),
  startedAt: new Date(now - 50*3600_000).toISOString(),
  completedAt: new Date(now - 50*3600_000).toISOString(),
  duration: 3_600_000,
  totalVolume: 60 * 12 * 4,
  mode: "hypertrophy",
  exercises: [{
    id: "ex_old",
    exerciseId: "bench-press",
    prescription: { repsMin: 8, repsMax: 12, restMin: 60, restMax: 90 },
    sets: [{ id: "s", weight: 60, reps: 12, completed: true }],
  }],
};
localStorage.setItem("balamai:workouts", JSON.stringify([past]));
location.reload();
```

Generate new → `/workout`. No banner. Recovery panel on Dashboard shows the relevant buckets as green `2d ago`.

- [x] **Step 9: Cleanup**

```js
localStorage.clear();
location.reload();
```

- [x] **Step 10: Commit**

```bash
git add src/pages/Workout.jsx
git -c user.email="unnik@switchpt.com" -c user.name="Unni K" commit -m "feat(v3): mount RecoveryWarning on Workout page"
```

---

### Task 6: Final smoke pass

**Files:** none — verification only.

- [x] **Step 1: Clean lint + build**

```bash
npm run lint
npm run build
```

Both must pass with 0 errors. Warnings that pre-existed before V3.2 are acceptable; new ones are not.

- [x] **Step 2: End-to-end smoke checklist**

`npm run dev`. Walk these in order — every box must check:

1. **Fresh state.** `localStorage.clear(); location.reload();`. Dashboard shows no "RECOVERY" panel. Click Generate new → `/workout` → no banner.
2. **One completed bench session, today.** Inject:
    ```js
    const now = Date.now();
    localStorage.setItem("balamai:workouts", JSON.stringify([{
      id: "w1",
      completedAt: new Date(now - 3600_000).toISOString(),
      mode: "hypertrophy",
      exercises: [{ id: "e1", exerciseId: "bench-press", sets: [{ id: "s", weight: 60, reps: 12, completed: true }] }],
    }]));
    localStorage.removeItem("balamai:current-workout");
    location.reload();
    ```
    Dashboard panel: Chest=red `today`, Shoulders=red `today`, Triceps=red `today`, everything else green `ready`. Generate new → if push slot hits any of those buckets, banner appears with appropriate text. Click `Regenerate` → new workout, banner re-evaluates. Click `Keep workout` → banner gone; reload → banner stays gone (flag persisted).
3. **Yesterday (30h ago).** Replace `completedAt` with `new Date(now - 30*3600_000).toISOString()`. Reload. Panel: Chest/Shoulders/Triceps = amber `1d ago`. Generate → no banner (amber ≠ red).
4. **Two days ago (50h).** Replace `completedAt` with `new Date(now - 50*3600_000).toISOString()`. Reload. Panel: trained buckets green `2d ago`. No banner on any generated workout.
5. **Multi-day history.** Inject 3 workouts spanning today (bench), 2d ago (barbell-row), 5d ago (back-squat):
    ```js
    const now = Date.now();
    localStorage.setItem("balamai:workouts", JSON.stringify([
      { id: "wA", completedAt: new Date(now - 1*3600_000).toISOString(), mode: "hypertrophy",
        exercises: [{ id: "e", exerciseId: "bench-press", sets: [{ id: "s", weight: 60, reps: 12, completed: true }] }] },
      { id: "wB", completedAt: new Date(now - 50*3600_000).toISOString(), mode: "hypertrophy",
        exercises: [{ id: "e", exerciseId: "barbell-row", sets: [{ id: "s", weight: 60, reps: 12, completed: true }] }] },
      { id: "wC", completedAt: new Date(now - 5*24*3600_000).toISOString(), mode: "hypertrophy",
        exercises: [{ id: "e", exerciseId: "back-squat", sets: [{ id: "s", weight: 100, reps: 5, completed: true }] }] },
    ]));
    localStorage.removeItem("balamai:current-workout");
    location.reload();
    ```
    Recovery panel expected:
    - Chest = red `today` (bench)
    - Back = green `2d ago` (barbell-row → mid-back, lats)
    - Shoulders = red `today` (bench → front-delts)
    - Biceps = green `2d ago` (barbell-row → biceps secondary)
    - Triceps = red `today` (bench)
    - Quads = green `5d ago` (back-squat)
    - Hams+Glut = green `5d ago` (back-squat → glutes + hamstrings)
    - Core = green `ready` (no exercise in this fixture hits core)
6. **Bucket label pluralization.** Use the snippets from Task 5 Step 7 — verify 1-bucket, 2-bucket, and 3-bucket banner text spellings (single name; `A and B`; `A, B, and C`).
7. **Dismissal scope.** With the today-bench seed, generate a workout that triggers the banner. Click `Keep workout` → banner gone. Smart-Swap one of the visible exercises → banner stays gone. Click `Finish workout` and confirm. Back on Dashboard, click `Generate new` again → banner reappears on the new workout if it still hits red buckets.
8. **Pre-V2 legacy entry in history.** Inject `{ id: "wL", completedAt: new Date(Date.now() - 1*3600_000).toISOString(), exercises: [{ id: "e", exerciseId: "bench-press", sets: [{ id: "s", weight: 60, reps: 12, completed: true }] }] }` (no `mode`, no `prescription`). Recovery panel still credits Chest/Shoulders/Triceps as red `today`. No crash.
9. **In-progress workout in history (defensive).** Inject `{ id: "wI", completedAt: null, exercises: [{ id: "e", exerciseId: "bench-press", sets: [{ id: "s", weight: 60, reps: 12, completed: true }] }] }` into `balamai:workouts`. Panel ignores it (treats as not-yet-trained — every bucket = green `ready` if there's no other history).
10. **Mode-agnostic.** Inject a strength-mode bench session today (`mode: "strength"`). Switch Dashboard mode to hypertrophy. Recovery panel still shows Chest=red `today`. Banner still fires for hypertrophy-mode generated workouts that hit chest.
11. **`> 7d` cap.** Inject `completedAt: new Date(Date.now() - 10*24*3600_000).toISOString()`. Affected buckets show `7d+ ago` (not `10d ago`).

- [x] **Step 3: No partial commits left**

```bash
git status
```

Expected: working tree clean.

- [x] **Step 4: Final marker commit (only if V3.2 changes remain uncommitted)**

If `git status` shows V3.2-related modifications grouped from a probe gone wrong, commit them:

```bash
git add <files>
git -c user.email="unnik@switchpt.com" -c user.name="Unni K" commit -m "feat(v3): recovery smoke-pass cleanup"
```

Otherwise skip.

---

## Self-review (already run)

- **Spec coverage:**
  - Spec §1 (architecture: pure module + 2 components) → Task 1 (module), Tasks 2 & 4 (components), Tasks 3 & 5 (wiring).
  - Spec §2 (bucket mapping, including the corrected `abs` / `lower-abs` / `upper-back` tags) → Task 1's `MUSCLE_BUCKET_MAP`.
  - Spec §2 ("what counts as trained": completedAt + at least one completed set + secondary movers count) → Task 1's `bucketsTrainedByWorkout` (the `anyCompleted` guard) + `bucketsForExercise` (no primary/secondary distinction).
  - Spec §3 (status computation, including `today` vs `yesterday` calendar-day split) → Task 1's `statusForHoursAgo` + `recoveryLabel`.
  - Spec §4 (`workout.recoveryWarningDismissed?: true` schema addition) → Task 5 Step 2's `handleRecoveryKeep` writes it via the existing `update` setter.
  - Spec §5.1 (RecoveryPanel: 2-column layout, fixed bucket order, hidden on empty history, placement between stats and mode toggle) → Task 2 (layout) + Task 3 (placement).
  - Spec §5.2 (RecoveryWarning: trigger conditions, Oxford-comma pluralization, today/yesterday clause, Regenerate vs Keep workout buttons, no `/history/:id` mount) → Task 4 (component) + Task 5 (workout-page wiring only — `/history/:id` is a separate route and never imports the warning).
  - Spec §6 (mode-agnostic by design) → Task 1's leading comment + Task 1's `recoveryStatus` never reads `workout.mode`. Smoke checklist item 10 confirms.
  - Spec §7 (testing posture: lint + build + manual probes per task, full smoke at the end) → encoded in every task + Task 6.
  - Spec §8 risks/limitations — these are documented constraints, not features to implement; no task needed.
  - Spec §9 out-of-scope items (recovery-aware generation, soreness survey, per-exercise recovery, equipment availability) — deliberately NOT implemented.
  - Spec §10 success criteria — Task 6's smoke checklist items 1-11 collectively cover all 8 criteria.
- **Placeholder scan:** No TBD / TODO / "appropriate" / "similar to" anywhere. Every code change shows full code; every command lists expected output.
- **Type consistency:** Bucket identifiers (`"chest"`, `"back"`, `"shoulders"`, `"biceps"`, `"triceps"`, `"quads"`, `"hams-glut"`, `"core"`) spelled identically in `BUCKET_ORDER`, `BUCKET_LABELS`, and `MUSCLE_BUCKET_MAP` (Task 1). Status values (`"ready" | "recovering" | "trained"`) spelled identically in producer (`statusForHoursAgo`), consumer color map (`DOT_BY_STATUS` in Task 2), and `workoutRedBuckets` filter (`s.status === "trained"`). Field names `lastTrainedAt`, `hoursAgo`, `status`, `bucket` are consistent across `recoveryStatus`, `recoveryLabel`, and the components.
- **Risks anticipated:**
  - **Module-singleton warning cache.** `_warnedUnmapped` in Task 1 is module-scoped, so each tag warns once per browser session. Acceptable — it's a dev-only nudge.
  - **`nowMs` captured once per render.** The Dashboard panel and Workout banner don't tick across midnight. If the user leaves the dashboard open from 11:30pm to 12:30am, "today" labels won't update without navigation. Documented in Task 2 Step 1 comment. Not worth a `useEffect` interval for V3.2.
  - **Banner ping-pong on Regenerate.** Documented in spec §8. The implementation in Task 5 Step 2 deliberately doesn't carry over `recoveryWarningDismissed` when regenerating, so the banner correctly re-evaluates against the new workout.
  - **Same-calendar-day check across DST.** `Date.toDateString()` is locale-independent (English short form), so it doesn't care about DST. Hours-ago math uses raw ms differences. Both layers ignore DST cleanly.
  - **Sets array can be missing.** Pre-V2 entries in the catalog stay safe via `(entry.sets || []).some(...)` in `bucketsTrainedByWorkout`. Tested via smoke item 8.
