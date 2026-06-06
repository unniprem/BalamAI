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
