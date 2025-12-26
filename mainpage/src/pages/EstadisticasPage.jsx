// src/pages/Estadisticas/EstadisticasPage.jsx
import React, { useEffect, useMemo, useState } from "react";
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

const EstadisticasPage = ({ type = "plato" }) => {
  const { categories, fetchCategories, products, fetchProducts } = useCategorias();

  const { hasFeature } = useFeaturesPlan();

  const [tipo, setTipo] = useState(type);
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [selectedDate, setSelectedDate] = useState(null);

  const isPro = hasFeature("estadisticas_avanzadas");

  /* =====================================================
   * NORMALIZAR CATEGORÍAS
   * ===================================================== */
  const categoriasNormalizadas = useMemo(() => {

    if (!categories) return [];

    const limpias = categories.filter(Boolean);
    const sinDuplicados = [...new Set(limpias)];

    const ordenadas = sinDuplicados.sort((a, b) => a.localeCompare(b));

    return ordenadas;
  }, [categories]);

  /* =====================================================
   * 1) Cargar categorías según tipo
   * ===================================================== */
  useEffect(() => {
    if (!tipo) return;

    fetchCategories(tipo);

    // reset solo si se cambia plato <-> bebida
    setSelectedCategory(null);
    setSelectedDate(null);
  }, [tipo]);

  /* =====================================================
   * 2) Seleccionar primera categoría SOLO si es null
   * ===================================================== */
  useEffect(() => {

    if (!selectedCategory && categoriasNormalizadas.length > 0) {
      setSelectedCategory(categoriasNormalizadas[0]);
    }
  }, [categoriasNormalizadas]);

  /* =====================================================
   * 3) Cargar productos cuando cambia la categoría
   * ===================================================== */
  useEffect(() => {
    fetchProducts(selectedCategory);

  }, [selectedCategory]);

  /* =====================================================
   * 4) Filtrar productos
   * ===================================================== */
  const productosCategoria = useMemo(() => {
    const result = (products || []).filter(
      (p) => p.categoria === selectedCategory
    );
    return result;
  }, [products, selectedCategory]);

  /* =====================================================
   * 5) Hook estadísticas
   * ===================================================== */
  const stats = useEstadisticasCategoria(productosCategoria, selectedDate);

  const {
    loading,
    productosConStats,
    resumenCategoria,
    estadisticasPorMesa,
    estadisticasPorHora,
    topProductos,
    horaPunta,
  } = stats;

  const fechaTexto = selectedDate
    ? selectedDate.toLocaleDateString()
    : "todas las fechas";

  const totalIngresosCategoria = resumenCategoria?.totalIngresos || 0;
  const productoEstrella =
    topProductos?.length > 0 ? topProductos[0] : null;

  /* =====================================================
   * 6) Estado de carga inicial
   * ===================================================== */
  if (!categoriasNormalizadas || categoriasNormalizadas.length === 0) {
    return (
      <div className="estadisticas-final--estadisticas">
        <p className="mensaje-carga--estadisticas">
          Cargando categorías...
        </p>
      </div>
    );
  }

  /* =====================================================
   * 7) Render principal
   * ===================================================== */
  return (
    <div className="estadisticas-root">
      <div className="estadisticas-page">
        <StatsFilterBar
          tipo={tipo}
          onChangeTipo={(t) => {
            setTipo(t);
          }}
          categories={categoriasNormalizadas}
          selectedCategory={selectedCategory}
          onChangeCategory={(cat) => {
            setSelectedCategory(cat);
          }}
          selectedDate={selectedDate}
          onChangeDate={(d) => {
            setSelectedDate(d);
          }}
        />

        {selectedCategory && (
          <>
            {/* SIEMPRE visible */}
            <StatsResumenCategoria
              category={selectedCategory}
              resumenCategoria={resumenCategoria}
              fechaTexto={fechaTexto}
              horaPunta={horaPunta}
              productoEstrella={productoEstrella}
              isPro={isPro}
              tipo={tipo}
            />

            {/* =============================
        BLOQUE AVANZADO — SOLO PRO
       ============================= */}
            {isPro ? (
              <>
                <div className="stats-pro-section">
                  <div className="stats-pro-grid">
                    <StatsPorMesa data={estadisticasPorMesa} />
                    <StatsPorHora data={estadisticasPorHora} />
                  </div>

                  <StatsTopProductos
                    topProductos={topProductos}
                    totalIngresosCategoria={totalIngresosCategoria}
                  />
                </div>
              </>
            ) : (
              // ⛔ SOLO ESTO, nada más debajo
              <UpsellEstadisticasPro fullscreen={true} />
            )}

            {/* =============================
        LISTA DE PRODUCTOS
       ============================= */}
            {/* LISTA DE PRODUCTOS */}
            {isPro && (
              <StatsListaProductos
                productosConStats={productosConStats}
                loading={loading}
              />
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default EstadisticasPage;
