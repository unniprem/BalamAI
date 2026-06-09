import { exercises } from "../data/exercises";

/**
 * Returns the layout of focuses for each day of the week based on days count and split type.
 * @param {string} split - "bro", "push-pull", "other"
 * @param {number} days - 3, 4, 5, or 6
 * @returns {Array<{name: string, focus: string[], rest: boolean}>}
 */
export function getWeeklySplitLayout(split, days) {
  const layout = [];

  // Helper to construct days
  if (split === "bro") {
    if (days === 3) {
      layout.push({ name: "Day 1", focus: ["push", "shoulders"], rest: false });
      layout.push({ name: "Day 2", focus: ["pull"], rest: false });
      layout.push({ name: "Day 3", focus: ["legs", "core"], rest: false });
    } else if (days === 4) {
      layout.push({ name: "Day 1", focus: ["push"], rest: false });
      layout.push({ name: "Day 2", focus: ["pull"], rest: false });
      layout.push({ name: "Day 3", focus: ["legs"], rest: false });
      layout.push({ name: "Day 4", focus: ["shoulders", "core"], rest: false });
    } else if (days === 5) {
      layout.push({ name: "Day 1", focus: ["push"], rest: false });
      layout.push({ name: "Day 2", focus: ["pull"], rest: false });
      layout.push({ name: "Day 3", focus: ["legs"], rest: false });
      layout.push({ name: "Day 4", focus: ["shoulders"], rest: false });
      layout.push({ name: "Day 5", focus: ["core"], rest: false });
    } else { // 6 days
      layout.push({ name: "Day 1", focus: ["push"], rest: false });
      layout.push({ name: "Day 2", focus: ["pull"], rest: false });
      layout.push({ name: "Day 3", focus: ["legs"], rest: false });
      layout.push({ name: "Day 4", focus: ["shoulders"], rest: false });
      layout.push({ name: "Day 5", focus: ["pull"], rest: false }); // repeat pull
      layout.push({ name: "Day 6", focus: ["core"], rest: false });
    }
  } else if (split === "push-pull") {
    if (days === 3) {
      layout.push({ name: "Day 1", focus: ["push"], rest: false });
      layout.push({ name: "Day 2", focus: ["pull"], rest: false });
      layout.push({ name: "Day 3", focus: ["legs", "core"], rest: false });
    } else if (days === 4) {
      layout.push({ name: "Day 1", focus: ["push"], rest: false });
      layout.push({ name: "Day 2", focus: ["pull"], rest: false });
      layout.push({ name: "Day 3", focus: ["legs"], rest: false });
      layout.push({ name: "Day 4", focus: ["core"], rest: false });
    } else if (days === 5) {
      layout.push({ name: "Day 1", focus: ["push", "shoulders"], rest: false });
      layout.push({ name: "Day 2", focus: ["pull"], rest: false });
      layout.push({ name: "Day 3", focus: ["legs"], rest: false });
      layout.push({ name: "Day 4", focus: ["push"], rest: false });
      layout.push({ name: "Day 5", focus: ["pull", "core"], rest: false });
    } else { // 6 days
      layout.push({ name: "Day 1", focus: ["push"], rest: false });
      layout.push({ name: "Day 2", focus: ["pull"], rest: false });
      layout.push({ name: "Day 3", focus: ["legs"], rest: false });
      layout.push({ name: "Day 4", focus: ["push"], rest: false });
      layout.push({ name: "Day 5", focus: ["pull"], rest: false });
      layout.push({ name: "Day 6", focus: ["legs", "core"], rest: false });
    }
  } else { // "other" (Upper / Lower / Full Body)
    if (days === 3) {
      layout.push({ name: "Day 1", focus: ["push", "pull", "legs", "shoulders", "core"], rest: false }); // Full Body
      layout.push({ name: "Day 2", focus: ["push", "pull", "legs", "shoulders", "core"], rest: false }); // Full Body
      layout.push({ name: "Day 3", focus: ["push", "pull", "legs", "shoulders", "core"], rest: false }); // Full Body
    } else if (days === 4) {
      layout.push({ name: "Day 1", focus: ["push", "pull", "shoulders"], rest: false }); // Upper
      layout.push({ name: "Day 2", focus: ["legs", "core"], rest: false });            // Lower
      layout.push({ name: "Day 3", focus: ["push", "pull", "shoulders"], rest: false }); // Upper
      layout.push({ name: "Day 4", focus: ["legs", "core"], rest: false });            // Lower
    } else if (days === 5) {
      layout.push({ name: "Day 1", focus: ["push", "pull", "shoulders"], rest: false }); // Upper
      layout.push({ name: "Day 2", focus: ["legs", "core"], rest: false });            // Lower
      layout.push({ name: "Day 3", focus: ["push", "pull", "shoulders"], rest: false }); // Upper
      layout.push({ name: "Day 4", focus: ["legs", "core"], rest: false });            // Lower
      layout.push({ name: "Day 5", focus: ["push", "pull", "legs", "shoulders", "core"], rest: false }); // Full Body
    } else { // 6 days
      layout.push({ name: "Day 1", focus: ["push", "pull", "shoulders"], rest: false }); // Upper
      layout.push({ name: "Day 2", focus: ["legs", "core"], rest: false });            // Lower
      layout.push({ name: "Day 3", focus: ["push", "pull", "shoulders"], rest: false }); // Upper
      layout.push({ name: "Day 4", focus: ["legs", "core"], rest: false });            // Lower
      layout.push({ name: "Day 5", focus: ["push", "pull", "shoulders"], rest: false }); // Upper
      layout.push({ name: "Day 6", focus: ["legs", "core"], rest: false });            // Lower
    }
  }

  // Pad to 7 calendar days to show Rest Days
  const activeCount = layout.length;
  const restCount = 7 - activeCount;

  // Distribute rest days evenly
  if (restCount === 1) {
    // Add rest day at the end
    layout.push({ name: "Rest Day", focus: [], rest: true });
  } else if (restCount === 2) {
    // Rest days mid-week and end-week
    layout.splice(3, 0, { name: "Rest Day", focus: [], rest: true });
    layout.push({ name: "Rest Day", focus: [], rest: true });
  } else if (restCount === 3) {
    // Rest days after every 2 active days
    layout.splice(2, 0, { name: "Rest Day", focus: [], rest: true });
    layout.splice(5, 0, { name: "Rest Day", focus: [], rest: true });
    layout.push({ name: "Rest Day", focus: [], rest: true });
  } else if (restCount === 4) {
    // 3 active days means 4 rest days
    layout.splice(1, 0, { name: "Rest Day", focus: [], rest: true });
    layout.splice(3, 0, { name: "Rest Day", focus: [], rest: true });
    layout.splice(5, 0, { name: "Rest Day", focus: [], rest: true });
    layout.push({ name: "Rest Day", focus: [], rest: true });
  }

  // Standardize the day index name
  return layout.map((day, idx) => ({
    ...day,
    id: `day-${idx + 1}`,
    name: day.rest ? "Rest Day" : `Workout Day ${layout.filter((d, i) => i < idx && !d.rest).length + 1}`
  }));
}

/**
 * Generates a list of randomized exercises for a target focus category set.
 * @param {string[]} focusCategories - e.g. ["push", "shoulders"]
 * @param {number} count - number of exercises needed (e.g. 4, 5, 6)
 * @param {string[]} [allowedEquipment=[]] - allowed equipment list
 * @returns {Object[]} Generated exercises list
 */
export function generateExercisesForFocus(focusCategories, count, allowedEquipment = []) {
  // If rest day or empty focus
  if (!focusCategories || focusCategories.length === 0) return [];

  // Filter the exercises matching any of the focus categories
  let pool = exercises.filter(ex => focusCategories.includes(ex.category));
  
  // Apply equipment filtering if settings are present
  if (allowedEquipment && allowedEquipment.length > 0) {
    const filtered = pool.filter(ex => allowedEquipment.includes(ex.equipment));
    if (filtered.length > 0) {
      pool = filtered;
    }
  }
  
  if (pool.length === 0) return [];

  // Shuffle pool
  const shuffled = [...pool].sort(() => 0.5 - Math.random());

  // We want to make sure we select at least one exercise from each focus category if multiple categories are specified
  const result = [];
  const selectedIds = new Set();

  if (focusCategories.length > 1) {
    // Try to pick one from each category first
    focusCategories.forEach(cat => {
      const match = shuffled.find(ex => ex.category === cat && !selectedIds.has(ex.id));
      if (match) {
        result.push({ ...match, completed: false });
        selectedIds.add(match.id);
      }
    });
  }

  // Fill up the rest of the exercises randomly
  for (const ex of shuffled) {
    if (result.length >= count) break;
    if (!selectedIds.has(ex.id)) {
      result.push({ ...ex, completed: false });
      selectedIds.add(ex.id);
    }
  }

  // If still not enough, we can repeat from the pool with fresh instance IDs
  let index = 0;
  while (result.length < count) {
    const item = shuffled[index % shuffled.length];
    result.push({
      ...item,
      id: `${item.id}-dup-${Date.now()}-${result.length}`,
      completed: false
    });
    index++;
  }

  return result;
}

/**
 * Returns a human-readable name for a goal.
 * @param {string} goal
 * @returns {string}
 */
export function getGoalLabel(goal) {
  switch (goal) {
    case "lose-fat":
      return "Lose Fat / Cardio";
    case "strength":
      return "Weight Strengthening / Power";
    case "general":
      return "General Fitness / Tone";
    default:
      return "Fitness Goal";
  }
}

/**
 * Returns a human-readable name for a split.
 * @param {string} split
 * @returns {string}
 */
export function getSplitLabel(split) {
  switch (split) {
    case "bro":
      return "Bro Split (Single Muscle Groups)";
    case "push-pull":
      return "Push-Pull-Legs (PPL)";
    case "other":
      return "Full Body / Upper-Lower";
    default:
      return "Workout Split";
  }
}
