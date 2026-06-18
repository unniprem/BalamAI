# Theme System Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a switchable Dark Slate / Clean White theme to BalamAI with a sun/moon toggle in the top bar and sidebar, persisted to localStorage.

**Architecture:** CSS custom properties (`--app-*`) drive all colors. Two `[data-theme]` blocks in `index.css` define the values. Tailwind v4 `@theme inline` maps these to utility classes (`bg-app-bg`, `text-app-text`, etc.). A `ThemeContext` applies `data-theme` to `<html>` and exposes a `toggleTheme()` function.

**Tech Stack:** React 19, Tailwind CSS v4, CSS custom properties, localStorage

---

## Token Map

| Token class | Dark Slate | Clean White |
|---|---|---|
| `bg-app-bg` | `#0f172a` | `#f8fafc` |
| `bg-app-surface` | `rgb(255 255 255 / 0.06)` | `#ffffff` |
| `bg-app-surface-2` | `rgb(255 255 255 / 0.04)` | `#f1f5f9` |
| `bg-app-surface-dim` | `rgb(255 255 255 / 0.03)` | `#f8fafc` |
| `border-app-border` | `rgb(255 255 255 / 0.10)` | `#e2e8f0` |
| `border-app-border-subtle` | `rgb(255 255 255 / 0.06)` | `#f1f5f9` |
| `text-app-text` | `#f1f5f9` | `#0f172a` |
| `text-app-text-2` | `#94a3b8` | `#475569` |
| `text-app-text-3` | `#64748b` | `#94a3b8` |
| `bg-app-hover` | `rgb(255 255 255 / 0.04)` | `#f1f5f9` |
| `bg-app-nav` | `#0f172a` | `#ffffff` |
| `border-app-nav-border` | `rgb(255 255 255 / 0.08)` | `#e2e8f0` |
| `bg-app-input` | `rgb(255 255 255 / 0.05)` | `#ffffff` |

---

## Task 1: CSS Theme Tokens

**Files:**
- Modify: `src/index.css`

- [ ] **Step 1: Add theme tokens to `@theme inline` block**

Open `src/index.css`. Inside the existing `@theme inline { ... }` block, add these lines at the end (before the closing `}`):

```css
    --color-app-bg: var(--app-bg);
    --color-app-surface: var(--app-surface);
    --color-app-surface-2: var(--app-surface-2);
    --color-app-surface-dim: var(--app-surface-dim);
    --color-app-border: var(--app-border);
    --color-app-border-subtle: var(--app-border-subtle);
    --color-app-text: var(--app-text);
    --color-app-text-2: var(--app-text-2);
    --color-app-text-3: var(--app-text-3);
    --color-app-hover: var(--app-hover);
    --color-app-nav: var(--app-nav);
    --color-app-nav-border: var(--app-nav-border);
    --color-app-input: var(--app-input);
```

- [ ] **Step 2: Add the two `[data-theme]` blocks**

After the closing `}` of the `.dark { ... }` block (at the bottom of the file, before `@layer base`), add:

```css
[data-theme="dark"] {
    --app-bg: #0f172a;
    --app-surface: rgb(255 255 255 / 0.06);
    --app-surface-2: rgb(255 255 255 / 0.04);
    --app-surface-dim: rgb(255 255 255 / 0.03);
    --app-border: rgb(255 255 255 / 0.10);
    --app-border-subtle: rgb(255 255 255 / 0.06);
    --app-text: #f1f5f9;
    --app-text-2: #94a3b8;
    --app-text-3: #64748b;
    --app-hover: rgb(255 255 255 / 0.04);
    --app-nav: #0f172a;
    --app-nav-border: rgb(255 255 255 / 0.08);
    --app-input: rgb(255 255 255 / 0.05);
}

[data-theme="light"] {
    --app-bg: #f8fafc;
    --app-surface: #ffffff;
    --app-surface-2: #f1f5f9;
    --app-surface-dim: #f8fafc;
    --app-border: #e2e8f0;
    --app-border-subtle: #f1f5f9;
    --app-text: #0f172a;
    --app-text-2: #475569;
    --app-text-3: #94a3b8;
    --app-hover: #f1f5f9;
    --app-nav: #ffffff;
    --app-nav-border: #e2e8f0;
    --app-input: #ffffff;
}
```

- [ ] **Step 3: Add card shadow utility for light mode**

At the bottom of `src/index.css`, inside `@layer base`, add:

```css
  [data-theme="light"] .app-card {
    box-shadow: 0 2px 8px rgb(0 0 0 / 0.06);
  }
```

- [ ] **Step 4: Commit**

```bash
git add src/index.css
git commit -m "feat: add CSS theme token system for dark/light themes"
```

---

## Task 2: ThemeContext

**Files:**
- Create: `src/context/ThemeContext.jsx`

- [ ] **Step 1: Create the file**

```jsx
import { createContext, useContext, useEffect, useState } from "react";

const ThemeContext = createContext(null);

export function ThemeProvider({ children }) {
  const [theme, setTheme] = useState(
    () => localStorage.getItem("balamai_theme") || "dark"
  );

  useEffect(() => {
    document.documentElement.setAttribute("data-theme", theme);
    localStorage.setItem("balamai_theme", theme);
  }, [theme]);

  function toggleTheme() {
    setTheme((t) => (t === "dark" ? "light" : "dark"));
  }

  return (
    <ThemeContext.Provider value={{ theme, toggleTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  return useContext(ThemeContext);
}
```

- [ ] **Step 2: Commit**

```bash
git add src/context/ThemeContext.jsx
git commit -m "feat: add ThemeContext with localStorage persistence"
```

---

## Task 3: Wire ThemeProvider + Clean AppShell

**Files:**
- Modify: `src/main.jsx`
- Modify: `src/App.jsx`

- [ ] **Step 1: Wrap app in ThemeProvider in `src/main.jsx`**

Replace the entire file with:

```jsx
import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'
import { ThemeProvider } from './context/ThemeContext.jsx'

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <ThemeProvider>
      <App />
    </ThemeProvider>
  </StrictMode>,
)
```

- [ ] **Step 2: Replace hardcoded colors in `AppShell` in `src/App.jsx`**

Replace:
```jsx
<div className="flex min-h-screen bg-zinc-950 text-zinc-100">
```
With:
```jsx
<div className="flex min-h-screen bg-app-bg text-app-text transition-colors duration-300">
```

- [ ] **Step 3: Commit**

```bash
git add src/main.jsx src/App.jsx
git commit -m "feat: wire ThemeProvider and update AppShell colors"
```

---

## Task 4: Navigation — Replace Colors + Add Toggle

**Files:**
- Modify: `src/components/Navigation.jsx`

- [ ] **Step 1: Replace the entire `Navigation.jsx` file**

```jsx
import { Link, useLocation } from "react-router-dom";
import { Dumbbell, History, TrendingUp, Flame, Sun, Moon } from "lucide-react";
import { loadSettings } from "../lib/storage";
import { useTheme } from "../context/ThemeContext";

export function MobileTopBar() {
  const settings = loadSettings();
  const streak = settings.streak || 0;
  const { theme, toggleTheme } = useTheme();

  return (
    <header className="sticky top-0 z-40 flex h-16 w-full items-center justify-between border-b border-app-nav-border bg-app-nav/80 px-4 backdrop-blur-md md:hidden transition-colors duration-300">
      <div className="flex items-center gap-2">
        <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-emerald-500/10 text-emerald-400">
          <Dumbbell className="h-5 w-5" />
        </div>
        <span className="font-sans text-xl font-bold tracking-tight text-app-text">
          Balam<span className="text-emerald-400">AI</span>
        </span>
      </div>

      <div className="flex items-center gap-2">
        {/* Active Streak Badge */}
        <div className="flex items-center gap-1 rounded-full bg-orange-500/10 px-3 py-1 text-xs font-semibold text-orange-400 border border-orange-500/20 animate-pulse">
          <Flame className="h-3.5 w-3.5 fill-orange-400" />
          <span>{streak} Day Streak</span>
        </div>

        {/* Theme Toggle */}
        <button
          onClick={toggleTheme}
          aria-label="Toggle theme"
          className="flex h-8 w-8 items-center justify-center rounded-lg border border-app-border bg-app-surface text-app-text-2 hover:text-app-text hover:bg-app-hover transition-all duration-200"
        >
          {theme === "dark" ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
        </button>
      </div>
    </header>
  );
}

export function MobileBottomNav() {
  const location = useLocation();
  const currentPath = location.pathname;

  const navItems = [
    { label: "Workout", path: "/", icon: Dumbbell },
    { label: "History", path: "/history", icon: History },
    { label: "Progress", path: "/progress", icon: TrendingUp },
  ];

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-40 flex h-16 w-full items-center justify-around border-t border-app-nav-border bg-app-nav/90 px-2 pb-safe backdrop-blur-md md:hidden transition-colors duration-300">
      {navItems.map((item) => {
        const Icon = item.icon;
        const isActive = currentPath === item.path || (item.path !== "/" && currentPath.startsWith(item.path));

        return (
          <Link
            key={item.path}
            to={item.path}
            className={`flex flex-col items-center justify-center gap-1 py-1 px-3 rounded-xl transition-all duration-300 ${
              isActive
                ? "text-emerald-400 font-medium scale-105"
                : "text-app-text-3 hover:text-app-text-2"
            }`}
          >
            <Icon className="h-5.5 w-5.5" />
            <span className="text-[10px] tracking-wide">{item.label}</span>
          </Link>
        );
      })}
    </nav>
  );
}

export function DesktopSidebar() {
  const location = useLocation();
  const currentPath = location.pathname;
  const settings = loadSettings();
  const streak = settings.streak || 0;
  const { theme, toggleTheme } = useTheme();

  const navItems = [
    { label: "Workout / Plan", path: "/", icon: Dumbbell },
    { label: "Workout History", path: "/history", icon: History },
    { label: "Progress & Analytics", path: "/progress", icon: TrendingUp },
  ];

  return (
    <aside className="hidden h-screen w-64 flex-col border-r border-app-nav-border bg-app-nav p-6 md:flex sticky top-0 transition-colors duration-300">
      {/* Brand Header */}
      <div className="mb-8 flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
          <Dumbbell className="h-6 w-6" />
        </div>
        <span className="font-sans text-2xl font-bold tracking-tight text-app-text">
          Balam<span className="text-emerald-400">AI</span>
        </span>
      </div>

      {/* Navigation Links */}
      <nav className="flex-1 space-y-1.5">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = currentPath === item.path || (item.path !== "/" && currentPath.startsWith(item.path));

          return (
            <Link
              key={item.path}
              to={item.path}
              className={`group flex items-center gap-3.5 px-4 py-3 rounded-xl transition-all duration-300 ${
                isActive
                  ? "bg-emerald-500/10 text-emerald-400 font-semibold border border-emerald-500/20"
                  : "text-app-text-3 hover:bg-app-hover hover:text-app-text-2"
              }`}
            >
              <Icon className={`h-5 w-5 transition-transform group-hover:scale-105 duration-300 ${isActive ? "text-emerald-400" : "text-app-text-3"}`} />
              <span className="text-sm tracking-wide">{item.label}</span>
            </Link>
          );
        })}
      </nav>

      {/* Footer: Streak + Theme Toggle */}
      <div className="mt-auto pt-6 border-t border-app-border-subtle space-y-3">
        <div className="flex items-center gap-3 rounded-2xl bg-app-surface p-4 border border-app-border">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-orange-500/10 text-orange-400 border border-orange-500/20">
            <Flame className="h-5.5 w-5.5 fill-orange-400 animate-pulse" />
          </div>
          <div>
            <div className="text-[10px] uppercase tracking-wider text-app-text-3 font-semibold">Streak</div>
            <div className="text-sm font-bold text-app-text">{streak} Days Active</div>
          </div>
        </div>

        {/* Theme Toggle */}
        <button
          onClick={toggleTheme}
          aria-label="Toggle theme"
          className="flex w-full items-center justify-between rounded-xl border border-app-border bg-app-surface px-4 py-2.5 text-sm font-medium text-app-text-2 hover:text-app-text hover:bg-app-hover transition-all duration-200"
        >
          <span>{theme === "dark" ? "Dark Slate" : "Clean White"}</span>
          {theme === "dark" ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
        </button>
      </div>
    </aside>
  );
}
```

- [ ] **Step 2: Start the dev server and verify toggle works**

```bash
npm run dev
```

Open http://localhost:5173/BalamAI. Click the sun/moon button in the top bar — the page background should switch between dark navy and white. Check the sidebar on a wider viewport. Check that the streak badge and nav links still look correct.

- [ ] **Step 3: Commit**

```bash
git add src/components/Navigation.jsx
git commit -m "feat: add theme toggle to mobile top bar and desktop sidebar"
```

---

## Task 5: ExerciseCard — Replace Colors

**Files:**
- Modify: `src/components/ExerciseCard.jsx`

- [ ] **Step 1: Replace the entire `ExerciseCard.jsx` file**

```jsx
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
```

- [ ] **Step 2: Verify in browser**

With `npm run dev` still running, check that exercise cards look correct in both themes. Toggle between dark and light — cards should have a white background in light mode and a glassy dark surface in dark mode.

- [ ] **Step 3: Commit**

```bash
git add src/components/ExerciseCard.jsx
git commit -m "feat: apply theme tokens to ExerciseCard"
```

---

## Task 6: Dashboard — Replace Colors

**Files:**
- Modify: `src/pages/Dashboard.jsx`

- [ ] **Step 1: Replace all hardcoded zinc color classes**

In `src/pages/Dashboard.jsx`, apply these find-and-replace substitutions in order. Use your editor's find-and-replace (not regex needed — plain text):

| Find | Replace |
|---|---|
| `text-white` | `text-app-text` |
| `text-zinc-400` | `text-app-text-2` |
| `text-zinc-300` | `text-app-text-2` |
| `text-zinc-350` | `text-app-text-2` |
| `text-zinc-500` | `text-app-text-3` |
| `text-zinc-550` | `text-app-text-3` |
| `text-zinc-650` | `text-app-text-3` |
| `text-zinc-250` | `text-app-text` |
| `bg-zinc-950` | `bg-app-bg` |
| `bg-zinc-950/40` | `bg-app-surface-dim` |
| `bg-zinc-950/20` | `bg-app-surface-dim` |
| `bg-zinc-900` | `bg-app-surface-2` |
| `bg-zinc-900/40` | `bg-app-surface-2` |
| `bg-zinc-900/30` | `bg-app-surface-2` |
| `bg-zinc-900/60` | `bg-app-surface-2` |
| `bg-zinc-900/15` | `bg-app-surface-dim` |
| `bg-zinc-900/10` | `bg-app-surface-dim` |
| `bg-zinc-800/60` | `bg-app-hover` |
| `bg-zinc-850` | `bg-app-hover` |
| `hover:bg-zinc-900/10` | `hover:bg-app-hover` |
| `hover:bg-zinc-900/30` | `hover:bg-app-hover` |
| `hover:bg-zinc-900/60` | `hover:bg-app-hover` |
| `hover:bg-zinc-800/60` | `hover:bg-app-hover` |
| `hover:bg-zinc-850` | `hover:bg-app-hover` |
| `border-zinc-800` | `border-app-border` |
| `border-zinc-850` | `border-app-border` |
| `border-zinc-805` | `border-app-border` |
| `border-zinc-900` | `border-app-border-subtle` |
| `hover:border-zinc-700/80` | `hover:border-emerald-500/20` |
| `outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500` | `outline-none bg-app-input focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 text-app-text` |

Then find these two specific `select` / input elements that have `bg-zinc-900/60` already replaced but need `text-app-text` added (search for `bg-app-surface-2 p-3 text-sm` and ensure `text-app-text` is present).

Also replace in the progress bar:
| Find | Replace |
|---|---|
| `bg-zinc-900 overflow-hidden border border-zinc-850` | `bg-app-surface-2 overflow-hidden border border-app-border` |

- [ ] **Step 2: Verify in browser**

Toggle themes on the Dashboard. Check: settings panel, weekly schedule day tabs, exercise section header, rest day panel, workout timer area. All text should be readable in both themes.

- [ ] **Step 3: Commit**

```bash
git add src/pages/Dashboard.jsx
git commit -m "feat: apply theme tokens to Dashboard page"
```

---

## Task 7: History + Progress — Replace Colors

**Files:**
- Modify: `src/pages/History.jsx`
- Modify: `src/pages/Progress.jsx`

- [ ] **Step 1: Replace colors in `History.jsx`**

Apply these substitutions to `src/pages/History.jsx`:

| Find | Replace |
|---|---|
| `text-white` | `text-app-text` |
| `text-zinc-400` | `text-app-text-2` |
| `text-zinc-300` | `text-app-text-2` |
| `text-zinc-550` | `text-app-text-3` |
| `text-zinc-500` | `text-app-text-3` |
| `text-zinc-650` | `text-app-text-3` |
| `bg-zinc-950` | `bg-app-bg` |
| `bg-zinc-950/75` | `bg-app-surface` |
| `bg-zinc-950/40` | `bg-app-surface-dim` |
| `bg-zinc-950/20` | `bg-app-surface-dim` |
| `bg-zinc-900` | `bg-app-surface-2` |
| `bg-zinc-900/10` | `bg-app-surface-dim` |
| `bg-zinc-900/20` | `bg-app-surface-dim` |
| `hover:bg-zinc-900/10` | `hover:bg-app-hover` |
| `border-zinc-850` | `border-app-border` |
| `border-zinc-800` | `border-app-border` |
| `border-zinc-900` | `border-app-border-subtle` |
| `hover:border-zinc-700/80` | `hover:border-emerald-500/20` |

- [ ] **Step 2: Replace colors in `Progress.jsx`**

Apply these substitutions to `src/pages/Progress.jsx`:

| Find | Replace |
|---|---|
| `text-white` | `text-app-text` |
| `text-zinc-400` | `text-app-text-2` |
| `text-zinc-300` | `text-app-text-2` |
| `text-zinc-450` | `text-app-text-2` |
| `text-zinc-500` | `text-app-text-3` |
| `text-zinc-550` | `text-app-text-3` |
| `text-zinc-650` | `text-app-text-3` |
| `bg-zinc-950` | `bg-app-bg` |
| `bg-zinc-950/20` | `bg-app-surface-dim` |
| `bg-zinc-900` | `bg-app-surface-2` |
| `border-zinc-850` | `border-app-border` |
| `border-zinc-800` | `border-app-border` |
| `border-zinc-900` | `border-app-border-subtle` |

- [ ] **Step 3: Verify both pages in browser**

Navigate to History and Progress. Toggle the theme. Check that all text is readable and all card borders/backgrounds look correct in both themes.

- [ ] **Step 4: Commit**

```bash
git add src/pages/History.jsx src/pages/Progress.jsx
git commit -m "feat: apply theme tokens to History and Progress pages"
```

---

## Task 8: Final Polish + Verification

**Files:**
- Modify: `src/components/ReplaceExerciseDialog.jsx` (if needed)
- No changes to `src/components/SetTracker.jsx` — it already uses shadcn semantic tokens (`bg-muted`, `text-muted-foreground`) which work in both themes

- [ ] **Step 1: Check ReplaceExerciseDialog for hardcoded zinc colors**

```bash
grep -n "zinc\|text-white" src/components/ReplaceExerciseDialog.jsx
```

If any `zinc-*` or `text-white` classes appear, apply the same substitution map from Task 6 Step 1.

- [ ] **Step 2: Verify `.gitignore` includes `.superpowers/`**

```bash
grep -q ".superpowers" .gitignore && echo "already ignored" || echo ".superpowers/" >> .gitignore
```

- [ ] **Step 3: Full app walkthrough in both themes**

With `npm run dev`:
1. Load the app — should default to Dark Slate
2. Toggle to Clean White — full page transitions smoothly
3. Refresh — Clean White persists (localStorage)
4. Toggle back to Dark Slate — persists on refresh
5. Check all three pages (Workout, History, Progress) in both themes
6. Check mobile viewport (< 768px) — toggle is in top bar
7. Check desktop viewport (≥ 768px) — toggle is in sidebar footer

- [ ] **Step 4: Final commit**

```bash
git add -A
git commit -m "feat: complete theme system — dark slate and clean white with persistent toggle"
```
