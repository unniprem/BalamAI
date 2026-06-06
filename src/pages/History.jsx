import { useState } from "react";
import { useParams } from "react-router-dom";
import { History as HistoryIcon } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { WorkoutHistoryCard } from "@/components/WorkoutHistoryCard";
import { useWorkoutHistory } from "@/hooks/useWorkoutHistory";

export default function History() {
  const { id } = useParams();
  const { workouts, removeWorkout } = useWorkoutHistory();
  const [override, setOverride] = useState(null);
  // URL is the source of truth on first paint; user toggles take over after that.
  const expandedId = override ?? id ?? null;
  const toggle = (workoutId) =>
    setOverride((prev) => (prev === workoutId || expandedId === workoutId ? "" : workoutId));

  return (
    <div className="flex flex-col gap-5">
      <header className="flex flex-col gap-1">
        <p className="text-sm text-muted-foreground">History</p>
        <h1 className="text-2xl font-semibold tracking-tight md:text-3xl">
          Previous workouts
        </h1>
        <p className="text-sm text-muted-foreground">
          Tap a workout to see the sets you logged.
        </p>
      </header>

      {workouts.length === 0 ? (
        <Card className="border-dashed border-border/70 bg-muted/20">
          <CardContent className="flex flex-col items-center gap-3 p-10 text-center">
            <div className="grid size-12 place-items-center rounded-full bg-muted">
              <HistoryIcon className="size-5 text-muted-foreground" />
            </div>
            <p className="text-sm text-muted-foreground">
              No workouts yet — finish your first session to see it here.
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="flex flex-col gap-3">
          {workouts.map((workout) => (
            <WorkoutHistoryCard
              key={workout.id}
              workout={workout}
              expanded={expandedId === workout.id}
              onToggle={() => toggle(workout.id)}
              onDelete={() => {
                if (window.confirm("Delete this workout from history?")) {
                  removeWorkout(workout.id);
                }
              }}
            />
          ))}
        </div>
      )}
    </div>
  );
}
