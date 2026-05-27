import React from "react";
import { trackEvent } from "../../utils/trackEvent";
import "./Comparativa.css";

const filas = [
  { feature: "IA que analiza tu negocio (50 herramientas)", alef: "Incluido", separado: "No existe", manual: "Imposible" },
  { feature: "Facturas proveedor → stock automático", alef: "Incluido", separado: "100–200€/mes", manual: "1-2h/día a mano" },
  { feature: "Instagram automático", alef: "Incluido", separado: "300–700€/mes", manual: "3-5h/semana" },
  { feature: "Reseñas Google respondidas con IA", alef: "Incluido", separado: "50–150€/mes", manual: "30 min/día" },
  { feature: "P&L y finanzas automáticas", alef: "Incluido", separado: "500–1.500€/mes", manual: "Excel y rezar" },
  { feature: "Stock predictivo + pedidos a proveedor", alef: "Incluido", separado: "100–200€/mes", manual: "Ojo y papel" },
  { feature: "Carta digital QR + camarero IA", alef: "Incluido", separado: "50–100€/mes", manual: "PDF estático" },
  { feature: "Reservas con confirmación automática", alef: "Incluido", separado: "50–150€/mes", manual: "Libreta" },
  { feature: "Facturación VeriFactu", alef: "Incluido", separado: "30–80€/mes", manual: "No cumples la ley" },
  { feature: "Coordinación cocina en tiempo real", alef: "Incluido", separado: "No existe", manual: "Gritar fuerte" },
];

function renderCell(val, isAlef) {
  if (val === "Incluido") return <span className="Comp-check">✓ Incluido</span>;
  if (val === "No existe" || val === "Imposible") return <span className="Comp-cross">✗ {val}</span>;
  // Costes o texto descriptivo
  const isCoste = val.includes("€");
  return <span className={isCoste ? "Comp-cost" : "Comp-text"}>{val}</span>;
}

export default function Comparativa() {
  return (
    <section className="Comp" id="comparativa">
      <div className="Comp-inner section--wide">
        <div className="Comp-header">
          <span className="Comp-kicker">Comparativa</span>
          <h2>Alef vs contratar todo por separado</h2>
          <p>
            La mayoría de restaurantes pagan por 5-7 herramientas diferentes. O lo hacen a mano. Alef lo unifica todo.
          </p>
        </div>

        <div className="Comp-table-wrap">
          <table className="Comp-table">
            <thead>
              <tr>
                <th></th>
                <th className="Comp-th--alef">Alef (129€/mes)</th>
                <th>Herramientas separadas</th>
                <th>A mano / Excel</th>
              </tr>
            </thead>
            <tbody>
              {filas.map((f, i) => (
                <tr key={i}>
                  <td className="Comp-feature">{f.feature}</td>
                  <td className="Comp-cell Comp-cell--alef">{renderCell(f.alef, true)}</td>
                  <td className="Comp-cell">{renderCell(f.separado)}</td>
                  <td className="Comp-cell">{renderCell(f.manual)}</td>
                </tr>
              ))}
            </tbody>
            <tfoot>
              <tr className="Comp-total-row">
                <td className="Comp-feature"><strong>TOTAL MENSUAL</strong></td>
                <td className="Comp-cell Comp-cell--alef"><strong className="Comp-total-alef">129€</strong></td>
                <td className="Comp-cell"><strong className="Comp-total-cost">1.300–3.400€</strong></td>
                <td className="Comp-cell"><strong className="Comp-total-manual">Tu tiempo + riesgo</strong></td>
              </tr>
            </tfoot>
          </table>
        </div>

        <div className="Comp-cta">
          <a href="#contacto" className="btn btn-primario" onClick={() => trackEvent("click_cta", { location: "comparativa", label: "empezar" })}>
            Empezar con Alef
          </a>
        </div>
      </div>
    </section>
  );
}
