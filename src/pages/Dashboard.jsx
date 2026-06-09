import { useState, useEffect, useRef, useCallback } from "react";
import { exercises } from "../data/exercises";
import {
  loadSettings,
  saveSettings,
  saveWorkout,
} from "../lib/storage";
import {
  getWeeklySplitLayout,
  generateExercisesForFocus,
  getGoalLabel,
  getSplitLabel,
} from "../lib/workout";
import ExerciseCard from "../components/ExerciseCard";
import ReplaceExerciseDialog from "../components/ReplaceExerciseDialog";
import {
  Settings,
  Calendar,
  RotateCw,
  Trophy,
  Activity,
  CheckCircle2,
  Clock,
} from "lucide-react";

export default function Dashboard() {
  // --- State ---
  const [settings, setSettings] = useState(() => loadSettings());
  const [weeklySchedule, setWeeklySchedule] = useState(() => {
    const storedSchedule = localStorage.getItem("balamai_weekly_schedule");
    const storedSettingsString = localStorage.getItem("balamai_stored_settings_key");
    const initialSettings = loadSettings();
    const settingsStr = JSON.stringify(initialSettings);
    
    if (storedSchedule && storedSettingsString === settingsStr) {
      return JSON.parse(storedSchedule);
    } else {
      const layout = getWeeklySplitLayout(initialSettings.split, initialSettings.days);
      const fullSchedule = layout.map((day) => {
        if (day.rest) return { ...day, exercises: [] };
        return {
          ...day,
          exercises: generateExercisesForFocus(day.focus, initialSettings.exerciseCount, initialSettings.equipment),
        };
      });
      localStorage.setItem("balamai_weekly_schedule", JSON.stringify(fullSchedule));
      localStorage.setItem("balamai_stored_settings_key", settingsStr);
      return fullSchedule;
    }
  });
  const [activeDayId, setActiveDayId] = useState("day-1");
  const [showSettings, setShowSettings] = useState(false);
  const [swapTarget, setSwapTarget] = useState(null); // exercise to swap
  
  // Timer State
  const [workoutActive, setWorkoutActive] = useState(false);
  const [secondsElapsed, setSecondsElapsed] = useState(0);
  const timerRef = useRef(null);

  // Success Modal State
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [lastCompletedWorkout, setLastCompletedWorkout] = useState(null);

  // Handle active workout state timer
  useEffect(() => {
    if (workoutActive) {
      timerRef.current = setInterval(() => {
        setSecondsElapsed((prev) => prev + 1);
      }, 1000);
    } else {
      if (timerRef.current) clearInterval(timerRef.current);
    }
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [workoutActive]);

  // Format active timer string
  const formatTime = useCallback((secs) => {
    const mins = Math.floor(secs / 60);
    const remainingSecs = secs % 60;
    return `${mins}:${remainingSecs < 10 ? "0" : ""}${remainingSecs}`;
  }, []);

  // --- Schedule Generation ---
  const regenerateWholeSchedule = useCallback((currentSettings) => {
    const layout = getWeeklySplitLayout(currentSettings.split, currentSettings.days);
    
    // For each active day, generate a list of exercises
    const fullSchedule = layout.map((day) => {
      if (day.rest) {
        return { ...day, exercises: [] };
      }
      return {
        ...day,
        exercises: generateExercisesForFocus(day.focus, currentSettings.exerciseCount, currentSettings.equipment),
      };
    });

    setWeeklySchedule(fullSchedule);
    localStorage.setItem("balamai_weekly_schedule", JSON.stringify(fullSchedule));
    localStorage.setItem("balamai_stored_settings_key", JSON.stringify(currentSettings));

    // Find first active day and select it
    const firstActive = fullSchedule.find((d) => !d.rest);
    if (firstActive) {
      setActiveDayId(firstActive.id);
    }
  }, []);

  const regenerateSpecificDay = useCallback((dayId) => {
    setWeeklySchedule((prevSchedule) => {
      const updated = prevSchedule.map((day) => {
        if (day.id === dayId) {
          return {
            ...day,
            exercises: generateExercisesForFocus(day.focus, settings.exerciseCount, settings.equipment),
          };
        }
        return day;
      });
      localStorage.setItem("balamai_weekly_schedule", JSON.stringify(updated));
      return updated;
    });
  }, [settings.exerciseCount, settings.equipment]);

  // --- Setting Change Handlers ---
  const handleSettingChange = useCallback((key, value) => {
    setSettings((prevSettings) => {
      const updatedSettings = { ...prevSettings, [key]: value };
      saveSettings(updatedSettings);
      
      // Reset timer
      setWorkoutActive(false);
      setSecondsElapsed(0);

      // Regenerate schedule
      regenerateWholeSchedule(updatedSettings);
      
      return updatedSettings;
    });
  }, [regenerateWholeSchedule]);

  // --- Workout Actions ---
  const activeDay = weeklySchedule.find((d) => d.id === activeDayId) || null;
  const isRestDay = activeDay?.rest || false;

  const handleToggleComplete = useCallback((exerciseId) => {
    // Automatically trigger timer start when checking the first exercise
    if (!workoutActive && secondsElapsed === 0) {
      setWorkoutActive(true);
    }

    setWeeklySchedule((prevSchedule) => {
      const updated = prevSchedule.map((day) => {
        if (day.id === activeDayId) {
          return {
            ...day,
            exercises: day.exercises.map((ex) =>
              ex.id === exerciseId ? { ...ex, completed: !ex.completed } : ex
            ),
          };
        }
        return day;
      });
      localStorage.setItem("balamai_weekly_schedule", JSON.stringify(updated));
      return updated;
    });
  }, [activeDayId, workoutActive, secondsElapsed]);

  const handleSwapExercise = useCallback((newExerciseId) => {
    const newExTemplate = exercises.find((ex) => ex.id === newExerciseId);
    if (!newExTemplate) return;

    setWeeklySchedule((prevSchedule) => {
      const updated = prevSchedule.map((day) => {
        if (day.id === activeDayId) {
          return {
            ...day,
            exercises: day.exercises.map((ex) =>
              ex.id === swapTarget?.id
                ? {
                    ...newExTemplate,
                    // Preserve key elements but swap templates
                    id: `${newExTemplate.id}-${Date.now()}`,
                    completed: false,
                  }
                : ex
            ),
          };
        }
        return day;
      });
      localStorage.setItem("balamai_weekly_schedule", JSON.stringify(updated));
      return updated;
    });
    setSwapTarget(null);
  }, [activeDayId, swapTarget]);

  const handleFinishWorkout = useCallback(() => {
    if (!activeDay || isRestDay) return;
    
    const completed = activeDay.exercises.filter((ex) => ex.completed);
    if (completed.length === 0) {
      alert("Please complete at least one exercise before finishing the workout!");
      return;
    }

    // Stop timer
    setWorkoutActive(false);

    const durationStr = formatTime(secondsElapsed);

    const workoutLog = {
      id: Date.now().toString(),
      date: new Date().toISOString().split("T")[0],
      dayName: activeDay.name,
      focusNames: activeDay.focus.map((f) => f.toUpperCase()),
      exercises: activeDay.exercises.map((ex) => ({
        id: ex.id,
        name: ex.name,
        category: ex.category,
        equipment: ex.equipment,
        completed: ex.completed,
      })),
      completedCount: completed.length,
      totalCount: activeDay.exercises.length,
      duration: durationStr,
      split: getSplitLabel(settings.split),
      goal: getGoalLabel(settings.goal),
    };

    saveWorkout(workoutLog);
    setLastCompletedWorkout(workoutLog);
    setShowSuccessModal(true);

    // Reset day's exercise checkmarks
    setWeeklySchedule((prevSchedule) => {
      const updated = prevSchedule.map((day) => {
        if (day.id === activeDayId) {
          return {
            ...day,
            exercises: day.exercises.map((ex) => ({ ...ex, completed: false })),
          };
        }
        return day;
      });
      localStorage.setItem("balamai_weekly_schedule", JSON.stringify(updated));
      return updated;
    });
    
    // Reset timer state
    setSecondsElapsed(0);
    
    // Update settings in state to reflect new streak
    setSettings(loadSettings());
  }, [activeDay, isRestDay, secondsElapsed, settings, activeDayId, formatTime]);

  // Calculate completion percentage
  const activeCompletedCount = activeDay?.exercises?.filter((e) => e.completed)?.length || 0;
  const activeTotalCount = activeDay?.exercises?.length || 0;
  const completionPercentage = activeTotalCount
    ? Math.round((activeCompletedCount / activeTotalCount) * 100)
    : 0;

  return (
    <div className="space-y-6">
      {/* Upper header segment: Welcome details */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight text-white sm:text-4xl">
            My Workout Plan
          </h1>
          <p className="mt-1.5 text-zinc-400 text-sm">
            Configure your week, customize exercises, and track your training offline.
          </p>
        </div>

        {/* Buttons: Quick settings toggler */}
        <button
          onClick={() => setShowSettings(!showSettings)}
          className={`flex items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-semibold transition-all duration-300 ${
            showSettings
              ? "bg-emerald-500 text-black shadow-md shadow-emerald-500/20"
              : "bg-zinc-900 text-zinc-350 border border-zinc-800 hover:text-white"
          }`}
        >
          <Settings className={`h-4.5 w-4.5 ${showSettings ? "animate-spin-once" : ""}`} />
          Configure Routine
        </button>
      </div>

      {/* Configuration Section (Dropdown panel) */}
      {showSettings && (
        <div className="rounded-2xl border border-zinc-800 bg-zinc-950 p-6 shadow-xl animate-in fade-in-50 slide-in-from-top-4 duration-300">
          <h2 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
            <Settings className="h-5 w-5 text-emerald-400" />
            Customize Settings
          </h2>
          
          <div className="grid gap-6 md:grid-cols-4">
            {/* Goal Selector */}
            <div className="space-y-2">
              <label className="text-xs font-semibold uppercase tracking-wider text-zinc-500">
                Fitness Goal
              </label>
              <select
                value={settings.goal}
                onChange={(e) => handleSettingChange("goal", e.target.value)}
                className="w-full rounded-xl border border-zinc-800 bg-zinc-900/60 p-3 text-sm text-white outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500"
              >
                <option value="lose-fat">Lose Fat / Cardio</option>
                <option value="strength">Weight Strengthening / Power</option>
                <option value="general">General Fitness / Tone</option>
              </select>
            </div>

            {/* Split Selector */}
            <div className="space-y-2">
              <label className="text-xs font-semibold uppercase tracking-wider text-zinc-500">
                Split Type
              </label>
              <select
                value={settings.split}
                onChange={(e) => handleSettingChange("split", e.target.value)}
                className="w-full rounded-xl border border-zinc-800 bg-zinc-900/60 p-3 text-sm text-white outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500"
              >
                <option value="bro">Bro Split (Target Single Focus)</option>
                <option value="push-pull">Push-Pull-Legs (PPL)</option>
                <option value="other">Full Body / Upper-Lower</option>
              </select>
            </div>

            {/* Days per week */}
            <div className="space-y-2">
              <label className="text-xs font-semibold uppercase tracking-wider text-zinc-500">
                Active Days
              </label>
              <select
                value={settings.days}
                onChange={(e) => handleSettingChange("days", parseInt(e.target.value))}
                className="w-full rounded-xl border border-zinc-800 bg-zinc-900/60 p-3 text-sm text-white outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500"
              >
                <option value="3">3 Days / Week</option>
                <option value="4">4 Days / Week</option>
                <option value="5">5 Days / Week</option>
                <option value="6">6 Days / Week</option>
              </select>
            </div>

            {/* Exercises per day */}
            <div className="space-y-2">
              <label className="text-xs font-semibold uppercase tracking-wider text-zinc-500">
                Exercises / Day
              </label>
              <select
                value={settings.exerciseCount}
                onChange={(e) => handleSettingChange("exerciseCount", parseInt(e.target.value))}
                className="w-full rounded-xl border border-zinc-800 bg-zinc-900/60 p-3 text-sm text-white outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500"
              >
                <option value="4">4 Exercises</option>
                <option value="5">5 Exercises</option>
                <option value="6">6 Exercises</option>
                <option value="7">7 Exercises</option>
              </select>
            </div>
          </div>

          {/* Equipment Availability Selection */}
          <div className="mt-6 border-t border-zinc-900 pt-5 space-y-3">
            <div className="flex flex-col gap-1">
              <label className="text-xs font-semibold uppercase tracking-wider text-zinc-500">
                Available Equipment
              </label>
              <span className="text-[10px] text-zinc-550">
                Limit your generated routines and exercise swaps to equipment you actually have.
              </span>
            </div>
            <div className="flex flex-wrap gap-2">
              {["barbell", "dumbbell", "machine", "cable", "bodyweight"].map((eq) => {
                const isSelected = settings.equipment?.includes(eq) ?? true;
                return (
                  <button
                    key={eq}
                    type="button"
                    onClick={() => {
                      const currentEq = settings.equipment || ["barbell", "dumbbell", "machine", "cable", "bodyweight"];
                      let nextEq;
                      if (isSelected) {
                        if (currentEq.length <= 1) return; // don't allow empty
                        nextEq = currentEq.filter((item) => item !== eq);
                      } else {
                        nextEq = [...currentEq, eq];
                      }
                      handleSettingChange("equipment", nextEq);
                    }}
                    className={`rounded-xl px-3.5 py-2 text-xs font-semibold uppercase tracking-wider transition-all duration-300 border ${
                      isSelected
                        ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/30"
                        : "bg-zinc-900/40 text-zinc-400 border-zinc-850 hover:bg-zinc-800/60 hover:text-white"
                    }`}
                  >
                    {eq}
                  </button>
                );
              })}
            </div>
          </div>

          <div className="mt-6 pt-5 border-t border-zinc-900 flex justify-between items-center flex-wrap gap-3">
            <span className="text-xs text-zinc-400">
              Active configuration: <strong className="text-white">{getGoalLabel(settings.goal)}</strong> with <strong className="text-white">{getSplitLabel(settings.split)}</strong> structure.
            </span>
            <button
              onClick={() => regenerateWholeSchedule(settings)}
              className="flex items-center gap-1.5 rounded-xl bg-zinc-900 border border-zinc-800 px-4.5 py-2 text-xs font-semibold text-white hover:bg-zinc-850 transition-all duration-355 active:scale-95"
            >
              <RotateCw className="h-3.5 w-3.5" />
              Regenerate Full Week
            </button>
          </div>
        </div>
      )}

      {/* Timeline of the Week (7 Calendar Days layout) */}
      <div className="rounded-2xl border border-zinc-850 bg-zinc-950 p-4 shadow-xl overflow-hidden">
        <div className="flex items-center gap-2 mb-3.5 px-1">
          <Calendar className="h-4.5 w-4.5 text-emerald-450" />
          <h2 className="text-sm font-bold text-white uppercase tracking-wider">Weekly Schedule</h2>
        </div>

        <div className="grid grid-cols-2 gap-2 sm:grid-cols-7">
          {weeklySchedule.map((day) => {
            const isActive = day.id === activeDayId;
            const isDayRest = day.rest;

            return (
              <button
                key={day.id}
                onClick={() => setActiveDayId(day.id)}
                className={`flex flex-col items-center p-3.5 rounded-xl text-center transition-all duration-300 border relative ${
                  isActive
                    ? "bg-emerald-500/10 border-emerald-500 text-white scale-[1.02] shadow-md shadow-emerald-500/5"
                    : isDayRest
                    ? "bg-zinc-900/15 border-zinc-850/60 text-zinc-500 hover:bg-zinc-900/30"
                    : "bg-zinc-900/40 border-zinc-800/80 text-zinc-300 hover:border-zinc-700/80 hover:bg-zinc-900/60"
                }`}
              >
                <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest">
                  {day.id.replace("-", " ")}
                </span>
                
                <span className={`mt-2.5 text-xs font-bold leading-none ${isActive ? "text-emerald-400" : isDayRest ? "text-zinc-650" : "text-zinc-250"}`}>
                  {isDayRest ? "REST" : day.focus.map(f => f.slice(0, 4).toUpperCase()).join("/")}
                </span>

                {day.exercises.length > 0 && (
                  <span className="absolute bottom-1.5 right-1.5 h-1.5 w-1.5 rounded-full bg-emerald-500/70" />
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* Main workout checklist pane */}
      <div className="grid gap-6 md:grid-cols-3">
        {/* Left pane: active day overview status */}
        <div className="md:col-span-1 space-y-4">
          <div className="rounded-2xl border border-zinc-850 bg-zinc-950 p-5 shadow-xl space-y-4 sticky top-24">
            <div>
              <div className="flex items-center gap-1.5">
                <span className="rounded bg-emerald-500/10 px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider text-emerald-400 border border-emerald-500/20">
                  {isRestDay ? "Rest" : "Active"}
                </span>
                <span className="text-xs text-zinc-500 font-semibold">{activeDay?.name}</span>
              </div>
              <h2 className="mt-2 text-xl font-bold tracking-tight text-white leading-tight">
                {isRestDay ? "Rest & Recovery" : activeDay?.focus?.map(f => f.toUpperCase()).join(" + ")}
              </h2>
            </div>

            {/* Display Stats or Details */}
            {isRestDay ? (
              <div className="rounded-xl bg-zinc-900/30 p-4 border border-zinc-900 text-center space-y-3 py-6">
                <div className="inline-flex h-12 w-12 items-center justify-center rounded-full bg-emerald-500/10 text-emerald-450 border border-emerald-500/20">
                  <Activity className="h-6 w-6" />
                </div>
                <div className="space-y-1">
                  <h3 className="text-sm font-bold text-white">Give muscles a break</h3>
                  <p className="text-xs text-zinc-500 leading-relaxed px-2">
                    Rest days are crucial for muscle hypertrophy and recovery. Drink water, focus on sleep, and active stretching.
                  </p>
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                {/* Progress Circle bar */}
                <div className="space-y-2">
                  <div className="flex justify-between text-xs font-semibold">
                    <span className="text-zinc-500">Progress Checklist</span>
                    <span className="text-emerald-450">{completionPercentage}%</span>
                  </div>
                  <div className="h-2 w-full rounded-full bg-zinc-900 overflow-hidden border border-zinc-850">
                    <div
                      className="h-full bg-gradient-to-r from-emerald-500 to-emerald-450 transition-all duration-500"
                      style={{ width: `${completionPercentage}%` }}
                    />
                  </div>
                  <div className="text-[11px] text-zinc-500 text-center">
                    {activeCompletedCount} of {activeTotalCount} exercises finished
                  </div>
                </div>

                {/* Workout Timer */}
                <div className="rounded-xl bg-zinc-900/30 p-4 border border-zinc-900 flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-zinc-800 text-zinc-400">
                      <Clock className="h-4.5 w-4.5" />
                    </div>
                    <div>
                      <div className="text-[10px] uppercase tracking-wider text-zinc-500 font-semibold">Time Active</div>
                      <div className="text-sm font-extrabold text-white font-mono">
                        {formatTime(secondsElapsed)}
                      </div>
                    </div>
                  </div>
                  
                  <button
                    onClick={() => setWorkoutActive(!workoutActive)}
                    className={`rounded-lg px-3 py-1.5 text-xs font-semibold transition-all duration-300 ${
                      workoutActive
                        ? "bg-zinc-800 text-zinc-300 hover:text-white"
                        : "bg-emerald-500/10 text-emerald-450 border border-emerald-500/20 hover:bg-emerald-500/20"
                    }`}
                  >
                    {workoutActive ? "Pause" : "Resume"}
                  </button>
                </div>

                {/* Actions: Finish Workout or Regenerate */}
                <div className="pt-2 space-y-2">
                  <button
                    onClick={handleFinishWorkout}
                    disabled={activeCompletedCount === 0}
                    className="w-full flex items-center justify-center gap-2 rounded-xl bg-emerald-500 py-3 text-sm font-extrabold text-black hover:bg-emerald-400 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed shadow-md shadow-emerald-500/15"
                  >
                    <CheckCircle2 className="h-4.5 w-4.5" />
                    Finish Workout
                  </button>
                  
                  <button
                    onClick={() => regenerateSpecificDay(activeDayId)}
                    className="w-full flex items-center justify-center gap-1.5 rounded-xl border border-zinc-800 bg-zinc-900/40 py-2.5 text-xs font-bold text-zinc-400 hover:bg-zinc-900 hover:text-white transition-all duration-300"
                  >
                    <RotateCw className="h-3.5 w-3.5" />
                    Regenerate Exercises
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Right pane: list of exercise cards */}
        <div className="md:col-span-2 space-y-4">
          {!isRestDay && activeDay ? (
            activeDay.exercises.map((ex) => (
              <ExerciseCard
                key={ex.id}
                exercise={ex}
                onToggleComplete={handleToggleComplete}
                onSwapClick={(e) => setSwapTarget(e)}
              />
            ))
          ) : isRestDay ? (
            <div className="flex flex-col items-center justify-center py-20 text-center border border-dashed border-zinc-850 rounded-2xl bg-zinc-950/20">
              <Calendar className="h-10 w-10 text-zinc-650 mb-3" />
              <h3 className="text-base font-bold text-zinc-400">Rest Day Selected</h3>
              <p className="text-xs text-zinc-550 max-w-xs mt-1 leading-relaxed">
                Take a break, relax, and log some steps or focus on mobility. Tap another day above to see workout plans.
              </p>
            </div>
          ) : (
            <div className="text-center py-10 text-zinc-500">Loading daily workout...</div>
          )}
        </div>
      </div>

      {/* Smart Swap Selector Modal overlay */}
      {swapTarget && (
        <ReplaceExerciseDialog
          isOpen={true}
          onClose={() => setSwapTarget(null)}
          currentExercise={swapTarget}
          onSelect={handleSwapExercise}
          allowedEquipment={settings.equipment}
        />
      )}

      {/* Success Congratulations Modal */}
      {showSuccessModal && lastCompletedWorkout && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-xs animate-fade-in">
          <div className="relative max-w-sm w-full rounded-2xl border border-zinc-800 bg-zinc-950 p-6 text-center text-white shadow-2xl space-y-5">
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
              <Trophy className="h-7 w-7 text-emerald-450 animate-bounce" />
            </div>

            <div className="space-y-1.5">
              <h2 className="text-2xl font-black tracking-tight">Workout Completed!</h2>
              <p className="text-zinc-400 text-xs">
                Awesome work finishing <strong className="text-white">{lastCompletedWorkout.dayName}</strong>. Progress saved!
              </p>
            </div>

            <div className="divide-y divide-zinc-900 rounded-xl border border-zinc-900 bg-zinc-900/10 px-4 py-1 text-left text-xs">
              <div className="flex justify-between py-2.5">
                <span className="text-zinc-550 font-medium">Split Target</span>
                <span className="text-white font-bold">{lastCompletedWorkout.split.split(" ")[0]}</span>
              </div>
              <div className="flex justify-between py-2.5">
                <span className="text-zinc-550 font-medium">Exercises Checked</span>
                <span className="text-white font-bold">{lastCompletedWorkout.completedCount} / {lastCompletedWorkout.totalCount}</span>
              </div>
              <div className="flex justify-between py-2.5">
                <span className="text-zinc-550 font-medium">Total Duration</span>
                <span className="text-emerald-400 font-bold font-mono">{lastCompletedWorkout.duration}</span>
              </div>
            </div>

            <button
              onClick={() => setShowSuccessModal(false)}
              className="w-full rounded-xl bg-emerald-500 py-3 text-sm font-extrabold text-black hover:bg-emerald-450 transition-all duration-300"
            >
              Continue Plan
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
