import React from "react";
import { trackEvent } from "../../utils/trackEvent";
import "./Comparativa.css";

const filas = [
  { feature: "TPV completo (mesas, cobros, cierres)", alef: "Incluido", separado: "Incluido", manual: "Caja registradora" },
  { feature: "Control de stock con alertas", alef: "Incluido", separado: "Básico (sin predicción)", manual: "Excel" },
  { feature: "Costes y márgenes por plato", alef: "Incluido", separado: "No incluido", manual: "Imposible" },
  { feature: "Facturación automática de proveedores", alef: "Incluido", separado: "No existe", manual: "1-2h/día a mano" },
  { feature: "Protección de márgenes con alertas", alef: "Incluido", separado: "No existe", manual: "No existe" },
  { feature: "Pedidos a proveedor automáticos", alef: "Incluido", separado: "No existe", manual: "Llamar uno a uno" },
  { feature: "Carta QR con pedidos a cocina", alef: "Incluido", separado: "Incluido (básica)", manual: "PDF estático" },
  { feature: "Cocina conectada (KDS)", alef: "Con predicción", separado: "KDS básico", manual: "No existe" },
  { feature: "VeriFactu", alef: "Incluido", separado: "Incluido", manual: "No cumples la ley" },
  { feature: "Copilot IA", alef: "Incluido", separado: "No existe", manual: "No existe" },
];

function renderCell(val) {
  if (val === "Incluido" || val === "Con predicción") return <span className="Comp-check">{val}</span>;
  if (val === "No existe" || val === "Imposible" || val === "No incluido") return <span className="Comp-cross">{val}</span>;
  const isCoste = val.includes("€");
  return <span className={isCoste ? "Comp-cost" : "Comp-text"}>{val}</span>;
}

export default function Comparativa() {
  return (
    <section className="Comp" id="comparativa">
      <div className="Comp-inner section--wide">
        <div className="Comp-header">
          <span className="Comp-kicker">¿Cuánto pagas hoy?</span>
          <h2>ALEF vs lo que hay en el mercado</h2>
          <p>
            Comparativa honesta con otros TPVs (Last.app, Revo, Ágora) y con hacer todo a mano.
          </p>
        </div>

        <div className="Comp-table-wrap">
          <table className="Comp-table">
            <thead>
              <tr>
                <th></th>
                <th className="Comp-th--alef">ALEF (129€/mes)</th>
                <th>Otros TPVs (75-150€)</th>
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
                <td className="Comp-cell"><strong className="Comp-total-cost">75–150€ + lo que falta</strong></td>
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
