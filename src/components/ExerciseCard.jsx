import { Check, RotateCw, ExternalLink, Play } from "lucide-react";
import { getExerciseDisplayCategory } from "../lib/workout";

export default function ExerciseCard({ exercise, onToggleComplete, onSwapClick }) {
  const isCompleted = exercise.completed;

  const youtubeSearchUrl = `https://www.youtube.com/results?search_query=${encodeURIComponent(
    exercise.name.toLowerCase()
  )}+form`;

  return (
    <div
      className={`app-card relative rounded-2xl border transition-all duration-500 overflow-hidden shadow-xl ${
        isCompleted
          ? "border-emerald-500/20 bg-app-surface-dim opacity-70"
          : "border-app-border bg-app-surface hover:border-emerald-500/20"
      }`}
    >
      {!isCompleted && (
        <div className="absolute top-0 right-0 -mt-4 -mr-4 h-24 w-24 rounded-full bg-emerald-500/5 blur-2xl pointer-events-none" />
      )}

      <div className="flex flex-col sm:flex-row gap-5 p-5">
        {/* GIF section */}
        <div className="relative w-full sm:w-44 h-44 shrink-0 rounded-xl bg-app-surface-2 overflow-hidden border border-app-border flex items-center justify-center group">
          {exercise.gifUrl ? (
            <img
              src={exercise.gifUrl}
              alt={exercise.name}
              className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-105"
              loading="lazy"
              onError={(e) => {
                e.target.onerror = null;
                e.target.src = "https://images.unsplash.com/photo-1517838277536-f5f99be501cd?w=400&q=80";
              }}
            />
          ) : (
            <div className="flex flex-col items-center justify-center p-3 text-center text-app-text-3">
              <Play className="h-8 w-8 text-app-text-3 mb-1" />
              <span className="text-[10px]">No animation</span>
            </div>
          )}
          <span className="absolute top-2 left-2 rounded-lg bg-app-bg/80 px-2 py-0.5 text-[9px] font-bold uppercase tracking-wider text-emerald-400 border border-app-border backdrop-blur-xs">
            {getExerciseDisplayCategory(exercise)}
          </span>
        </div>

        {/* Content */}
        <div className="flex-1 flex flex-col justify-between">
          <div className="min-w-0">
            <div className="flex items-start justify-between gap-4">
              <div>
                <h3
                  className={`text-lg font-bold leading-snug tracking-tight transition-all duration-300 ${
                    isCompleted ? "line-through text-app-text-3 font-medium" : "text-app-text"
                  }`}
                >
                  {exercise.name}
                </h3>
                <div className="mt-1.5 flex flex-wrap items-center gap-1.5">
                  <span className="rounded bg-app-surface-2 px-2.5 py-0.5 text-[10px] font-semibold text-app-text-2 uppercase tracking-wider border border-app-border">
                    {exercise.equipment}
                  </span>
                  {exercise.muscles.map((muscle) => (
                    <span
                      key={muscle}
                      className="rounded bg-app-surface-2 px-2 py-0.5 text-[10px] font-medium text-app-text-3 capitalize"
                    >
                      {muscle}
                    </span>
                  ))}
                </div>
              </div>

              <button
                onClick={() => onToggleComplete(exercise.id)}
                className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-full border transition-all duration-350 active:scale-90 ${
                  isCompleted
                    ? "bg-emerald-500 border-emerald-500 text-black shadow-md shadow-emerald-500/20"
                    : "border-app-border bg-app-surface-2 text-transparent hover:border-emerald-500/50 hover:bg-app-hover"
                }`}
                aria-label="Toggle completed"
              >
                <Check className={`h-5 w-5 ${isCompleted ? "stroke-[3px]" : "hover:text-emerald-400 text-transparent"}`} />
              </button>
            </div>
          </div>

          <div className="mt-6 flex flex-wrap gap-2 pt-4 border-t border-app-border-subtle">
            <a
              href={youtubeSearchUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1.5 rounded-xl bg-app-surface-2 px-3.5 py-2 text-xs font-semibold text-app-text-2 border border-app-border hover:bg-app-hover hover:text-app-text transition-all duration-300"
            >
              <ExternalLink className="h-3.5 w-3.5" />
              Watch Form
            </a>

            <button
              onClick={() => onSwapClick(exercise)}
              className="flex items-center gap-1.5 rounded-xl bg-emerald-500/5 px-3.5 py-2 text-xs font-semibold text-emerald-400 border border-emerald-500/10 hover:bg-emerald-500/10 hover:border-emerald-500/30 transition-all duration-300 active:scale-95 ml-auto"
            >
              <RotateCw className="h-3.5 w-3.5" />
              Swap Exercise
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
