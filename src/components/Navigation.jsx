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
