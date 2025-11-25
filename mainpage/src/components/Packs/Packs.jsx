import React from "react";
import { useEffect, useState } from "react";
import api from "../../utils/api";
import "./Packs.css";

import PlanDetallesModal from "../Packs/PlanDetallesModal";

const Packs = () => {
  const [planes, setPlanes] = useState([]);
  const [modalPlan, setModalPlan] = useState(null);

  useEffect(() => {
    const fetchPlanes = async () => {
      try {
        const { data } = await api.get("/superadminPlans/publicPlans");
        setPlanes(data);
      } catch (err) {
        console.error("Error cargando planes:", err);
      }
    };
    fetchPlanes();
  }, []);

  return (
    <section className="Packs" id="packs">

      <div className="fila-superior">
        <div className="packs-header">
          <h2>Planes disponibles</h2>
          <p>Elige el plan que mejor se adapte a tu restaurante.</p>
        </div>
      </div>

      <div className="Packs-cards">
        {planes.length === 0 && <p>No hay planes disponibles.</p>}

        {planes.map((plan, index) => (
          <div className={`PackCard PackCard-${index}`} key={plan._id}>

            <h3>{plan.nombre}</h3>

            <p className="precio">
              {plan.precioMensual} €/mes
            </p>

            <ul>
              {(plan.features || []).slice(0, 3).map((f) => (
                <li key={f._id}>{f.nombre}</li>
              ))}

              {plan.features.length > 3 && (
                <li className="ver-mas" onClick={() => setModalPlan(plan)}>
                  + {plan.features.length - 3} más...
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

          </div>
        ))}
      </div>

      {modalPlan && (
        <PlanDetallesModal
          plan={modalPlan}
          onClose={() => setModalPlan(null)}
        />
      )}
    </section>
  );
};

export default Packs;
