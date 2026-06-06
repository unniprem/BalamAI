# Recovery Tracking (V3.2) — Design Spec

**Scope:** V3.2 of BalamAI. Adds a derived muscle-group recovery panel to the Dashboard plus a per-workout warning banner on the Workout page when a freshly-generated workout hits muscles trained in the last 24 hours.

**Status:** Approved (pending review).

**Related docs:**
- `requements.md` §"Future Enhancements / Version 3" — lists "Recovery tracking" as one of three V3 features. V3.1 (Progressive overload) shipped; V3.3 (Equipment availability) is out of scope for this spec.
- `docs/superpowers/specs/2026-06-06-progressive-overload-design.md` — V3.1 spec; this spec mirrors its module-shape and verification posture.
- `docs/superpowers/specs/2026-06-06-goal-based-workouts-design.md` — V2 spec; introduced `workout.mode` and `entry.prescription`, both of which V3.2 *ignores* (see §6).

---

## §1 Architecture

A new pure module `src/lib/recovery.js` exports:

```js
recoveryStatus(history, nowMs) → [
  { bucket, lastTrainedAt, hoursAgo, status }, ...
]
// One entry per bucket. Order: Chest, Back, Shoulders, Biceps, Triceps,
// Quads, Hams+Glut, Core (fixed — does not reshuffle by status).

workoutRedBuckets(workout, history, nowMs) → ["chest", "triceps", ...]
// The buckets present in `workout` that have status === "trained" (red)
// in the recovery table derived from `history`.
```

Both helpers are **pure** — no `localStorage` access, no `Date.now()` / `new Date()` inside. Callers pass `nowMs` so the helpers stay deterministic and testable. Mirrors the V3.1 `overload.js` pattern.

Two new UI bits:
- `src/components/RecoveryPanel.jsx` — rendered on `Dashboard.jsx`, between the 3-card stats grid and the Training-mode toggle. (Stats + recovery group as the "current status" block; mode toggle + CTA group as the "next action" block below.)
- `src/components/RecoveryWarning.jsx` — rendered on `Workout.jsx`, above the first exercise card.

**No storage schema change.** Recovery is fully derived from existing `workout.completedAt`, `workout.exercises[].exerciseId`, and `workout.exercises[].sets[].completed`. The only schema addition is one optional boolean field on the *current* workout — see §4.

---

## §2 Bucket mapping

Eight display buckets, defined as `MUSCLE_BUCKET_MAP` in `src/lib/recovery.js`:

| Bucket | Raw `muscles[]` tags that contribute |
|---|---|
| `chest` | `chest`, `upper-chest` |
| `back` | `lats`, `mid-back`, `lower-back`, `traps` |
| `shoulders` | `front-delts`, `side-delts`, `rear-delts`, `shoulders` |
| `biceps` | `biceps`, `forearms` |
| `triceps` | `triceps` |
| `quads` | `quads` |
| `hams-glut` | `hamstrings`, `glutes` |
| `core` | `core`, `obliques`, `calves` |

Display labels (used by `RecoveryPanel`): `Chest`, `Back`, `Shoulders`, `Biceps`, `Triceps`, `Quads`, `Hams+Glut`, `Core`.

Calves are bucketed with Core (an "odds-and-ends" bucket). The catalog currently has one calf exercise; a dedicated bucket would almost always read green. This is a deliberate display choice — it does NOT mean calves and core recover together.

**Unmapped tags** (raw strings in `muscles[]` not present in the table above) are silently ignored. In development, a one-time `console.warn` lists any seen unmapped tag so the table can be extended when the catalog grows. Production builds stay quiet.

### What counts as "trained"

A muscle bucket is **trained** by a workout when, in that workout, there exists at least one exercise entry whose catalog `muscles[]` includes any tag mapped to the bucket AND that entry has at least one `set` with `completed === true`. Secondary movers count (e.g. bench → Triceps via secondary).

The bucket's `lastTrainedAt` is the maximum `workout.completedAt` across all workouts in `history` that train it.

Workouts with `completedAt: null` (in-progress) are skipped. Workouts with `completedAt` set but no completed sets at all are also skipped (defensive — should not happen via the UI).

---

## §3 Status computation

Given `lastTrainedAt` (a millisecond timestamp or `null`) and `nowMs`, with `hoursAgo = (nowMs - lastTrainedAt) / 3_600_000`:

| Condition | `status` | UI color | Label |
|---|---|---|---|
| `lastTrainedAt === null` | `ready` | green | `ready` |
| `hoursAgo < 24` AND same local calendar day | `trained` | red | `today` |
| `hoursAgo < 24` AND different local calendar day | `trained` | red | `yesterday` |
| `24 ≤ hoursAgo < 48` | `recovering` | amber | `1d ago` |
| `48 ≤ hoursAgo < 168` | `ready` | green | `Nd ago` where `N = floor(hoursAgo / 24)` |
| `hoursAgo ≥ 168` | `ready` | green | `7d+ ago` |

`sameCalendarDay = new Date(lastTrainedAt).toDateString() === new Date(nowMs).toDateString()`. The status decision uses only `hoursAgo`; the calendar-day comparison only affects the `today` vs `yesterday` label split inside the red band. (When `hoursAgo ≥ 24` the calendar day must differ — 24h cannot fit inside one calendar day — so the amber/green rows don't need a same-day variant.)

Color tokens (Tailwind utilities):
- `red` = `bg-rose-500` dot, `text-rose-500` accent text where needed.
- `amber` = `bg-amber-500` dot.
- `green` = `bg-emerald-500` dot. (Matches V3.1's "↑ bumped" emerald-500.)

---

## §4 Data model

**No `localStorage` key changes.** Existing `balamai:workouts` and `balamai:current-workout` are read as-is.

**One optional field added to a workout in `balamai:current-workout`:**

```ts
workout.recoveryWarningDismissed?: true
```

Set by `<RecoveryWarning>`'s "Keep workout" button via the existing `useCurrentWorkout` setter. Travels with the workout into history when finished (harmless residue; no consumer reads it after completion). Absent on freshly-generated workouts, which is how the banner reappears for the next workout that hits red muscles.

Pre-V2 legacy workouts in `balamai:workouts` (no `mode`, no `prescription`) still have `exercises[].exerciseId` and `sets[].completed`, so bucketing works for them. They are NOT skipped by recovery (see §6 — divergence from V3.1).

---

## §5 UI components

### §5.1 `<RecoveryPanel>` on Dashboard

Placement: `Dashboard.jsx`, between the 3-card stats grid and the Training-mode toggle (see §1).

```
┌── RECOVERY ──────────────────────────────────────────┐
│ ● Chest      today        ● Back       2d ago        │
│ ● Shoulders  yesterday    ● Biceps     ready         │
│ ● Triceps    today        ● Quads      3d ago        │
│ ● Hams+Glut  2d ago       ● Core       5d ago        │
└──────────────────────────────────────────────────────┘
```

- 2-column grid at `sm+`, 1-column on mobile. Bucket order: Chest, Back, Shoulders, Biceps, Triceps, Quads, Hams+Glut, Core. Fixed — not status-sorted.
- Card chrome reuses `Card`/`CardContent` from `src/components/ui/card`. Title header: small uppercase `RECOVERY` label like the "Training mode" row above the toggle.
- Each row: `<dot> <bucket label> <relative label>`. Dot is a 8px circle (`size-2 rounded-full`). Bucket label `text-sm`. Relative label `text-xs text-muted-foreground`.
- **Hidden when history is empty.** If `workouts.length === 0`, the panel renders nothing (returns `null`). Once at least one workout is completed, the panel mounts. Rationale: a fresh user sees 8 green "ready" dots that mean nothing.

### §5.2 `<RecoveryWarning>` on Workout page

Placement: `Workout.jsx`, top of the workout view (above the first `ExerciseCard`).

```
┌─ ⚠ Recently trained ─────────────────────────────────┐
│ This workout hits Chest and Triceps, which you       │
│ trained today.                                       │
│                                                       │
│  [Regenerate]   [Keep workout]                       │
└───────────────────────────────────────────────────────┘
```

- Background `bg-amber-500/10`, border `border-amber-500/40`. Icon: lucide-react `TriangleAlert` (`size-4 text-amber-500`).
- **Trigger:** all of the following:
  1. `workout != null` (we have a current workout).
  2. `workoutRedBuckets(workout, history, Date.now()).length > 0`.
  3. `workout.recoveryWarningDismissed !== true`.
- **Bucket list rendering** uses display labels from §2, joined by:
  - 1 bucket → `Chest`
  - 2 buckets → `Chest and Triceps`
  - 3+ → `Chest, Triceps, and Shoulders` (Oxford comma)
  - Order = the bucket order from §2 (Chest, Back, …), not the order they appear in the workout.
- **Trailing time clause** is the worst (newest) of the red buckets' labels — `today` if any red bucket trained today, else `yesterday`. (Red status implies `hoursAgo < 24`, so "today" or "yesterday" are the only possibilities.)
- **Buttons:**
  - `Regenerate` — calls `generateWorkout(currentWorkout, currentWorkout.mode, history)` and replaces the current workout via the existing `setWorkout` from `useCurrentWorkout`. Same code path as Dashboard's "Generate new". Banner re-evaluates against the new workout; if it still hits red muscles, banner stays.
  - `Keep workout` — calls `setWorkout({ ...workout, recoveryWarningDismissed: true })`. Banner unmounts.
- Smart-Swap on an individual `ExerciseCard` does NOT touch the banner state and does NOT re-trigger evaluation. The banner is a workout-level concern.
- The banner does NOT mount on `/history/:id` views (those are completed workouts; out of scope for "are you trying to overtrain today?").

---

## §6 Divergence from V3.1: no mode isolation

V3.1's `recommendForExercise` is **strictly mode-isolated** — a strength bench session does NOT inform a hypertrophy bench recommendation. V3.2 recovery is **NOT mode-isolated**: a strength session trains your chest just as much as a hypertrophy session does.

This means `recoveryStatus` walks ALL history regardless of `workout.mode`, and `workoutRedBuckets` ignores `workout.mode`. Pre-V2 workouts (no `mode` field at all) are included.

The divergence is intentional and call-out-worthy because the pattern from V3.1 might suggest otherwise. Document the choice with a comment in `src/lib/recovery.js`.

---

## §7 Testing approach

Project has no test runner. Verification mirrors V2/V3.1:

- `npm run lint` (0 errors)
- `npm run build` (Vite success)
- Manual probes per task via `npm run dev`, using DevTools console for pure-helper sanity and localStorage injection for end-to-end UI checks.

### Smoke checklist (executed at the end of the implementation plan)

1. **Fresh state.** `localStorage.clear(); location.reload();`. Dashboard does NOT render `<RecoveryPanel>` (empty history). Generate workout → `/workout` → no banner.
2. **One completed bench session, today.** Inject a finished workout with Bench Press, `completedAt: new Date().toISOString()`. Reload. Dashboard panel appears with Chest=red `today`, Triceps=red `today`, Shoulders=red `today`, everything else green `ready`. Generate a fresh workout → if it contains any push exercise hitting chest/triceps/front-delts, banner mounts on `/workout`. Click `Regenerate` → new workout; banner re-evaluates. Click `Keep workout` → banner unmounts; reload → banner stays gone (flag persisted on workout).
3. **Yesterday (30h ago).** Same fixture but `completedAt = new Date(Date.now() - 30*3600*1000).toISOString()`. Chest/Triceps/Shoulders = amber `1d ago`. Generate workout hitting those buckets → no banner (amber ≠ red).
4. **Two days ago (50h).** All buckets that this workout trained = green `2d ago`. No banner on any generated workout (no red buckets).
5. **Multi-day history.** Inject 3 workouts: today (bench), 2d ago (row), 5d ago (squat). Verify each bucket reflects most-recent training: Chest red `today`, Triceps red `today`, Shoulders red `today`, Back green `2d ago`, Biceps green `2d ago` (row → biceps secondary), Quads green `5d ago`, Hams+Glut green `5d ago`, Core green `ready` (none of those exercises hit core).
6. **Bucket label pluralization.** Force workouts hitting 1, 2, and 3+ red buckets. Banner text reads `Chest`, then `Chest and Triceps`, then `Chest, Triceps, and Shoulders` (Oxford comma).
7. **Dismissal scope.** Dismiss banner. Smart-Swap an exercise → banner stays dismissed. Finish workout. Click `Generate new` on Dashboard → banner reappears on the fresh workout if conditions match.
8. **Pre-V2 legacy entry in history.** Inject `{ id, exercises: [{ exerciseId: "bench-press", sets: [{weight:60, reps:12, completed:true}] }], completedAt: <today> }` (no `mode`, no `prescription`). Recovery panel still credits Chest/Triceps/Shoulders. No crash.
9. **In-progress workout in history (defensive).** Inject a workout with `completedAt: null` into `balamai:workouts`. Panel ignores it (treats as not-yet-trained).
10. **Mode-agnostic.** Inject a strength-mode bench session today. Switch Dashboard mode to hypertrophy. Recovery panel still shows Chest=red `today`. Banner still fires for hypertrophy-mode generated workouts that hit chest. (Confirms §6.)
11. **`> 7d` cap.** Inject a workout `completedAt: Date.now() - 10*24*3600*1000`. Affected buckets show `7d+ ago` (not `10d ago`).

### Per-task verification

Each task in the implementation plan ends with `npm run lint`, `npm run build`, a focused manual probe, and a commit. The full smoke checklist runs once at the end as its own task.

---

## §8 Risks / limitations

- **Bucketing is opinionated.** Calves-in-Core may surprise a serious lifter; Forearms-in-Biceps treats grip work as bicep recovery. Documented in §2; acceptable for V3.2 because the panel is advisory, not load-bearing.
- **Secondary-mover credit.** Every bench press counts as a "Triceps" training event. Some users may expect "I only trained chest, why is triceps red?" The trade-off favors the simpler implementation and the more honest physiological model. Documented in §2.
- **Same-calendar-day across midnight.** A workout finished at 11:50pm and viewed at 12:10am will read `1d ago` (because `hoursAgo` jumps to "less than 24" but calendar day differs). Acceptable; not worth special-casing.
- **No timezone awareness.** All calendar logic uses local time via `Date#toDateString()`. Travel-day glitches are out of scope.
- **No undo for `Keep workout`.** Once dismissed, the banner doesn't return for the current workout. Acceptable — the panel on Dashboard still shows the recovery state; the banner is just a nudge.
- **Banner can ping-pong on Regenerate.** If the user clicks Regenerate and the new workout still hits red muscles, the banner shows again with the same buckets. This is correct behavior, not a bug; the user can keep regenerating or hit Keep workout.

---

## §9 Out of scope (deferred)

- **Recovery-aware generation.** The generator does not weight its picks by recovery state. (Was considered; rejected to keep V3.2 scope tight. Future V3.x or V4 feature.)
- **Subjective soreness input.** No "how sore are you?" survey. Recovery is purely time-derived. (Future feature.)
- **Per-exercise recovery.** Recovery is per-bucket only. "It's been 4 days since I bench pressed specifically" is not tracked.
- **Equipment availability profiles** — V3.3, separate spec.

---

## §10 Success criteria

V3.2 is considered successful when, on a clean install:

1. A user with empty history sees no recovery panel on Dashboard and no banner on the Workout page.
2. After completing one workout, the Dashboard panel appears with eight buckets, correctly colored by what the workout trained.
3. Generating a new workout that hits any red bucket displays the warning banner on `/workout`.
4. The banner's bucket list is correctly ordered, pluralized, and Oxford-comma'd.
5. `Keep workout` dismisses the banner for that workout and the dismissal survives reload.
6. `Regenerate` creates a new workout and re-evaluates the banner against it.
7. The panel and banner gracefully handle pre-V2 legacy workouts in history without crashing.
8. `npm run lint` and `npm run build` pass with 0 errors.

---

## File map

| Path | Action |
|---|---|
| `src/lib/recovery.js` | NEW — `MUSCLE_BUCKET_MAP`, `BUCKET_ORDER`, `BUCKET_LABELS`, `recoveryStatus(history, nowMs)`, `workoutRedBuckets(workout, history, nowMs)` |
| `src/components/RecoveryPanel.jsx` | NEW — Dashboard panel; consumes `recoveryStatus` |
| `src/components/RecoveryWarning.jsx` | NEW — Workout-page banner; consumes `workoutRedBuckets` |
| `src/pages/Dashboard.jsx` | MODIFY — mount `<RecoveryPanel>` between stats grid and Generate CTA |
| `src/pages/Workout.jsx` | MODIFY — mount `<RecoveryWarning>` at top of workout view |
