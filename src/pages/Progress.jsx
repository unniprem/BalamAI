import { useMemo } from "react";
import { Activity, BarChart3, Dumbbell, Trophy } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { StatsCard } from "@/components/StatsCard";
import { useWorkoutHistory } from "@/hooks/useWorkoutHistory";
import {
  exerciseFrequency,
  mostPerformedExercise,
  totalVolume,
} from "@/lib/stats";
import { CATEGORY_LABELS } from "@/data/exercises";

export default function Progress() {
  const { workouts } = useWorkoutHistory();

  const summary = useMemo(() => {
    return {
      total: workouts.length,
      volume: totalVolume(workouts),
      most: mostPerformedExercise(workouts),
      frequency: exerciseFrequency(workouts).slice(0, 10),
    };
  }, [workouts]);

  const maxCount = summary.frequency[0]?.count || 1;

  return (
    <div className="flex flex-col gap-5">
      <header className="flex flex-col gap-1">
        <p className="text-sm text-muted-foreground">Progress</p>
        <h1 className="text-2xl font-semibold tracking-tight md:text-3xl">
          Your training at a glance
        </h1>
      </header>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
        <StatsCard
          icon={Trophy}
          label="Total workouts"
          value={summary.total}
          hint="Completed sessions"
        />
        <StatsCard
          icon={Activity}
          label="Total volume"
          value={`${summary.volume.toLocaleString()} kg`}
          hint="Weight × reps across all sets"
        />
        <StatsCard
          icon={Dumbbell}
          label="Most performed"
          value={summary.most ? summary.most.exercise.name : "—"}
          hint={summary.most ? `${summary.most.count} times` : "Log a workout to see"}
        />
      </div>

      <Card className="border-border/80">
        <CardHeader className="pb-2">
          <CardTitle className="flex items-center gap-2 text-base">
            <BarChart3 className="size-4" />
            Exercise frequency
          </CardTitle>
        </CardHeader>
        <CardContent>
          {summary.frequency.length === 0 ? (
            <p className="py-6 text-center text-sm text-muted-foreground">
              No data yet — finish a workout to start tracking frequency.
            </p>
          ) : (
            <ul className="flex flex-col gap-2">
              {summary.frequency.map(({ id, exercise, count }) => (
                <li key={id} className="flex flex-col gap-1">
                  <div className="flex items-center justify-between text-sm">
                    <div className="flex items-center gap-2">
                      <span className="font-medium">{exercise.name}</span>
                      <Badge variant="outline" className="text-[10px] uppercase">
                        {CATEGORY_LABELS[exercise.category]}
                      </Badge>
                    </div>
                    <span className="text-xs text-muted-foreground">
                      {count} {count === 1 ? "time" : "times"}
                    </span>
                  </div>
                  <div className="h-1.5 overflow-hidden rounded-full bg-muted">
                    <div
                      className="h-full rounded-full bg-primary/80"
                      style={{ width: `${(count / maxCount) * 100}%` }}
                    />
                  </div>
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
