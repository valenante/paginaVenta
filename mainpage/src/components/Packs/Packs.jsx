// src/components/Packs/Packs.jsx
import React, { useEffect, useState } from "react";
import api from "../../utils/api";
import useRevealOnScroll from "../../Hooks/useRevealOnScroll";
import "./Packs.css";

import PlanDetallesModal from "../Packs/PlanDetallesModal";

const Packs = () => {
  const [planes, setPlanes] = useState([]);
  const [modalPlan, setModalPlan] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useRevealOnScroll();

  useEffect(() => {
    const fetchPlanes = async () => {
      try {
        setLoading(true);
        setError("");
        const { data } = await api.get("/superadminPlans/publicPlans");
        setPlanes(Array.isArray(data) ? data : []);
      } catch (err) {
        console.error("Error cargando planes:", err);
        setError(
          "No hemos podido cargar los planes en este momento. Inténtalo de nuevo en unos minutos."
        );
      } finally {
        setLoading(false);
      }
    };
    fetchPlanes();
  }, []);

  return (
    <section className="Packs bg-fondo-claro reveal" id="packs">
      <div className="Packs-inner section--wide">
        {/* HEADER */}
        <div className="fila-superior">
          <div className="packs-header">
            <span className="packs-kicker">Planes Alef</span>
            <h2>Elige el plan que encaja con tu restaurante</h2>
            <p>
              Todos los planes incluyen soporte, actualizaciones y acceso al
              panel de administración. Puedes empezar con uno y subir cuando tu
              restaurante lo necesite.
            </p>
          </div>
        </div>

        {/* ESTADOS */}
        {loading && <p className="packs-estado">Cargando planes…</p>}

        {error && !loading && (
          <p className="packs-estado packs-estado-error">{error}</p>
        )}

        {/* LISTADO DE PLANES */}
        {!loading && !error && (
          <div className="Packs-cards">
            {planes.length === 0 && (
              <p className="packs-estado">
                En este momento no hay planes públicos configurados.
                Ponte en contacto con nosotros para una propuesta a medida.
              </p>
            )}

            {planes.map((plan, index) => {
              const features = Array.isArray(plan.features) ? plan.features : [];
              const esDestacado =
                plan.destacado || plan.recomendado || index === 1; // fallback

              return (
                <article
                  className={`PackCard PackCard-${index} ${
                    esDestacado ? "PackCard--destacado" : ""
                  }`}
                  key={plan._id}
                >
                  {esDestacado && (
                    <div className="PackCard-badge">Más elegido</div>
                  )}

                  <h3 className="PackCard-titulo">{plan.nombre}</h3>

                  {plan.descripcionCorta && (
                    <p className="PackCard-subtitulo">
                      {plan.descripcionCorta}
                    </p>
                  )}

                  <div className="precio-wrapper">
                    <span className="precio-cantidad">
                      {plan.precioMensual}
                    </span>
                    <span className="precio-unidad">€/mes</span>
                  </div>
                  <p className="precio-nota">
                    Licencia por restaurante. Impuestos no incluidos.
                  </p>

                  <ul className="PackCard-lista">
                    {features.slice(0, 4).map((f) => (
                      <li key={f._id || f.nombre}>{f.nombre}</li>
                    ))}

                    {features.length > 4 && (
                      <li
                        className="ver-mas"
                        onClick={() => setModalPlan(plan)}
                      >
                        Ver todas las funcionalidades →
                      </li>
                    )}
                  </ul>

                  <div className="pack-actions">
                    <button
                      className="btn-detalles"
                      onClick={() => setModalPlan(plan)}
                    >
                      Ver detalles
                    </button>

                    <a
                      href={`/registro?plan=${plan.slug}`}
                      className="btn-elegir"
                    >
                      Elegir plan
                    </a>
                  </div>
                </article>
              );
            })}
          </div>
        )}

        {modalPlan && (
          <PlanDetallesModal
            plan={modalPlan}
            onClose={() => setModalPlan(null)}
          />
        )}
      </div>
    </section>
  );
};

export default Packs;
