import { useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Calendar, Dumbbell, Flame, Play, RotateCcw, Trophy } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { StatsCard } from "@/components/StatsCard";
import { WorkoutCard } from "@/components/WorkoutCard";
import { useCurrentWorkout } from "@/hooks/useCurrentWorkout";
import { useWorkoutHistory } from "@/hooks/useWorkoutHistory";
import { generateWorkout } from "@/lib/workout";
import { computeStreak, formatRelativeDate, lastWorkoutDate } from "@/lib/stats";
import { MODE_ORDER, MODES } from "@/data/modes";
import { loadSettings, saveSettings } from "@/lib/storage";
import { cn } from "@/lib/utils";

export default function Dashboard() {
  const navigate = useNavigate();
  const { workout, setWorkout } = useCurrentWorkout();
  const { workouts } = useWorkoutHistory();

  const [mode, setMode] = useState(() => loadSettings().mode);

  function handleSelectMode(nextMode) {
    setMode(nextMode);
    saveSettings({ mode: nextMode });
  }

  const stats = useMemo(() => {
    const last = lastWorkoutDate(workouts);
    return {
      total: workouts.length,
      streak: computeStreak(workouts),
      last,
    };
  }, [workouts]);

  function handleGenerate() {
    const previous = workouts[0] || workout;
    const fresh = generateWorkout(previous, mode, workouts);
    setWorkout(fresh);
    navigate("/workout");
  }

  function handleStart() {
    if (!workout) handleGenerate();
    else navigate("/workout");
  }

  return (
    <div className="flex flex-col gap-6">
      <header className="flex flex-col gap-1">
        <p className="text-sm text-muted-foreground">Welcome back</p>
        <h1 className="text-2xl font-semibold tracking-tight md:text-3xl">
          Ready to train?
        </h1>
        <p className="text-sm text-muted-foreground">
          BalamAI adapts your workout to whatever your gym has today.
        </p>
      </header>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
        <StatsCard
          icon={Trophy}
          label="Total workouts"
          value={stats.total}
          hint="Completed sessions"
        />
        <StatsCard
          icon={Flame}
          label="Current streak"
          value={stats.streak}
          hint={stats.streak === 1 ? "day" : "days"}
        />
        <StatsCard
          icon={Calendar}
          label="Last workout"
          value={formatRelativeDate(stats.last)}
          hint={stats.last ? new Date(stats.last).toLocaleDateString() : "No history yet"}
        />
      </div>

      <div className="flex flex-col gap-2">
        <div className="flex items-center justify-between">
          <span className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
            Training mode
          </span>
          <span className="text-[11px] text-muted-foreground">
            {MODES[mode].sets} sets · {MODES[mode].repsMin}-{MODES[mode].repsMax} reps
          </span>
        </div>
        <div
          role="radiogroup"
          aria-label="Training mode"
          className="flex rounded-lg border border-border/70 bg-muted/30 p-1"
          onKeyDown={(e) => {
            const idx = MODE_ORDER.indexOf(mode);
            if (e.key === "ArrowRight" || e.key === "ArrowDown") {
              e.preventDefault();
              handleSelectMode(MODE_ORDER[(idx + 1) % MODE_ORDER.length]);
            } else if (e.key === "ArrowLeft" || e.key === "ArrowUp") {
              e.preventDefault();
              handleSelectMode(
                MODE_ORDER[(idx - 1 + MODE_ORDER.length) % MODE_ORDER.length],
              );
            }
          }}
        >
          {MODE_ORDER.map((id) => {
            const selected = id === mode;
            return (
              <button
                key={id}
                type="button"
                role="radio"
                aria-checked={selected}
                tabIndex={selected ? 0 : -1}
                onClick={() => handleSelectMode(id)}
                className={cn(
                  "flex-1 rounded-md px-3 py-1.5 text-xs font-medium transition-colors",
                  selected
                    ? "bg-background text-foreground shadow-sm"
                    : "text-muted-foreground hover:text-foreground",
                )}
              >
                {MODES[id].label}
              </button>
            );
          })}
        </div>
      </div>

      <Card className="border-border/80">
        <CardContent className="flex flex-col gap-4 p-5 md:flex-row md:items-center md:justify-between">
          <div>
            <h2 className="text-lg font-semibold tracking-tight">
              {workout ? "Continue your workout" : "Generate a workout"}
            </h2>
            <p className="text-sm text-muted-foreground">
              {workout
                ? "Pick up where you left off, or generate a fresh plan."
                : "A balanced session: one push, pull, leg, shoulder, and core exercise."}
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button size="lg" onClick={handleStart}>
              <Play className="size-4" />
              {workout ? "Resume workout" : "Start workout"}
            </Button>
            <Button size="lg" variant="outline" onClick={handleGenerate}>
              <RotateCcw className="size-4" />
              Generate new
            </Button>
          </div>
        </CardContent>
      </Card>

      {workout ? (
        <WorkoutCard workout={workout} title="Today's plan" />
      ) : (
        <Card className="border-dashed border-border/70 bg-muted/20">
          <CardContent className="flex flex-col items-center gap-3 p-8 text-center">
            <div className="grid size-12 place-items-center rounded-full bg-muted">
              <Dumbbell className="size-5 text-muted-foreground" />
            </div>
            <div>
              <p className="text-sm font-medium">No workout queued yet</p>
              <p className="text-xs text-muted-foreground">
                Generate one to see your plan here.
              </p>
            </div>
            <Button onClick={handleGenerate}>Generate workout</Button>
          </CardContent>
        </Card>
      )}

      <div className="flex justify-between text-sm">
        <Link to="/history" className="text-muted-foreground hover:text-foreground">
          View history →
        </Link>
        <Link to="/progress" className="text-muted-foreground hover:text-foreground">
          See progress →
        </Link>
      </div>
    </div>
  );
}
