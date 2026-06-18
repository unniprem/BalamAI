# Theme System Design

**Date:** 2026-06-18  
**Status:** Approved

## Summary

Add a switchable light/dark theme system to BalamAI. The current pure-black (`zinc-950`) UI is replaced with two polished themes the user can toggle from within the app. The selected theme persists across sessions.

## Themes

### Dark Slate
- **Background:** deep navy/slate (`slate-900` → `slate-950` gradient), not pure black
- **Cards:** semi-transparent glassy surfaces (`rgba(255,255,255,0.05–0.08)`) with subtle `rgba` borders
- **Text:** `slate-100` primary, `slate-400` secondary, `slate-500` muted
- **Accents:** emerald green (`emerald-400` / `#34d399`) for active states, orange (`orange-400`) for streak

### Clean White
- **Background:** `slate-50` (`#f8fafc`)
- **Cards:** white with soft drop shadows (`box-shadow: 0 2px 6px rgba(0,0,0,0.05)`) and `slate-200` borders
- **Text:** `slate-900` primary, `slate-500` secondary, `slate-400` muted
- **Accents:** emerald green (`emerald-600` / `#10b981`) for active states, orange (`orange-500`) for streak

Both themes keep the same emerald + orange accent palette — only backgrounds, card surfaces, and text lightness change.

## Toggle Placement

- **Mobile:** Sun/moon pill button in the `MobileTopBar`, right of the streak badge
- **Desktop:** Sun/moon pill button in the `DesktopSidebar` footer, below the streak card

The toggle is a small two-segment pill (🌙 / ☀️). The active segment has a filled background; the inactive one is ghost/muted.

## Architecture

### Theme token approach
All color values are expressed as CSS custom properties. Two sets of tokens defined in `src/index.css`:

```css
:root[data-theme="light"] { ... }
:root[data-theme="dark"]  { ... }
```

The `data-theme` attribute is applied to `<html>`. Components use only the token names (e.g., `var(--color-background)`, `var(--color-card)`) — they never reference a raw color or know which theme is active.

### ThemeContext
A `src/context/ThemeContext.jsx` provides:
- `theme` — `"dark"` | `"light"`
- `toggleTheme()` — flips and persists

Default theme on first load: `"dark"` (closest to the existing app feel).

### Persistence
Theme preference is stored in `localStorage` under the key `balamai_theme`. Read on app init; written on every toggle.

### Applying the attribute
`ThemeContext` sets `document.documentElement.setAttribute("data-theme", theme)` whenever the theme value changes.

## Scope

- `src/index.css` — replace hardcoded `zinc-*` token values with the two-block CSS variable system
- `src/context/ThemeContext.jsx` — new file
- `src/main.jsx` — wrap app in `ThemeProvider`
- `src/App.jsx` — remove hardcoded `bg-zinc-950 text-zinc-100` from `AppShell`; use token classes instead
- `src/components/Navigation.jsx` — replace all hardcoded `zinc-*` / `emerald-*` classes with token equivalents; add toggle pill to `MobileTopBar` and `DesktopSidebar`
- `src/components/ExerciseCard.jsx`, `SetTracker.jsx`, `ReplaceExerciseDialog.jsx` — swap hardcoded colors for tokens
- `src/pages/Dashboard.jsx`, `History.jsx`, `Progress.jsx` — same color token pass

## Out of Scope

- No layout, structure, or feature changes
- No new routes or components beyond `ThemeContext`
- No system-preference (`prefers-color-scheme`) auto-detection — user controls it manually
