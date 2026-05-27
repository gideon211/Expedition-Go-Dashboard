import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Eye, EyeOff, Loader2, AlertCircle, Shield } from "lucide-react";
import { toast } from "sonner";
import { auth, signInWithEmailAndPassword } from "@/lib/firebase";
import api from "@/lib/axios";
import { useAuthStore } from "@/stores/authStore";

export default function LoginPage() {
  const navigate = useNavigate();
  const { isAuthenticated, user } = useAuthStore();
  const login = useAuthStore((state) => state.login);

  // If already authenticated, redirect to dashboard
  useEffect(() => {
    if (isAuthenticated && user) {
      navigate("/", { replace: true });
    }
  }, [isAuthenticated, user, navigate]);

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    if (!email.trim()) {
      setError("Email is required");
      return;
    }
    if (!password) {
      setError("Password is required");
      return;
    }

    setLoading(true);

    try {
      // Sign in with Firebase
      const userCredential = await signInWithEmailAndPassword(
        auth,
        email,
        password
      );
      const idToken = await userCredential.user.getIdToken();

      // Exchange Firebase token for session with backend
      const response = await api.post(
        "/auth/verify-token",
        { token: idToken },
        { withCredentials: true }
      );

      const responseData = response.data?.data || response.data;
      const user = responseData?.user;
      const supplierProfile = responseData?.supplierProfile || null;

      if (!user) {
        throw new Error("Backend did not return user data.");
      }

      login(user, idToken, supplierProfile);
      toast.success(`Welcome back, ${user.name || user.email}!`);

      // Determine redirect
      const returnUrl = localStorage.getItem("auth_return_url");
      const hasSupplierRole = user.roles?.includes("supplier");
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
    } catch (err) {
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
      } else {
        setError(message);
      }
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

        {/* Login Form */}
        <form
          onSubmit={handleSubmit}
          className="bg-white rounded-xl border border-[#eaeaea] shadow-sm p-6 space-y-5"
        >
          {/* Error Message */}
          {error && (
            <div className="flex items-start gap-3 p-3 bg-[#fef2f2] border border-[#fca5a5] rounded-lg">
              <AlertCircle size={18} className="text-[#dc2626] mt-0.5 flex-shrink-0" />
              <p className="text-sm text-[#991b1b]">{error}</p>
            </div>
          )}

          {/* Email */}
          <div>
            <label
              htmlFor="email"
              className="block text-sm font-medium text-[#1e293b] mb-1.5"
            >
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

          {/* Password */}
          <div>
            <label
              htmlFor="password"
              className="block text-sm font-medium text-[#1e293b] mb-1.5"
            >
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

          {/* Submit */}
          <button
            type="submit"
            disabled={loading}
            className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-[#044b3b] text-white rounded-lg text-sm font-medium hover:bg-[#033629] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? (
              <>
                <Loader2 size={16} className="animate-spin" />
                Signing in...
              </>
            ) : (
              <>
                <Shield size={16} />
                Sign In
              </>
            )}
          </button>

          {/* Additional Links */}
          <div className="text-center pt-2">
            <a
              href="https://travioafrica.com/login"
              className="text-xs text-[#64748b] hover:text-[#044b3b] transition-colors"
            >
              Log in via the main site instead
            </a>
          </div>
        </form>

        {/* Footer */}
        <p className="text-xs text-center text-[#9e9e9e] mt-6">
          Only approved suppliers can access the dashboard.
          <br />
          <a
            href="https://travioafrica.com/become-a-supplier"
            className="text-[#044b3b] hover:underline"
          >
            Apply to become a supplier
          </a>
        </p>
      </div>
    </div>
  );
}