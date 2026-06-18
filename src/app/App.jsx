import { useEffect } from "react";
import Providers from "./providers";
import AppRoutes from "./routes";
import ErrorBoundary from "@/components/shared/ErrorBoundary";
import { initAuthFromStorage, useAuthStore } from "@/stores/authStore";

function App() {
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
