import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { getExerciseById, CATEGORY_LABELS } from "@/data/exercises";
import { MODES } from "@/data/modes";

export function WorkoutCard({ workout, title = "Today's workout" }) {
  if (!workout) return null;
  return (
    <Card className="border-border/80">
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2 min-w-0">
            <CardTitle className="text-base">{title}</CardTitle>
            {workout.mode && MODES[workout.mode] ? (
              <Badge variant="outline" className="text-[10px] uppercase">
                {MODES[workout.mode].label}
              </Badge>
            ) : null}
          </div>
          <Badge variant="secondary" className="text-[11px]">
            {workout.exercises.length} exercises
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-2">
        {workout.exercises.map((entry) => {
          const ex = getExerciseById(entry.exerciseId);
          if (!ex) return null;
          return (
            <div
              key={entry.id}
              className="flex items-center justify-between rounded-lg border border-border/60 bg-muted/30 px-3 py-2"
            >
              <div className="flex flex-col">
                <span className="text-sm font-medium">{ex.name}</span>
                <span className="text-[11px] text-muted-foreground">
                  {ex.equipment.join(" · ")}
                </span>
              </div>
              <Badge variant="outline" className="text-[10px] uppercase">
                {CATEGORY_LABELS[ex.category]}
              </Badge>
            </div>
          );
        })}
      </CardContent>
    </Card>
  );
}
