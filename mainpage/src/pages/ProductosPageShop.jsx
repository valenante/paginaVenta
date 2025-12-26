// src/pages/ProductosPageShop.jsx
import React, { useEffect } from "react";
import ShopProducts from "../components/ShopProducts/ShopProducts";
import { useShopCategorias } from "../context/ShopCategoriasContext";
import { useTenant } from "../context/TenantContext.jsx";
import "../styles/ProductosPageShop.css";

export default function ProductosPageShop() {
  const { categories, fetchCategories } = useShopCategorias();
  const { tenantId } = useTenant();

  useEffect(() => {
    fetchCategories();
  }, [fetchCategories]);

  return (
    <div className="products-page--productos alef-products-page">
      {/* ===== HEADER ===== */}
      <header className="products-header--productos">
        <div>
          <h1 className="products-title--productos">Gestor de catálogo</h1>
          <p className="products-subtitle--productos">
            Crea y edita productos de tu tienda: precios, impuestos, stock,
            duración y opciones avanzadas.
          </p>
          <p className="products-subtitle--productos">
            Tenant: <b>{tenantId || "—"}</b>
          </p>
        </div>
      </header>

      {/* ===== CONTENIDO ===== */}
      <section className="products-content-card--productos">
        <ShopProducts categories={categories} />
      </section>
    </div>
  );
}
