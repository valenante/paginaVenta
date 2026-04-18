import React, { useState, useEffect } from "react";
import PeriodoSelector from "./PeriodoSelector";
import TabResumen from "./TabResumen";
import TabProductos from "./TabProductos";
import TabGastos from "./TabGastos";
import { PERIODOS } from "./utils";
import "./Finanzas.css";

const TABS = [
  { key: "resumen", label: "📊 Resumen" },
  { key: "productos", label: "🍽️ Productos" },
  { key: "gastos", label: "🧾 Gastos fijos" },
];

function FinanzasHelpModal({ onClose }) {
  useEffect(() => {
    const onKey = (e) => { if (e.key === "Escape") onClose(); };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  return (
    <div className="fin-help-overlay" onClick={onClose}>
      <div className="fin-help-modal" onClick={(e) => e.stopPropagation()}>
        <button className="fin-help-close" onClick={onClose}>✕</button>
        <h3 className="fin-help-title">Como funciona Finanzas</h3>

        <div className="fin-help-body">
          <div className="fin-help-section">
            <h4>Finanzas vs Caja Diaria</h4>
            <p>
              <strong>Caja Diaria</strong> muestra lo que entra en caja: el total que paga el cliente, <strong>con IVA incluido</strong>.
            </p>
            <p>
              <strong>Finanzas</strong> muestra el rendimiento real del negocio: ingresos <strong>sin IVA</strong> (base imponible),
              menos todos los costes. El IVA no es tuyo — es un impuesto que recaudas para Hacienda.
            </p>
            <p className="fin-help-example">
              Si en Caja ves 2.200€ y en Finanzas ves 2.000€, la diferencia es el IVA (~10% comida, ~21% alcohol).
            </p>
          </div>

          <div className="fin-help-section">
            <h4>Ingresos (sin IVA)</h4>
            <p>
              Suma de todas las ventas del periodo, quitando el IVA de cada producto segun su tipo impositivo
              (10% comida, 21% alcohol). Las cortesias (invitaciones) no se cuentan como ingreso.
            </p>
          </div>

          <div className="fin-help-section">
            <h4>Coste de ventas</h4>
            <p>
              Lo que te costo producir lo que vendiste. Se calcula multiplicando el coste unitario de cada producto
              por las unidades vendidas. Si un producto no tiene coste configurado, aparece como 0.
            </p>
            <p>Las cortesias SI cuentan aqui: aunque regales el plato, pagaste al proveedor.</p>
          </div>

          <div className="fin-help-section">
            <h4>Gastos totales</h4>
            <p>
              <strong>Proveedores:</strong> facturas de proveedores registradas en el periodo (base imponible, sin IVA).
            </p>
            <p>
              <strong>Fijos:</strong> alquiler, salarios, seguros, etc. Se prorratean automaticamente al periodo seleccionado.
              Si ves medio mes, el alquiler se divide a la mitad.
            </p>
          </div>

          <div className="fin-help-section">
            <h4>Beneficio neto</h4>
            <p>
              <strong>Ingresos - Coste de ventas - Gastos proveedores - Gastos fijos = Beneficio neto</strong>
            </p>
            <p>
              El margen se colorea segun la salud: verde (&ge;15%), amarillo (5-15%), naranja (0-5%), rojo (negativo).
            </p>
          </div>

          <div className="fin-help-section">
            <h4>Cortesias</h4>
            <p>
              <strong>Valor regalado:</strong> lo que habrias cobrado al cliente (sin IVA).
            </p>
            <p>
              <strong>Coste real:</strong> lo que te costo producirlo.
            </p>
            <p>
              <strong>Impacto en margen:</strong> que porcentaje de tus ingresos representan las cortesias en coste.
            </p>
          </div>

          <div className="fin-help-section">
            <h4>Rentabilidad por producto</h4>
            <p>
              En la pestana "Productos" puedes ver el margen de cada producto.
              Necesitas tener el coste configurado en cada producto para que el calculo sea preciso.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function FinanzasPage() {
  const [periodo, setPeriodo] = useState(PERIODOS.mes());
  const [tab, setTab] = useState("resumen");
  const [showHelp, setShowHelp] = useState(false);

  return (
    <div className="finanzas-root">
      <div className="finanzas-header">
        <div className="finanzas-title">
          <h2>Finanzas</h2>
          <span className="finanzas-subtitle">
            Ingresos, costes y beneficio neto del negocio
          </span>
        </div>
        <div className="finanzas-header-actions">
          <button className="fin-help-btn" onClick={() => setShowHelp(true)} title="Como funciona">
            ?
          </button>
          {tab !== "gastos" && (
            <PeriodoSelector value={periodo} onChange={setPeriodo} />
          )}
        </div>
      </div>

      <div className="finanzas-tabs">
        {TABS.map((t) => (
          <button
            key={t.key}
            className={`finanzas-tab ${tab === t.key ? "active" : ""}`}
            onClick={() => setTab(t.key)}
          >
            {t.label}
          </button>
        ))}
      </div>

      <div className="finanzas-content">
        {tab === "resumen" && <TabResumen periodo={periodo} />}
        {tab === "productos" && <TabProductos periodo={periodo} />}
        {tab === "gastos" && <TabGastos />}
      </div>

      {showHelp && <FinanzasHelpModal onClose={() => setShowHelp(false)} />}
    </div>
  );
}
