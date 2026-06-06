import { Calendar, Clock, Dumbbell, Trash2 } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { formatDuration } from "@/lib/workout";
import { formatRelativeDate } from "@/lib/stats";
import { getExerciseById, CATEGORY_LABELS } from "@/data/exercises";
import { cn } from "@/lib/utils";

export function WorkoutHistoryCard({ workout, expanded, onToggle, onDelete }) {
  const date = workout.completedAt || workout.createdAt;
  const exerciseCount = workout.exercises?.length || 0;

  return (
    <Card
      className={cn(
        "border-border/80 transition-colors",
        expanded && "ring-1 ring-primary/30",
      )}
    >
      <CardContent className="p-0">
        <button
          type="button"
          onClick={onToggle}
          className="flex w-full items-center justify-between gap-3 p-4 text-left"
        >
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2">
              <span className="text-sm font-semibold tracking-tight">
                {formatRelativeDate(date)}
              </span>
              <span className="text-xs text-muted-foreground">
                {new Date(date).toLocaleDateString(undefined, {
                  month: "short",
                  day: "numeric",
                  year: "numeric",
                })}
              </span>
            </div>
            <div className="mt-1 flex flex-wrap items-center gap-2 text-[11px] text-muted-foreground">
              <span className="flex items-center gap-1">
                <Clock className="size-3" /> {formatDuration(workout.duration)}
              </span>
              <span className="flex items-center gap-1">
                <Dumbbell className="size-3" /> {exerciseCount} exercises
              </span>
              <span className="flex items-center gap-1">
                <Calendar className="size-3" /> {Number(workout.totalVolume) || 0} kg total
              </span>
            </div>
          </div>
          <Badge variant="outline" className="text-[10px]">
            {expanded ? "Hide" : "View"}
          </Badge>
        </button>

        {expanded ? (
          <div className="space-y-2 border-t border-border/60 p-4">
            {workout.exercises.map((entry) => {
              const ex = getExerciseById(entry.exerciseId);
              if (!ex) return null;
              const completed = entry.sets.filter((s) => s.completed);
              return (
                <div
                  key={entry.id}
                  className="rounded-lg border border-border/50 bg-muted/30 p-3"
                >
                  <div className="flex items-center justify-between gap-2">
                    <div className="min-w-0">
                      <p className="truncate text-sm font-medium">{ex.name}</p>
                      <p className="text-[11px] text-muted-foreground">
                        {CATEGORY_LABELS[ex.category]} · {ex.equipment.join(" · ")}
                      </p>
                    </div>
                    <Badge variant="secondary" className="text-[10px]">
                      {completed.length}/{entry.sets.length} sets
                    </Badge>
                  </div>
                  {completed.length > 0 ? (
                    <div className="mt-2 grid grid-cols-2 gap-1 text-[11px] text-muted-foreground sm:grid-cols-3 md:grid-cols-4">
                      {completed.map((set, idx) => (
                        <span
                          key={set.id}
                          className="rounded bg-background/60 px-2 py-1"
                        >
                          Set {idx + 1}: {set.weight}kg × {set.reps}
                        </span>
                      ))}
                    </div>
                  ) : (
                    <p className="mt-2 text-[11px] text-muted-foreground">
                      No completed sets recorded.
                    </p>
                  )}
                </div>
              );
            })}
            {onDelete ? (
              <div className="pt-2">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={onDelete}
                  className="text-muted-foreground hover:text-destructive"
                >
                  <Trash2 className="size-3.5" /> Delete workout
                </Button>
              </div>
            ) : null}
          </div>
        ) : null}
      </CardContent>
    </Card>
  );
}
