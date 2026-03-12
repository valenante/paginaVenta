// src/pages/Estadisticas/EstadisticasPage.jsx
import React, { useEffect, useMemo, useState } from "react";
import { useCategorias } from "../../context/CategoriasContext";
import { useConfig } from "../../context/ConfigContext";
import { useEstadisticasCategoria } from "../../Hooks/useEstadisticasCategoria";

import StatsFilterBar from "./components/StatsFilterBar";
import StatsResumenCategoria from "./components/StatsResumenCategoria";
import StatsTopProductos from "./components/StatsTopProductos";
import StatsPorMeses from "./components/StatsPorMeses";
import StatsPorHora from "./components/StatsPorHora";
import StatsListaProductos from "./components/StatsListaProductos";
import UpsellEstadisticasPro from "./components/UpsellEstadisticasPro";

import "./EstadisticasFinal.css";

const formatearFechaTexto = (date) => {
  if (!date) return "";
  return date.toLocaleDateString();
};

const EstadisticasPage = ({ categories }) => {
  const { products, fetchProducts } = useCategorias();
  const { hasFeature } = useConfig();

  const [selectedCategory, setSelectedCategory] = useState(
    categories?.[0] || null
  );

  const [startDate, setStartDate] = useState(null);
  const [endDate, setEndDate] = useState(null);

  const isPro = hasFeature("features.estadisticasAmpliadas", false);

  useEffect(() => {
    if (selectedCategory) {
      fetchProducts(selectedCategory);
    }
  }, [selectedCategory, fetchProducts]);

  const productosCategoria = useMemo(
    () => (products || []).filter((p) => p.categoria === selectedCategory),
    [products, selectedCategory]
  );

  const {
    loading,
    productosConStats,
    resumenCategoria,
    estadisticasPorMes,
    estadisticasPorHora,
    topProductos,
    horaPunta,
  } = useEstadisticasCategoria(productosCategoria, { startDate, endDate });

  const fechaTexto =
    startDate && endDate
      ? `del ${formatearFechaTexto(startDate)} al ${formatearFechaTexto(endDate)}`
      : startDate
        ? `desde el ${formatearFechaTexto(startDate)}`
        : endDate
          ? `hasta el ${formatearFechaTexto(endDate)}`
          : "todas las fechas";

  const totalIngresosCategoria = resumenCategoria?.totalIngresos || 0;
  const productoEstrella =
    topProductos && topProductos.length > 0 ? topProductos[0] : null;

  if (!categories || categories.length === 0) {
    return (
      <div className="estadisticas-final--estadisticas">
        <p className="mensaje-carga--estadisticas">
          Cargando categorías...
        </p>
      </div>
    );
  }

  return (
    <div className="estadisticas-page">
      <StatsFilterBar
        categories={categories}
        selectedCategory={selectedCategory}
        onChangeCategory={setSelectedCategory}
        startDate={startDate}
        endDate={endDate}
        onChangeStartDate={setStartDate}
        onChangeEndDate={setEndDate}
      />

      {selectedCategory && (
        <>
          {isPro && (
            <>
              <StatsResumenCategoria
                category={selectedCategory}
                resumenCategoria={resumenCategoria}
                fechaTexto={fechaTexto}
                horaPunta={horaPunta}
                productoEstrella={productoEstrella}
                isPro={isPro}
              />

              <div className="stats-pro-grid">
                <StatsPorMeses data={estadisticasPorMes} />
                <StatsPorHora data={estadisticasPorHora} />
              </div>

              <StatsTopProductos
                topProductos={topProductos}
                totalIngresosCategoria={totalIngresosCategoria}
              />
            </>
          )}

          {!isPro && <UpsellEstadisticasPro />}

          <StatsListaProductos
            productosConStats={productosConStats}
            loading={loading}
          />
        </>
      )}
    </div>
  );
};

export default EstadisticasPage;