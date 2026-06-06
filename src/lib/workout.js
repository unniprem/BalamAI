import { CATEGORIES, EXERCISES, getExerciseById } from "@/data/exercises";

export function newId(prefix = "id") {
  return `${prefix}_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`;
}

function pickRandom(list) {
  return list[Math.floor(Math.random() * list.length)];
}

export function generateWorkout(previousWorkout) {
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
      sets: [
        { id: newId("set"), weight: 0, reps: 0, completed: false },
        { id: newId("set"), weight: 0, reps: 0, completed: false },
        { id: newId("set"), weight: 0, reps: 0, completed: false },
      ],
    };
  });

  return {
    id: newId("wo"),
    createdAt: new Date().toISOString(),
    startedAt: null,
    completedAt: null,
    exercises: picked,
  };
}

export function startWorkout(workout) {
  return { ...workout, startedAt: workout.startedAt || new Date().toISOString() };
}

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

export function addSet(workout, exerciseEntryId) {
  return {
    ...workout,
    exercises: workout.exercises.map((entry) => {
      if (entry.id !== exerciseEntryId) return entry;
      const last = entry.sets[entry.sets.length - 1];
      return {
        ...entry,
        sets: [
          ...entry.sets,
          {
            id: newId("set"),
            weight: last?.weight ?? 0,
            reps: last?.reps ?? 0,
            completed: false,
          },
        ],
      };
    }),
  };
}

export function removeSet(workout, exerciseEntryId, setId) {
  return {
    ...workout,
    exercises: workout.exercises.map((entry) =>
      entry.id === exerciseEntryId
        ? { ...entry, sets: entry.sets.filter((s) => s.id !== setId) }
        : entry,
    ),
  };
}

export function updateSet(workout, exerciseEntryId, setId, patch) {
  return {
    ...workout,
    exercises: workout.exercises.map((entry) =>
      entry.id === exerciseEntryId
        ? {
            ...entry,
            sets: entry.sets.map((s) => (s.id === setId ? { ...s, ...patch } : s)),
          }
        : entry,
    ),
  };
}

export function computeWorkoutVolume(workout) {
  let total = 0;
  for (const entry of workout.exercises || []) {
    for (const set of entry.sets || []) {
      if (!set.completed) continue;
      const w = Number(set.weight) || 0;
      const r = Number(set.reps) || 0;
      total += w * r;
    }
  }
  return total;
}

export function formatDuration(ms) {
  if (!ms || ms < 0) return "0m";
  const totalSeconds = Math.floor(ms / 1000);
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  if (hours > 0) return `${hours}h ${minutes}m`;
  return `${minutes}m`;
}

export function finishWorkout(workout) {
  const start = workout.startedAt ? new Date(workout.startedAt) : new Date();
  const end = new Date();
  const duration = end.getTime() - start.getTime();
  const totalVolume = computeWorkoutVolume(workout);
  return {
    ...workout,
    completedAt: end.toISOString(),
    duration,
    totalVolume,
  };
}

export function workoutSummary(workout) {
  return workout.exercises
    .map((entry) => getExerciseById(entry.exerciseId)?.name)
    .filter(Boolean);
}
