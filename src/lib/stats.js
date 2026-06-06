import { getExerciseById } from "@/data/exercises";

function startOfDay(date) {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  return d;
}

function dayDiff(a, b) {
  const ms = startOfDay(a).getTime() - startOfDay(b).getTime();
  return Math.round(ms / 86_400_000);
}

export function computeStreak(workouts) {
  if (!workouts.length) return 0;
  const days = [
    ...new Set(
      workouts
        .filter((w) => w.completedAt)
        .map((w) => startOfDay(w.completedAt).toISOString()),
    ),
  ]
    .map((iso) => new Date(iso))
    .sort((a, b) => b - a);

  if (!days.length) return 0;

  const today = startOfDay(new Date());
  const first = days[0];
  const offset = dayDiff(today, first);
  if (offset > 1) return 0;

  let streak = 1;
  for (let i = 1; i < days.length; i++) {
    if (dayDiff(days[i - 1], days[i]) === 1) streak += 1;
    else break;
  }
  return streak;
}

export function lastWorkoutDate(workouts) {
  const completed = workouts.filter((w) => w.completedAt);
  if (!completed.length) return null;
  return completed
    .map((w) => new Date(w.completedAt))
    .sort((a, b) => b - a)[0];
}

export function totalVolume(workouts) {
  return workouts.reduce((sum, w) => sum + (Number(w.totalVolume) || 0), 0);
}

export function exerciseFrequency(workouts) {
  const counts = new Map();
  for (const w of workouts) {
    for (const entry of w.exercises || []) {
      counts.set(entry.exerciseId, (counts.get(entry.exerciseId) || 0) + 1);
    }
  }
  return [...counts.entries()]
    .map(([id, count]) => ({
      id,
      count,
      exercise: getExerciseById(id),
    }))
    .filter((row) => row.exercise)
    .sort((a, b) => b.count - a.count);
}

export function mostPerformedExercise(workouts) {
  const freq = exerciseFrequency(workouts);
  return freq[0] || null;
}

export function formatRelativeDate(date) {
  if (!date) return "—";
  const d = new Date(date);
  const today = startOfDay(new Date());
  const that = startOfDay(d);
  const diff = dayDiff(today, that);
  if (diff === 0) return "Today";
  if (diff === 1) return "Yesterday";
  if (diff < 7) return `${diff} days ago`;
  return d.toLocaleDateString(undefined, { month: "short", day: "numeric" });
}
