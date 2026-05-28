import { useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import {
  exchangeFirebaseToken,
  getLoginErrorMessage,
  showSupplierLoginToast,
} from "@/features/auth/api";
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
        showSupplierLoginToast(supplierProfile, user);

        const path = getPostLoginPath(supplierProfile);
        localStorage.removeItem("auth_return_url");
        navigate(path, { replace: true });

        return { user, supplierProfile };
      } catch (err) {
        if (err.code === "auth/popup-closed-by-user") {
          return null;
        }

        const message = getLoginErrorMessage(err);
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
