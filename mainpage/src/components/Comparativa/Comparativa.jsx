import React from "react";
import "./Comparativa.css";

const filas = [
  { feature: "Comandas digitales con buscador", alef: true, tpv: "parcial", papel: false },
  { feature: "Cocina/barra en tiempo real", alef: true, tpv: false, papel: false },
  { feature: "Tickets por seccion con notas", alef: true, tpv: "parcial", papel: false },
  { feature: "Carta QR en 3 idiomas", alef: true, tpv: "extra", papel: false },
  { feature: "Facturacion VERI*FACTU", alef: true, tpv: "algunos", papel: false },
  { feature: "Reservas online", alef: true, tpv: "extra", papel: false },
  { feature: "Stock y proveedores", alef: true, tpv: "parcial", papel: false },
  { feature: "Estadisticas de ventas", alef: true, tpv: "parcial", papel: false },
  { feature: "Funciona en cualquier dispositivo", alef: true, tpv: false, papel: true },
  { feature: "Sin instalacion", alef: true, tpv: false, papel: true },
  { feature: "Voz inteligente", alef: true, tpv: false, papel: false },
  { feature: "Coste mensual", alef: "59€", tpv: "50-200€ + licencia", papel: "0€" },
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
            Compara lo que Alef te da desde el primer dia frente a un TPV
            tradicional o gestionar con papel y Excel.
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
          <a href="#packs" className="btn btn-primario">
            Empezar con Alef
          </a>
        </div>
      </div>
    </section>
  );
}
