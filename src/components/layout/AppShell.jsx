import { Outlet } from "react-router-dom";
import Sidebar from "./Sidebar";
import Header from "./Header";
import { useSidebarStore } from "@/stores/sidebarStore";
import SupportFloating from "@/features/chat/components/SupportFloating";

export default function AppShell() {
  const { isCollapsed, isMobileOpen } = useSidebarStore();

  return (
    <div className="min-h-screen bg-slate-50">
      <Sidebar />
      <Header />
      {isMobileOpen && (
        <div
          className="fixed inset-0 bg-black/20 z-40 lg:hidden"
          onClick={() => useSidebarStore.getState().closeMobile()}
        />
      )}
      <main
        className={`pt-14 min-h-screen transition-all duration-300 ${
          isCollapsed ? "lg:ml-[60px]" : "lg:ml-[220px]"
        }`}
      >
        <div className="min-h-[calc(100vh-64px)]">
          <Outlet />
        </div>
      </main>
      <SupportFloating />
    </div>
  );
}
