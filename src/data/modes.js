export const MODES = {
  strength: {
    id: "strength",
    label: "Strength",
    sets: 5,
    repsMin: 3,
    repsMax: 5,
    restMin: 180,
    restMax: 300,
  },
  hypertrophy: {
    id: "hypertrophy",
    label: "Hypertrophy",
    sets: 4,
    repsMin: 8,
    repsMax: 12,
    restMin: 60,
    restMax: 90,
  },
  "fat-loss": {
    id: "fat-loss",
    label: "Fat Loss",
    sets: 3,
    repsMin: 12,
    repsMax: 20,
    restMin: 30,
    restMax: 45,
  },
};

export const MODE_ORDER = ["strength", "hypertrophy", "fat-loss"];
export const DEFAULT_MODE = "hypertrophy";

export function getMode(id) {
  return MODES[id] ?? MODES[DEFAULT_MODE];
}

export function formatRepRange({ repsMin, repsMax }) {
  return `${repsMin}-${repsMax}`;
}

export function formatRestRange({ restMin, restMax }) {
  if (restMin >= 60 && restMin % 60 === 0 && restMax % 60 === 0) {
    return `${restMin / 60}-${restMax / 60}m`;
  }
  return `${restMin}-${restMax}s`;
}
