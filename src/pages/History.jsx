import { useState } from "react";
import { loadWorkouts } from "../lib/storage";
import { Calendar, Clock, Dumbbell, ChevronDown, ChevronUp, Trash2 } from "lucide-react";

export default function History() {
  const [workouts, setWorkouts] = useState(() => loadWorkouts());
  const [expandedId, setExpandedId] = useState(null);

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
          <h1 className="text-3xl font-extrabold tracking-tight text-app-text sm:text-4xl">
            Workout History
          </h1>
          <p className="mt-1.5 text-app-text-2 text-sm">
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
                    ? "border-emerald-500/30 bg-app-surface shadow-lg"
                    : "border-app-border bg-app-bg hover:border-emerald-500/20"
                }`}
              >
                {/* Summary Header Row */}
                <div
                  onClick={() => toggleExpand(workout.id)}
                  className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-5 cursor-pointer hover:bg-app-hover transition-colors"
                >
                  <div className="space-y-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="rounded bg-emerald-500/10 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-emerald-400 border border-emerald-500/20">
                        {workout.split.split(" ")[0]}
                      </span>
                      <span className="text-xs text-app-text-2 font-medium">
                        {workout.dayName}
                      </span>
                    </div>

                    <h3 className="text-lg font-bold text-app-text flex items-center gap-2">
                      <Calendar className="h-4 w-4 text-app-text-3" />
                      {formattedDate}
                    </h3>
                  </div>

                  <div className="flex items-center gap-4.5 justify-between sm:justify-end">
                    {/* Time taken */}
                    <div className="flex items-center gap-1.5 text-app-text-2">
                      <Clock className="h-4 w-4 text-app-text-3" />
                      <span className="text-xs font-semibold font-mono">{workout.duration}</span>
                    </div>

                    {/* Exercises count */}
                    <div className="flex items-center gap-1.5 text-app-text-2">
                      <Dumbbell className="h-4 w-4 text-app-text-3" />
                      <span className="text-xs font-semibold">
                        {workout.completedCount} / {workout.totalCount} Exercises
                      </span>
                    </div>

                    <div className="text-app-text-2">
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
                  <div className="border-t border-app-border-subtle bg-app-surface-dim p-5 animate-in slide-in-from-top-1 duration-200">
                    <div className="grid gap-4 md:grid-cols-2">
                      {/* Left: General configuration info */}
                      <div className="space-y-3">
                        <h4 className="text-xs font-bold text-app-text-3 uppercase tracking-widest">
                          Session Config
                        </h4>

                        <div className="rounded-xl border border-app-border-subtle bg-app-surface-dim p-3.5 space-y-2.5 text-xs text-app-text-2">
                          <div className="flex justify-between">
                            <span>Goal:</span>
                            <span className="text-app-text font-medium">{workout.goal}</span>
                          </div>
                          <div className="flex justify-between">
                            <span>Routine:</span>
                            <span className="text-app-text font-medium">{workout.split}</span>
                          </div>
                          <div className="flex justify-between">
                            <span>Time taken:</span>
                            <span className="text-app-text font-bold font-mono">{workout.duration}</span>
                          </div>
                        </div>
                      </div>

                      {/* Right: exercises completed details */}
                      <div className="space-y-2">
                        <h4 className="text-xs font-bold text-app-text-3 uppercase tracking-widest mb-1">
                          Exercises Performed
                        </h4>

                        <div className="space-y-2">
                          {workout.exercises.map((ex, index) => (
                            <div
                              key={ex.id || index}
                              className="flex items-center justify-between rounded-xl border border-app-border-subtle bg-app-surface-dim px-3.5 py-2.5"
                            >
                              <div className="flex items-center gap-2.5 min-w-0">
                                <div
                                  className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-full border text-[10px] font-bold ${
                                    ex.completed
                                      ? "bg-emerald-500/10 border-emerald-500 text-emerald-400"
                                      : "border-app-border text-app-text-3"
                                  }`}
                                >
                                  {ex.completed ? "✓" : "✗"}
                                </div>
                                <span
                                  className={`text-sm truncate font-medium ${
                                    ex.completed ? "text-app-text" : "text-app-text-3 line-through"
                                  }`}
                                >
                                  {ex.name}
                                </span>
                              </div>

                              <span className="rounded bg-app-surface-2 px-2 py-0.5 text-[9px] font-medium text-app-text-2 uppercase tracking-wide border border-app-border">
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
          <div className="flex flex-col items-center justify-center py-24 text-center border border-dashed border-app-border rounded-2xl bg-app-surface-dim">
            <Calendar className="h-12 w-12 text-app-text-3 mb-4" />
            <h3 className="text-lg font-bold text-app-text-2">No workout sessions logged yet</h3>
            <p className="text-xs text-app-text-3 max-w-xs mt-1 leading-relaxed px-4">
              Your completed training sessions will appear here. Go to the main tab and complete your first workout to get started!
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
