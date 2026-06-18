import { create } from "zustand";
import { persist } from "zustand/middleware";

export const useAuthStore = create(
  persist(
    (set) => ({
      user: null,
      token: null,
      isAuthenticated: false,
      isLoading: false,
      hasHydrated: false,
      supplierProfile: null,

      login: (user, token, supplierProfile) => {
        if (token) {
          localStorage.setItem("auth_token", token);
        }
        if (user) {
          const normalizedUser = normalizeAvatar(user);
          localStorage.setItem("auth_user", JSON.stringify(normalizedUser));
          set({ user: normalizedUser, token, isAuthenticated: true, isLoading: false, supplierProfile });
          return;
        }
        set({ user, token, isAuthenticated: true, isLoading: false, supplierProfile });
      },

      updateUser: (userData) => {
        set((state) => {
          const merged = state.user ? { ...state.user, ...userData } : userData;
          const normalized = normalizeAvatar(merged);
          if (state.user) {
            localStorage.setItem("auth_user", JSON.stringify(normalized));
          }
          return { user: normalized };
        });
      },

      setSupplierProfile: (profile) => set({ supplierProfile: profile }),

      setLoading: (loading) => set({ isLoading: loading }),

      setHasHydrated: (hasHydrated) => set({ hasHydrated, isLoading: false }),

      setToken: (newToken) => {
        if (newToken) {
          localStorage.setItem("auth_token", newToken);
          set({ token: newToken });
        }
      },

      setUnauthenticated: () => {
        localStorage.removeItem("auth_token");
        localStorage.removeItem("auth_user");
        localStorage.removeItem("refresh_token");
        set({ user: null, token: null, isAuthenticated: false, isLoading: false, supplierProfile: null });
      },

      logout: async () => {
        try {
          const { default: api } = await import("@/lib/axios");
          await api.post("/auth/logout", {}, { skipAuthGuard: true });
        } catch {
        }

        localStorage.removeItem("auth_token");
        localStorage.removeItem("auth_user");
        localStorage.removeItem("refresh_token");
        set({ user: null, token: null, isAuthenticated: false, isLoading: false, supplierProfile: null });
      },
    }),
    {
      name: "auth-storage",
      partialize: (state) => ({
        user: state.user,
        token: state.token,
        isAuthenticated: state.isAuthenticated,
        supplierProfile: state.supplierProfile,
      }),
      onRehydrateStorage: () => (state) => {
        if (state?.isAuthenticated && !state?.token) {
          useAuthStore.getState().setUnauthenticated();
          useAuthStore.getState().setHasHydrated(true);
          return;
        }

        if (state?.token) {
          localStorage.setItem("auth_token", state.token);
        }
        if (state?.user) {
          const normalizedUser = normalizeAvatar(state.user);
          localStorage.setItem("auth_user", JSON.stringify(normalizedUser));
          if (normalizedUser.avatar !== state.user.avatar) {
            useAuthStore.setState({ user: normalizedUser });
          }
        }
        useAuthStore.getState().setHasHydrated(true);
      },
    }
  )
);

export function getAuthToken() {
  const storageToken = localStorage.getItem("auth_token");
  if (storageToken) {
    return storageToken;
  }

  const storeToken = useAuthStore.getState().token;
  if (storeToken) {
    localStorage.setItem("auth_token", storeToken);
    return storeToken;
  }

  return null;
}

export function getStoredAuthUser() {
  const userJson = localStorage.getItem("auth_user");
  if (userJson) {
    try {
      return JSON.parse(userJson);
    } catch {
      localStorage.removeItem("auth_user");
    }
  }

  return useAuthStore.getState().user || null;
}

function normalizeAvatar(user) {
  if (!user) return user;
  if (user.avatar) return user;
  const url = user.photoURL || user.photoUrl;
  if (url) {
    return { ...user, avatar: url };
  }
  return user;
}

export function hasValidAuthSession() {
  const { isAuthenticated } = useAuthStore.getState();
  return Boolean(isAuthenticated && getStoredAuthUser() && getAuthToken());
}

export function initAuthFromStorage() {
  const token = getAuthToken();
  const raw = getStoredAuthUser();
  const user = normalizeAvatar(raw);

  if (raw && user?.avatar !== raw?.avatar) {
    localStorage.setItem("auth_user", JSON.stringify(user));
  }

  if (token && user) {
    useAuthStore.setState({ user, token, isAuthenticated: true, isLoading: false });
  } else if (token || user) {
    useAuthStore.getState().setUnauthenticated();
  }

  if (useAuthStore.persist.hasHydrated()) {
    useAuthStore.getState().setHasHydrated(true);
  }
}

export function isAdminUser() {
  const user = useAuthStore.getState().user;
  return user?.roles?.includes("admin") || false;
}

export function isSupplierUser() {
  const user = useAuthStore.getState().user;
  return user?.roles?.includes("supplier") || false;
}

export const SUPPLIER_DASHBOARD_STATUSES = ["ACTIVE", "APPROVED"];

export function canAccessSupplierDashboard(supplierProfile) {
  return SUPPLIER_DASHBOARD_STATUSES.includes(supplierProfile?.status);
}

export function canCreateTours(supplierProfile) {
  return canAccessSupplierDashboard(supplierProfile);
}

export function isVerifiedSupplier() {
  const { supplierProfile } = useAuthStore.getState();
  return canCreateTours(supplierProfile);
}
