// src/components/VerifactuGlobalModal.jsx
import { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import api from "../../utils/api";
import "./VerifactuGlobalModal.css";

const VF_COOLDOWN_MS = 10 * 60 * 1000; // 10 minutos

export default function VerifactuGlobalModal() {
  const [visible, setVisible] = useState(false);
  const [checking, setChecking] = useState(true);

  const location = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    const checkVerifactu = async () => {
      setChecking(true);
      try {
        const { data } = await api.get("/admin/verifactu/verifactu");
        const enabled = !!data.enabled;

        // Si ya está activado o estamos en la pantalla de config → nada
        if (
          enabled ||
          location.pathname === "/mi-cuenta"
        ) {
          setVisible(false);
          return;
        }

        // Si NO está activado, miramos cooldown
        const lastShown = Number(
          sessionStorage.getItem("vfLastShownAt") || 0
        );
        const now = Date.now();

        // Si nunca se mostró o ya pasó el cooldown → mostrar
        if (!lastShown || now - lastShown > VF_COOLDOWN_MS) {
          setVisible(true);
          sessionStorage.setItem("vfLastShownAt", String(now));
        } else {
          setVisible(false);
        }
      } catch (err) {
        // 401, 403, etc → sin sesión o sin permiso → no mostrar
        setVisible(false);
      } finally {
        setChecking(false);
      }
    };

    checkVerifactu();
  }, [location.pathname]);

  if (!visible || checking) return null;

  const irAConfig = () => {
    setVisible(false);
    navigate("/mi-cuenta");
  };

  const cerrar = () => {
    // No tocamos vfLastShownAt: así respeta el cooldown actual
    setVisible(false);
  };

  return (
    <div className="vf-modal-backdrop">
      <div className="vf-modal-card">
        <button
          className="vf-modal-close"
          type="button"
          onClick={cerrar}
        >
          ✕
        </button>

        <div className="vf-modal-content">
          <h2>VeriFactu pendiente de configurar</h2>
          <p className="vf-modal-text">
            Para poder utilizar el TPV y emitir facturas válidas ante la AEAT,
            primero debes completar la configuración fiscal (CIF) y activar el
            sistema VeriFactu para este restaurante.
          </p>

          <p className="vf-modal-text vf-modal-text-sec">
            Rellena los datos fiscales del restaurante, guarda la
            configuración CIF y después activa VeriFactu desde el panel
            de administración.
          </p>

          <div className="vf-modal-actions">
            <button
              type="button"
              className="vf-modal-primary"
              onClick={irAConfig}
            >
              Ir a configurar VeriFactu
            </button>

            <button
              type="button"
              className="vf-modal-secondary"
              onClick={cerrar}
            >
              Cerrar por ahora
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
