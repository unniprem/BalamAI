const KEYS = {
  workouts: "balamai:workouts",
  current: "balamai:current-workout",
  settings: "balamai:settings",
};

function read(key, fallback) {
  if (typeof window === "undefined") return fallback;
  try {
    const raw = window.localStorage.getItem(key);
    if (raw == null) return fallback;
    return JSON.parse(raw);
  } catch {
    return fallback;
  }
}

function write(key, value) {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(key, JSON.stringify(value));
  } catch {
    // quota exceeded or storage unavailable — silently no-op so the UI keeps working offline
  }
}

function remove(key) {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.removeItem(key);
  } catch {
    // no-op
  }
}

export function loadWorkouts() {
  const list = read(KEYS.workouts, []);
  return Array.isArray(list) ? list : [];
}

export function saveWorkout(workout) {
  const all = loadWorkouts();
  const next = [workout, ...all];
  write(KEYS.workouts, next);
  return next;
}

export function deleteWorkout(id) {
  const next = loadWorkouts().filter((w) => w.id !== id);
  write(KEYS.workouts, next);
  return next;
}

export function loadCurrentWorkout() {
  return read(KEYS.current, null);
}

export function saveCurrentWorkout(workout) {
  if (workout == null) {
    remove(KEYS.current);
    return null;
  }
  write(KEYS.current, workout);
  return workout;
}

export function clearCurrentWorkout() {
  remove(KEYS.current);
}

const DEFAULT_SETTINGS = {
  theme: "dark",
  mode: "hypertrophy",
};

export function loadSettings() {
  return { ...DEFAULT_SETTINGS, ...read(KEYS.settings, {}) };
}

export function saveSettings(settings) {
  const next = { ...loadSettings(), ...settings };
  write(KEYS.settings, next);
  return next;
}
