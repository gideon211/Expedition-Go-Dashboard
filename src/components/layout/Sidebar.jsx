import { useState, useEffect } from "react";
import { NavLink, useLocation } from "react-router-dom";
import {
  LayoutDashboard, Package, MessageCircle,
  DollarSign, Bell, Settings, ChevronLeft, ChevronRight,
  Menu, X, CalendarCheck, Star, Compass
} from "lucide-react";
import { useSidebarStore } from "@/stores/sidebarStore";
import { useAuthStore } from "@/stores/authStore";
import { toast } from "sonner";
import { loadSupplierProfile } from "@/features/auth/api";

const navItems = [
  { label: "Dashboard", path: "/", icon: LayoutDashboard },
  { label: "Bookings", path: "/bookings", icon: CalendarCheck },
  { label: "Products", path: "/products", icon: Package },
  { label: "Reviews", path: "/reviews", icon: Star },
  { label: "Finance", path: "/finance", icon: DollarSign },
  { label: "Notifications", path: "/notifications", icon: Bell },
  { label: "Settings", path: "/settings", icon: Settings },
  { label: "Customer Conversations", path: "/chat", icon: MessageCircle, disabled: true },
];

function extractBusinessName(businessInfo) {
  if (!businessInfo) return null;
  if (typeof businessInfo === "string") {
    try { const p = JSON.parse(businessInfo); return p.businessName || p.legalBusinessName || null; } catch { return null; }
  }
  return businessInfo.businessName || businessInfo.legalBusinessName || null;
}

export default function Sidebar() {
  const { isCollapsed, toggle, isMobileOpen, closeMobile } = useSidebarStore();
  const user = useAuthStore((state) => state.user);
  const location = useLocation();
  const logoUrl = user?.logoUrl;
  const [businessName, setBusinessName] = useState(null);

  useEffect(() => {
    if (!user?.roles?.includes("supplier")) return;
    loadSupplierProfile().then((profile) => {
      if (!profile) return;
      const name = extractBusinessName(profile.businessInfo);
      if (name) setBusinessName(name);
    });
  }, [user?.roles]);

  return (
    <>
      {/* Mobile Toggle Button (fixed, visible only on mobile) */}
      <button
        onClick={() => useSidebarStore.getState().toggleMobile()}
        className="fixed top-4 left-4 z-[60] p-2.5 rounded-lg bg-[#044b3b] text-white shadow-lg lg:hidden"
        aria-label="Toggle menu"
      >
        {isMobileOpen ? <X size={20} /> : <Menu size={20} />}
      </button>

      {/* Sidebar */}
      <aside
        className={`fixed left-0 top-0 h-screen bg-[#262a2e] text-white transition-all duration-300 z-50 flex flex-col
          ${isMobileOpen ? "translate-x-0" : "-translate-x-full"}
          ${isCollapsed ? "lg:w-[70px] lg:translate-x-0" : "lg:w-[260px] lg:translate-x-0"}
          w-[280px]`}
      >
        {/* Logo Area */}
        <div className="h-16 flex items-center px-4 border-b border-white/10">
          <div className={`flex items-center gap-3 ${isCollapsed ? "justify-center w-full" : ""}`}>
            <div className="w-8 h-8 rounded-lg bg-[#044b3b] flex items-center justify-center flex-shrink-0">
              <Compass size={16} className="text-white" />
            </div>
            {!isCollapsed && (
              <span className="font-bold text-white text-lg tracking-tight whitespace-nowrap">
                TravioAfrica
              </span>
            )}
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 py-4 overflow-y-auto overflow-x-hidden">
          <ul className="space-y-1 px-2">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = location.pathname === item.path || location.pathname.startsWith(item.path + "/");

              return (
                <li key={item.path}>
                  {item.disabled ? (
                    <button
                      onClick={() => toast.info("Coming soon")}
                      className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium w-full text-left cursor-default text-[#6b6b6b] ${isCollapsed ? "justify-center" : ""}`}
                      title={isCollapsed ? item.label : undefined}
                    >
                      <Icon size={20} className="flex-shrink-0 opacity-50" />
                      {!isCollapsed && <span className="whitespace-nowrap">{item.label}</span>}
                    </button>
                  ) : (
                    <NavLink
                      to={item.path}
                      onClick={closeMobile}
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
                      {!isCollapsed && <span className="whitespace-nowrap">{item.label}</span>}
                    </NavLink>
                  )}
                </li>
              );
            })}
          </ul>
        </nav>

        {/* User / Supplier Section */}
        <div className="border-t border-white/10 p-3">
          <div className={`flex items-center gap-3 ${isCollapsed ? "justify-center" : ""}`}>
            {logoUrl ? (
              <div className="w-8 h-8 rounded-full overflow-hidden flex-shrink-0 bg-white">
                <img
                  src={logoUrl}
                  alt="Company logo"
                  className="w-full h-full object-cover"
                />
              </div>
            ) : (
              <div className="w-8 h-8 rounded-full bg-[#044b3b] flex items-center justify-center flex-shrink-0">
                <span className="text-xs font-bold text-white">
                  {user?.name ? user.name.charAt(0).toUpperCase() : "S"}
                </span>
              </div>
            )}
            {!isCollapsed && (
              <div className="min-w-0 flex-1">
                <p className="text-sm font-semibold text-white truncate">
                  {businessName || user?.name || "Supplier"}
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Collapse Toggle (desktop only) */}
        <div className="p-2 border-t border-white/10 hidden lg:block">
          <button
            onClick={toggle}
            className="w-full flex items-center justify-center p-2 text-[#9e9e9e] hover:text-white hover:bg-white/5 rounded-lg transition-colors"
            title={isCollapsed ? "Expand sidebar" : "Collapse sidebar"}
          >
            {isCollapsed ? <ChevronRight size={18} /> : <ChevronLeft size={18} />}
          </button>
        </div>
      </aside>
    </>
  );
}
