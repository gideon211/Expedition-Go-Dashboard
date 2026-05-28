import { create } from "zustand";
import { persist } from "zustand/middleware";

/**
 * Auth Store
 *
 * Manages authentication state for the supplier dashboard.
 * Supports two auth mechanisms:
 *  1. Cookie-based session (set by backend after POST /api/users/signup
 *     with Authorization: Bearer <firebase_id_token>).
 *  2. Bearer token in localStorage as fallback auth.
 */

export const useAuthStore = create(
  persist(
    (set) => ({
      user: null,
      token: null,
      isAuthenticated: false,
      isLoading: false,
      supplierProfile: null,

      /**
       * Log in a user.
       * @param {Object} user  - User object (e.g. { uid, email, name, role })
       * @param {string} token - Optional JWT / Firebase ID token for localStorage fallback
       * @param {Object} supplierProfile - Optional supplier profile (if user is a supplier)
       */
      login: (user, token, supplierProfile) => {
        if (token) {
          localStorage.setItem("auth_token", token);
        }
        if (user) {
          localStorage.setItem("auth_user", JSON.stringify(user));
        }
        set({ user, token, isAuthenticated: true, isLoading: false, supplierProfile });
      },

      /**
       * Update user data without touching the token.
       */
      updateUser: (userData) => {
        set((state) => ({
          user: state.user ? { ...state.user, ...userData } : userData,
        }));
      },

      /**
       * Set supplier profile data.
       */
      setSupplierProfile: (profile) => set({ supplierProfile: profile }),

      /**
       * Set loading state (used during initial session check).
       */
      setLoading: (loading) => set({ isLoading: loading }),

      /**
       * Mark auth as failed / user is logged out.
       */
      setUnauthenticated: () => {
        localStorage.removeItem("auth_token");
        localStorage.removeItem("auth_user");
        set({ user: null, token: null, isAuthenticated: false, isLoading: false, supplierProfile: null });
      },

      /**
       * Log out the user completely.
       * Also calls the backend to clear the __session cookie.
       */
      logout: async () => {
        // Attempt to clear the server-side session cookie
        try {
          const { default: api } = await import("@/lib/axios");
          await api.post("/auth/logout", {}, { withCredentials: true });
        } catch {
          // Backend logout is best-effort; local state must always clear.
        }
        localStorage.removeItem("auth_token");
        localStorage.removeItem("auth_user");
        set({ user: null, token: null, isAuthenticated: false, isLoading: false, supplierProfile: null });
      },
    }),
    {
      name: "auth-storage",
      // Persist user and token so the user stays "logged in" across refreshes
      // even if cookies are unavailable.
      partialize: (state) => ({
        user: state.user,
        token: state.token,
        isAuthenticated: state.isAuthenticated,
        supplierProfile: state.supplierProfile,
      }),
    }
  )
);

/**
 * Initialize auth state from localStorage on app load.
 * If a token is present, we optimistically assume the user is authenticated.
 * The first API call will validate the session (401 if the cookie/token expired).
 */
export function initAuthFromStorage() {
  const token = localStorage.getItem("auth_token");
  const userJson = localStorage.getItem("auth_user");
  const user = userJson ? JSON.parse(userJson) : null;

  if (token && user) {
    useAuthStore.setState({ user, token, isAuthenticated: true, isLoading: false });
  } else if (token || user) {
    // Partial state — clear it to avoid stale data
    useAuthStore.getState().setUnauthenticated();
  }
}

/**
 * Check if the current user has the admin role.
 */
export function isAdminUser() {
  const user = useAuthStore.getState().user;
  return user?.roles?.includes("admin") || false;
}

/**
 * Check if the current user has the supplier role.
 */
export function isSupplierUser() {
  const user = useAuthStore.getState().user;
  return user?.roles?.includes("supplier") || false;
}

/** Supplier statuses that can access the dashboard. */
export const SUPPLIER_DASHBOARD_STATUSES = ["ACTIVE", "APPROVED"];

/**
 * Whether a supplier profile is allowed into the dashboard.
 */
export function canAccessSupplierDashboard(supplierProfile) {
  return SUPPLIER_DASHBOARD_STATUSES.includes(supplierProfile?.status);
}

/**
 * Whether a supplier can create and manage tours in the dashboard.
 */
export function canCreateTours(supplierProfile) {
  return canAccessSupplierDashboard(supplierProfile);
}

/**
 * Check if the current user is an approved or active supplier.
 */
export function isVerifiedSupplier() {
  const { supplierProfile } = useAuthStore.getState();
  return canCreateTours(supplierProfile);
}
