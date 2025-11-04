import { createContext, useContext, useEffect, useState } from "react";
import api from "../utils/api";
import { useTenant } from "./TenantContext.jsx";

const AuthContext = createContext();

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const { setTenantId } = useTenant();

  useEffect(() => {
    const verificarSesion = async () => {
      try {
        const res = await api.get("/auth/me/me");
        const usuario = res.data.user;
        setUser(usuario);

        console.log(usuario)

        // ✅ Si el usuario pertenece a un tenant, guardarlo
        if (usuario?.tenantId) {
          setTenantId(usuario.tenantId);
          sessionStorage.setItem("tenantId", usuario.tenantId);
        }
      } catch (error) {
        console.warn("No hay sesión activa:", error.response?.status);
        setUser(null);
      } finally {
        setLoading(false);
      }
    };
    verificarSesion();
  }, [setTenantId]);

  const logout = async () => {
    await api.post("/auth/logout");
    setUser(null);
    sessionStorage.removeItem("tenantId");
    window.location.href = "/";
  };

  return (
    <AuthContext.Provider value={{ user, setUser, logout, loading }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
