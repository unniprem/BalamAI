import { useMemo, useState } from "react";
import { Search, ArrowRightLeft } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { getAlternativesFor, CATEGORY_LABELS } from "@/data/exercises";
import { cn } from "@/lib/utils";

export function ReplaceExerciseDialog({ open, onOpenChange, current, onReplace }) {
  const [query, setQuery] = useState("");
  const [pickedId, setPickedId] = useState(null);

  const alternatives = useMemo(() => getAlternativesFor(current), [current]);
  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return alternatives;
    return alternatives.filter(
      (e) =>
        e.name.toLowerCase().includes(q) ||
        e.equipment.some((eq) => eq.toLowerCase().includes(q)) ||
        e.muscles.some((m) => m.toLowerCase().includes(q)),
    );
  }, [alternatives, query]);

  function handleClose(next) {
    onOpenChange(next);
    if (!next) {
      setQuery("");
      setPickedId(null);
    }
  }

  function handleConfirm() {
    if (!pickedId) return;
    onReplace(pickedId);
    handleClose(false);
  }

  if (!current) return null;

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-h-[90vh] gap-3 sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <ArrowRightLeft className="size-4" />
            Replace exercise
          </DialogTitle>
          <DialogDescription>
            Swap <span className="font-medium text-foreground">{current.name}</span> for
            another <Badge variant="outline" className="ml-1 text-[10px] uppercase">
              {CATEGORY_LABELS[current.category]}
            </Badge> movement. Your workout balance stays the same.
          </DialogDescription>
        </DialogHeader>

        <div className="relative">
          <Search className="pointer-events-none absolute top-2.5 left-2.5 size-4 text-muted-foreground" />
          <Input
            placeholder="Search alternatives…"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="h-9 pl-8"
            autoFocus
          />
        </div>

        <ScrollArea className="h-72 rounded-lg border border-border/60">
          <div className="flex flex-col p-1">
            {filtered.length === 0 ? (
              <p className="p-6 text-center text-sm text-muted-foreground">
                No matches.
              </p>
            ) : (
              filtered.map((ex) => {
                const selected = pickedId === ex.id;
                return (
                  <button
                    key={ex.id}
                    type="button"
                    onClick={() => setPickedId(ex.id)}
                    className={cn(
                      "flex flex-col gap-1 rounded-md px-3 py-2 text-left text-sm transition-colors",
                      selected
                        ? "bg-primary/10 text-foreground ring-1 ring-primary/40"
                        : "hover:bg-muted",
                    )}
                  >
                    <span className="font-medium">{ex.name}</span>
                    <span className="text-[11px] text-muted-foreground">
                      {ex.equipment.join(" · ")} · {ex.muscles.slice(0, 3).join(", ")}
                    </span>
                  </button>
                );
              })
            )}
          </div>
        </ScrollArea>

        <DialogFooter className="gap-2 sm:gap-2">
          <Button variant="ghost" onClick={() => handleClose(false)}>
            Cancel
          </Button>
          <Button onClick={handleConfirm} disabled={!pickedId}>
            Swap exercise
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
