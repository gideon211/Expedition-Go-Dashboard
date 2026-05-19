import { Routes, Route } from "react-router-dom";
import AppShell from "@/components/layout/AppShell";

// Pages
import DashboardPage from "@/features/dashboard/pages/DashboardPage";
import BookingsPage from "@/features/bookings/pages/BookingsPage";
import ProductsListPage from "@/features/products/pages/ProductsListPage";
import ProductBuilderPage from "@/features/products/pages/ProductBuilderPage";
import AvailabilityPage from "@/features/availability/pages/AvailabilityPage";
import PerformancePage from "@/features/performance/pages/PerformancePage";
import ReviewsPage from "@/features/reviews/pages/ReviewsPage";
import FinancePage from "@/features/finance/pages/FinancePage";
import NotificationsPage from "@/features/notifications/pages/NotificationsPage";
import UsersPage from "@/features/users/pages/UsersPage";
import SettingsPage from "@/features/settings/pages/SettingsPage";

export default function AppRoutes() {
  return (
    <AppShell>
      <Routes>
        <Route path="/" element={<DashboardPage />} />
        <Route path="/bookings" element={<BookingsPage />} />
        <Route path="/products" element={<ProductsListPage />} />
        <Route path="/products/build/:id?/:step?" element={<ProductBuilderPage />} />
        <Route path="/availability" element={<AvailabilityPage />} />
        <Route path="/performance" element={<PerformancePage />} />
        <Route path="/reviews" element={<ReviewsPage />} />
        <Route path="/finance" element={<FinancePage />} />
        <Route path="/notifications" element={<NotificationsPage />} />
        <Route path="/users" element={<UsersPage />} />
        <Route path="/settings" element={<SettingsPage />} />
      </Routes>
    </AppShell>
  );
}
