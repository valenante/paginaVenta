import React, { useState, useEffect, useMemo, useRef, useCallback } from "react";
import html2canvas from "html2canvas";
import { obtenerCajasPorRango } from "./ObtenerCajasPorRango";
import UpsellEstadisticasPro from "../../components/Estadisticas/UpsellEstadisticasPro";
import { useAuth } from "../../context/AuthContext.jsx";
import { generarPDFCaja } from "./pdfs/pdfCajaUltraPro";
import { useTenant } from "../../context/TenantContext";
import HeatmapSemana from "./HeatMapSemana";
import CajaIngresosChart from "./CajaIngresosChart";
import ComparacionPeriodos from "./ComparacionPeriodos";
import DiasPeriodo from "./DiaDetalleModal/DiasPeriodo";
import { toISODateKey, formatFechaUI } from "./cajaHelpers";
import "./CajaDiariaUltraPro.css";

const rangoPorDefecto = () => {
  const hoy = new Date();
  const inicio = new Date(hoy.getFullYear(), hoy.getMonth(), 1).toISOString().slice(0, 10);
  const m = new Date();
  m.setDate(m.getDate() + 1);
  const fin = m.toISOString().slice(0, 10);
  return { inicio, fin };
};

export default function CajaDiariaUltraPro() {
  const [fechaInicio, setFechaInicio] = useState(() => rangoPorDefecto().inicio);
  const [fechaFin, setFechaFin] = useState(() => rangoPorDefecto().fin);

  const rangoDefault = useMemo(() => rangoPorDefecto(), []);
  const filtroActivo =
    fechaInicio !== rangoDefault.inicio || fechaFin !== rangoDefault.fin;

  const resetFiltros = () => {
    const { inicio, fin } = rangoPorDefecto();
    setFechaInicio(inicio);
    setFechaFin(fin);
  };

  const [datos, setDatos] = useState([]);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);
  const [generandoPDF, setGenerandoPDF] = useState(false);
  const [comparando, setComparando] = useState(false);

  const chartSectionRef = useRef(null);
  const heatmapSectionRef = useRef(null);
  const controllerRef = useRef(null);

  const { user } = useAuth();
  const { tenant } = useTenant();
  const tipoNegocio = tenant?.tipoNegocio || "restaurante";
  const isPlanEsencial =
    tipoNegocio === "restaurante" &&
    (user?.plan === "esencial" || user?.plan === "tpv-esencial");

  // Fix #1 + #2: cargarDatos estable con AbortController
  const cargarDatos = useCallback(async () => {
    if (!fechaInicio || !fechaFin) return;

    controllerRef.current?.abort();
    const controller = new AbortController();
    controllerRef.current = controller;

    setLoading(true);
    setError(null);

    try {
      const cajas = await obtenerCajasPorRango(fechaInicio, fechaFin, tipoNegocio);
      if (controller.signal.aborted) return;
      setDatos(Array.isArray(cajas) ? cajas : []);
    } catch (err) {
      if (err?.name === "CanceledError" || err?.code === "ERR_CANCELED") return;
      setDatos([]);
      setError("Error al cargar datos. Comprueba el rango de fechas.");
    } finally {
      if (!controller.signal.aborted) setLoading(false);
    }
  }, [fechaInicio, fechaFin, tipoNegocio]);

  useEffect(() => {
    cargarDatos();
    return () => controllerRef.current?.abort();
  }, [cargarDatos]);

  /* =========================================================================
      Agregación por día
     ========================================================================= */
  const datosDiarios = useMemo(() => {
    const map = {};

    datos.forEach((d) => {
      const fechaKey = toISODateKey(d.fecha);
      if (!fechaKey) return;

      if (!map[fechaKey]) {
        map[fechaKey] = {
          fecha: fechaKey,
          total: 0,
          numTickets: 0,
          numComensales: 0,
          avgDuracionMin: null,
          mensajeCierre: d.mensajeCierre || null,
        };
      }

      map[fechaKey].total += Number(d.total || 0);
      // numTickets y numComensales vienen repetidos por hora (mismo total del día), usar el máximo
      map[fechaKey].numTickets = Math.max(map[fechaKey].numTickets, Number(d.numTickets || 0));
      map[fechaKey].numComensales = Math.max(map[fechaKey].numComensales, Number(d.numComensales || 0));
      if (d.avgDuracionMin != null) map[fechaKey].avgDuracionMin = Number(d.avgDuracionMin);
    });

    return Object.values(map)
      .filter((d) => d.total > 0 || d.numTickets > 0)
      .sort((a, b) => new Date(a.fecha) - new Date(b.fecha));
  }, [datos]);

  /* KPIs */
  const totalIngresos = useMemo(
    () => datosDiarios.reduce((acc, d) => acc + d.total, 0),
    [datosDiarios]
  );

  const totalTickets = useMemo(
    () => datosDiarios.reduce((acc, d) => acc + d.numTickets, 0),
    [datosDiarios]
  );

  const ticketMedio = totalTickets > 0 ? totalIngresos / totalTickets : 0;

  const totalComensales = useMemo(
    () => datosDiarios.reduce((acc, d) => acc + Number(d.numComensales || 0), 0),
    [datosDiarios]
  );

  const ticketMedioComensal = totalComensales > 0 ? totalIngresos / totalComensales : 0;

  const duracionMediaMin = useMemo(() => {
    const conDuracion = datosDiarios.filter((d) => d.avgDuracionMin != null && d.avgDuracionMin > 0);
    if (!conDuracion.length) return null;
    return Math.round(conDuracion.reduce((acc, d) => acc + d.avgDuracionMin, 0) / conDuracion.length);
  }, [datosDiarios]);

  // Fix #7: no mostrar mejor/peor si es el mismo día
  const diaMasFuerte = datosDiarios.length
    ? datosDiarios.reduce((a, b) => (a.total > b.total ? a : b))
    : null;

  const diaMasDebil = datosDiarios.length > 1
    ? datosDiarios.reduce((a, b) => (a.total < b.total ? a : b))
    : null;

  /* Variaciones día a día */
  const variaciones = useMemo(() => {
    return datosDiarios.map((d, i) => {
      if (i === 0) return { ...d, variacion: 0 };
      const anterior = datosDiarios[i - 1].total;
      const diff = d.total - anterior;
      const pct = anterior > 0 ? (diff / anterior) * 100 : 0;
      return { ...d, variacion: pct };
    });
  }, [datosDiarios]);

  /* =========================================================================
      PDF — Fix #5 + #6: html2canvas para capturar DOM real
     ========================================================================= */
  const handlePDF = async () => {
    setGenerandoPDF(true);

    let chartImg = null;
    let heatmapImg = null;

    try {
      if (chartSectionRef.current) {
        const canvas = await html2canvas(chartSectionRef.current, {
          backgroundColor: "#0a0a13",
          scale: 2,
        });
        chartImg = canvas.toDataURL("image/png");
      }
    } catch { /* chart capture failed, continue without it */ }

    try {
      if (heatmapSectionRef.current) {
        const canvas = await html2canvas(heatmapSectionRef.current, {
          backgroundColor: "#0a0a13",
          scale: 2,
        });
        heatmapImg = canvas.toDataURL("image/png");
      }
    } catch { /* heatmap capture failed, continue without it */ }

    generarPDFCaja({
      datos: datosDiarios,
      fechaInicio,
      fechaFin,
      heatmapDataURL: heatmapImg,
      chartDataURL: chartImg,
      brand: {
        nombre: tenant?.nombre || "Alef",
        primary: "#60b5ff",
        accent: "#ff9149",
      },
    });

    setGenerandoPDF(false);
  };

  /* =========================================================================
      Render
     ========================================================================= */
  return (
    <div className="caja-ultra-root">
      {/* HEADER */}
      <header className="caja-ultra-header">
        <div>
          <h1 className="caja-ultra-titulo">Caja Diaria</h1>
          <p className="caja-ultra-sub">
            Control financiero del restaurante.
          </p>
        </div>

        <div className="caja-ultra-filtros">
          <input
            type="date"
            value={fechaInicio}
            onChange={(e) => setFechaInicio(e.target.value)}
          />
          <input
            type="date"
            value={fechaFin}
            onChange={(e) => setFechaFin(e.target.value)}
          />

          <button onClick={cargarDatos} disabled={loading}>
            {loading ? "Cargando..." : "Actualizar"}
          </button>

          {filtroActivo && (
            <button
              className="reset-filtros-btn"
              onClick={resetFiltros}
              disabled={loading}
              title="Volver al rango por defecto (mes actual)"
            >
              ✕ Quitar filtros
            </button>
          )}

          {!isPlanEsencial && (
            <>
              <button
                className={`comp-toggle-btn ${comparando ? "is-active" : ""}`}
                onClick={() => setComparando((v) => !v)}
              >
                {comparando ? "Cerrar comparador" : "Comparar periodos"}
              </button>
              <button className="pdf-btn" onClick={handlePDF} disabled={generandoPDF || loading}>
                {generandoPDF ? "Generando..." : "Descargar PDF"}
              </button>
            </>
          )}
        </div>
      </header>

      {/* Fix #3: error con clase CSS en vez de inline */}
      {error && (
        <div className="caja-ultra-error">
          <span>{error}</span>
          <button onClick={cargarDatos}>Reintentar</button>
        </div>
      )}

      {/* Fix #11: loading state */}
      {loading && datos.length === 0 && (
        <div className="caja-ultra-loading">Cargando datos...</div>
      )}

      {!loading && !error && datos.length === 0 && (
        <div className="caja-ultra-empty">No hay datos en este rango.</div>
      )}

      {/* Chart — siempre visible */}
      <div ref={chartSectionRef}>
        <CajaIngresosChart
          datosDiarios={datosDiarios}
          onDiaClick={(fechaISO) => {
            if (!fechaISO) return;
            const dia = String(fechaISO).slice(0, 10);
            // El backend amplía fin hasta las 04:00 del día siguiente,
            // así que usar el mismo día captura un día operativo completo.
            setFechaInicio(dia);
            setFechaFin(dia);
          }}
        />
      </div>

      {/* Comparador de periodos */}
      {comparando && !isPlanEsencial && (
        <ComparacionPeriodos
          periodoA={{ fechaInicio, fechaFin, datos }}
          tipoNegocio={tipoNegocio}
        />
      )}

      {/* Plan esencial: upsell */}
      {isPlanEsencial && <UpsellEstadisticasPro />}

      {/* Plan pro: todo lo demás */}
      {!isPlanEsencial && (
        <>
          {/* KPIs */}
          <section className="caja-ultra-kpi">
            <div className="kpi-card">
              <span>Ingresos totales</span>
              <strong>{totalIngresos.toFixed(2)} €</strong>
            </div>

            <div className="kpi-card">
              <span>Total tickets</span>
              <strong>{totalTickets}</strong>
            </div>

            <div className="kpi-card">
              <span>Ticket medio</span>
              <strong>{ticketMedio.toFixed(2)} €</strong>
            </div>

            <div className="kpi-card">
              <span>Comensales</span>
              <strong>{totalComensales}</strong>
            </div>

            <div className="kpi-card">
              <span>Ticket medio / comensal</span>
              <strong>{ticketMedioComensal.toFixed(2)} €</strong>
            </div>

            {diaMasFuerte && (
              <div className="kpi-card highlight">
                <span>Mejor día</span>
                <strong>{formatFechaUI(diaMasFuerte.fecha)}</strong>
                <small>{diaMasFuerte.total.toFixed(2)} €</small>
              </div>
            )}

            {/* Fix #7: solo si hay >1 día y es diferente del mejor */}
            {diaMasDebil && diaMasDebil.fecha !== diaMasFuerte?.fecha && (
              <div className="kpi-card worst">
                <span>Peor día</span>
                <strong>{formatFechaUI(diaMasDebil.fecha)}</strong>
                <small>{diaMasDebil.total.toFixed(2)} €</small>
              </div>
            )}

            {duracionMediaMin != null && (
              <div className="kpi-card">
                <span>Tiempo medio / mesa</span>
                <strong>
                  {duracionMediaMin >= 60
                    ? `${Math.floor(duracionMediaMin / 60)}h ${duracionMediaMin % 60}m`
                    : `${duracionMediaMin} min`}
                </strong>
              </div>
            )}
          </section>

          <DiasPeriodo dias={variaciones} />

          {/* Heatmap — ref para captura PDF */}
          <div ref={heatmapSectionRef}>
            <HeatmapSemana datos={datos} />
          </div>
        </>
      )}
    </div>
  );
}
