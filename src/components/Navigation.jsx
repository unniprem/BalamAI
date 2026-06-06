import { NavLink } from "react-router-dom";
import { Dumbbell, Home, History, TrendingUp } from "lucide-react";
import { cn } from "@/lib/utils";

const ITEMS = [
  { to: "/", label: "Home", icon: Home, end: true },
  { to: "/workout", label: "Workout", icon: Dumbbell },
  { to: "/history", label: "History", icon: History },
  { to: "/progress", label: "Progress", icon: TrendingUp },
];

function Brand() {
  return (
    <div className="flex items-center gap-2 px-1">
      <div className="grid size-9 place-items-center rounded-xl bg-primary text-primary-foreground">
        <Dumbbell className="size-5" />
      </div>
      <div className="leading-tight">
        <div className="text-base font-semibold tracking-tight">BalamAI</div>
        <div className="text-[11px] text-muted-foreground">Adaptive fitness coach</div>
      </div>
    </div>
  );
}

export function DesktopSidebar() {
  return (
    <aside className="sticky top-0 hidden h-screen w-60 shrink-0 flex-col border-r border-border bg-sidebar text-sidebar-foreground md:flex">
      <div className="px-4 pt-5 pb-4">
        <Brand />
      </div>
      <nav className="flex flex-1 flex-col gap-1 px-3">
        {ITEMS.map(({ to, label, icon: Icon, end }) => (
          <NavLink
            key={to}
            to={to}
            end={end}
            className={({ isActive }) =>
              cn(
                "flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
                isActive
                  ? "bg-sidebar-accent text-sidebar-accent-foreground"
                  : "text-muted-foreground hover:bg-sidebar-accent/60 hover:text-sidebar-accent-foreground",
              )
            }
          >
            <Icon className="size-4" />
            {label}
          </NavLink>
        ))}
      </nav>
      <div className="px-4 pb-5 text-[11px] text-muted-foreground">
        Works offline · v0.1
      </div>
    </aside>
  );
}

export function MobileTopBar() {
  return (
    <header className="sticky top-0 z-30 flex items-center justify-between border-b border-border bg-background/95 px-4 py-3 backdrop-blur md:hidden">
      <Brand />
    </header>
  );
}

export function MobileBottomNav() {
  return (
    <nav className="sticky bottom-0 z-30 grid grid-cols-4 border-t border-border bg-background/95 backdrop-blur md:hidden">
      {ITEMS.map(({ to, label, icon: Icon, end }) => (
        <NavLink
          key={to}
          to={to}
          end={end}
          className={({ isActive }) =>
            cn(
              "flex flex-col items-center justify-center gap-1 py-2.5 text-[11px] font-medium transition-colors",
              isActive
                ? "text-primary"
                : "text-muted-foreground hover:text-foreground",
            )
          }
        >
          <Icon className="size-5" />
          {label}
        </NavLink>
      ))}
    </nav>
  );
}
