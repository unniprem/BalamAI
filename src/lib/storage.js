// Keys for LocalStorage
const KEYS = {
  HISTORY: "balamai_history",
  CURRENT_WORKOUT: "balamai_current_workout",
  SETTINGS: "balamai_settings"
};

// Safe JSON parser/stringifier helpers
const safeGet = (key, defaultValue) => {
  try {
    const item = localStorage.getItem(key);
    return item ? JSON.parse(item) : defaultValue;
  } catch (error) {
    console.error(`Error reading ${key} from LocalStorage`, error);
    return defaultValue;
  }
};

const safeSet = (key, value) => {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch (error) {
    console.error(`Error writing ${key} to LocalStorage`, error);
  }
};

// --- Storage API ---

/**
 * Saves a completed workout to history.
 * @param {Object} workout - Completed workout details
 */
export function saveWorkout(workout) {
  const history = loadWorkouts();
  const newWorkout = {
    id: workout.id || Date.now().toString(),
    date: workout.date || new Date().toISOString().split("T")[0],
    duration: workout.duration || "0:00",
    exercises: workout.exercises || [],
    split: workout.split || "Full Body",
    goal: workout.goal || "General",
    ...workout
  };
  
  history.unshift(newWorkout);
  safeSet(KEYS.HISTORY, history);
  
  // Clear active workout
  localStorage.removeItem(KEYS.CURRENT_WORKOUT);

  // Update streak details in settings
  const settings = loadSettings();
  const todayStr = new Date().toISOString().split("T")[0];
  
  if (settings.lastWorkoutDate !== todayStr) {
    // If last workout was yesterday (or no last workout), increment streak
    let newStreak = settings.streak || 0;
    if (!settings.lastWorkoutDate) {
      newStreak = 1;
    } else {
      const lastDate = new Date(settings.lastWorkoutDate);
      const today = new Date(todayStr);
      const diffTime = Math.abs(today - lastDate);
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      if (diffDays <= 1) {
        newStreak += 1;
      } else {
        newStreak = 1; // reset streak if gap is larger than 1 day
      }
    }
    settings.streak = newStreak;
    settings.lastWorkoutDate = todayStr;
    saveSettings(settings);
  }
}

/**
 * Loads the history of completed workouts.
 * @returns {Array} List of completed workouts
 */
export function loadWorkouts() {
  return safeGet(KEYS.HISTORY, []);
}

/**
 * Saves the current active workout state (for reload protection).
 * @param {Object|null} workoutState - Active workout state
 */
export function saveCurrentWorkout(workoutState) {
  if (workoutState === null) {
    localStorage.removeItem(KEYS.CURRENT_WORKOUT);
  } else {
    safeSet(KEYS.CURRENT_WORKOUT, workoutState);
  }
}

/**
 * Loads the active workout state.
 * @returns {Object|null} Active workout state
 */
export function loadCurrentWorkout() {
  return safeGet(KEYS.CURRENT_WORKOUT, null);
}

/**
 * Saves user settings.
 * @param {Object} settings - Settings configuration
 */
export function saveSettings(settings) {
  safeSet(KEYS.SETTINGS, settings);
}

/**
 * Loads user settings.
 * @returns {Object} Settings configuration
 */
export function loadSettings() {
  const defaultSettings = {
    streak: 0,
    lastWorkoutDate: null,
    days: 5,                  // 3, 4, 5, or 6 days
    split: "push-pull",       // "bro", "push-pull", "other"
    goal: "strength",         // "lose-fat", "strength", "general"
    exerciseCount: 5          // 4, 5, or 6
  };
  
  // Merge stored settings with defaults to ensure all keys exist
  const stored = safeGet(KEYS.SETTINGS, {});
  return { ...defaultSettings, ...stored };
}
