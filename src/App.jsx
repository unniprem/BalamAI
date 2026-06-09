import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";
import { DesktopSidebar, MobileBottomNav, MobileTopBar } from "./components/Navigation";
import Dashboard from "./pages/Dashboard";
import History from "./pages/History";
import Progress from "./pages/Progress";

function AppShell({ children }) {
  return (
    <div className="flex min-h-screen bg-zinc-950 text-zinc-100">
      {/* Sidebar for Desktop layouts */}
      <DesktopSidebar />
      
      <div className="flex min-h-screen w-full min-w-0 flex-1 flex-col pb-16 md:pb-0">
        {/* Top bar for Mobile layouts */}
        <MobileTopBar />
        
        {/* Main Content Area */}
        <main className="flex-1 px-4 py-5 md:px-8 md:py-8">
          <div className="mx-auto w-full max-w-5xl">{children}</div>
        </main>
        
        {/* Sticky Bottom Nav for Mobile layouts */}
        <MobileBottomNav />
      </div>
    </div>
  );
}

export default function App() {
  return (
    <BrowserRouter basename="/BalamAI">
      <AppShell>
        <Routes>
          <Route path="/" element={<Dashboard />} />
          <Route path="/workout" element={<Navigate to="/" replace />} />
          <Route path="/history" element={<History />} />
          <Route path="/progress" element={<Progress />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </AppShell>
    </BrowserRouter>
  );
}
