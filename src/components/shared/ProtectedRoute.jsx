import { useEffect, useState } from "react";
import { Navigate, Outlet, useLocation } from "react-router-dom";
import { useAuthStore, isAdminUser, canAccessSupplierDashboard } from "@/stores/authStore";
import { Loader2 } from "lucide-react";
import api from "@/lib/axios";

export default function ProtectedRoute({ requireAdmin = false }) {
  const { isAuthenticated, isLoading, supplierProfile, setSupplierProfile } = useAuthStore();
  const location = useLocation();
  const [profileChecked, setProfileChecked] = useState(Boolean(supplierProfile));
  const isAdmin = isAdminUser();

  useEffect(() => {
    if (!isAuthenticated || isAdmin || supplierProfile) {
      setProfileChecked(true);
      return;
    }

    let cancelled = false;
    setProfileChecked(false);

    api
      .get("/suppliers/application/status")
      .then((res) => {
        if (!cancelled) {
          setSupplierProfile(res.data?.data?.supplierProfile || null);
        }
      })
      .catch(() => {
        if (!cancelled) {
          setSupplierProfile(null);
        }
      })
      .finally(() => {
        if (!cancelled) {
          setProfileChecked(true);
        }
      });

    return () => {
      cancelled = true;
    };
  }, [isAuthenticated, isAdmin, supplierProfile, setSupplierProfile]);

  if (isLoading || (isAuthenticated && !profileChecked)) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#f8fafc]">
        <div className="flex flex-col items-center gap-3">
          <Loader2 size={32} className="animate-spin text-[#044b3b]" />
          <p className="text-sm text-[#64748b]">Verifying session...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  if (requireAdmin && !isAdmin) {
    return <Navigate to="/" replace />;
  }

  if (!isAdmin && !canAccessSupplierDashboard(supplierProfile)) {
    return <Navigate to="/supplier/status" replace />;
  }

  return <Outlet />;
}
