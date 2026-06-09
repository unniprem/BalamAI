import React, { useState, useEffect } from "react";
import { loadWorkouts } from "../lib/storage";
import { Calendar, Clock, Dumbbell, ChevronDown, ChevronUp, Trash2 } from "lucide-react";

export default function History() {
  const [workouts, setWorkouts] = useState([]);
  const [expandedId, setExpandedId] = useState(null);

  useEffect(() => {
    setWorkouts(loadWorkouts());
  }, []);

  const toggleExpand = (id) => {
    setExpandedId(expandedId === id ? null : id);
  };

  const handleClearHistory = () => {
    if (confirm("Are you sure you want to clear your entire workout history? This cannot be undone.")) {
      localStorage.removeItem("balamai_history");
      setWorkouts([]);
    }
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight text-white sm:text-4xl">
            Workout History
          </h1>
          <p className="mt-1.5 text-zinc-400 text-sm">
            Review your completed training sessions and progress details.
          </p>
        </div>

        {workouts.length > 0 && (
          <button
            onClick={handleClearHistory}
            className="flex items-center gap-1.5 rounded-xl bg-red-500/10 px-4 py-2.5 text-xs font-semibold text-red-400 border border-red-500/20 hover:bg-red-500/20 transition-all duration-300 active:scale-95"
          >
            <Trash2 className="h-4 w-4" />
            Clear History
          </button>
        )}
      </div>

      {/* History List */}
      <div className="space-y-4">
        {workouts.length > 0 ? (
          workouts.map((workout) => {
            const isExpanded = expandedId === workout.id;
            const dateObj = new Date(workout.date);
            const formattedDate = dateObj.toLocaleDateString("en-US", {
              weekday: "short",
              month: "short",
              day: "numeric",
              year: "numeric",
            });

            return (
              <div
                key={workout.id}
                className={`rounded-2xl border transition-all duration-300 overflow-hidden ${
                  isExpanded
                    ? "border-emerald-500/30 bg-zinc-950/75 shadow-lg"
                    : "border-zinc-850 bg-zinc-950 hover:border-zinc-700/80"
                }`}
              >
                {/* Summary Header Row */}
                <div
                  onClick={() => toggleExpand(workout.id)}
                  className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-5 cursor-pointer hover:bg-zinc-900/10 transition-colors"
                >
                  <div className="space-y-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="rounded bg-emerald-500/10 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-emerald-400 border border-emerald-500/20">
                        {workout.split.split(" ")[0]}
                      </span>
                      <span className="text-xs text-zinc-400 font-medium">
                        {workout.dayName}
                      </span>
                    </div>
                    
                    <h3 className="text-lg font-bold text-white flex items-center gap-2">
                      <Calendar className="h-4 w-4 text-zinc-500" />
                      {formattedDate}
                    </h3>
                  </div>

                  <div className="flex items-center gap-4.5 justify-between sm:justify-end">
                    {/* Time taken */}
                    <div className="flex items-center gap-1.5 text-zinc-300">
                      <Clock className="h-4 w-4 text-zinc-500" />
                      <span className="text-xs font-semibold font-mono">{workout.duration}</span>
                    </div>

                    {/* Exercises count */}
                    <div className="flex items-center gap-1.5 text-zinc-300">
                      <Dumbbell className="h-4 w-4 text-zinc-500" />
                      <span className="text-xs font-semibold">
                        {workout.completedCount} / {workout.totalCount} Exercises
                      </span>
                    </div>

                    <div className="text-zinc-400">
                      {isExpanded ? (
                        <ChevronUp className="h-5 w-5" />
                      ) : (
                        <ChevronDown className="h-5 w-5" />
                      )}
                    </div>
                  </div>
                </div>

                {/* Expanded exercise details checklist */}
                {isExpanded && (
                  <div className="border-t border-zinc-900 bg-zinc-950/40 p-5 animate-in slide-in-from-top-1 duration-200">
                    <div className="grid gap-4 md:grid-cols-2">
                      {/* Left: General configuration info */}
                      <div className="space-y-3">
                        <h4 className="text-xs font-bold text-zinc-550 uppercase tracking-widest">
                          Session Config
                        </h4>
                        
                        <div className="rounded-xl border border-zinc-900 bg-zinc-900/10 p-3.5 space-y-2.5 text-xs text-zinc-400">
                          <div className="flex justify-between">
                            <span>Goal:</span>
                            <span className="text-white font-medium">{workout.goal}</span>
                          </div>
                          <div className="flex justify-between">
                            <span>Routine:</span>
                            <span className="text-white font-medium">{workout.split}</span>
                          </div>
                          <div className="flex justify-between">
                            <span>Time taken:</span>
                            <span className="text-white font-bold font-mono">{workout.duration}</span>
                          </div>
                        </div>
                      </div>

                      {/* Right: exercises completed details */}
                      <div className="space-y-2">
                        <h4 className="text-xs font-bold text-zinc-550 uppercase tracking-widest mb-1">
                          Exercises Performed
                        </h4>
                        
                        <div className="space-y-2">
                          {workout.exercises.map((ex, index) => (
                            <div
                              key={ex.id || index}
                              className="flex items-center justify-between rounded-xl border border-zinc-900 bg-zinc-900/20 px-3.5 py-2.5"
                            >
                              <div className="flex items-center gap-2.5 min-w-0">
                                <div
                                  className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-full border text-[10px] font-bold ${
                                    ex.completed
                                      ? "bg-emerald-500/10 border-emerald-500 text-emerald-400"
                                      : "border-zinc-800 text-zinc-650"
                                  }`}
                                >
                                  {ex.completed ? "✓" : "✗"}
                                </div>
                                <span
                                  className={`text-sm truncate font-medium ${
                                    ex.completed ? "text-white" : "text-zinc-500 line-through"
                                  }`}
                                >
                                  {ex.name}
                                </span>
                              </div>
                              
                              <span className="rounded bg-zinc-900 px-2 py-0.5 text-[9px] font-medium text-zinc-400 uppercase tracking-wide border border-zinc-800">
                                {ex.equipment}
                              </span>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            );
          })
        ) : (
          /* Empty state */
          <div className="flex flex-col items-center justify-center py-24 text-center border border-dashed border-zinc-850 rounded-2xl bg-zinc-950/20">
            <Calendar className="h-12 w-12 text-zinc-650 mb-4" />
            <h3 className="text-lg font-bold text-zinc-400">No workout sessions logged yet</h3>
            <p className="text-xs text-zinc-550 max-w-xs mt-1 leading-relaxed px-4">
              Your completed training sessions will appear here. Go to the main tab and complete your first workout to get started!
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
