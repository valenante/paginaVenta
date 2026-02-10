// src/pages/Estadisticas/EstadisticasPage.jsx
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
  const [selectedDate, setSelectedDate] = useState(null);

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
   * 2) Cargar categorías al cambiar tipo
   * ===================================================== */
  useEffect(() => {
    if (!tipo) return;

    fetchCategories(tipo);
    setSelectedCategory(null);
    setSelectedDate(null);
    userChangedCategoryRef.current = false;
  }, [tipo, fetchCategories]);

  /* =====================================================
   * 3) Autoselect de categoría (solo si procede)
   * ===================================================== */
  useEffect(() => {
    if (selectedCategory) return;
    if (userChangedCategoryRef.current) return;
    if (categoriasNormalizadas.length === 0) return;

    setSelectedCategory(categoriasNormalizadas[0]);
  }, [categoriasNormalizadas, selectedCategory]);

  /* =====================================================
   * 4) Validar categoría seleccionada
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
   * 7) Estadísticas
   * ===================================================== */
  const stats = useEstadisticasCategoria(productosCategoria, selectedDate);

  const {
    loading: loadingStats,
    productosConStats,
    resumenCategoria,
    estadisticasPorMesa,
    estadisticasPorHora,
    topProductos,
    horaPunta,
  } = stats || {};

  const fechaTexto = selectedDate
    ? selectedDate.toLocaleDateString()
    : "todas las fechas";

  const totalIngresosCategoria = resumenCategoria?.totalIngresos || 0;
  const productoEstrella = topProductos?.[0] ?? null;

  /* =====================================================
   * 8) Estados UI PROFESIONALES
   * ===================================================== */

  // ⏳ loading real
  if (loading.categories) {
    return (
      <div className="estadisticas-final--estadisticas">
        <p className="mensaje-carga--estadisticas">
          Cargando categorías…
        </p>
      </div>
    );
  }

  // ❌ error real
  if (error.categories) {
    return (
      <div className="estadisticas-final--estadisticas">
        <p className="mensaje-error--estadisticas">
          Error al cargar las categorías
        </p>
      </div>
    );
  }

  // 📭 empty state real (PRO)
  if (categoriasNormalizadas.length === 0) {
    return (
      <div className="estadisticas-final--estadisticas">
        <p className="mensaje-vacio--estadisticas">
          Todavía no hay estadisticas para mostrar.
        </p>
      </div>
    );
  }

  /* =====================================================
   * 9) Handlers
   * ===================================================== */
  const handleChangeTipo = (t) => setTipo(t);

  const handleChangeCategory = (cat) => {
    userChangedCategoryRef.current = true;
    setSelectedCategory(cat);
  };

  const handleChangeDate = (d) => setSelectedDate(d);

  /* =====================================================
   * 10) Render
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
          selectedDate={selectedDate}
          onChangeDate={handleChangeDate}
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
              tipo={tipo}
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
