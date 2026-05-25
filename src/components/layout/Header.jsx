import { Search, Bell, ChevronDown, Building2, Shield, Clock, FileText } from "lucide-react";
import { useSidebarStore } from "@/stores/sidebarStore";
import { useAuthStore } from "@/stores/authStore";
import { useEffect, useRef, useState } from "react";
import api from "@/lib/axios";

const STATUS_STYLES = {
  PENDING: { bg: "bg-[#fef3c7]", text: "text-[#92400e]", label: "Pending" },
  UNDER_REVIEW: { bg: "bg-[#dbeafe]", text: "text-[#1e40af]", label: "Under Review" },
  APPROVED: { bg: "bg-[#dbeafe]", text: "text-[#1e40af]", label: "Approved" },
  ACTIVE: { bg: "bg-[#dcfce7]", text: "text-[#166534]", label: "Active" },
  SUSPENDED: { bg: "bg-[#fee2e2]", text: "text-[#991b1b]", label: "Suspended" },
  REJECTED: { bg: "bg-[#fee2e2]", text: "text-[#991b1b]", label: "Rejected" },
};

export default function Header() {
  const { isCollapsed } = useSidebarStore();
  const user = useAuthStore((state) => state.user);
  const isAdmin = user?.roles?.includes("admin");
  const isSupplier = user?.roles?.includes("supplier");

  const [suppliers, setSuppliers] = useState([]);
  const [suppliersLoading, setSuppliersLoading] = useState(false);
  const [suppliersOpen, setSuppliersOpen] = useState(false);
  const suppliersRef = useRef(null);

  const [supplierProfile, setSupplierProfile] = useState(null);
  const [profileLoading, setProfileLoading] = useState(false);

  useEffect(() => {
    if (!isAdmin) return;
    setSuppliersLoading(true);
    api
      .get("/suppliers/admin/active-suppliers")
      .then((res) => {
        setSuppliers(res.data?.data?.suppliers || []);
      })
      .catch(() => {
        setSuppliers([]);
      })
      .finally(() => setSuppliersLoading(false));
  }, [isAdmin]);

  useEffect(() => {
    if (!isSupplier) return;
    setProfileLoading(true);
    api
      .get("/suppliers/application/status")
      .then((res) => {
        setSupplierProfile(res.data?.data?.supplierProfile || null);
      })
      .catch(() => {
        setSupplierProfile(null);
      })
      .finally(() => setProfileLoading(false));
  }, [isSupplier]);

  useEffect(() => {
    function handleClickOutside(e) {
      if (suppliersRef.current && !suppliersRef.current.contains(e.target)) {
        setSuppliersOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const displayName = user?.name || "Admin User";
  const displayRole = isAdmin ? "Administrator" : user?.roles?.[0] || "User";
  const avatarLetter = displayName?.charAt(0)?.toUpperCase() || "A";

  const statusStyle = STATUS_STYLES[supplierProfile?.status] || STATUS_STYLES.PENDING;

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
          <div className="relative" ref={suppliersRef}>
            <button
              onClick={() => setSuppliersOpen((open) => !open)}
              className="flex items-center gap-2 px-3 py-2 text-sm font-medium text-[#1e293b] bg-[#f8fafc] border border-[#eaeaea] rounded-lg hover:bg-[#eef2f6] transition-colors"
            >
              <Building2 size={16} className="text-[#64748b]" />
              <span className="hidden sm:inline">
                {isAdmin ? "Suppliers" : "My Profile"}
              </span>
              <ChevronDown
                size={14}
                className={`text-[#9e9e9e] transition-transform ${suppliersOpen ? "rotate-180" : ""}`}
              />
            </button>
            {suppliersOpen && (
              <div className="absolute right-0 mt-2 w-72 bg-white rounded-xl border border-[#eaeaea] shadow-lg z-50 overflow-hidden">
                {isAdmin ? (
                  <>
                    <div className="px-4 py-3 border-b border-[#eaeaea]">
                      <p className="text-sm font-semibold text-[#1e293b]">Active Suppliers</p>
                      <p className="text-xs text-[#64748b]">Able to create tours</p>
                    </div>
                    <div className="max-h-64 overflow-y-auto">
                      {suppliersLoading ? (
                        <div className="px-4 py-6 text-center text-sm text-[#64748b]">Loading...</div>
                      ) : suppliers.length === 0 ? (
                        <div className="px-4 py-6 text-center text-sm text-[#64748b]">No active suppliers</div>
                      ) : (
                        suppliers.map((supplier) => (
                          <div
                            key={supplier.id}
                            className="flex items-center gap-3 px-4 py-3 hover:bg-[#f8fafc] transition-colors border-b border-[#eaeaea] last:border-0"
                          >
                            <div className="w-8 h-8 rounded-full bg-[#044b3b] flex items-center justify-center text-white text-xs font-medium flex-shrink-0">
                              {supplier.name?.charAt(0)?.toUpperCase() || "S"}
                            </div>
                            <div className="min-w-0">
                              <p className="text-sm font-medium text-[#1e293b] truncate">{supplier.name}</p>
                              <p className="text-xs text-[#64748b] truncate">{supplier.email}</p>
                            </div>
                          </div>
                        ))
                      )}
                    </div>
                  </>
                ) : (
                  <>
                    <div className="px-4 py-3 border-b border-[#eaeaea]">
                      <p className="text-sm font-semibold text-[#1e293b]">Supplier Profile</p>
                      <p className="text-xs text-[#64748b]">Your account status & details</p>
                    </div>
                    <div className="px-4 py-4 space-y-3">
                      {profileLoading ? (
                        <div className="text-center text-sm text-[#64748b]">Loading profile...</div>
                      ) : supplierProfile ? (
                        <>
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-full bg-[#044b3b] flex items-center justify-center text-white text-sm font-medium flex-shrink-0">
                              {displayName?.charAt(0)?.toUpperCase() || "S"}
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
                            <span>Applied {new Date(supplierProfile.createdAt).toLocaleDateString()}</span>
                          </div>
                          {supplierProfile.reviewedAt && (
                            <div className="flex items-center gap-2 text-xs text-[#64748b]">
                              <Clock size={14} />
                              <span>Reviewed {new Date(supplierProfile.reviewedAt).toLocaleDateString()}</span>
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
                  </>
                )}
              </div>
            )}
          </div>
        )}

        {/* Notifications */}
        <button className="relative p-2 text-[#6f6f6f] hover:text-[#1e293b] hover:bg-[#f8fafc] rounded-lg transition-colors">
          <Bell size={20} />
          <span className="absolute top-1 right-1 w-4 h-4 bg-[#dc3545] text-white text-[10px] font-bold rounded-full flex items-center justify-center">
            3
          </span>
        </button>

        {/* User Profile */}
        <div className="flex items-center gap-2 sm:gap-3 pl-2 sm:pl-4 border-l border-[#eaeaea]">
          <div className="text-right hidden sm:block">
            <p className="text-sm font-medium text-[#1e293b]">{displayName}</p>
            <p className="text-xs text-[#64748b] capitalize">{displayRole}</p>
          </div>
          <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-full bg-[#044b3b] flex items-center justify-center text-white font-medium text-sm cursor-pointer">
            {avatarLetter}
          </div>
          <ChevronDown size={14} className="text-[#9e9e9e] hidden sm:block" />
        </div>
      </div>
    </header>
  );
}
