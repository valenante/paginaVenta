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
                    sessionStorage.setItem("token", token);
                    sessionStorage.setItem("tenantId", data.user.tenantId);
                    sessionStorage.setItem("impersonado", "true");

                    // Redirige al panel real del TPV
                    navigate(`/tpv/${tenantId}/dashboard`);
                } else {
                    navigate(`/tpv/login/${tenantId}`);
                }
            } catch (err) {
                console.error("❌ Error al validar impersonación:", err);
                navigate(`/tpv/login/${tenantId}`);
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
