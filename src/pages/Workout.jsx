import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { CheckCircle2, Dumbbell, Timer } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ExerciseCard } from "@/components/ExerciseCard";
import { useCurrentWorkout } from "@/hooks/useCurrentWorkout";
import { useWorkoutHistory } from "@/hooks/useWorkoutHistory";
import {
  addSet,
  computeWorkoutVolume,
  finishWorkout,
  formatDuration,
  generateWorkout,
  removeSet,
  replaceExercise,
  startWorkout,
  updateSet,
} from "@/lib/workout";

function useElapsed(startedAt) {
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    if (!startedAt) return undefined;
    const id = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(id);
  }, [startedAt]);
  if (!startedAt) return 0;
  return now - new Date(startedAt).getTime();
}

export default function Workout() {
  const navigate = useNavigate();
  const { workout, update, setWorkout, clear } = useCurrentWorkout();
  const { addWorkout, workouts: history } = useWorkoutHistory();

  useEffect(() => {
    if (workout && !workout.startedAt) {
      update((prev) => (prev ? startWorkout(prev) : prev));
    }
  }, [workout, update]);

  const elapsedMs = useElapsed(workout?.startedAt);
  const liveVolume = useMemo(() => (workout ? computeWorkoutVolume(workout) : 0), [workout]);
  const completedSets = useMemo(() => {
    if (!workout) return 0;
    return workout.exercises.reduce(
      (sum, e) => sum + e.sets.filter((s) => s.completed).length,
      0,
    );
  }, [workout]);
  const totalSets = useMemo(() => {
    if (!workout) return 0;
    return workout.exercises.reduce((sum, e) => sum + e.sets.length, 0);
  }, [workout]);

  function handleGenerate() {
    const previous = history[0] || workout;
    setWorkout(startWorkout(generateWorkout(previous)));
  }

  function handleFinish() {
    if (!workout) return;
    if (completedSets === 0) {
      const confirmed = window.confirm(
        "You haven't logged any completed sets. Finish workout anyway?",
      );
      if (!confirmed) return;
    }
    const finished = finishWorkout(workout);
    addWorkout(finished);
    clear();
    navigate(`/history/${finished.id}`);
  }

  if (!workout) {
    return (
      <div className="flex flex-col gap-6">
        <header className="flex flex-col gap-1">
          <p className="text-sm text-muted-foreground">Workout</p>
          <h1 className="text-2xl font-semibold tracking-tight md:text-3xl">
            No active workout
          </h1>
          <p className="text-sm text-muted-foreground">
            Generate a fresh plan to start training.
          </p>
        </header>
        <Card className="border-dashed border-border/70 bg-muted/20">
          <CardContent className="flex flex-col items-center gap-3 p-10 text-center">
            <div className="grid size-12 place-items-center rounded-full bg-muted">
              <Dumbbell className="size-5 text-muted-foreground" />
            </div>
            <p className="text-sm text-muted-foreground">
              BalamAI will balance push, pull, legs, shoulders, and core for you.
            </p>
            <Button size="lg" onClick={handleGenerate}>
              Generate workout
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-5">
      <header className="flex flex-col gap-2">
        <div className="flex flex-wrap items-center gap-2">
          <p className="text-sm text-muted-foreground">Active workout</p>
          <Badge variant="secondary" className="text-[10px] uppercase">
            <Timer className="size-3" /> {formatDuration(elapsedMs)}
          </Badge>
          <Badge variant="outline" className="text-[10px] uppercase">
            {completedSets}/{totalSets} sets
          </Badge>
          <Badge variant="outline" className="text-[10px] uppercase">
            {liveVolume} kg total
          </Badge>
        </div>
        <h1 className="text-2xl font-semibold tracking-tight md:text-3xl">
          Today's session
        </h1>
      </header>

      <div className="flex flex-col gap-3">
        {workout.exercises.map((entry) => (
          <ExerciseCard
            key={entry.id}
            entry={entry}
            onUpdateSet={(entryId, setId, patch) =>
              update((prev) => updateSet(prev, entryId, setId, patch))
            }
            onAddSet={(entryId) => update((prev) => addSet(prev, entryId))}
            onRemoveSet={(entryId, setId) =>
              update((prev) => removeSet(prev, entryId, setId))
            }
            onReplace={(entryId, newExerciseId) =>
              update((prev) => replaceExercise(prev, entryId, newExerciseId))
            }
          />
        ))}
      </div>

      <div className="sticky bottom-2 z-10 mt-2 flex flex-wrap gap-2 rounded-xl border border-border/80 bg-background/95 p-3 shadow-lg backdrop-blur md:static md:bg-transparent md:p-0 md:shadow-none md:backdrop-blur-none">
        <Button size="lg" onClick={handleFinish} className="flex-1">
          <CheckCircle2 className="size-4" />
          Finish workout
        </Button>
        <Button
          size="lg"
          variant="outline"
          onClick={() => {
            if (window.confirm("Discard this workout? Your progress won't be saved.")) {
              clear();
              navigate("/");
            }
          }}
        >
          Discard
        </Button>
      </div>
    </div>
  );
}
