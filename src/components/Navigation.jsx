import { Link, useLocation } from "react-router-dom";
import { Dumbbell, History, TrendingUp, Flame } from "lucide-react";
import { loadSettings } from "../lib/storage";

export function MobileTopBar() {
  const settings = loadSettings();
  const streak = settings.streak || 0;

  return (
    <header className="sticky top-0 z-40 flex h-16 w-full items-center justify-between border-b border-zinc-800 bg-zinc-950/80 px-4 backdrop-blur-md md:hidden">
      <div className="flex items-center gap-2">
        <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-emerald-500/10 text-emerald-400">
          <Dumbbell className="h-5 w-5" />
        </div>
        <span className="font-sans text-xl font-bold tracking-tight text-white">
          Balam<span className="text-emerald-400">AI</span>
        </span>
      </div>
      
      {/* Active Streak Badge */}
      <div className="flex items-center gap-1 rounded-full bg-orange-500/10 px-3 py-1 text-xs font-semibold text-orange-400 border border-orange-500/20 animate-pulse">
        <Flame className="h-3.5 w-3.5 fill-orange-400" />
        <span>{streak} Day Streak</span>
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
    <nav className="fixed bottom-0 left-0 right-0 z-40 flex h-16 w-full items-center justify-around border-t border-zinc-800 bg-zinc-950/90 px-2 pb-safe backdrop-blur-md md:hidden">
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
                : "text-zinc-400 hover:text-zinc-200"
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

  const navItems = [
    { label: "Workout / Plan", path: "/", icon: Dumbbell },
    { label: "Workout History", path: "/history", icon: History },
    { label: "Progress & Analytics", path: "/progress", icon: TrendingUp },
  ];

  return (
    <aside className="hidden h-screen w-64 flex-col border-r border-zinc-850 bg-zinc-950 p-6 md:flex sticky top-0">
      {/* Brand Header */}
      <div className="mb-8 flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-500/10 text-emerald-450 border border-emerald-500/20">
          <Dumbbell className="h-6 w-6" />
        </div>
        <span className="font-sans text-2xl font-bold tracking-tight text-white">
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
                  : "text-zinc-400 hover:bg-zinc-900/60 hover:text-zinc-200"
              }`}
            >
              <Icon className={`h-5 w-5 transition-transform group-hover:scale-105 duration-300 ${isActive ? "text-emerald-400" : "text-zinc-400"}`} />
              <span className="text-sm tracking-wide">{item.label}</span>
            </Link>
          );
        })}
      </nav>

      {/* Footer / Streak Badge */}
      <div className="mt-auto pt-6 border-t border-zinc-900">
        <div className="flex items-center gap-3 rounded-2xl bg-zinc-900/40 p-4 border border-zinc-800/80">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-orange-500/10 text-orange-400 border border-orange-500/20">
            <Flame className="h-5.5 w-5.5 fill-orange-400 animate-pulse" />
          </div>
          <div>
            <div className="text-[10px] uppercase tracking-wider text-zinc-500 font-semibold">Streak</div>
            <div className="text-sm font-bold text-white">{streak} Days Active</div>
          </div>
        </div>
      </div>
    </aside>
  );
}
