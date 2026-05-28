import { useEffect } from "react";
import Providers from "./providers";
import AppRoutes from "./routes";
import ErrorBoundary from "@/components/shared/ErrorBoundary";
import { initAuthFromStorage, useAuthStore } from "@/stores/authStore";

function App() {
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

  return (
    <ErrorBoundary>
      <Providers>
        <AppRoutes />
      </Providers>
    </ErrorBoundary>
  );
}

export default App;
