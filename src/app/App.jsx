import Providers from "./providers";
import AppRoutes from "./routes";
import ErrorBoundary from "@/components/shared/ErrorBoundary";

function App() {
  return (
    <ErrorBoundary>
      <Providers>
        <AppRoutes />
      </Providers>
    </ErrorBoundary>
  );
}

export default App;
