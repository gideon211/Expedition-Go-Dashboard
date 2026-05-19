import Sidebar from "./Sidebar";
import Header from "./Header";
import { useSidebarStore } from "@/stores/sidebarStore";

export default function AppShell({ children }) {
  const { isCollapsed } = useSidebarStore();

  return (
    <div className="min-h-screen bg-white">
      <Sidebar />
      <Header />
      <main
        className={`pt-16 min-h-screen transition-all duration-300 ${
          isCollapsed ? "ml-[70px]" : "ml-[260px]"
        }`}
      >
        <div className="bg-white min-h-[calc(100vh-64px)]">
          {children}
        </div>
      </main>
    </div>
  );
}
