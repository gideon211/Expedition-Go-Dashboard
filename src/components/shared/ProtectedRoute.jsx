import { Navigate, useLocation } from "react-router-dom";
import { useAuthStore, isSupplierUser, isAdminUser } from "@/stores/authStore";
import { Loader2 } from "lucide-react";

export default function ProtectedRoute({ children, requireAdmin = false }) {
  const { isAuthenticated, isLoading, supplierProfile } = useAuthStore();
  const location = useLocation();

  if (isLoading) {
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

  const isSupplier = isSupplierUser();
  const isAdmin = isAdminUser();

  // Admin-only pages (e.g., User Management)
  if (requireAdmin && !isAdmin) {
    return <Navigate to="/" replace />;
  }

  // Supplier dashboard pages require verified supplier or admin
  if (!isSupplier && !isAdmin) {
    return <Navigate to="/supplier/status" replace />;
  }

  // Supplier exists but not yet verified/active
  if (isSupplier && !isAdmin) {
    if (!supplierProfile) {
      return <Navigate to="/supplier/status" replace />;
    }
    const activeStatuses = ["ACTIVE", "APPROVED"];
    if (!activeStatuses.includes(supplierProfile.status)) {
      return <Navigate to="/supplier/status" replace />;
    }
  }

  return children;
}