import { createContext, useContext, useEffect, useState } from "react";
import api from "../utils/api";
import { useTenant } from "./TenantContext.jsx";

const AuthContext = createContext();

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const { setTenantId } = useTenant();

  useEffect(() => {
    const impersonado = sessionStorage.getItem("impersonado") === "true";
    console.log("🟣 [AuthProvider] Iniciando verificación. Impersonado:", impersonado);

    const verificarSesion = async () => {
      // 🟪 Modo impersonado
      if (impersonado) {
        const storedUser = sessionStorage.getItem("user");
        console.log("🟪 [AuthProvider] Usuario impersonado encontrado en sessionStorage:", storedUser);

        if (storedUser) {
          const parsed = JSON.parse(storedUser);
          setUser(parsed);
          setTenantId(parsed.tenantId);
          console.log("✅ [AuthProvider] Usuario impersonado cargado:", parsed.name);
        } else {
          console.warn("⚠️ [AuthProvider] Impersonado pero sin user guardado en sessionStorage");
        }

        setLoading(false);
        return; // 👈 No llamar /auth/me/me
      }

      // 🧩 Flujo normal
      console.log("🟡 [AuthProvider] Verificando sesión normal con /auth/me/me...");
      try {
        const res = await api.get("/auth/me/me");
        const usuario = res.data.user;
        console.log("🟢 [AuthProvider] Usuario encontrado:", usuario);
        setUser(usuario);

        if (usuario?.tenantId) {
          setTenantId(usuario.tenantId);
          sessionStorage.setItem("tenantId", usuario.tenantId);
        }
      } catch (error) {
        console.warn("🔴 [AuthProvider] No hay sesión activa:", error.response?.status);
        setUser(null);
      } finally {
        setLoading(false);
      }
    };

    verificarSesion();
  }, [setTenantId]);

  const logout = async () => {
    console.log("🚪 [AuthProvider] Logout iniciado...");
    await api.post("/auth/logout");
    setUser(null);
    sessionStorage.removeItem("tenantId");
    sessionStorage.removeItem("impersonado");
    sessionStorage.removeItem("user");
    window.location.href = "/";
  };

  return (
    <AuthContext.Provider value={{ user, setUser, logout, loading }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
