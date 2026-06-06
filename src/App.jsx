import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";
import { DesktopSidebar, MobileBottomNav, MobileTopBar } from "@/components/Navigation";
import Dashboard from "@/pages/Dashboard";
import Workout from "@/pages/Workout";
import History from "@/pages/History";
import Progress from "@/pages/Progress";

function AppShell({ children }) {
  return (
    <div className="flex min-h-screen bg-background text-foreground">
      <DesktopSidebar />
      <div className="flex min-h-screen w-full min-w-0 flex-1 flex-col">
        <MobileTopBar />
        <main className="flex-1 px-4 py-5 pb-6 md:px-8 md:py-8">
          <div className="mx-auto w-full max-w-5xl">{children}</div>
        </main>
        <MobileBottomNav />
      </div>
    </div>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <AppShell>
        <Routes>
          <Route path="/" element={<Dashboard />} />
          <Route path="/workout" element={<Workout />} />
          <Route path="/history" element={<History />} />
          <Route path="/history/:id" element={<History />} />
          <Route path="/progress" element={<Progress />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </AppShell>
    </BrowserRouter>
  );
}
