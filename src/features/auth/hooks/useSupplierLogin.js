import { useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { exchangeFirebaseToken } from "@/features/auth/api";
import { useAuthStore, canAccessSupplierDashboard } from "@/stores/authStore";

export function getPostLoginPath(supplierProfile) {
  const returnUrl = localStorage.getItem("auth_return_url");

  if (returnUrl) {
    return returnUrl;
  }

  if (canAccessSupplierDashboard(supplierProfile)) {
    return "/";
  }

  return "/supplier/status";
}

export function useSupplierLogin() {
  const navigate = useNavigate();
  const login = useAuthStore((state) => state.login);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const completeLogin = useCallback(
    async (idToken) => {
      setError("");
      setLoading(true);

      try {
        const { user, supplierProfile, token } = await exchangeFirebaseToken(idToken);

        if (!user) {
          throw new Error("Backend did not return user data.");
        }

        login(user, token || idToken, supplierProfile);

        if (canAccessSupplierDashboard(supplierProfile)) {
          toast.success(`Welcome back, ${user.name || user.email}!`);
        } else {
          toast.info("Signed in. Your supplier application is still being reviewed.");
        }

        const path = getPostLoginPath(supplierProfile);
        localStorage.removeItem("auth_return_url");
        navigate(path, { replace: true });

        return { user, supplierProfile };
      } catch (err) {
        if (err.code === "auth/popup-closed-by-user") {
          return null;
        }

        let message = "Sign in failed";

        if (err.code === "auth/unauthorized-domain") {
          message = "This domain is not authorized for sign-in. Contact support.";
        } else if (err.code === "auth/invalid-credential" || err.code === "auth/wrong-password") {
          message = "Invalid email or password.";
        } else if (err.code === "auth/user-not-found") {
          message = "No account found with this email.";
        } else {
          message =
            err.response?.data?.error ||
            err.response?.data?.message ||
            err.message ||
            message;
        }

        setError(message);
        throw err;
      } finally {
        setLoading(false);
      }
    },
    [login, navigate]
  );

  return { completeLogin, loading, error, setError };
}
