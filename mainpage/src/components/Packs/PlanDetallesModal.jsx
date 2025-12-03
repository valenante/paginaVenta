// src/components/Packs/PlanDetallesModal.jsx
import { useMemo, useState, useRef, useEffect } from "react";
import { createPortal } from "react-dom";
import "./PlanDetallesModal.css";

const LABEL_CATEGORIAS = {
  legal: "Fiscalidad y VeriFactu",
  tpv: "TPV y flujo de mesas",
  carta: "Carta digital",
  reservas: "Reservas",
  informes: "Informes y estadísticas",
  soporte: "Soporte",
  voz_ia: "Voz e IA",
  hardware: "Impresoras y hardware",
  branding: "Branding y apariencia",
  general: "Otras funcionalidades",
};

function getEtiquetaCategoria(raw) {
  if (!raw) return LABEL_CATEGORIAS.general;
  const key = raw.toLowerCase();
  return (
    LABEL_CATEGORIAS[key] ||
    raw.charAt(0).toUpperCase() + raw.slice(1) // fallback legible
  );
}

export default function PlanDetallesModal({ plan, onClose }) {
  const [openGroups, setOpenGroups] = useState({});
  const groupRefs = useRef({});

  // Agrupar features por categoría
  const groupedFeatures = useMemo(() => {
    const grupos = {};
    (plan?.features || []).forEach((f) => {
      const cat = f.categoria || "general";
      if (!grupos[cat]) grupos[cat] = [];
      grupos[cat].push(f);
    });
    return grupos;
  }, [plan]);

  const categoriasOrdenadas = useMemo(
    () => Object.entries(groupedFeatures),
    [groupedFeatures]
  );

  const toggleGroup = (cat) => {
    setOpenGroups((prev) => ({ ...prev, [cat]: !prev[cat] }));
  };

  const handleResumenClick = (cat) => {
    // Abrir el grupo
    setOpenGroups((prev) => ({ ...prev, [cat]: true }));

    // Scroll suave al bloque
    setTimeout(() => {
      const el = groupRefs.current[cat];
      if (el) {
        el.scrollIntoView({ behavior: "smooth", block: "start" });
      }
    }, 50);
  };

  // Bloquear scroll del body mientras el modal está abierto
  useEffect(() => {
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prevOverflow;
    };
  }, []);

  // Cerrar con ESC
  useEffect(() => {
    const handleKey = (e) => {
      if (e.key === "Escape") onClose?.();
    };
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [onClose]);

  if (!plan) return null;

  // 🔥 Portal: el overlay se pinta directamente en <body>
  return createPortal(
    <div className="modal-overlay" onClick={onClose}>
      <div
        className="modal-plan"
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-labelledby="modal-plan-title"
      >
        {/* HEADER */}
        <header className="modal-header">
          <div>
            <h2 id="modal-plan-title" className="modal-title">
              {plan.nombre}
            </h2>
            {plan.descripcionCorta && (
              <p className="modal-subtitle">{plan.descripcionCorta}</p>
            )}
          </div>

          <button
            className="btn-cerrar-icon"
            onClick={onClose}
            aria-label="Cerrar detalles del plan"
          >
            ✕
          </button>
        </header>

        {/* PRECIO */}
        <p className="modal-precio">
          <span className="modal-precio-cantidad">
            {plan.precioMensual} €
          </span>
          <span className="modal-precio-unidad">/mes</span>
          {plan.precioAnual > 0 && (
            <span className="precio-anual"> — {plan.precioAnual} €/año</span>
          )}
        </p>

        {plan.descripcion && (
          <p className="modal-descripcion">{plan.descripcion}</p>
        )}

        {/* RESUMEN RÁPIDO */}
        <div className="modal-resumen">
          <div className="resumen-item total">
            <span className="resumen-count">
              {plan.features?.length || 0}
            </span>
            <span className="resumen-label">funciones incluidas</span>
          </div>

          {categoriasOrdenadas.map(([cat, feats]) => {
            const etiqueta = getEtiquetaCategoria(cat);
            const abierta = !!openGroups[cat];
            return (
              <button
                key={cat}
                type="button"
                className={`resumen-item pill ${abierta ? "active" : ""}`}
                onClick={() => handleResumenClick(cat)}
              >
                <span className="resumen-count small">{feats.length}</span>
                <span className="resumen-label">{etiqueta}</span>
              </button>
            );
          })}
        </div>

        <h3 className="modal-section-title">¿Qué incluye este plan?</h3>

        {/* BLOQUES POR CATEGORÍA */}
        <div className="modal-feature-groups">
          {categoriasOrdenadas.map(([cat, feats]) => {
            const abierta = !!openGroups[cat];
            const etiqueta = getEtiquetaCategoria(cat);
            const visibles = abierta ? feats : feats.slice(0, 3);
            const restantes = feats.length - visibles.length;

            return (
              <section
                className="feature-group"
                key={cat}
                ref={(el) => (groupRefs.current[cat] = el)}
              >
                <button
                  type="button"
                  className="feature-group-header"
                  onClick={() => toggleGroup(cat)}
                >
                  <div>
                    <span className="feature-group-title">{etiqueta}</span>
                    <span className="feature-group-count">
                      {feats.length} función
                      {feats.length !== 1 && "es"}
                    </span>
                  </div>
                  <span className="feature-group-toggle">
                    {abierta ? "−" : "+"}
                  </span>
                </button>

                <ul className="feature-group-list">
                  {visibles.map((f) => (
                    <li key={f._id || f.nombre}>
                      <strong>{f.nombre}</strong>
                      {f.descripcion && (
                        <p className="feature-desc">{f.descripcion}</p>
                      )}
                    </li>
                  ))}

                  {!abierta && restantes > 0 && (
                    <li className="feature-ver-mas">
                      …y {restantes} más en {etiqueta.toLowerCase()}.
                    </li>
                  )}
                </ul>
              </section>
            );
          })}
        </div>

        {/* CTA INFERIOR */}
        <a className="btn-elegir big" href={`/registro?plan=${plan.slug}`}>
          Elegir este plan
        </a>

        <button className="btn-cerrar" onClick={onClose}>
          Cerrar
        </button>
      </div>
    </div>,
    document.body
  );
}
