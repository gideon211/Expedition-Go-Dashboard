import { useState, useEffect } from "react";
import { NavLink, useLocation, useNavigate } from "react-router-dom";
import { useSidebarStore } from "@/stores/sidebarStore";
import { useAuthStore } from "@/stores/authStore";
import { toast } from "sonner";
import { loadSupplierProfile } from "@/features/auth/api";
import { Compass, LogOut, ChevronLeft, ChevronRight, Menu, X, LayoutDashboard, Package, Ticket, CalendarDays, Users, DollarSign, Star, Bell, BarChart3 } from "lucide-react";

const navItems = [
  { label: "Dashboard", path: "/", icon: <LayoutDashboard size={18} /> },
  { label: "Products", path: "/products", icon: <Package size={18} /> },
  { label: "Bookings", path: "/bookings", icon: <Ticket size={18} /> },
  { label: "Availability", path: "/availability", icon: <CalendarDays size={18} /> },
  { label: "Customers", path: "/chat", icon: <Users size={18} /> },
  { label: "Finance", path: "/finance", icon: <DollarSign size={18} /> },
  { label: "Reviews", path: "/reviews", icon: <Star size={18} /> },
  { label: "Notifications", path: "/notifications", icon: <Bell size={18} /> },
  { label: "Analytics", path: "/analytics", icon: <BarChart3 size={18} /> },
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
  const navigate = useNavigate();
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

  const handleLogout = async () => {
    await useAuthStore.getState().logout();
    navigate("/login", { replace: true });
  };

  return (
    <>
      <button
        onClick={() => useSidebarStore.getState().toggleMobile()}
        className="fixed top-3 left-3 z-[60] p-2 rounded-lg bg-emerald-900 text-white shadow-lg shadow-emerald-900/20 lg:hidden"
        aria-label="Toggle menu"
      >
        {isMobileOpen ? <X size={18} /> : <Menu size={18} />}
      </button>

      <aside
        className={`fixed left-0 top-0 h-screen bg-emerald-900 border-r border-emerald-800 transition-all duration-300 z-50 flex flex-col
          ${isMobileOpen ? "translate-x-0" : "-translate-x-full"}
          ${isCollapsed ? "lg:w-[60px] lg:translate-x-0" : "lg:w-[220px] lg:translate-x-0"}
          w-[240px]`}
      >
        {/* Brand */}
        <div className={`flex items-center gap-3 h-16 border-b border-emerald-800 ${isCollapsed ? "justify-center px-2" : "px-4"}`}>
          <div className="w-8 h-8 rounded-xl bg-emerald-600 flex items-center justify-center shrink-0 shadow-sm shadow-emerald-950/20">
            <Compass size={16} className="text-white" />
          </div>
          {!isCollapsed && (
            <span className="text-base font-bold text-white tracking-tight">Travio Africa</span>
          )}
        </div>

        {/* Navigation */}
        <nav className="flex-1 py-4 overflow-y-auto overflow-x-hidden">
          <ul className={`space-y-0.5 ${isCollapsed ? "px-1.5" : "px-2"}`}>
            {navItems.map((item) => {
              const isActive = location.pathname === item.path || location.pathname.startsWith(item.path + "/");

              return (
                <li key={item.path}>
                  {item.disabled ? (
                    <button
                      onClick={() => toast.info("Coming soon")}
                      className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium w-full text-left text-emerald-300/40 cursor-default ${isCollapsed ? "justify-center" : ""}`}
                      title={isCollapsed ? item.label : undefined}
                    >
                      <span className="shrink-0 opacity-50">{item.icon}</span>
                      {!isCollapsed && <span className="whitespace-nowrap text-sm font-medium">{item.label}</span>}
                    </button>
                  ) : (
                    <NavLink
                      to={item.path}
                      onClick={closeMobile}
                      className={({ isActive: navActive }) =>
                        `flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-200 ${
                          isActive || navActive
                            ? "bg-emerald-600 text-white shadow-sm shadow-emerald-950/30"
                            : "text-emerald-200/70 hover:text-white hover:bg-emerald-800"
                        } ${isCollapsed ? "justify-center" : ""}`
                      }
                      title={isCollapsed ? item.label : undefined}
                    >
                      <span className="shrink-0">{item.icon}</span>
                      {!isCollapsed && <span className="whitespace-nowrap text-sm font-medium tracking-wide">{item.label}</span>}
                    </NavLink>
                  )}
                </li>
              );
            })}
          </ul>
        </nav>

        {/* Supplier Info */}
        <div className={`border-t border-emerald-800 p-3 ${isCollapsed ? "text-center" : ""}`}>
          <div className={`flex items-center gap-2.5 ${isCollapsed ? "justify-center" : ""}`}>
            {logoUrl ? (
              <div className="w-7 h-7 rounded-full overflow-hidden shrink-0 ring-1 ring-emerald-500">
                <img src={logoUrl} alt="" className="w-full h-full object-cover" />
              </div>
            ) : (
              <div className="w-7 h-7 rounded-full bg-emerald-600 flex items-center justify-center shrink-0">
                <span className="text-[11px] font-bold text-white">
                  {(businessName || user?.name || "S").charAt(0)}
                </span>
              </div>
            )}
            {!isCollapsed && (
              <div className="min-w-0 flex-1">
                <p className="text-xs font-semibold text-emerald-100 truncate leading-tight">
                  {businessName || user?.name || "Supplier"}
                </p>
                <div className="flex items-center gap-1 mt-0.5">
                  <span className="text-[9px] font-medium text-emerald-300">✓ Verified Supplier</span>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Collapse + Logout */}
        <div className="border-t border-emerald-800 p-2 flex items-center gap-1">
          <button onClick={toggle} className="flex-1 flex items-center justify-center p-1.5 text-emerald-300 hover:text-white hover:bg-emerald-800 rounded-lg transition-colors" title={isCollapsed ? "Expand" : "Collapse"}>
            {isCollapsed ? <ChevronRight size={14} /> : <ChevronLeft size={14} />}
          </button>
          <button onClick={handleLogout} className={`flex items-center p-1.5 text-emerald-300 hover:text-red-400 hover:bg-red-900/40 rounded-lg transition-colors ${isCollapsed ? "justify-center flex-1" : ""}`} title="Logout">
            <LogOut size={14} />
          </button>
        </div>
      </aside>
    </>
  );
}
