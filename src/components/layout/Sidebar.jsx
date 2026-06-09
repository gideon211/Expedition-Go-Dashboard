import { useState, useEffect, useRef } from "react";
import { NavLink, useLocation, useNavigate } from "react-router-dom";
import { useSidebarStore } from "@/stores/sidebarStore";
import { useAuthStore } from "@/stores/authStore";
import { toast } from "sonner";
import { loadSupplierProfile } from "@/features/auth/api";
import { Compass, LogOut, ChevronLeft, ChevronRight, Menu, X, LayoutDashboard, Package, Ticket, CalendarDays, Users, DollarSign, Star, Bell, BarChart3, BadgeCheck } from "lucide-react";

const navGroups = [
  {
    label: "Main",
    items: [
      { label: "Dashboard", path: "/", icon: <LayoutDashboard size={18} /> },
      { label: "Products", path: "/products", icon: <Package size={18} /> },
      { label: "Bookings", path: "/bookings", icon: <Ticket size={18} /> },
      { label: "Availability", path: "/availability", icon: <CalendarDays size={18} /> },
    ],
  },
  {
    label: "Management",
    items: [
      { label: "Customers", path: "/chat", icon: <Users size={18} /> },
      { label: "Finance", path: "/finance", icon: <DollarSign size={18} /> },
      { label: "Reviews", path: "/reviews", icon: <Star size={18} /> },
    ],
  },
  {
    label: "System",
    items: [
      { label: "Notifications", path: "/notifications", icon: <Bell size={18} /> },
      { label: "Analytics", path: "/analytics", icon: <BarChart3 size={18} /> },
    ],
  },
];

function extractBusinessName(businessInfo) {
  if (!businessInfo) return null;
  if (typeof businessInfo === "string") {
    try { const p = JSON.parse(businessInfo); return p.businessName || p.legalBusinessName || null; } catch { return null; }
  }
  return businessInfo.businessName || businessInfo.legalBusinessName || null;
}

const SIDEBAR_STATUS_STYLES = {
  PENDING: { dot: "bg-amber-400", text: "text-amber-300/80", label: "Pending" },
  UNDER_REVIEW: { dot: "bg-blue-400", text: "text-blue-300/80", label: "Under Review" },
  APPROVED: { dot: "bg-blue-400", text: "text-blue-300/80", label: "Approved" },
  ACTIVE: { dot: "bg-emerald-400", text: "text-emerald-300/80", label: "Verified" },
  SUSPENDED: { dot: "bg-red-400", text: "text-red-300/80", label: "Suspended" },
  REJECTED: { dot: "bg-red-400", text: "text-red-300/80", label: "Rejected" },
};

export default function Sidebar() {
  const { isCollapsed, toggle, isMobileOpen, closeMobile } = useSidebarStore();
  const user = useAuthStore((state) => state.user);
  const supplierProfile = useAuthStore((state) => state.supplierProfile);
  const location = useLocation();
  const navigate = useNavigate();
  const logoUrl = user?.logoUrl;
  const [businessName, setBusinessName] = useState(null);
  const logoutRef = useRef(null);
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);

  useEffect(() => {
    if (!user?.roles?.includes("supplier")) return;
    loadSupplierProfile().then((profile) => {
      if (!profile) return;
      const name = extractBusinessName(profile.businessInfo);
      if (name) setBusinessName(name);
    });
  }, [user?.roles]);

  useEffect(() => {
    if (isCollapsed) setShowLogoutConfirm(false); // eslint-disable-line react-hooks/set-state-in-effect
  }, [isCollapsed]);

  const statusStyle = SIDEBAR_STATUS_STYLES[supplierProfile?.status] || null;

  const handleLogout = async () => {
    await useAuthStore.getState().logout();
    navigate("/login", { replace: true });
  };

  function NavItem({ item, isCollapsed, closeMobile }) {
    const isActive = location.pathname === item.path || location.pathname.startsWith(item.path + "/");

    if (item.disabled) {
      return (
        <button
          onClick={() => toast.info("Coming soon")}
          className={`relative flex items-center gap-3 w-full text-left text-emerald-300/40 cursor-default select-none ${isCollapsed ? "justify-center px-2 py-2.5" : "px-3 py-2.5"}`}
          title={isCollapsed ? item.label : undefined}
        >
          <span className="shrink-0 opacity-40">{item.icon}</span>
          {!isCollapsed && <span className="text-sm font-medium truncate">{item.label}</span>}
        </button>
      );
    }

    return (
      <NavLink
        to={item.path}
        onClick={closeMobile}
        className={({ isActive: navActive }) =>
          `relative flex items-center gap-3 rounded-lg text-sm font-medium transition-all duration-200 group ${
            isActive || navActive
              ? "bg-emerald-700/60 text-white shadow-sm shadow-black/10"
              : "text-emerald-200/60 hover:text-white hover:bg-emerald-800/60"
          } ${isCollapsed ? "justify-center px-2 py-2.5" : "px-3 py-2.5"}`
        }
        title={isCollapsed ? item.label : undefined}
      >
        {/* Active left bar */}
        {(isActive) && (
          <span className="absolute left-0 top-1/2 -translate-y-1/2 w-0.5 h-5 bg-gradient-to-b from-emerald-400 to-emerald-300 rounded-r-full" />
        )}
        <span className="shrink-0 relative">{item.icon}</span>
        {!isCollapsed && (
          <span className="truncate tracking-wide">{item.label}</span>
        )}
        {isCollapsed && (
          <div className="absolute left-full ml-2 top-1/2 -translate-y-1/2 px-2.5 py-1.5 bg-emerald-800 text-white text-xs font-medium rounded-lg shadow-lg shadow-black/20 whitespace-nowrap opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 pointer-events-none z-[70]">
            {item.label}
          </div>
        )}
      </NavLink>
    );
  }

  return (
    <>
      <button
        onClick={() => useSidebarStore.getState().toggleMobile()}
        className="fixed top-3 left-3 z-[60] p-2.5 rounded-xl bg-emerald-900 text-white shadow-lg shadow-emerald-950/30 lg:hidden hover:bg-emerald-800 transition-colors"
        aria-label="Toggle menu"
      >
        {isMobileOpen ? <X size={18} /> : <Menu size={18} />}
      </button>

      <aside
        className={`fixed left-0 top-0 h-screen bg-gradient-to-b from-emerald-900 via-emerald-900 to-emerald-950 border-r border-emerald-800/60 transition-all duration-300 z-50 flex flex-col
          ${isMobileOpen ? "translate-x-0" : "-translate-x-full"}
          ${isCollapsed ? "lg:w-[64px] lg:translate-x-0" : "lg:w-[270px] lg:translate-x-0"}
          w-[260px]`}
      >
        {/* Brand */}
        <div className={`flex items-center gap-3.5 h-[76px] border-b border-emerald-800/40 flex-shrink-0 ${isCollapsed ? "justify-center px-2" : "px-5"}`}>
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-400 to-emerald-600 flex items-center justify-center shrink-0 shadow-lg shadow-emerald-950/40">
            <Compass size={19} className="text-white" />
          </div>
          {!isCollapsed && (
            <div className="min-w-0 py-0.5">
              <span className="text-[17px] font-bold text-white tracking-normal block leading-none" style={{ fontFamily: "'DM Sans', system-ui, sans-serif", letterSpacing: "-0.02em" }}>TravioAfrica</span>
              <span className="text-[10px] font-medium text-emerald-400/50 block mt-1.5">Dashboard</span>
            </div>
          )}
        </div>

        {/* Navigation */}
        <nav className="flex-1 overflow-y-auto overflow-x-hidden py-3 scrollbar-thin">
          {navGroups.map((group) => (
            <div key={group.label} className="mb-4 last:mb-0">
              {!isCollapsed && (
                <div className="px-5 mb-1.5">
                  <span className="text-[9px] font-semibold text-emerald-400/40 uppercase tracking-[0.15em]">{group.label}</span>
                </div>
              )}
              <ul className={`space-y-0.5 ${isCollapsed ? "px-2" : "px-2.5"}`}>
                {group.items.map((item) => (
                  <li key={item.path}>
                    <NavItem item={item} isCollapsed={isCollapsed} closeMobile={closeMobile} />
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </nav>

        {/* Supplier Info */}
        <div className={`border-t border-emerald-800/50 flex-shrink-0 ${isCollapsed ? "py-3" : "py-3 px-3.5"}`}>
          <div className={`flex items-center gap-3 ${isCollapsed ? "justify-center" : ""}`}>
            <div className="relative shrink-0">
              {logoUrl ? (
                <div className="w-9 h-9 rounded-full overflow-hidden ring-2 ring-emerald-700/60 shadow-sm shadow-black/20">
                  <img src={logoUrl} alt="" className="w-full h-full object-cover" />
                </div>
              ) : (
                <div className="w-9 h-9 rounded-full bg-gradient-to-br from-emerald-500 to-emerald-700 flex items-center justify-center ring-2 ring-emerald-700/60 shadow-sm shadow-black/20">
                  <span className="text-sm font-bold text-white">
                    {(businessName || user?.name || "S").charAt(0).toUpperCase()}
                  </span>
                </div>
              )}
              <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-emerald-500 rounded-full border-2 border-emerald-900" />
            </div>
            {!isCollapsed && (
              <div className="min-w-0 flex-1">
                <p className="text-sm font-semibold text-slate-100 truncate leading-tight" title={businessName || user?.name}>
                  {businessName || user?.name || "Supplier"}
                </p>
                {statusStyle && (
                  <div className="flex items-center gap-1.5 mt-2">
                    {statusStyle.label === "Verified" ? (
                      <BadgeCheck size={13} className="text-emerald-400" />
                    ) : (
                      <span className={`w-1.5 h-1.5 rounded-full ${statusStyle.dot}`} />
                    )}
                    <span className={`text-xs font-medium ${statusStyle.text}`}>{statusStyle.label}</span>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Collapse + Logout */}
        <div className="border-t border-emerald-800/50 p-2 flex items-center gap-0.5 flex-shrink-0">
          <button
            onClick={toggle}
            className="flex-1 flex items-center justify-center p-2 text-emerald-400/50 hover:text-emerald-300 hover:bg-emerald-800/50 rounded-lg transition-all duration-200"
            title={isCollapsed ? "Expand sidebar" : "Collapse sidebar"}
          >
            {isCollapsed ? <ChevronRight size={15} /> : <ChevronLeft size={15} />}
          </button>
          <div className="relative" ref={logoutRef}>
            <button
              onClick={() => setShowLogoutConfirm(!showLogoutConfirm)}
              onBlur={() => setTimeout(() => setShowLogoutConfirm(false), 200)}
              className="flex-1 flex items-center justify-center p-2 text-emerald-400/50 hover:text-red-400 hover:bg-red-900/30 rounded-lg transition-all duration-200"
              title="Sign out"
            >
              <LogOut size={15} />
            </button>
            {showLogoutConfirm && (
              <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 bg-white rounded-xl shadow-xl shadow-black/20 p-3 min-w-[160px] z-[70] border border-slate-100">
                <p className="text-xs font-medium text-slate-700 mb-2.5 text-center whitespace-nowrap">Sign out of dashboard?</p>
                <div className="flex gap-1.5">
                  <button
                    onClick={() => setShowLogoutConfirm(false)}
                    className="flex-1 px-3 py-1.5 text-xs font-medium text-slate-500 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleLogout}
                    className="flex-1 px-3 py-1.5 text-xs font-medium text-white bg-red-500 hover:bg-red-600 rounded-lg transition-colors"
                  >
                    Sign out
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </aside>
    </>
  );
}
