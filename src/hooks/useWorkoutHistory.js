import { useCallback, useState } from "react";
import { deleteWorkout, loadWorkouts, saveWorkout } from "@/lib/storage";

export function useWorkoutHistory() {
  const [workouts, setWorkouts] = useState(() => loadWorkouts());

  const add = useCallback((workout) => {
    const next = saveWorkout(workout);
    setWorkouts(next);
    return next;
  }, []);

  const remove = useCallback((id) => {
    const next = deleteWorkout(id);
    setWorkouts(next);
    return next;
  }, []);

  return { workouts, addWorkout: add, removeWorkout: remove };
}
