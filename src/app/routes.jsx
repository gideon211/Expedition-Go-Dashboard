import { Routes, Route } from "react-router-dom";
import AppShell from "@/components/layout/AppShell";
import ProtectedRoute from "@/components/shared/ProtectedRoute";

// Pages
import DashboardPage from "@/features/dashboard/pages/DashboardPage";
import BookingsPage from "@/features/bookings/pages/BookingsPage";
import ProductsListPage from "@/features/products/pages/ProductsListPage";
import ProductDetailPage from "@/features/products/pages/ProductDetailPage";
import ProductBuilderPage from "@/features/products/pages/ProductBuilderPage";
import AvailabilityPage from "@/features/availability/pages/AvailabilityPage";
import PerformancePage from "@/features/performance/pages/PerformancePage";
import ReviewsPage from "@/features/reviews/pages/ReviewsPage";
import FinancePage from "@/features/finance/pages/FinancePage";
import NotificationsPage from "@/features/notifications/pages/NotificationsPage";
import UsersPage from "@/features/users/pages/UsersPage";
import SettingsPage from "@/features/settings/pages/SettingsPage";

import GuestRoute from "@/components/shared/GuestRoute";

// Auth Pages (rendered outside AppShell)
import AuthCallback from "@/features/auth/pages/AuthCallback";
import LoginPage from "@/features/auth/pages/LoginPage";

// Supplier Pages (rendered outside AppShell)
import SupplierStatusPage from "@/features/supplier/pages/SupplierStatusPage";

// Error Pages
import NotFoundPage from "@/pages/errors/NotFoundPage";
import ServerErrorPage from "@/pages/errors/ServerErrorPage";
import ForbiddenPage from "@/pages/errors/ForbiddenPage";
import NetworkErrorPage from "@/pages/errors/NetworkErrorPage";

export default function AppRoutes() {
  return (
    <Routes>
      {/* Auth Pages (without AppShell) */}
      <Route path="/auth/callback" element={<AuthCallback />} />
      <Route
        path="/login"
        element={
          <GuestRoute>
            <LoginPage />
          </GuestRoute>
        }
      />

      {/* Supplier Status (without AppShell — full-screen status check) */}
      <Route path="/supplier/status" element={<SupplierStatusPage />} />

      {/* Error Pages (without AppShell) */}
      <Route path="/error/404" element={<NotFoundPage />} />
      <Route path="/error/500" element={<ServerErrorPage />} />
      <Route path="/error/403" element={<ForbiddenPage />} />
      <Route path="/error/network" element={<NetworkErrorPage />} />

      {/* Protected layout — checks auth & supplier status */}
      <Route element={<ProtectedRoute />}>
        {/* Main App Layout (with AppShell) */}
        <Route element={<AppShell />}>
          <Route path="/" element={<DashboardPage />} />
          <Route path="/bookings" element={<BookingsPage />} />
          <Route path="/products" element={<ProductsListPage />} />
          <Route path="/products/:id" element={<ProductDetailPage />} />
          <Route path="/products/build/:id?/:step?" element={<ProductBuilderPage />} />
          <Route path="/availability" element={<AvailabilityPage />} />
          <Route path="/performance" element={<PerformancePage />} />
          <Route path="/reviews" element={<ReviewsPage />} />
          <Route path="/finance" element={<FinancePage />} />
          <Route path="/notifications" element={<NotificationsPage />} />
          <Route path="/users" element={<UsersPage />} />
          <Route path="/settings" element={<SettingsPage />} />

          {/* Catch-all route for 404 */}
          <Route path="*" element={<NotFoundPage />} />
        </Route>
      </Route>
    </Routes>
  );
}
