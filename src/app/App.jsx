import { useEffect, useRef } from "react";
import Providers from "./providers";
import AppRoutes from "./routes";
import ErrorBoundary from "@/components/shared/ErrorBoundary";
import { initAuthFromStorage, useAuthStore } from "@/stores/authStore";
import { auth, onAuthStateChanged } from "@/lib/firebase";

function App() {
  const tokenListenerSetup = useRef(false);
  const wasAuthenticated = useRef(false);

  // Hydrate auth state from localStorage on first mount so the user
  // isn't treated as logged-out while the cookie is being verified.
  useEffect(() => {
    initAuthFromStorage();

    const finishHydration = () => {
      useAuthStore.getState().setHasHydrated(true);
    };

    if (useAuthStore.persist.hasHydrated()) {
      finishHydration();
      return undefined;
    }

    const unsubscribe = useAuthStore.persist.onFinishHydration(finishHydration);
    const fallbackTimer = window.setTimeout(finishHydration, 500);

    return () => {
      unsubscribe?.();
      window.clearTimeout(fallbackTimer);
    };
  }, []);

  // Listen for Firebase ID token refreshes and sync to Zustand + localStorage.
  // Firebase auto-refreshes tokens before they expire (~hourly).
  // Without this, the stored token goes stale and every API call returns 401.
  useEffect(() => {
    if (!auth || tokenListenerSetup.current) return;
    tokenListenerSetup.current = true;

    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        wasAuthenticated.current = true;
        try {
          const newToken = await firebaseUser.getIdToken(false);
          const { token: storedToken, isAuthenticated } = useAuthStore.getState();
          if (isAuthenticated && newToken && newToken !== storedToken) {
            useAuthStore.getState().setToken(newToken);
          }
        } catch {
          // Token refresh failed — will be caught by axios 401 handler
        }
      } else if (wasAuthenticated.current) {
        wasAuthenticated.current = false;
        localStorage.removeItem("auth_token");
        localStorage.removeItem("auth_user");
        useAuthStore.getState().setUnauthenticated();
        window.location.href = "/login";
      }
    });

    return unsubscribe;
  }, []);

  return (
    <ErrorBoundary>
      <Providers>
        <AppRoutes />
      </Providers>
    </ErrorBoundary>
  );
}

export default App;
