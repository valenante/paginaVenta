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

const log = (msg, data) =>
  console.log(`%c[ESTADISTICAS] ${msg}`, "color:#ff6700;font-weight:bold", data);

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
    log("📌 RE-CALCULANDO categoriasNormalizadas", categories);

    if (!categories) return [];

    const limpias = categories.filter(Boolean);
    const sinDuplicados = [...new Set(limpias)];

    const ordenadas = sinDuplicados.sort((a, b) => a.localeCompare(b));

    log("✔ categoriasNormalizadas RESULTADO", ordenadas);

    return ordenadas;
  }, [categories]);

  /* =====================================================
   * 1) Cargar categorías según tipo
   * ===================================================== */
  useEffect(() => {
    log("🔄 CAMBIO tipo → fetchCategories()", tipo);

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
    log("👀 useEffect categoriasNormalizadas", {
      categoriasNormalizadas,
      selectedCategory,
    });

    if (!selectedCategory && categoriasNormalizadas.length > 0) {
      log("➡ AUTO-SELECT primera categoría", categoriasNormalizadas[0]);
      setSelectedCategory(categoriasNormalizadas[0]);
    }
  }, [categoriasNormalizadas]);

  /* =====================================================
   * 3) Cargar productos cuando cambia la categoría
   * ===================================================== */
  useEffect(() => {
    log("🟦 Cambio selectedCategory", selectedCategory);

    if (!selectedCategory) {
      log("⛔ NO se carga fetchProducts porque no hay categoría");
      return;
    }

    log("📥 fetchProducts()", selectedCategory);
    fetchProducts(selectedCategory);

  }, [selectedCategory]);

  /* =====================================================
   * 4) Filtrar productos
   * ===================================================== */
  const productosCategoria = useMemo(() => {
    log("🔍 Filtrando productos por categoría", {
      selectedCategory,
      totalProducts: products?.length,
    });

    const result = (products || []).filter(
      (p) => p.categoria === selectedCategory
    );

    log("✔ productosCategoria", result);
    return result;
  }, [products, selectedCategory]);

  /* =====================================================
   * 5) Hook estadísticas
   * ===================================================== */
  const stats = useEstadisticasCategoria(productosCategoria, selectedDate);
  log("📊 Estadísticas generadas", stats);

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
    log("⏳ Esperando categorías...");
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
  log("🔰 Render principal", {
    tipo,
    selectedCategory,
    selectedDate,
  });

  return (
    <div className="estadisticas-root">
      <div className="estadisticas-page">
        <StatsFilterBar
          tipo={tipo}
          onChangeTipo={(t) => {
            log("🟥 Cambio manual TIPO", t);
            setTipo(t);
          }}
          categories={categoriasNormalizadas}
          selectedCategory={selectedCategory}
          onChangeCategory={(cat) => {
            log("🟨 Cambio manual CATEGORIA desde Select", cat);
            setSelectedCategory(cat);
          }}
          selectedDate={selectedDate}
          onChangeDate={(d) => {
            log("🟩 Cambio manual FECHA", d);
            setSelectedDate(d);
          }}
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
                  tipo={tipo}
                />

                <div className="stats-pro-grid">
                  <StatsPorMesa data={estadisticasPorMesa} />
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
    </div>
  );
};

export default EstadisticasPage;
