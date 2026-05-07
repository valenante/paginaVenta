import React from "react";
import { trackEvent } from "../../utils/trackEvent";
import "./Comparativa.css";

const filas = [
  { feature: "IA que analiza tu negocio y sugiere decisiones", alef: true, tpv: false, papel: false },
  { feature: "Alertas automaticas (margen bajo, stock, tendencias)", alef: true, tpv: false, papel: false },
  { feature: "Prediccion de consumo y pedidos a proveedores", alef: true, tpv: false, papel: false },
  { feature: "Informe financiero automatico para el contable", alef: true, tpv: false, papel: false },
  { feature: "Cocina y barra coordinadas en tiempo real", alef: true, tpv: false, papel: false },
  { feature: "Carta digital QR en 3 idiomas", alef: true, tpv: "extra", papel: false },
  { feature: "Comandas por voz", alef: true, tpv: false, papel: false },
  { feature: "Stock con alertas y gestion de proveedores", alef: true, tpv: "parcial", papel: false },
  { feature: "Estadisticas de ventas y productos estrella", alef: true, tpv: "parcial", papel: false },
  { feature: "Facturacion VERI*FACTU", alef: true, tpv: "algunos", papel: false },
  { feature: "Funciona en cualquier dispositivo", alef: true, tpv: false, papel: true },
  { feature: "Sin instalacion ni hardware especial", alef: true, tpv: false, papel: true },
];

function renderCell(val) {
  if (val === true) return <span className="Comp-check">✓</span>;
  if (val === false) return <span className="Comp-cross">✗</span>;
  return <span className="Comp-text">{val}</span>;
}

export default function Comparativa() {
  return (
    <section className="Comp" id="comparativa">
      <div className="Comp-inner section--wide">
        <div className="Comp-header">
          <span className="Comp-kicker">Comparativa</span>
          <h2>Alef vs lo que usas ahora</h2>
          <p>
            La mayoria de TPVs solo toman comandas. Alef automatiza
            la gestion completa de tu restaurante.
          </p>
        </div>

        <div className="Comp-table-wrap">
          <table className="Comp-table">
            <thead>
              <tr>
                <th></th>
                <th className="Comp-th--alef">Alef</th>
                <th>TPV tradicional</th>
                <th>Papel / Excel</th>
              </tr>
            </thead>
            <tbody>
              {filas.map((f, i) => (
                <tr key={i}>
                  <td className="Comp-feature">{f.feature}</td>
                  <td className="Comp-cell Comp-cell--alef">{renderCell(f.alef)}</td>
                  <td className="Comp-cell">{renderCell(f.tpv)}</td>
                  <td className="Comp-cell">{renderCell(f.papel)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="Comp-cta">
          <a href="#contacto" className="btn btn-primario" onClick={() => trackEvent("click_cta", { location: "comparativa", label: "automatizar" })}>
            Quiero automatizar mi restaurante
          </a>
        </div>
      </div>
    </section>
  );
}
