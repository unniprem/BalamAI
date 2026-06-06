import { useState } from "react";
import { ArrowRightLeft, ExternalLink, Plus } from "lucide-react";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { SetTracker } from "@/components/SetTracker";
import { ReplaceExerciseDialog } from "@/components/ReplaceExerciseDialog";
import { CATEGORY_LABELS, getExerciseById } from "@/data/exercises";

export function ExerciseCard({ entry, onUpdateSet, onAddSet, onRemoveSet, onReplace }) {
  const [dialogOpen, setDialogOpen] = useState(false);
  const exercise = getExerciseById(entry.exerciseId);
  if (!exercise) return null;

  return (
    <>
      <Card className="border-border/80">
        <CardHeader className="gap-2 pb-3">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2">
                <h3 className="truncate text-base font-semibold tracking-tight">
                  {exercise.name}
                </h3>
                <Badge variant="outline" className="text-[10px] uppercase">
                  {CATEGORY_LABELS[exercise.category]}
                </Badge>
              </div>
              <p className="mt-1 text-[11px] text-muted-foreground">
                {exercise.equipment.join(" · ")} · {exercise.muscles.slice(0, 3).join(", ")}
              </p>
            </div>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button
              size="sm"
              variant="outline"
              onClick={() => setDialogOpen(true)}
              aria-label="Replace exercise"
            >
              <ArrowRightLeft className="size-3.5" />
              Replace
            </Button>
            <Button size="sm" variant="ghost" asChild>
              <a
                href={exercise.videoUrl}
                target="_blank"
                rel="noreferrer noopener"
                aria-label={`Watch form video for ${exercise.name}`}
              >
                <ExternalLink className="size-3.5" />
                Watch form
              </a>
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-3 pt-0">
          <SetTracker
            sets={entry.sets}
            onChange={(setId, patch) => onUpdateSet(entry.id, setId, patch)}
            onRemove={(setId) => onRemoveSet(entry.id, setId)}
          />
          <Button
            type="button"
            variant="secondary"
            size="sm"
            onClick={() => onAddSet(entry.id)}
            className="w-full"
          >
            <Plus className="size-3.5" />
            Add set
          </Button>
        </CardContent>
      </Card>

      <ReplaceExerciseDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        current={exercise}
        onReplace={(newId) => onReplace(entry.id, newId)}
      />
    </>
  );
}
