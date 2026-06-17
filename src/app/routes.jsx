import { Routes, Route, Navigate } from "react-router-dom";
import AppShell from "@/components/layout/AppShell";
import ProtectedRoute from "@/components/shared/ProtectedRoute";

// Pages
import DashboardPage from "@/features/dashboard/pages/DashboardPage";
import BookingsPage from "@/features/bookings/pages/BookingsPage";
import AvailabilityPage from "@/features/availability/pages/AvailabilityPage";
import ProductsListPage from "@/features/products/pages/ProductsListPage";
import ProductDetailPage from "@/features/products/pages/ProductDetailPage";
import ProductBuilderPage from "@/features/products/pages/ProductBuilderPage";
import ReviewsPage from "@/features/reviews/pages/ReviewsPage";
import FinancePage from "@/features/finance/pages/FinancePage";
import NotificationsPage from "@/features/notifications/pages/NotificationsPage";
import SettingsPage from "@/features/settings/pages/SettingsPage";
import ChatPage from "@/features/chat/pages/ChatPage";
import AnalyticsPage from "@/features/analytics/pages/AnalyticsPage";
import CancellationRatePage from "@/features/cancellation/pages/CancellationRatePage";

import GuestRoute from "@/components/shared/GuestRoute";

// Auth Pages (rendered outside AppShell)
import AuthCallback from "@/features/auth/pages/AuthCallback";
import LoginPage from "@/features/auth/pages/LoginPage";

// Supplier Pages (rendered outside AppShell)
import SupplierStatusPage from "@/features/supplier/pages/SupplierStatusPage";

// Team Invite (auth-only, no supplier check)
import TeamInvitePage from "@/pages/TeamInvitePage";
import AuthOnlyRoute from "@/components/shared/AuthOnlyRoute";

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

      {/* Auth-only routes (no supplier status check) */}
      <Route element={<AuthOnlyRoute />}>
        <Route path="/team/invite" element={<TeamInvitePage />} />
      </Route>

      {/* Protected layout — checks auth & supplier status */}
      <Route element={<ProtectedRoute />}>
        {/* Main App Layout (with AppShell) */}
        <Route element={<AppShell />}>
          <Route path="/" element={<DashboardPage />} />
          <Route path="/bookings" element={<BookingsPage />} />
          <Route path="/availability" element={<AvailabilityPage />} />
          <Route path="/products" element={<ProductsListPage />} />
          <Route path="/products/:id" element={<ProductDetailPage />} />
          <Route path="/products/build/:id?/:step?" element={<ProductBuilderPage />} />
          <Route path="/reviews" element={<ReviewsPage />} />
          <Route path="/finance" element={<FinancePage />} />
          <Route path="/notifications" element={<NotificationsPage />} />
          <Route path="/settings" element={<SettingsPage />} />
          <Route path="/chat" element={<ChatPage />} />
          <Route path="/customers" element={<Navigate to="/chat" replace />} />
          <Route path="/analytics" element={<AnalyticsPage />} />
          <Route path="/cancellation-rate" element={<CancellationRatePage />} />

          {/* Catch-all route for 404 */}
          <Route path="*" element={<NotFoundPage />} />
        </Route>
      </Route>
    </Routes>
  );
}
