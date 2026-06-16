import { useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import {
  exchangeFirebaseToken,
  getLoginErrorMessage,
  showSupplierLoginToast,
} from "@/features/auth/api";
import { useAuthStore, canAccessSupplierDashboard } from "@/stores/authStore";
import api from "@/lib/axios";

export function getPostLoginPath(supplierProfile, isTeamMember) {
  const returnUrl = localStorage.getItem("auth_return_url");

  if (returnUrl) {
    return returnUrl;
  }

  if (canAccessSupplierDashboard(supplierProfile) || isTeamMember) {
    return "/";
  }

  return "/supplier/status";
}

async function checkIsTeamMember() {
  try {
    const res = await api.get("/suppliers/settings/team/my-role", {
      skipGlobalErrorHandler: true,
    });
    return res.data?.data?.role !== null;
  } catch {
    return false;
  }
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

        const isTeamMember = await checkIsTeamMember();
        const path = getPostLoginPath(supplierProfile, isTeamMember);
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
