import { useMemo, useState } from "react";
import { TriangleAlert } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  BUCKET_LABELS,
  recoveryLabel,
  recoveryStatus,
  workoutRedBuckets,
} from "@/lib/recovery";

function joinOxford(parts) {
  if (parts.length === 0) return "";
  if (parts.length === 1) return parts[0];
  if (parts.length === 2) return `${parts[0]} and ${parts[1]}`;
  return `${parts.slice(0, -1).join(", ")}, and ${parts[parts.length - 1]}`;
}

// "today" if any red bucket was trained today; otherwise "yesterday".
// Red status (hoursAgo < 24) means it can only be one of those two.
function worstRedLabel(redBuckets, history, nowMs) {
  const statuses = recoveryStatus(history, nowMs);
  for (const b of redBuckets) {
    const entry = statuses.find((s) => s.bucket === b);
    if (entry && recoveryLabel(entry, nowMs) === "today") return "today";
  }
  return "yesterday";
}

export function RecoveryWarning({ workout, history, onRegenerate, onKeep }) {
  // Captured once on mount — `react-hooks/purity` rejects a bare `Date.now()`
  // during render. The Workout page remounts this on navigation.
  const [nowMs] = useState(() => Date.now());
  const reds = useMemo(
    () => workoutRedBuckets(workout, history, nowMs),
    [workout, history, nowMs],
  );

  if (!workout) return null;
  if (workout.recoveryWarningDismissed === true) return null;
  if (reds.length === 0) return null;

  const labels = reds.map((b) => BUCKET_LABELS[b]);
  const when = worstRedLabel(reds, history, nowMs);

  return (
    <div className="flex flex-col gap-2 rounded-xl border border-amber-500/40 bg-amber-500/10 p-4">
      <div className="flex items-center gap-2 text-sm font-medium text-amber-500">
        <TriangleAlert className="size-4" aria-hidden />
        Recently trained
      </div>
      <p className="text-sm text-foreground/90">
        This workout hits {joinOxford(labels)}, which you trained {when}.
      </p>
      <div className="mt-1 flex flex-wrap gap-2">
        <Button size="sm" onClick={onRegenerate}>
          Regenerate
        </Button>
        <Button size="sm" variant="outline" onClick={onKeep}>
          Keep workout
        </Button>
      </div>
    </div>
  );
}
