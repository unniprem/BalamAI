import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";

export function StatsCard({ icon: Icon, label, value, hint, className }) {
  return (
    <Card className={cn("border-border/80", className)}>
      <CardContent className="flex flex-col gap-2 p-4 md:p-5">
        <div className="flex items-center gap-2 text-muted-foreground">
          {Icon ? <Icon className="size-4" /> : null}
          <span className="text-xs font-medium uppercase tracking-wide">{label}</span>
        </div>
        <div className="text-2xl font-semibold tracking-tight md:text-3xl">{value}</div>
        {hint ? <div className="text-xs text-muted-foreground">{hint}</div> : null}
      </CardContent>
    </Card>
  );
}
