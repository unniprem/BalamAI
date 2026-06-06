import { useCallback, useState } from "react";
import { loadCurrentWorkout, saveCurrentWorkout } from "@/lib/storage";

export function useCurrentWorkout() {
  const [workout, setWorkout] = useState(() => loadCurrentWorkout());

  const persist = useCallback((next) => {
    setWorkout(next);
    saveCurrentWorkout(next);
  }, []);

  const update = useCallback(
    (updater) => {
      setWorkout((prev) => {
        const next = typeof updater === "function" ? updater(prev) : updater;
        saveCurrentWorkout(next);
        return next;
      });
    },
    [],
  );

  const clear = useCallback(() => {
    setWorkout(null);
    saveCurrentWorkout(null);
  }, []);

  return { workout, setWorkout: persist, update, clear };
}
