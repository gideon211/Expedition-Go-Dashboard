import { Search, ChevronDown, Building2, Shield, Clock, FileText, LogOut, User, Mail, Loader2 } from "lucide-react";
import NotificationBell from "@/features/notifications/components/NotificationBell";
import { useSidebarStore } from "@/stores/sidebarStore";
import { useAuthStore } from "@/stores/authStore";
import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { formatDate } from "@/lib/utils";

const STATUS_STYLES = {
  PENDING: { bg: "bg-[#fef3c7]", text: "text-[#92400e]", label: "Pending" },
  UNDER_REVIEW: { bg: "bg-[#dbeafe]", text: "text-[#1e40af]", label: "Under Review" },
  APPROVED: { bg: "bg-[#dbeafe]", text: "text-[#1e40af]", label: "Approved" },
  ACTIVE: { bg: "bg-[#dcfce7]", text: "text-[#166534]", label: "Active" },
  SUSPENDED: { bg: "bg-[#fee2e2]", text: "text-[#991b1b]", label: "Suspended" },
  REJECTED: { bg: "bg-[#fee2e2]", text: "text-[#991b1b]", label: "Rejected" },
};

export default function Header() {
  const navigate = useNavigate();
  const { isCollapsed } = useSidebarStore();
  const user = useAuthStore((state) => state.user);
  const supplierProfile = useAuthStore((state) => state.supplierProfile);
  const isAdmin = user?.roles?.includes("admin");
  const isSupplier = user?.roles?.includes("supplier");

  const [profileOpen, setProfileOpen] = useState(false);
  const profileRef = useRef(null);

  // User dropdown state
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const [logoutLoading, setLogoutLoading] = useState(false);
  const userMenuRef = useRef(null);

  // Click outside handlers
  useEffect(() => {
    function handleClickOutside(e) {
      if (profileRef.current && !profileRef.current.contains(e.target)) {
        setProfileOpen(false);
      }
      if (userMenuRef.current && !userMenuRef.current.contains(e.target)) {
        if (!logoutLoading) {
          setUserMenuOpen(false);
        }
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [logoutLoading]);

  const displayName = user?.name || "Admin User";
  const displayRole = isAdmin ? "Administrator" : user?.roles?.[0] || "User";
  const avatarLetter = displayName?.charAt(0)?.toUpperCase() || "A";

  const statusStyle = STATUS_STYLES[supplierProfile?.status] || STATUS_STYLES.PENDING;

  const handleLogout = async () => {
    if (logoutLoading) return;

    setLogoutLoading(true);

    await Promise.all([
      useAuthStore.getState().logout(),
      new Promise((resolve) => setTimeout(resolve, 4000)),
    ]);

    navigate("/login", { replace: true });
  };

  return (
    <header
      className={`fixed top-0 right-0 h-16 bg-white border-b border-[#eaeaea] flex items-center justify-between px-4 lg:px-6 z-40 transition-all duration-300 ${
        isCollapsed ? "lg:left-[70px]" : "lg:left-[260px]"
      } left-0`}
    >
      {/* Left: Search */}
      <div className="flex items-center gap-4 flex-1 min-w-0 ml-10 lg:ml-0">
        <div className="relative w-full max-w-xs sm:max-w-sm md:max-w-md">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#9e9e9e]" />
          <input
            type="text"
            placeholder="Search..."
            className="w-full pl-9 pr-4 py-2 bg-[#f8fafc] border border-[#eaeaea] rounded-lg text-sm text-[#1e293b] placeholder:text-[#9e9e9e] focus:outline-none focus:ring-2 focus:ring-[#044b3b]/20 focus:border-[#044b3b]"
          />
        </div>
      </div>

      {/* Right: Actions */}
      <div className="flex items-center gap-2 sm:gap-4">
        {/* Suppliers Dropdown — Admin sees all, Supplier sees own profile */}
        {(isAdmin || isSupplier) && (
          <div className="relative" ref={profileRef}>
            <button
              onClick={() => setProfileOpen((open) => !open)}
              className="flex items-center gap-2 px-3 py-2 text-sm font-medium text-[#1e293b] bg-[#f8fafc] border border-[#eaeaea] rounded-lg hover:bg-[#eef2f6] transition-colors"
            >
              <Building2 size={16} className="text-[#64748b]" />
              <span className="hidden sm:inline">My Profile</span>
              <ChevronDown
                size={14}
                className={`text-[#9e9e9e] transition-transform ${profileOpen ? "rotate-180" : ""}`}
              />
            </button>
            {profileOpen && (
              <div className="absolute right-0 mt-2 w-72 bg-white rounded-xl border border-[#eaeaea] shadow-lg z-50 overflow-hidden">
                <div className="px-4 py-3 border-b border-[#eaeaea]">
                  <p className="text-sm font-semibold text-[#1e293b]">Supplier Profile</p>
                  <p className="text-xs text-[#64748b]">Your account status and details</p>
                </div>
                <div className="px-4 py-4 space-y-3">
                  {supplierProfile ? (
                    <>
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full overflow-hidden bg-[#044b3b] flex-shrink-0">
                          {user?.photoURL ? (
                            <img src={user.photoURL} alt="" className="w-full h-full object-cover" />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center text-white text-sm font-medium">
                              {avatarLetter}
                            </div>
                          )}
                        </div>
                        <div className="min-w-0">
                          <p className="text-sm font-medium text-[#1e293b] truncate">{displayName}</p>
                          <p className="text-xs text-[#64748b] truncate">{user?.email}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Shield size={14} className="text-[#64748b]" />
                        <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${statusStyle.bg} ${statusStyle.text}`}>
                          {statusStyle.label}
                        </span>
                      </div>
                      {supplierProfile.adminNotes && (
                        <div className="flex items-start gap-2">
                          <FileText size={14} className="text-[#64748b] mt-0.5 flex-shrink-0" />
                          <p className="text-xs text-[#64748b]">{supplierProfile.adminNotes}</p>
                        </div>
                      )}
                      <div className="flex items-center gap-2 text-xs text-[#64748b]">
                        <Clock size={14} />
                        <span>Applied {formatDate(supplierProfile.createdAt)}</span>
                      </div>
                      {supplierProfile.reviewedAt && (
                        <div className="flex items-center gap-2 text-xs text-[#64748b]">
                          <Clock size={14} />
                          <span>Reviewed {formatDate(supplierProfile.reviewedAt)}</span>
                        </div>
                      )}
                    </>
                  ) : (
                    <div className="text-center text-sm text-[#64748b]">
                      No supplier profile found.
                      <p className="text-xs mt-1">Apply to become a supplier to see your status here.</p>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        )}

        <NotificationBell />

        {/* User Profile Dropdown */}
        <div className="relative" ref={userMenuRef}>
          <button
            onClick={() => setUserMenuOpen((open) => !open)}
            className="flex items-center gap-2 sm:gap-3 pl-2 sm:pl-4 border-l border-[#eaeaea] hover:bg-[#f8fafc] rounded-lg py-1.5 pr-2 transition-colors"
          >
            <div className="text-right hidden sm:block">
              <p className="text-sm font-medium text-[#1e293b]">{displayName}</p>
              <p className="text-xs text-[#64748b] capitalize">{displayRole}</p>
            </div>
            <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-full overflow-hidden bg-[#044b3b] flex-shrink-0">
              {user?.photoURL ? (
                <img src={user.photoURL} alt="" className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-white font-medium text-sm">
                  {avatarLetter}
                </div>
              )}
            </div>
            <ChevronDown
              size={14}
              className={`text-[#9e9e9e] hidden sm:block transition-transform ${userMenuOpen ? "rotate-180" : ""}`}
            />
          </button>
          {userMenuOpen && (
            <div className="absolute right-0 mt-2 w-64 bg-white rounded-xl border border-[#eaeaea] shadow-lg z-50 overflow-hidden">
              {/* Profile Info */}
              <div className="px-4 py-4 border-b border-[#eaeaea]">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full overflow-hidden bg-[#044b3b] flex-shrink-0">
                    {user?.photoURL ? (
                      <img src={user.photoURL} alt="" className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-white text-sm font-medium">
                        {avatarLetter}
                      </div>
                    )}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-semibold text-[#1e293b] truncate">{displayName}</p>
                    <p className="text-xs text-[#64748b] truncate capitalize">{displayRole}</p>
                  </div>
                </div>
              </div>

              {/* Menu Items */}
              <div className="py-1">
                <button
                  onClick={() => { setUserMenuOpen(false); navigate("/settings"); }}
                  className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-[#1e293b] hover:bg-[#f8fafc] transition-colors"
                >
                  <User size={16} className="text-[#64748b]" />
                  Profile Settings
                </button>
                {user?.email && (
                  <div className="flex items-center gap-3 px-4 py-2.5 text-sm text-[#64748b]">
                    <Mail size={16} />
                    <span className="truncate">{user.email}</span>
                  </div>
                )}
              </div>

              {/* Logout */}
              <div className="border-t border-[#eaeaea] py-1">
                <button
                  onClick={handleLogout}
                  disabled={logoutLoading}
                  className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-[#dc2626] hover:bg-[#fef2f2] transition-colors disabled:opacity-70 disabled:cursor-not-allowed"
                >
                  {logoutLoading ? (
                    <Loader2 size={16} className="animate-spin" />
                  ) : (
                    <LogOut size={16} />
                  )}
                  {logoutLoading ? "Signing out..." : "Sign Out"}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}