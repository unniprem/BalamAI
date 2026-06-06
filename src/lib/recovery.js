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
