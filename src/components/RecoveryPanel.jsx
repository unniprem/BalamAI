import { useMemo, useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import {
  BUCKET_LABELS,
  recoveryLabel,
  recoveryStatus,
} from "@/lib/recovery";
import { cn } from "@/lib/utils";

const DOT_BY_STATUS = {
  trained: "bg-rose-500",
  recovering: "bg-amber-500",
  ready: "bg-emerald-500",
};

export function RecoveryPanel({ history }) {
  // Captured once on mount — `react-hooks/purity` rejects a bare `Date.now()`
  // during render. Re-mount on nav refreshes this naturally.
  const [nowMs] = useState(() => Date.now());
  const rows = useMemo(() => recoveryStatus(history, nowMs), [history, nowMs]);

  if (!history || history.length === 0) return null;

  return (
    <Card className="border-border/80">
      <CardContent className="flex flex-col gap-3 p-5">
        <span className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
          Recovery
        </span>
        <div className="grid grid-cols-1 gap-x-6 gap-y-2 sm:grid-cols-2">
          {rows.map((row) => (
            <div key={row.bucket} className="flex items-center gap-2">
              <span
                className={cn("size-2 shrink-0 rounded-full", DOT_BY_STATUS[row.status])}
                aria-hidden
              />
              <span className="text-sm">{BUCKET_LABELS[row.bucket]}</span>
              <span className="ml-auto text-xs text-muted-foreground">
                {recoveryLabel(row, nowMs)}
              </span>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
