import { useState, useEffect, useRef } from "react";
import { NavLink, useLocation, useNavigate } from "react-router-dom";
import { useSidebarStore } from "@/stores/sidebarStore";
import { useAuthStore } from "@/stores/authStore";
import { toast } from "sonner";
import { loadSupplierProfile } from "@/features/auth/api";
import { LogOut, ChevronLeft, ChevronRight, Menu, X, LayoutDashboard, Package, Ticket, CalendarDays, Users, DollarSign, Star, Bell, BarChart3, BadgeCheck, Settings } from "lucide-react";
import { optimizeImage } from "@/lib/image";

const navItems = [
  { label: "Dashboard", path: "/", icon: <LayoutDashboard size={20} /> },
  { label: "Products", path: "/products", icon: <Package size={20} /> },
  { label: "Bookings", path: "/bookings", icon: <Ticket size={20} /> },
  { label: "Availability", path: "/availability", icon: <CalendarDays size={20} /> },
  { label: "Customers", path: "/chat", icon: <Users size={20} /> },
  { label: "Finance", path: "/finance", icon: <DollarSign size={20} /> },
  { label: "Reviews", path: "/reviews", icon: <Star size={20} /> },
  { label: "Notifications", path: "/notifications", icon: <Bell size={20} /> },
  { label: "Analytics", path: "/analytics", icon: <BarChart3 size={20} /> },
  { label: "Settings", path: "/settings", icon: <Settings size={20} /> },
];

function extractBusinessName(businessInfo) {
  if (!businessInfo) return null;
  if (typeof businessInfo === "string") {
    try { const p = JSON.parse(businessInfo); return p.businessName || p.legalBusinessName || null; } catch { return null; }
  }
  return businessInfo.businessName || businessInfo.legalBusinessName || null;
}

const SIDEBAR_STATUS_STYLES = {
  PENDING: { dot: "bg-amber-300", text: "text-white/70", label: "Pending" },
  UNDER_REVIEW: { dot: "bg-blue-300", text: "text-white/70", label: "Under Review" },
  APPROVED: { dot: "bg-blue-300", text: "text-white/70", label: "Approved" },
  ACTIVE: { dot: "bg-white", text: "text-white", label: "Verified" },
  SUSPENDED: { dot: "bg-red-300", text: "text-white/70", label: "Suspended" },
  REJECTED: { dot: "bg-red-300", text: "text-white/70", label: "Rejected" },
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
    if (isCollapsed) setShowLogoutConfirm(false);
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
          className={`relative flex items-center gap-6 w-full text-left text-white/30 cursor-default select-none ${isCollapsed ? "justify-center px-2 py-2.5" : "px-3 py-2.5"}`}
          title={isCollapsed ? item.label : undefined}
        >
          <span className="shrink-0 opacity-30">{item.icon}</span>
          {!isCollapsed && <span className="text-sm font-medium truncate">{item.label}</span>}
        </button>
      );
    }

    return (
      <NavLink
        to={item.path}
        onClick={closeMobile}
        className={({ isActive: navActive }) =>
          `relative flex items-center gap-6 w-full rounded-lg text-sm font-medium transition-all duration-200 group ${
            isActive || navActive
              ? "bg-white/15 text-white font-semibold"
              : "text-white/70 hover:bg-white/10 hover:text-white"
          } ${isCollapsed ? "justify-center px-2 py-2.5" : "px-3 py-2.5"}`
        }
        title={isCollapsed ? item.label : undefined}
      >
        {(isActive) && (
          <span className="absolute left-0 top-1/2 -translate-y-1/2 w-[5px] h-[34px] bg-white rounded-r-full" />
        )}
        <span className="shrink-0 relative">{item.icon}</span>
        {!isCollapsed && (
          <span className="truncate tracking-normal text-[15px]">{item.label}</span>
        )}
        {isCollapsed && (
          <div className="absolute left-full ml-2 top-1/2 -translate-y-1/2 px-2.5 py-1.5 bg-white text-[#333] text-xs font-medium rounded-lg shadow-lg border border-[#eaeaea] whitespace-nowrap opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 pointer-events-none z-[70]">
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
        className="fixed top-3 left-3 z-[60] p-2.5 rounded-xl bg-[#065f46] text-white shadow-lg lg:hidden hover:bg-[#047857] transition-colors"
        aria-label="Toggle menu"
      >
        {isMobileOpen ? <X size={18} /> : <Menu size={18} />}
      </button>

      <aside
        className={`fixed left-0 top-0 h-screen bg-[#065f46] border-r border-white/10 transition-all duration-300 z-50 flex flex-col
          ${isMobileOpen ? "translate-x-0" : "-translate-x-full"}
          ${isCollapsed ? "lg:w-[64px] lg:translate-x-0" : "lg:w-[270px] lg:translate-x-0"}
          w-[260px]`}
      >
        {/* Brand */}
        <div className={`flex items-center gap-3 h-[88px] flex-shrink-0 ${isCollapsed ? "justify-center px-2" : "px-6"}`}>
          {!isCollapsed && (
            <div className="min-w-0">
              <span className="text-xl font-bold text-white tracking-tight block leading-none">TravioAfrica</span>
              <span className="text-[11px] font-medium text-white/60 block mt-1">Dashboard</span>
            </div>
          )}
        </div>

        {/* Navigation */}
        <nav className="flex-1 overflow-y-auto overflow-x-hidden py-4 scrollbar-thin">
          <ul className={`space-y-[2px] ${isCollapsed ? "px-2" : "px-3"}`}>
            {navItems.map((item) => (
              <li key={item.path}>
                <NavItem item={item} isCollapsed={isCollapsed} closeMobile={closeMobile} />
              </li>
            ))}
          </ul>
        </nav>

        {/* Supplier Info */}
        <div className={`border-t border-white/10 flex-shrink-0 ${isCollapsed ? "py-3" : "py-3 px-4"}`}>
          <div className={`flex items-center gap-3 ${isCollapsed ? "justify-center" : ""}`}>
            <div className="relative shrink-0">
              {logoUrl ? (
                <div className="w-9 h-9 rounded-full overflow-hidden ring-2 ring-white/30 shadow-sm">
                  <img src={optimizeImage(logoUrl, 36)} alt="" className="w-full h-full object-cover" />
                </div>
              ) : (
                <div className="w-9 h-9 rounded-full bg-white/20 flex items-center justify-center ring-2 ring-white/30 shadow-sm">
                  <span className="text-sm font-bold text-white">
                    {(businessName || user?.name || "S").charAt(0).toUpperCase()}
                  </span>
                </div>
              )}
              <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-white rounded-full border-2 border-[#065f46]" />
            </div>
            {!isCollapsed && (
              <div className="min-w-0 flex-1">
                <p className="text-sm font-semibold text-white truncate leading-tight" title={businessName || user?.name}>
                  {businessName || user?.name || "Supplier"}
                </p>
                {statusStyle && (
                  <div className="flex items-center gap-1.5 mt-1.5">
                    {statusStyle.label === "Verified" ? (
                      <BadgeCheck size={12} className="text-white" />
                    ) : (
                      <span className={`w-1.5 h-1.5 rounded-full ${statusStyle.dot}`} />
                    )}
                    <span className={`text-[11px] font-medium ${statusStyle.text}`}>{statusStyle.label}</span>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Collapse + Logout */}
        <div className={`border-t border-white/10 flex items-center gap-0.5 flex-shrink-0 ${isCollapsed ? "p-1" : "p-2"}`}>
          <button
            onClick={toggle}
            className={`flex items-center justify-center text-white/50 hover:text-white hover:bg-white/10 rounded-lg transition-all duration-200 flex-1 ${isCollapsed ? "p-1" : "p-2"}`}
            title={isCollapsed ? "Expand sidebar" : "Collapse sidebar"}
          >
            {isCollapsed ? <ChevronRight size={15} /> : <ChevronLeft size={15} />}
          </button>
          <div className="relative" ref={logoutRef}>
            <button
              onClick={() => setShowLogoutConfirm(!showLogoutConfirm)}
              onBlur={() => setTimeout(() => setShowLogoutConfirm(false), 200)}
              className={`flex items-center justify-center text-white/50 hover:text-red-300 hover:bg-white/10 rounded-lg transition-all duration-200 flex-1 ${isCollapsed ? "p-1" : "p-2"}`}
              title="Sign out"
            >
              <LogOut size={15} />
            </button>
            {showLogoutConfirm && (
              <div className={`absolute bottom-full mb-2 bg-white rounded-xl shadow-xl shadow-black/10 p-3 min-w-[200px] z-[70] border border-[#eaeaea] ${isCollapsed ? "left-0" : "left-1/2 -translate-x-1/2"}`}>
                <p className="text-xs font-medium text-[#464255] mb-2.5 text-center whitespace-nowrap">Sign out of dashboard?</p>
                <div className="flex gap-1.5">
                  <button
                    onClick={() => setShowLogoutConfirm(false)}
                    className="flex-1 px-3 py-1.5 text-xs font-medium text-[#64748b] bg-[#f5f5f5] hover:bg-[#eaeaea] rounded-lg transition-colors"
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
