import React, { useState, useEffect } from "react";
import { loadWorkouts, loadSettings } from "../lib/storage";
import { TrendingUp, Flame, Dumbbell, BarChart3, PieChart, Info } from "lucide-react";

export default function Progress() {
  const [workouts, setWorkouts] = useState([]);
  const [settings, setSettings] = useState(() => loadSettings());

  useEffect(() => {
    setWorkouts(loadWorkouts());
    setSettings(loadSettings());
  }, []);

  // Compute metrics
  const totalWorkouts = workouts.length;
  const currentStreak = settings.streak || 0;
  
  // Total exercises completed
  const totalExercisesCompleted = workouts.reduce(
    (acc, curr) => acc + (curr.completedCount || 0),
    0
  );

  // Category counts
  const categoryCounts = workouts.reduce((acc, curr) => {
    if (curr.exercises) {
      curr.exercises.forEach((ex) => {
        if (ex.completed && ex.category) {
          acc[ex.category] = (acc[ex.category] || 0) + 1;
        }
      });
    }
    return acc;
  }, {});

  const totalCompletedWithCategory = Object.values(categoryCounts).reduce(
    (a, b) => a + b,
    0
  );

  // Equipment counts
  const equipmentCounts = workouts.reduce((acc, curr) => {
    if (curr.exercises) {
      curr.exercises.forEach((ex) => {
        if (ex.completed && ex.equipment) {
          acc[ex.equipment] = (acc[ex.equipment] || 0) + 1;
        }
      });
    }
    return acc;
  }, {});

  const totalCompletedWithEquipment = Object.values(equipmentCounts).reduce(
    (a, b) => a + b,
    0
  );

  // Standard categories
  const categories = ["push", "pull", "legs", "shoulders", "core"];
  const categoryColors = {
    push: "bg-cyan-500",
    pull: "bg-blue-500",
    legs: "bg-emerald-500",
    shoulders: "bg-purple-500",
    core: "bg-orange-500",
  };

  // Standard equipment list
  const equipments = ["barbell", "dumbbell", "machine", "cable", "bodyweight"];
  const equipmentColors = {
    barbell: "bg-rose-500",
    dumbbell: "bg-amber-500",
    machine: "bg-teal-500",
    cable: "bg-violet-500",
    bodyweight: "bg-indigo-500",
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div>
        <h1 className="text-3xl font-extrabold tracking-tight text-white sm:text-4xl">
          Progress & Analytics
        </h1>
        <p className="mt-1.5 text-zinc-400 text-sm">
          Visualize your training habits, streaks, and muscle balance distribution.
        </p>
      </div>

      {/* Stats Cards Grid */}
      <div className="grid gap-4 sm:grid-cols-3">
        {/* Total Workouts completed */}
        <div className="rounded-2xl border border-zinc-850 bg-zinc-950 p-5 flex items-center gap-4.5 shadow-xl relative overflow-hidden">
          <div className="absolute top-0 right-0 -mt-4 -mr-4 h-16 w-16 rounded-full bg-emerald-500/5 blur-xl pointer-events-none" />
          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-emerald-500/10 text-emerald-450 border border-emerald-500/20">
            <TrendingUp className="h-5.5 w-5.5" />
          </div>
          <div>
            <div className="text-[10px] uppercase tracking-wider text-zinc-500 font-semibold">Total Sessions</div>
            <div className="text-2xl font-black text-white">{totalWorkouts}</div>
            <div className="text-[10px] text-zinc-450">Workouts finished</div>
          </div>
        </div>

        {/* Streak card */}
        <div className="rounded-2xl border border-zinc-850 bg-zinc-950 p-5 flex items-center gap-4.5 shadow-xl relative overflow-hidden">
          <div className="absolute top-0 right-0 -mt-4 -mr-4 h-16 w-16 rounded-full bg-orange-500/5 blur-xl pointer-events-none" />
          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-orange-500/10 text-orange-400 border border-orange-500/20">
            <Flame className="h-5.5 w-5.5 fill-orange-400 animate-pulse" />
          </div>
          <div>
            <div className="text-[10px] uppercase tracking-wider text-zinc-500 font-semibold">Current Streak</div>
            <div className="text-2xl font-black text-white">{currentStreak} Days</div>
            <div className="text-[10px] text-zinc-450">Consecutive workouts</div>
          </div>
        </div>

        {/* Total Exercises completed */}
        <div className="rounded-2xl border border-zinc-850 bg-zinc-950 p-5 flex items-center gap-4.5 shadow-xl relative overflow-hidden">
          <div className="absolute top-0 right-0 -mt-4 -mr-4 h-16 w-16 rounded-full bg-blue-500/5 blur-xl pointer-events-none" />
          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-blue-500/10 text-blue-400 border border-blue-500/20">
            <Dumbbell className="h-5.5 w-5.5" />
          </div>
          <div>
            <div className="text-[10px] uppercase tracking-wider text-zinc-500 font-semibold">Exercises Completed</div>
            <div className="text-2xl font-black text-white">{totalExercisesCompleted}</div>
            <div className="text-[10px] text-zinc-450">Successful checkmarks</div>
          </div>
        </div>
      </div>

      {workouts.length > 0 ? (
        <div className="grid gap-6 md:grid-cols-2">
          {/* Category split distributions */}
          <div className="rounded-2xl border border-zinc-850 bg-zinc-950 p-5 shadow-xl space-y-4">
            <div className="flex items-center gap-2 border-b border-zinc-900 pb-3">
              <BarChart3 className="h-5 w-5 text-emerald-400" />
              <h2 className="text-base font-bold text-white uppercase tracking-wider">
                Category Distribution
              </h2>
            </div>
            
            <p className="text-xs text-zinc-400 leading-relaxed">
              Maintains balanced exercise targets. Ideally, keep an even split between categories to avoid imbalances.
            </p>

            <div className="space-y-3 pt-2">
              {categories.map((cat) => {
                const count = categoryCounts[cat] || 0;
                const percent = totalCompletedWithCategory
                  ? Math.round((count / totalCompletedWithCategory) * 100)
                  : 0;
                
                return (
                  <div key={cat} className="space-y-1">
                    <div className="flex justify-between text-xs">
                      <span className="font-semibold text-zinc-300 capitalize">{cat}</span>
                      <span className="text-zinc-500">
                        {count} ({percent}%)
                      </span>
                    </div>
                    
                    <div className="h-3 w-full rounded-full bg-zinc-900 border border-zinc-850 overflow-hidden">
                      <div
                        className={`h-full ${categoryColors[cat]} transition-all duration-500`}
                        style={{ width: `${percent}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Equipment distribution */}
          <div className="rounded-2xl border border-zinc-850 bg-zinc-950 p-5 shadow-xl space-y-4">
            <div className="flex items-center gap-2 border-b border-zinc-900 pb-3">
              <PieChart className="h-5 w-5 text-emerald-400" />
              <h2 className="text-base font-bold text-white uppercase tracking-wider">
                Equipment Usage
              </h2>
            </div>
            
            <p className="text-xs text-zinc-400 leading-relaxed">
              Track what equipment type you rely on most. Helpful for adapting splits to barbell, dumbbell or bodyweight.
            </p>

            <div className="space-y-3 pt-2">
              {equipments.map((eq) => {
                const count = equipmentCounts[eq] || 0;
                const percent = totalCompletedWithEquipment
                  ? Math.round((count / totalCompletedWithEquipment) * 100)
                  : 0;
                
                return (
                  <div key={eq} className="space-y-1">
                    <div className="flex justify-between text-xs">
                      <span className="font-semibold text-zinc-300 capitalize">{eq}</span>
                      <span className="text-zinc-500">
                        {count} ({percent}%)
                      </span>
                    </div>
                    
                    <div className="h-3 w-full rounded-full bg-zinc-900 border border-zinc-850 overflow-hidden">
                      <div
                        className={`h-full ${equipmentColors[eq]} transition-all duration-500`}
                        style={{ width: `${percent}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      ) : (
        /* Empty analytics state */
        <div className="flex flex-col items-center justify-center py-20 text-center border border-dashed border-zinc-850 rounded-2xl bg-zinc-950/20">
          <Info className="h-10 w-10 text-zinc-650 mb-3" />
          <h3 className="text-base font-bold text-zinc-400">No analytics data available</h3>
          <p className="text-xs text-zinc-550 max-w-xs mt-1 leading-relaxed px-4">
            Log your workouts to populate these charts. The app will automatically analyze category balances and equipment split types once you start finishing sessions.
          </p>
        </div>
      )}
    </div>
  );
}
