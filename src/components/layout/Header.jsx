import { Search, Bell, ChevronDown, Building2 } from "lucide-react";
import { useSidebarStore } from "@/stores/sidebarStore";
import { useAuthStore } from "@/stores/authStore";
import { useEffect, useRef, useState } from "react";
import api from "@/lib/axios";

export default function Header() {
  const { isCollapsed } = useSidebarStore();
  const user = useAuthStore((state) => state.user);
  const isAdmin = user?.roles?.includes("admin");

  const [suppliers, setSuppliers] = useState([]);
  const [suppliersLoading, setSuppliersLoading] = useState(false);
  const [suppliersOpen, setSuppliersOpen] = useState(false);
  const suppliersRef = useRef(null);

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
        {/* Admin Suppliers Dropdown */}
        {isAdmin && (
          <div className="relative" ref={suppliersRef}>
            <button
              onClick={() => setSuppliersOpen((open) => !open)}
              className="flex items-center gap-2 px-3 py-2 text-sm font-medium text-[#1e293b] bg-[#f8fafc] border border-[#eaeaea] rounded-lg hover:bg-[#eef2f6] transition-colors"
            >
              <Building2 size={16} className="text-[#64748b]" />
              <span className="hidden sm:inline">Suppliers</span>
              <ChevronDown
                size={14}
                className={`text-[#9e9e9e] transition-transform ${suppliersOpen ? "rotate-180" : ""}`}
              />
            </button>
            {suppliersOpen && (
              <div className="absolute right-0 mt-2 w-64 bg-white rounded-xl border border-[#eaeaea] shadow-lg z-50 overflow-hidden">
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
