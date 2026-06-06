import { Check, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

export function SetTracker({ sets, onChange, onRemove }) {
  return (
    <div className="flex flex-col gap-1.5">
      <div className="grid grid-cols-[28px_1fr_1fr_auto_auto] items-center gap-2 px-1 text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
        <span>#</span>
        <span>Weight (kg)</span>
        <span>Reps</span>
        <span className="sr-only">Done</span>
        <span className="sr-only">Remove</span>
      </div>
      {sets.map((set, index) => (
        <div
          key={set.id}
          className={cn(
            "grid grid-cols-[28px_1fr_1fr_auto_auto] items-center gap-2 rounded-lg border border-border/60 bg-muted/30 px-2 py-1.5 transition-colors",
            set.completed && "border-primary/40 bg-primary/5",
          )}
        >
          <span className="text-sm font-medium text-muted-foreground">{index + 1}</span>
          <Input
            type="number"
            inputMode="decimal"
            min="0"
            step="0.5"
            value={set.weight === 0 && !set.completed ? "" : set.weight}
            placeholder="0"
            onChange={(e) =>
              onChange(set.id, { weight: e.target.value === "" ? 0 : Number(e.target.value) })
            }
            className="h-8"
          />
          <Input
            type="number"
            inputMode="numeric"
            min="0"
            step="1"
            value={set.reps === 0 && !set.completed ? "" : set.reps}
            placeholder="0"
            onChange={(e) =>
              onChange(set.id, { reps: e.target.value === "" ? 0 : Number(e.target.value) })
            }
            className="h-8"
          />
          <Button
            type="button"
            size="icon-sm"
            variant={set.completed ? "default" : "outline"}
            onClick={() => onChange(set.id, { completed: !set.completed })}
            aria-pressed={set.completed}
            aria-label={set.completed ? "Mark set as incomplete" : "Mark set as complete"}
          >
            <Check className="size-3.5" />
          </Button>
          <Button
            type="button"
            size="icon-sm"
            variant="ghost"
            onClick={() => onRemove(set.id)}
            aria-label="Remove set"
            className="text-muted-foreground hover:text-destructive"
          >
            <Trash2 className="size-3.5" />
          </Button>
        </div>
      ))}
    </div>
  );
}
