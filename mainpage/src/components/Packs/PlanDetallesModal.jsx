// PlanDetallesModal.jsx
import { useMemo, useState, useRef } from "react";
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
  const groupRefs = useRef({}); // refs para hacer scroll a cada bloque

  const groupedFeatures = useMemo(() => {
    const grupos = {};
    (plan.features || []).forEach((f) => {
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
    // abrir el grupo
    setOpenGroups((prev) => ({ ...prev, [cat]: true }));

    // y hacer scroll suave al bloque
    setTimeout(() => {
      const el = groupRefs.current[cat];
      if (el) {
        el.scrollIntoView({ behavior: "smooth", block: "start" });
      }
    }, 50);
  };

  if (!plan) return null;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div
        className="modal-plan"
        onClick={(e) => e.stopPropagation()}
      >
        <h2>{plan.nombre}</h2>

        <p className="modal-precio">
          {plan.precioMensual} €/mes
          {plan.precioAnual > 0 && (
            <span className="precio-anual">— {plan.precioAnual} €/año</span>
          )}
        </p>

        {plan.descripcion && (
          <p className="modal-descripcion">{plan.descripcion}</p>
        )}

        {/* Resumen rápido */}
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

        <h3 style={{ marginTop: "1rem" }}>¿Qué incluye este plan?</h3>

        {/* Bloques por categoría con acordeón */}
        <div className="modal-feature-groups">
          {categoriasOrdenadas.map(([cat, feats]) => {
            const abierta = !!openGroups[cat];
            const etiqueta = getEtiquetaCategoria(cat);
            const visibles = abierta ? feats : feats.slice(0, 3);
            const restantes = feats.length - visibles.length;

            return (
              <div
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
                      {feats.length} función{feats.length !== 1 && "es"}
                    </span>
                  </div>
                  <span className="feature-group-toggle">
                    {abierta ? "−" : "+"}
                  </span>
                </button>

                <ul className="feature-group-list">
                  {visibles.map((f) => (
                    <li key={f._id}>
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
              </div>
            );
          })}
        </div>

        <a className="btn-elegir big" href={`/registro?plan=${plan.slug}`}>
          Elegir este plan
        </a>

        <button className="btn-cerrar" onClick={onClose}>
          Cerrar
        </button>
      </div>
    </div>
  );
}
