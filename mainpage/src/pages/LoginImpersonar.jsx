import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import api from "../utils/api";

export default function LoginImpersonar() {
  const navigate = useNavigate();

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const token = params.get("token");

    if (!token) {
      navigate("/login");
      return;
    }

    const validar = async () => {
      try {
        const { data } = await api.get(`/auth/impersonar-validar?token=${token}`);

        if (data.ok) {
          const { user } = data;
          const { tenantId } = user;

          // ✅ Guardar datos en sessionStorage
          sessionStorage.setItem("token", token);
          sessionStorage.setItem("tenantId", tenantId);
          sessionStorage.setItem("impersonado", "true");
          sessionStorage.setItem("user", JSON.stringify(user));

          navigate(`/tpv/${tenantId}/dashboard`);
        } else {
          console.warn("🚫 Token inválido o expirado.");
          navigate("/login");
        }
      } catch (err) {
        console.error("❌ Error al validar impersonación:", err);
        navigate("/login");
      }
    };

    validar();
  }, [navigate]);

  return (
    <div style={{ textAlign: "center", marginTop: "3rem" }}>
      Iniciando sesión como admin del restaurante...
    </div>
  );
}
