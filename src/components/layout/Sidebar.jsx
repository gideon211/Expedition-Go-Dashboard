import { NavLink, useLocation } from "react-router-dom";
import {
  LayoutDashboard,
  CalendarCheck,
  Package,
  CalendarDays,
  BarChart3,
  Star,
  DollarSign,
  Bell,
  Users,
  Settings,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import { useSidebarStore } from "@/stores/sidebarStore";

const navItems = [
  { label: "Dashboard", path: "/", icon: LayoutDashboard },
  { label: "Bookings", path: "/bookings", icon: CalendarCheck },
  { label: "Products", path: "/products", icon: Package },
  { label: "Availability", path: "/availability", icon: CalendarDays },
  { label: "Performance", path: "/performance", icon: BarChart3 },
  { label: "Reviews", path: "/reviews", icon: Star },
  { label: "Finance", path: "/finance", icon: DollarSign },
  { label: "Notifications", path: "/notifications", icon: Bell },
  { label: "User Management", path: "/users", icon: Users },
  { label: "Settings", path: "/settings", icon: Settings },
];

export default function Sidebar() {
  const { isCollapsed, toggle } = useSidebarStore();
  const location = useLocation();

  return (
    <aside
      className={`fixed left-0 top-0 h-screen bg-[#262a2e] text-white transition-all duration-300 z-50 flex flex-col ${
        isCollapsed ? "w-[70px]" : "w-[260px]"
      }`}
    >
      {/* Logo Area */}
      <div className="h-16 flex items-center px-4 border-b border-white/10">
        <div className={`flex items-center gap-3 ${isCollapsed ? "justify-center w-full" : ""}`}>
          <div className="w-8 h-8 rounded-lg bg-[#044b3b] flex items-center justify-center flex-shrink-0">
            <span className="text-white font-bold text-sm">T</span>
          </div>
          {!isCollapsed && (
            <span className="font-bold text-white text-lg tracking-tight">
              TravioAfrica
            </span>
          )}
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 py-4 overflow-y-auto">
        <ul className="space-y-1 px-2">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = location.pathname === item.path || location.pathname.startsWith(item.path + "/");

            return (
              <li key={item.path}>
                <NavLink
                  to={item.path}
                  className={({ isActive: navActive }) =>
                    `flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors duration-200 ${
                      isActive || navActive
                        ? "bg-[#044b3b] text-white"
                        : "text-[#9e9e9e] hover:text-white hover:bg-white/5"
                    } ${isCollapsed ? "justify-center" : ""}`
                  }
                  title={isCollapsed ? item.label : undefined}
                >
                  <Icon size={20} className="flex-shrink-0" />
                  {!isCollapsed && <span>{item.label}</span>}
                </NavLink>
              </li>
            );
          })}
        </ul>
      </nav>

      {/* Collapse Toggle */}
      <div className="p-2 border-t border-white/10">
        <button
          onClick={toggle}
          className="w-full flex items-center justify-center p-2 text-[#9e9e9e] hover:text-white hover:bg-white/5 rounded-lg transition-colors"
          title={isCollapsed ? "Expand sidebar" : "Collapse sidebar"}
        >
          {isCollapsed ? <ChevronRight size={18} /> : <ChevronLeft size={18} />}
        </button>
      </div>
    </aside>
  );
}
