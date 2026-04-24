import React, {
  createContext,
  useContext,
  useEffect,
  useState,
  useCallback,
  useMemo,
} from "react";
import api from "../utils/api";
import { useTenant } from "./TenantContext.jsx";

const AuthContext = createContext(null);

const ADMIN_PANEL_ROLES = new Set([
  "admin",
  "admin_restaurante",
  "admin_shop",
  "vendedor",
]);

const resolveTenantValue = (user) => user?.tenantSlug || user?.tenantId || null;

const saveUserClient = (user) => {
  sessionStorage.setItem("user", JSON.stringify(user));

  const tenantValue = resolveTenantValue(user);
  if (tenantValue) sessionStorage.setItem("tenantId", tenantValue);
  else sessionStorage.removeItem("tenantId");
};

const clearUserClient = () => {
  sessionStorage.removeItem("user");
  sessionStorage.removeItem("tenantId");
  sessionStorage.removeItem("impersonado");
};

export function AuthProvider({ children }) {
  const { setTenantId, clearTenant } = useTenant();

  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [bootError, setBootError] = useState(null);

  const applyUser = useCallback(
    (u) => {
      setUser(u);
      saveUserClient(u);

      if (u?.role === "superadmin") {
        clearTenant();
        sessionStorage.removeItem("tenantId");
        return;
      }

      const tenantValue = resolveTenantValue(u);
      if (tenantValue) setTenantId(tenantValue);
      else clearTenant();
    },
    [setTenantId, clearTenant]
  );

  const bootstrap = useCallback(async () => {
    setLoading(true);

    try {
      setBootError(null);

      const res = await api.get("/auth/me/me");
      const u = res?.data?.user || null;

      if (!u) {
        setUser(null);
        clearUserClient();
        clearTenant();
        return;
      }

      applyUser(u);
    } catch (e) {
      const status = e?.response?.status;

      setUser(null);
      clearUserClient();
      clearTenant();

      if (status === 401) {
        setBootError(null);
      } else {
        setBootError(e);
      }
    } finally {
      setLoading(false);
    }
  }, [applyUser, clearTenant]);

  useEffect(() => {
    bootstrap();
  }, [bootstrap]);

  const login = useCallback(
    async ({ email, password }) => {
      const loginRes = await api.post("/auth/login", { email, password });

      // MFA required — return the MFA data without setting user
      if (loginRes?.data?.mfaRequired) {
        return { mfaRequired: true, mfaUserId: loginRes.data.mfaUserId, mfaEmail: loginRes.data.mfaEmail };
      }

      const maybeUser = loginRes?.data?.user;
      if (maybeUser) {
        applyUser(maybeUser);
        return maybeUser;
      }

      const meRes = await api.get("/auth/me/me");
      const u = meRes?.data?.user;
      applyUser(u);
      return u;
    },
    [applyUser]
  );

  const verifyMfa = useCallback(
    async ({ userId, code }) => {
      const res = await api.post("/auth/mfa/verify", { userId, code });
      const u = res?.data?.user;
      if (u) applyUser(u);
      return u;
    },
    [applyUser]
  );

  const logout = useCallback(async () => {
    try {
      await api.post("/auth/logout");
    } finally {
      setUser(null);
      clearUserClient();
      clearTenant();
      window.location.replace("/login");
    }
  }, [clearTenant]);

  const permsEfectivos = useMemo(
    () => user?.permisosEfectivos || user?.permisos || [],
    [user]
  );

  const isSuperadmin = user?.role === "superadmin";
  const isAdmin = ADMIN_PANEL_ROLES.has(user?.role);
  const isStaff = !!user && !isSuperadmin && !isAdmin;

  const isAdminPanelRole = useCallback((candidateUser = user) => {
    if (!candidateUser) return false;
    return ADMIN_PANEL_ROLES.has(candidateUser.role);
  }, [user]);

  const tienePermiso = useCallback(
    (perm) => {
      if (isSuperadmin) return true;
      return Array.isArray(permsEfectivos) && permsEfectivos.includes(perm);
    },
    [permsEfectivos, isSuperadmin]
  );

  const hasPermission = useCallback(
    (...requeridos) => {
      if (isSuperadmin) return true;
      if (!Array.isArray(permsEfectivos)) return false;
      return requeridos.every((p) => permsEfectivos.includes(p));
    },
    [permsEfectivos, isSuperadmin]
  );

  const hasAnyPermission = useCallback(
    (...requeridos) => {
      if (isSuperadmin) return true;
      if (!Array.isArray(permsEfectivos)) return false;
      return requeridos.some((p) => permsEfectivos.includes(p));
    },
    [permsEfectivos, isSuperadmin]
  );

  const canAccessModule = useCallback(
    (modulo) => {
      if (isSuperadmin) return true;
      if (!Array.isArray(permsEfectivos)) return false;
      return permsEfectivos.some((p) => p.startsWith(`${modulo}.`));
    },
    [permsEfectivos, isSuperadmin]
  );

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        bootError,
        login,
        verifyMfa,
        logout,
        setUser: applyUser,
        bootstrap,

        isSuperadmin,
        isAdmin,
        isStaff,
        isAdminPanelRole,

        tienePermiso,
        hasPermission,
        hasAnyPermission,
        canAccessModule,
        permsEfectivos,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);