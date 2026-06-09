import React, { useState, useMemo } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "./ui/dialog";
import { exercises } from "../data/exercises";
import { Search, RotateCw, Sparkles } from "lucide-react";

export default function ReplaceExerciseDialog({
  isOpen,
  onClose,
  currentExercise,
  onSelect,
}) {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedEquipment, setSelectedEquipment] = useState("all");

  const category = currentExercise?.category || "";
  const currentId = currentExercise?.id || "";

  // Filter exercises that belong to the same category and are not the current exercise
  const alternatives = useMemo(() => {
    if (!category) return [];
    
    return exercises.filter((ex) => {
      // Must be same category
      if (ex.category !== category) return false;
      // Cannot be the active one
      if (ex.id === currentId) return false;
      
      // Filter by search query
      if (
        searchQuery &&
        !ex.name.toLowerCase().includes(searchQuery.toLowerCase())
      ) {
        return false;
      }
      
      // Filter by equipment
      if (selectedEquipment !== "all" && ex.equipment !== selectedEquipment) {
        return false;
      }
      
      return true;
    });
  }, [category, currentId, searchQuery, selectedEquipment]);

  if (!currentExercise) return null;

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-md border border-zinc-800 bg-zinc-950 text-white rounded-2xl p-5 overflow-hidden flex flex-col max-h-[85vh]">
        <DialogHeader className="pb-3 border-b border-zinc-900">
          <DialogTitle className="text-xl font-bold flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-emerald-400" />
            Swap Exercise
          </DialogTitle>
          <DialogDescription className="text-zinc-400">
            Replace <span className="text-white font-medium">{currentExercise.name}</span> with a matching <span className="text-emerald-450 font-medium">{category.toUpperCase()}</span> alternative.
          </DialogDescription>
        </DialogHeader>

        {/* Search & Filters */}
        <div className="space-y-3.5 py-3">
          {/* Search Input */}
          <div className="relative">
            <Search className="absolute left-3.5 top-1/2 h-4.5 w-4.5 -translate-y-1/2 text-zinc-500" />
            <input
              type="text"
              placeholder="Search exercises..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full rounded-xl border border-zinc-800 bg-zinc-900/60 py-2.5 pl-11 pr-4 text-sm text-white placeholder-zinc-500 outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500"
            />
          </div>

          {/* Equipment Pills */}
          <div className="flex flex-wrap gap-1.5">
            {["all", "barbell", "dumbbell", "machine", "cable", "bodyweight"].map(
              (eq) => (
                <button
                  key={eq}
                  onClick={() => setSelectedEquipment(eq)}
                  className={`rounded-full px-3 py-1 text-[11px] font-semibold uppercase tracking-wider transition-all duration-300 border ${
                    selectedEquipment === eq
                      ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/30"
                      : "bg-zinc-900/40 text-zinc-400 border-zinc-800/80 hover:bg-zinc-800/60"
                  }`}
                >
                  {eq}
                </button>
              )
            )}
          </div>
        </div>

        {/* Alternatives List */}
        <div className="flex-1 overflow-y-auto pr-1 space-y-2.5 min-h-[250px] max-h-[40vh] scrollbar-thin">
          {alternatives.length > 0 ? (
            alternatives.map((alt) => (
              <div
                key={alt.id}
                className="flex items-center justify-between gap-4 rounded-xl border border-zinc-800 bg-zinc-900/25 p-3.5 hover:border-zinc-700/80 transition-all duration-300 hover:bg-zinc-900/50"
              >
                <div className="min-w-0">
                  <h4 className="text-sm font-bold text-white truncate">
                    {alt.name}
                  </h4>
                  <div className="mt-1 flex items-center gap-1.5">
                    <span className="rounded bg-zinc-900 px-2 py-0.5 text-[10px] font-medium text-zinc-400 uppercase tracking-wide border border-zinc-800">
                      {alt.equipment}
                    </span>
                    {alt.muscles.slice(0, 2).map((muscle) => (
                      <span
                        key={muscle}
                        className="text-[10px] text-zinc-500"
                      >
                        • {muscle}
                      </span>
                    ))}
                  </div>
                </div>

                <button
                  onClick={() => {
                    onSelect(alt.id);
                    onClose();
                  }}
                  className="flex items-center gap-1.5 rounded-lg bg-emerald-500/10 px-3 py-2 text-xs font-semibold text-emerald-400 border border-emerald-500/20 hover:bg-emerald-500 hover:text-black hover:border-emerald-500 transition-all duration-300 active:scale-95"
                >
                  <RotateCw className="h-3.5 w-3.5" />
                  Swap
                </button>
              </div>
            ))
          ) : (
            <div className="flex flex-col items-center justify-center py-10 text-center">
              <p className="text-sm text-zinc-500">
                No matching alternative exercises found.
              </p>
              <button
                onClick={() => {
                  setSearchQuery("");
                  setSelectedEquipment("all");
                }}
                className="mt-3 text-xs font-semibold text-emerald-400 hover:underline"
              >
                Clear filters
              </button>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
