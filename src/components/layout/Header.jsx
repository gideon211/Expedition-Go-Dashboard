import { Search, ChevronDown, Building2, Shield, Clock, FileText, LogOut, User, Mail, Loader2 } from "lucide-react";
import NotificationBell from "@/features/notifications/components/NotificationBell";
import { useSidebarStore } from "@/stores/sidebarStore";
import { useAuthStore } from "@/stores/authStore";
import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { formatDate } from "@/lib/utils";

const STATUS_STYLES = {
  PENDING: { bg: "bg-amber-50", text: "text-amber-700", label: "Pending" },
  UNDER_REVIEW: { bg: "bg-blue-50", text: "text-blue-700", label: "Under Review" },
  APPROVED: { bg: "bg-blue-50", text: "text-blue-700", label: "Approved" },
  ACTIVE: { bg: "bg-emerald-50", text: "text-emerald-700", label: "Active" },
  SUSPENDED: { bg: "bg-red-50", text: "text-red-700", label: "Suspended" },
  REJECTED: { bg: "bg-red-50", text: "text-red-700", label: "Rejected" },
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
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const [logoutLoading, setLogoutLoading] = useState(false);
  const userMenuRef = useRef(null);

  useEffect(() => {
    function handleClickOutside(e) {
      if (profileRef.current && !profileRef.current.contains(e.target)) setProfileOpen(false);
      if (userMenuRef.current && !userMenuRef.current.contains(e.target) && !logoutLoading) setUserMenuOpen(false);
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
    await Promise.all([useAuthStore.getState().logout(), new Promise((resolve) => setTimeout(resolve, 4000))]);
    navigate("/login", { replace: true });
  };

  return (
    <header
      className={`fixed top-0 right-0 h-16 bg-white border-b border-emerald-100/60 flex items-center justify-between px-4 lg:px-6 z-40 transition-all duration-300 ${
        isCollapsed ? "lg:left-[60px]" : "lg:left-[220px]"
      } left-0`}
    >
      {/* Left spacer */}
      <div className="flex-1 min-w-0 ml-10 lg:ml-0" />

      {/* Right */}
      <div className="flex items-center gap-2 sm:gap-3">
        {(isAdmin || isSupplier) && (
          <div className="relative" ref={profileRef}>
            <button
              onClick={() => setProfileOpen((open) => !open)}
              className="flex items-center gap-2 px-2.5 py-1.5 text-xs font-medium text-emerald-700 bg-emerald-50 border border-emerald-200/60 rounded-lg hover:bg-emerald-100 transition-colors"
            >
              <Building2 size={13} className="text-slate-400" />
              <span className="hidden sm:inline">My Profile</span>
              <ChevronDown size={11} className={`text-slate-400 transition-transform ${profileOpen ? "rotate-180" : ""}`} />
            </button>
            {profileOpen && (
              <div className="absolute right-0 mt-2 w-72 bg-white rounded-xl border border-emerald-100/60 shadow-lg shadow-emerald-900/5 z-50 overflow-hidden">
                <div className="px-4 py-3 border-b border-slate-100">
                  <p className="text-sm font-semibold text-slate-800">Supplier Profile</p>
                  <p className="text-xs text-slate-500">Your account status and details</p>
                </div>
                <div className="px-4 py-4 space-y-3">
                  {supplierProfile ? (
                    <>
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full overflow-hidden bg-[#044b3b] shrink-0">
                          {user?.photoURL ? (
                            <img src={user.photoURL} alt="" className="w-full h-full object-cover" />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center text-white text-sm font-medium">{avatarLetter}</div>
                          )}
                        </div>
                        <div className="min-w-0">
                          <p className="text-sm font-medium text-slate-800 truncate">{displayName}</p>
                          <p className="text-xs text-slate-500 truncate">{user?.email}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Shield size={13} className="text-slate-400" />
                        <span className={`text-[11px] font-medium px-2 py-0.5 rounded-full ${statusStyle.bg} ${statusStyle.text}`}>{statusStyle.label}</span>
                      </div>
                      {supplierProfile.adminNotes && (
                        <div className="flex items-start gap-2">
                          <FileText size={13} className="text-slate-400 mt-0.5 shrink-0" />
                          <p className="text-xs text-slate-500">{supplierProfile.adminNotes}</p>
                        </div>
                      )}
                      <div className="flex items-center gap-2 text-xs text-slate-500">
                        <Clock size={13} /> Applied {formatDate(supplierProfile.createdAt)}
                      </div>
                      {supplierProfile.reviewedAt && (
                        <div className="flex items-center gap-2 text-xs text-slate-500">
                          <Clock size={13} /> Reviewed {formatDate(supplierProfile.reviewedAt)}
                        </div>
                      )}
                    </>
                  ) : (
                    <div className="text-center text-sm text-slate-500">No supplier profile found.<p className="text-xs mt-1">Apply to become a supplier to see your status here.</p></div>
                  )}
                </div>
              </div>
            )}
          </div>
        )}

        <NotificationBell />

        <div className="relative" ref={userMenuRef}>
          <button
            onClick={() => setUserMenuOpen((open) => !open)}
            className="flex items-center gap-2 sm:gap-3 pl-2 sm:pl-3 border-l border-emerald-100/60 hover:bg-emerald-50 rounded-lg py-1 pr-2 transition-colors"
          >
            <div className="text-right hidden sm:block">
              <p className="text-xs font-medium text-slate-700">{displayName}</p>
              <p className="text-[10px] text-slate-400 capitalize">{displayRole}</p>
            </div>
            <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-full overflow-hidden bg-[#044b3b] shrink-0">
              {user?.photoURL ? (
                <img src={user.photoURL} alt="" className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-white font-medium text-[11px]">{avatarLetter}</div>
              )}
            </div>
            <ChevronDown size={11} className={`text-slate-400 hidden sm:block transition-transform ${userMenuOpen ? "rotate-180" : ""}`} />
          </button>
          {userMenuOpen && (
            <div className="absolute right-0 mt-2 w-64 bg-white rounded-xl border border-emerald-100/60 shadow-lg shadow-emerald-900/5 z-50 overflow-hidden">
              <div className="px-4 py-4 border-b border-slate-100">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full overflow-hidden bg-[#044b3b] shrink-0">
                    {user?.photoURL ? (
                      <img src={user.photoURL} alt="" className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-white text-sm font-medium">{avatarLetter}</div>
                    )}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-semibold text-slate-800 truncate">{displayName}</p>
                    <p className="text-xs text-slate-500 truncate capitalize">{displayRole}</p>
                  </div>
                </div>
              </div>
              <div className="py-1">
                <button onClick={() => { setUserMenuOpen(false); navigate("/settings"); }}
                  className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-slate-700 hover:bg-slate-50 transition-colors"
                >
                  <User size={15} className="text-slate-400" /> Profile Settings
                </button>
                {user?.email && (
                  <div className="flex items-center gap-3 px-4 py-2.5 text-sm text-slate-500">
                    <Mail size={15} /> <span className="truncate">{user.email}</span>
                  </div>
                )}
              </div>
              <div className="border-t border-slate-100 py-1">
                <button onClick={handleLogout} disabled={logoutLoading}
                  className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-red-600 hover:bg-red-50 transition-colors disabled:opacity-70"
                >
                  {logoutLoading ? <Loader2 size={15} className="animate-spin" /> : <LogOut size={15} />}
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
