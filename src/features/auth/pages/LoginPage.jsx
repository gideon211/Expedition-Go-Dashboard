import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Eye, EyeOff, Loader2, AlertCircle, Shield, Mail } from "lucide-react";
import { toast } from "sonner";
import { auth, googleProvider, signInWithPopup, signInWithEmailAndPassword } from "@/lib/firebase";
import api from "@/lib/axios";
import { useAuthStore } from "@/stores/authStore";

async function exchangeToken(idToken) {
  const response = await api.post(
    "/auth/verify-token",
    { token: idToken },
    { withCredentials: true }
  );
  const responseData = response.data?.data || response.data;
  return {
    user: responseData?.user,
    supplierProfile: responseData?.supplierProfile || null,
  };
}

function redirectAfterLogin(navigate, userData, supplierProfile) {
  const returnUrl = localStorage.getItem("auth_return_url");
  const hasSupplierRole = userData.roles?.includes("supplier");
  const isVerified =
    supplierProfile?.status === "ACTIVE" ||
    supplierProfile?.status === "APPROVED";

  if (returnUrl) {
    localStorage.removeItem("auth_return_url");
    navigate(returnUrl, { replace: true });
  } else if (hasSupplierRole && isVerified) {
    navigate("/", { replace: true });
  } else {
    navigate("/supplier/status", { replace: true });
  }
}

export default function LoginPage() {
  const navigate = useNavigate();
  const { isAuthenticated, user } = useAuthStore();
  const login = useAuthStore((state) => state.login);

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [mode, setMode] = useState("login"); // "login" | "google"

  useEffect(() => {
    if (isAuthenticated && user) {
      navigate("/", { replace: true });
    }
  }, [isAuthenticated, user, navigate]);

  const setFormError = (err) => {
    const firebaseCode = err.code;
    const message =
      err.response?.data?.error ||
      err.response?.data?.message ||
      err.message ||
      "Login failed";

    if (firebaseCode === "auth/user-not-found") {
      setError("No account found with this email.");
    } else if (firebaseCode === "auth/wrong-password") {
      setError("Invalid password. Please try again.");
    } else if (firebaseCode === "auth/invalid-credential") {
      setError("Invalid email or password.");
    } else if (firebaseCode === "auth/too-many-requests") {
      setError("Too many attempts. Please try again later.");
    } else if (firebaseCode === "auth/invalid-email") {
      setError("Invalid email format.");
    } else if (firebaseCode === "auth/popup-closed-by-user") {
      return; // silent
    } else if (firebaseCode === "auth/unauthorized-domain") {
      setError("This domain is not authorized for sign-in. Contact support.");
    } else {
      setError(message);
    }
  };

  const handleEmailSignIn = async (e) => {
    e.preventDefault();
    setError("");

    if (!email.trim()) { setError("Email is required"); return; }
    if (!password) { setError("Password is required"); return; }

    if (!auth) {
      setError("Authentication service is unavailable. Please try again later.");
      return;
    }

    setMode("login");
    setLoading(true);

    try {
      const credential = await signInWithEmailAndPassword(auth, email, password);
      const idToken = await credential.user.getIdToken();
      const { user: userData, supplierProfile } = await exchangeToken(idToken);

      if (!userData) throw new Error("Backend did not return user data.");

      login(userData, idToken, supplierProfile);
      toast.success(`Welcome back, ${userData.name || userData.email}!`);
      redirectAfterLogin(navigate, userData, supplierProfile);
    } catch (err) {
      setFormError(err);
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    setError("");

    if (!auth || !googleProvider) {
      setError("Authentication service is unavailable. Please try again later.");
      return;
    }

    setMode("google");
    setLoading(true);

    try {
      const result = await signInWithPopup(auth, googleProvider);
      const idToken = await result.user.getIdToken();
      const { user: userData, supplierProfile } = await exchangeToken(idToken);

      if (!userData) throw new Error("Backend did not return user data.");

      login(userData, idToken, supplierProfile);
      toast.success(`Welcome back, ${userData.name || userData.email}!`);
      redirectAfterLogin(navigate, userData, supplierProfile);
    } catch (err) {
      setFormError(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#f8fafc] px-4">
      <div className="max-w-md w-full">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-xl bg-[#044b3b] mb-4">
            <span className="text-white font-bold text-xl">T</span>
          </div>
          <h1 className="text-2xl font-bold text-[#1e293b]">Supplier Dashboard</h1>
          <p className="text-sm text-[#64748b] mt-1">
            Sign in to manage your tours and bookings
          </p>
        </div>

        <div className="bg-white rounded-xl border border-[#eaeaea] shadow-sm p-6 space-y-5">
          {error && (
            <div className="flex items-start gap-3 p-3 bg-[#fef2f2] border border-[#fca5a5] rounded-lg">
              <AlertCircle size={18} className="text-[#dc2626] mt-0.5 flex-shrink-0" />
              <p className="text-sm text-[#991b1b]">{error}</p>
            </div>
          )}

          {/* Email / Password Form */}
          <form onSubmit={handleEmailSignIn} className="space-y-4">
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-[#1e293b] mb-1.5">
                Email Address
              </label>
              <input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                autoComplete="email"
                autoFocus
                className="w-full px-3 py-2.5 border border-[#eaeaea] rounded-lg text-sm text-[#1e293b] placeholder:text-[#9e9e9e] focus:outline-none focus:ring-2 focus:ring-[#044b3b]/20 focus:border-[#044b3b] transition-colors"
              />
            </div>
            <div>
              <label htmlFor="password" className="block text-sm font-medium text-[#1e293b] mb-1.5">
                Password
              </label>
              <div className="relative">
                <input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter your password"
                  autoComplete="current-password"
                  className="w-full px-3 py-2.5 pr-10 border border-[#eaeaea] rounded-lg text-sm text-[#1e293b] placeholder:text-[#9e9e9e] focus:outline-none focus:ring-2 focus:ring-[#044b3b]/20 focus:border-[#044b3b] transition-colors"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-[#9e9e9e] hover:text-[#64748b] transition-colors"
                  tabIndex={-1}
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>
            <button
              type="submit"
              disabled={loading && mode === "login"}
              className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-[#044b3b] text-white rounded-lg text-sm font-medium hover:bg-[#033629] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading && mode === "login" ? (
                <><Loader2 size={16} className="animate-spin" /> Signing in...</>
              ) : (
                <><Shield size={16} /> Sign In</>
              )}
            </button>
          </form>

          {/* Divider */}
          <div className="flex items-center gap-3">
            <div className="flex-1 h-px bg-[#eaeaea]" />
            <span className="text-xs text-[#9e9e9e] font-medium">OR</span>
            <div className="flex-1 h-px bg-[#eaeaea]" />
          </div>

          {/* Google Sign-In */}
          <button
            onClick={handleGoogleSignIn}
            disabled={loading}
            className="w-full flex items-center justify-center gap-3 px-4 py-2.5 border-2 border-[#eaeaea] rounded-lg text-sm font-medium text-[#1e293b] hover:bg-[#f8fafc] hover:border-[#044b3b] transition-all disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading && mode === "google" ? (
              <Loader2 size={20} className="animate-spin text-[#044b3b]" />
            ) : (
              <svg width="20" height="20" viewBox="0 0 24 24">
                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" />
                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
              </svg>
            )}
            {loading && mode === "google" ? "Signing in..." : "Sign in with Google"}
          </button>

          <div className="text-center">
            <a
              href="https://travioafrica.com/login"
              className="text-xs text-[#64748b] hover:text-[#044b3b] transition-colors"
            >
              Log in via the main site instead
            </a>
          </div>
        </div>

        <p className="text-xs text-center text-[#9e9e9e] mt-6">
          Only approved suppliers can access the dashboard.
          <br />
          <a href="https://travioafrica.com/become-a-supplier" className="text-[#044b3b] hover:underline">
            Apply to become a supplier
          </a>
        </p>
      </div>
    </div>
  );
}