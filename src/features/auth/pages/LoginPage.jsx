import { useState } from "react";
import {
  Loader2,
  AlertCircle,
  Mail,
  Lock,
  Eye,
  EyeOff,
  MapPin,
  Package,
  BarChart3,
} from "lucide-react";
import {
  auth,
  googleProvider,
  signInWithPopup,
  signInWithEmailAndPassword,
  getFirebaseStatus,
} from "@/lib/firebase";
import { useSupplierLogin } from "@/features/auth/hooks/useSupplierLogin";
import { getLoginErrorMessage } from "@/features/auth/api";
import supplierLoginImage from "@/assets/supplier_login.jpg";

const FEATURES = [
  { icon: Package, label: "Create and publish tours" },
  { icon: MapPin, label: "Manage destinations and availability" },
  { icon: BarChart3, label: "Track bookings and performance" },
];

export default function LoginPage() {
  const { completeLogin, loading, error, setError } = useSupplierLogin();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  const handleEmailSignIn = async (event) => {
    event.preventDefault();
    setError("");

    if (!email.trim() || !password) {
      setError("Please enter your email and password.");
      return;
    }

    if (!auth) {
      setError("Authentication service is unavailable. Please try again later.");
      return;
    }

    try {
      const result = await signInWithEmailAndPassword(auth, email.trim(), password);
      const idToken = await result.user.getIdToken();
      await completeLogin(idToken);
    } catch (err) {
      if (err.code === "auth/popup-closed-by-user") return;
      if (!err.response) {
        setError(getLoginErrorMessage(err));
      }
    }
  };

  const handleGoogleSignIn = async () => {
    setError("");

    if (!auth || !googleProvider) {
      const status = getFirebaseStatus();
      if (status.error) {
        setError(`Sign-in unavailable: ${status.error}`);
      } else if (!status.hasConfig) {
        setError("Sign-in is not configured. Contact the administrator.");
      } else {
        setError("Authentication service is unavailable. Please try again later.");
      }
      return;
    }

    try {
      const result = await signInWithPopup(auth, googleProvider);
      const idToken = await result.user.getIdToken();
      await completeLogin(idToken);
    } catch (err) {
      if (err.code === "auth/popup-closed-by-user") return;
      if (!err.response) {
        setError(getLoginErrorMessage(err));
      }
    }
  };

  return (
    <div className="min-h-screen flex bg-[#f8fafc]">
      {/* Brand panel with supplier image */}
      <div className="hidden lg:flex lg:w-[45%] xl:w-[42%] relative overflow-hidden">
        <img
          src={supplierLoginImage}
          alt="African travel and safari experiences"
          className="absolute inset-0 w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-[#044b3b]/70 via-[#044b3b]/45 to-[#044b3b]/20" />

        <div className="relative z-10 flex flex-col justify-between p-10 xl:p-14 text-white w-full min-h-screen">
          <div>
            <div className="flex items-center gap-3 mb-12">
              <div className="w-10 h-10 rounded-xl bg-white/10 backdrop-blur-sm flex items-center justify-center">
                <span className="font-bold text-lg">T</span>
              </div>
              <span className="font-bold text-xl tracking-tight">TravioAfrica</span>
            </div>

            <h1 className="text-3xl xl:text-4xl font-bold leading-tight mb-4">
              Supplier Dashboard
            </h1>
            <p className="text-white/85 text-base leading-relaxed max-w-md">
              Sign in to create tours, manage bookings, and grow your travel business across Africa.
            </p>
          </div>

          <ul className="space-y-4">
            {FEATURES.map(({ icon: Icon, label }) => (
              <li key={label} className="flex items-center gap-3 text-white/90">
                <span className="w-9 h-9 rounded-lg bg-white/10 backdrop-blur-sm flex items-center justify-center flex-shrink-0">
                  <Icon size={18} />
                </span>
                <span className="text-sm font-medium">{label}</span>
              </li>
            ))}
          </ul>

          <p className="text-xs text-white/60">
            Access is limited to approved and active suppliers.
          </p>
        </div>
      </div>

      {/* Login form */}
      <div className="flex-1 flex items-center justify-center px-4 py-10 sm:px-8">
        <div className="w-full max-w-md">
          <div className="lg:hidden text-center mb-8">
            <div className="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-[#044b3b] mb-3">
              <span className="text-white font-bold text-lg">T</span>
            </div>
            <h1 className="text-2xl font-bold text-[#1e293b]">Supplier Login</h1>
            <p className="text-sm text-[#64748b] mt-1">Approved & active suppliers only</p>
          </div>

          <div className="bg-white rounded-2xl border border-[#eaeaea] shadow-sm p-6 sm:p-8">
            <div className="hidden lg:block mb-6">
              <h2 className="text-xl font-bold text-[#1e293b]">Sign in</h2>
              <p className="text-sm text-[#64748b] mt-1">
                Use your supplier account to access the dashboard
              </p>
            </div>

            {error && (
              <div className="flex items-start gap-3 p-3 mb-5 bg-[#fef2f2] border border-[#fca5a5] rounded-lg">
                <AlertCircle size={18} className="text-[#dc2626] mt-0.5 flex-shrink-0" />
                <p className="text-sm text-[#991b1b]">{error}</p>
              </div>
            )}

            <form onSubmit={handleEmailSignIn} className="space-y-4">
              <div>
                <label htmlFor="email" className="block text-sm font-medium text-[#1e293b] mb-1.5">
                  Email address
                </label>
                <div className="relative">
                  <Mail size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#9e9e9e]" />
                  <input
                    id="email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="you@example.com"
                    autoComplete="email"
                    disabled={loading}
                    className="w-full pl-9 pr-4 py-2.5 border border-[#eaeaea] rounded-lg text-sm text-[#1e293b] placeholder:text-[#9e9e9e] focus:outline-none focus:ring-2 focus:ring-[#044b3b]/20 focus:border-[#044b3b] transition-colors disabled:opacity-60"
                  />
                </div>
              </div>

              <div>
                <label htmlFor="password" className="block text-sm font-medium text-[#1e293b] mb-1.5">
                  Password
                </label>
                <div className="relative">
                  <Lock size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#9e9e9e]" />
                  <input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Enter your password"
                    autoComplete="current-password"
                    disabled={loading}
                    className="w-full pl-9 pr-10 py-2.5 border border-[#eaeaea] rounded-lg text-sm text-[#1e293b] placeholder:text-[#9e9e9e] focus:outline-none focus:ring-2 focus:ring-[#044b3b]/20 focus:border-[#044b3b] transition-colors disabled:opacity-60"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword((prev) => !prev)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-[#9e9e9e] hover:text-[#64748b]"
                    aria-label={showPassword ? "Hide password" : "Show password"}
                  >
                    {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-[#044b3b] text-white rounded-lg text-sm font-medium hover:bg-[#033629] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? <Loader2 size={18} className="animate-spin" /> : null}
                {loading ? "Signing in..." : "Sign in"}
              </button>
            </form>

            <div className="relative my-6">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-[#eaeaea]" />
              </div>
              <div className="relative flex justify-center text-xs">
                <span className="bg-white px-3 text-[#9e9e9e]">or continue with</span>
              </div>
            </div>

            <button
              type="button"
              onClick={handleGoogleSignIn}
              disabled={loading}
              className="w-full flex items-center justify-center gap-3 px-4 py-2.5 border-2 border-[#eaeaea] rounded-lg text-sm font-medium text-[#1e293b] hover:bg-[#f8fafc] hover:border-[#044b3b] transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? (
                <Loader2 size={20} className="animate-spin text-[#044b3b]" />
              ) : (
                <svg width="20" height="20" viewBox="0 0 24 24" aria-hidden="true">
                  <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" />
                  <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                  <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
                  <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
                </svg>
              )}
              Sign in with Google
            </button>
          </div>

          <p className="text-xs text-center text-[#9e9e9e] mt-6 leading-relaxed">
            Only suppliers with <strong className="text-[#64748b] font-medium">Approved</strong> or{" "}
            <strong className="text-[#64748b] font-medium">Active</strong> status can access the dashboard and create tours.
            <br />
            <a
              href="https://travioafrica.com/become-a-supplier"
              className="text-[#044b3b] hover:underline mt-1 inline-block"
            >
              Apply to become a supplier
            </a>
          </p>
        </div>
      </div>
    </div>
  );
}
