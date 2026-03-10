// src/pages/EstadisticasPage.jsx
import React, { useEffect, useMemo, useRef, useState } from "react";
import { useCategorias } from "../context/CategoriasContext";
import { useFeaturesPlan } from "../context/FeaturesPlanContext";
import { useEstadisticasCategoria } from "../Hooks/useEstadisticasCategoria";

import StatsFilterBar from "../components/Estadisticas/StatsFilterBar";
import StatsResumenCategoria from "../components/Estadisticas/StatsResumenCategoria";
import StatsTopProductos from "../components/Estadisticas/StatsTopProductos";
import StatsPorMesa from "../components/Estadisticas/StatsPorMesa";
import StatsPorHora from "../components/Estadisticas/StatsPorHora";
import StatsListaProductos from "../components/Estadisticas/StatsListaProductos";
import UpsellEstadisticasPro from "../components/Estadisticas/UpsellEstadisticasPro";

import "../components/Estadisticas/EstadisticasFinal.css";

export default function EstadisticasPage({ type = "plato" }) {
  const {
    categoriesByTipo,
    productsByKey,
    loading,
    error,
    fetchCategories,
    fetchProducts,
  } = useCategorias();

  const { hasFeature } = useFeaturesPlan();

  const [tipo, setTipo] = useState(type);
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [startDate, setStartDate] = useState(null);
  const [endDate, setEndDate] = useState(null);

  const isPro = hasFeature("estadisticas_avanzadas");

  const userChangedCategoryRef = useRef(false);

  /* =====================================================
   * 1) Categorías del tipo actual
   * ===================================================== */
  const categorias = categoriesByTipo[tipo] || [];

  const categoriasNormalizadas = useMemo(() => {
    return categorias
      .filter((c) => typeof c === "string" && c.trim().length > 0)
      .sort((a, b) => a.localeCompare(b));
  }, [categorias]);

  /* =====================================================
   * 2) Cargar categorías al cambiar tipo — resetear todo
   * ===================================================== */
  useEffect(() => {
    if (!tipo) return;
    fetchCategories(tipo);
    setSelectedCategory(null);
    setStartDate(null);
    setEndDate(null);
    userChangedCategoryRef.current = false;
  }, [tipo, fetchCategories]);

  /* =====================================================
   * 3) Autoselect de categoría (solo si el usuario no ha tocado)
   * ===================================================== */
  useEffect(() => {
    if (selectedCategory) return;
    if (userChangedCategoryRef.current) return;
    if (categoriasNormalizadas.length === 0) return;
    setSelectedCategory(categoriasNormalizadas[0]);
  }, [categoriasNormalizadas, selectedCategory]);

  /* =====================================================
   * 4) Validar categoría seleccionada (si el tipo cambia)
   * ===================================================== */
  useEffect(() => {
    if (!selectedCategory) return;
    if (categoriasNormalizadas.includes(selectedCategory)) return;
    setSelectedCategory(categoriasNormalizadas[0] || null);
    userChangedCategoryRef.current = false;
  }, [categoriasNormalizadas, selectedCategory]);

  /* =====================================================
   * 5) Cargar productos por tipo + categoría
   * ===================================================== */
  useEffect(() => {
    if (!tipo || !selectedCategory) return;
    fetchProducts({ tipo, categoria: selectedCategory });
  }, [tipo, selectedCategory, fetchProducts]);

  /* =====================================================
   * 6) Productos de la categoría actual (desde cache)
   * ===================================================== */
  const productosCategoria = useMemo(() => {
    if (!tipo || !selectedCategory) return [];
    const key = `${tipo}::${selectedCategory}`;
    return productsByKey[key] || [];
  }, [tipo, selectedCategory, productsByKey]);

  /* =====================================================
   * 7) Estadísticas — se pasa el rango como objeto { startDate, endDate }
   * ===================================================== */
  const {
    loading: loadingStats,
    productosConStats,
    resumenCategoria,
    estadisticasPorMesa,
    estadisticasPorHora,
    topProductos,
    horaPunta,
  } = useEstadisticasCategoria(productosCategoria, { startDate, endDate });

  /* =====================================================
   * 8) Texto descriptivo del rango de fechas activo
   * ===================================================== */
  const fechaTexto = useMemo(() => {
    const fmt = (d) => d.toLocaleDateString();
    if (startDate && endDate) return `del ${fmt(startDate)} al ${fmt(endDate)}`;
    if (startDate) return `desde el ${fmt(startDate)}`;
    if (endDate) return `hasta el ${fmt(endDate)}`;
    return "todas las fechas";
  }, [startDate, endDate]);

  const totalIngresosCategoria = resumenCategoria?.totalIngresos || 0;
  const productoEstrella = topProductos?.[0] ?? null;

  /* =====================================================
   * 9) Estados de UI
   * ===================================================== */
  if (loading.categories) {
    return (
      <div className="estadisticas-final--estadisticas">
        <p className="mensaje-carga--estadisticas">Cargando categorías…</p>
      </div>
    );
  }

  if (error.categories) {
    return (
      <div className="estadisticas-final--estadisticas">
        <p className="mensaje-error--estadisticas">Error al cargar las categorías</p>
      </div>
    );
  }

  if (categoriasNormalizadas.length === 0) {
    return (
      <div className="estadisticas-final--estadisticas">
        <p className="mensaje-vacio--estadisticas">
          Todavía no hay estadísticas para mostrar.
        </p>
      </div>
    );
  }

  /* =====================================================
   * 10) Handlers
   * ===================================================== */
  const handleChangeTipo = (t) => setTipo(t);

  const handleChangeCategory = (cat) => {
    userChangedCategoryRef.current = true;
    setSelectedCategory(cat);
  };

  /* =====================================================
   * 11) Render
   * ===================================================== */
  return (
    <div className="estadisticas-root">
      <div className="estadisticas-page">
        <StatsFilterBar
          tipo={tipo}
          onChangeTipo={handleChangeTipo}
          categories={categoriasNormalizadas}
          selectedCategory={selectedCategory}
          onChangeCategory={handleChangeCategory}
          startDate={startDate}
          endDate={endDate}
          onChangeStartDate={setStartDate}
          onChangeEndDate={setEndDate}
        />

        {selectedCategory && (
          <>
            <StatsResumenCategoria
              category={selectedCategory}
              resumenCategoria={resumenCategoria}
              fechaTexto={fechaTexto}
              horaPunta={horaPunta}
              productoEstrella={productoEstrella}
              isPro={isPro}
            />

            {isPro ? (
              <div className="stats-pro-section">
                <div className="stats-pro-grid">
                  <StatsPorMesa data={estadisticasPorMesa} />
                  <StatsPorHora data={estadisticasPorHora} />
                </div>

                <StatsTopProductos
                  topProductos={topProductos}
                  totalIngresosCategoria={totalIngresosCategoria}
                />

                <StatsListaProductos
                  productosConStats={productosConStats}
                  loading={loadingStats}
                />
              </div>
            ) : (
              <UpsellEstadisticasPro fullscreen />
            )}
          </>
        )}
      </div>
    </div>
  );
}
