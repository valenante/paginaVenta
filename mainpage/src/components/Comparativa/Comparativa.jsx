import React from "react";
import { trackEvent } from "../../utils/trackEvent";
import "./Comparativa.css";

const filas = [
  { feature: "TPV completo (mesas, cobros, cierres)", alef: "Incluido", separado: "80–150€/mes", manual: "Caja registradora" },
  { feature: "Control de stock con alertas", alef: "Incluido", separado: "50–120€/mes", manual: "Ojo y papel" },
  { feature: "Facturación automática de proveedores", alef: "Incluido", separado: "No existe", manual: "1-2h/día a mano" },
  { feature: "Protección de márgenes con alertas", alef: "Incluido", separado: "No existe", manual: "Imposible" },
  { feature: "Pedidos a proveedor automáticos", alef: "Incluido", separado: "50–150€/mes", manual: "Llamar uno a uno" },
  { feature: "Carta digital QR con pedidos", alef: "Incluido", separado: "30–60€/mes", manual: "PDF estático" },
  { feature: "Instagram automático", alef: "Incluido", separado: "200–500€/mes", manual: "3-5h/semana" },
  { feature: "Reseñas Google respondidas", alef: "Incluido", separado: "No se hace", manual: "30 min/día" },
  { feature: "Facturación VeriFactu", alef: "Incluido", separado: "20–50€/mes", manual: "No cumples la ley" },
  { feature: "Cocina conectada con predicciones", alef: "Incluido", separado: "KDS básico", manual: "Gritar fuerte" },
];

function renderCell(val) {
  if (val === "Incluido") return <span className="Comp-check">✓ Incluido</span>;
  if (val === "No existe" || val === "Imposible" || val === "No se hace") return <span className="Comp-cross">✗ {val}</span>;
  const isCoste = val.includes("€");
  return <span className={isCoste ? "Comp-cost" : "Comp-text"}>{val}</span>;
}

export default function Comparativa() {
  return (
    <section className="Comp" id="comparativa">
      <div className="Comp-inner section--wide">
        <div className="Comp-header">
          <span className="Comp-kicker">¿Cuánto pagas hoy?</span>
          <h2>ALEF vs contratar todo por separado</h2>
          <p>
            Un sistema que lo incluye todo frente a pagar por cada herramienta individualmente.
          </p>
        </div>

        <div className="Comp-table-wrap">
          <table className="Comp-table">
            <thead>
              <tr>
                <th></th>
                <th className="Comp-th--alef">ALEF (129€/mes)</th>
                <th>Herramientas separadas</th>
                <th>A mano / Excel</th>
              </tr>
            </thead>
            <tbody>
              {filas.map((f, i) => (
                <tr key={i}>
                  <td className="Comp-feature">{f.feature}</td>
                  <td className="Comp-cell Comp-cell--alef">{renderCell(f.alef)}</td>
                  <td className="Comp-cell">{renderCell(f.separado)}</td>
                  <td className="Comp-cell">{renderCell(f.manual)}</td>
                </tr>
              ))}
            </tbody>
            <tfoot>
              <tr className="Comp-total-row">
                <td className="Comp-feature"><strong>TOTAL MENSUAL</strong></td>
                <td className="Comp-cell Comp-cell--alef"><strong className="Comp-total-alef">129€</strong></td>
                <td className="Comp-cell"><strong className="Comp-total-cost">390–910€</strong></td>
                <td className="Comp-cell"><strong className="Comp-total-manual">Tu tiempo + riesgo</strong></td>
              </tr>
            </tfoot>
          </table>
        </div>

        <div className="Comp-cta">
          <a href="#contacto" className="btn btn-primario" onClick={() => trackEvent("click_cta", { location: "comparativa", label: "empezar" })}>
            Solicitar demo
          </a>
        </div>
      </div>
    </section>
  );
}
