// src/pages/ProductosPageShop.jsx
import React, { useEffect } from "react";
import ShopProducts from "../components/ShopProducts/ShopProducts";
import { useShopCategorias } from "../context/ShopCategoriasContext";
import "../styles/ProductosPageShop.css";

export default function ProductosPageShop() {
  const { fetchCategories } = useShopCategorias();

  useEffect(() => {
    fetchCategories();
  }, [fetchCategories]);

  return (
    <div className="products-page--productos alef-products-page">
      {/* ===== HEADER (mismas clases y estructura que ProductsMenu de restaurante) ===== */}
      <header className="products-header--productos">
        <div>
          <h1 className="products-title--productos">Gestor de productos</h1>
          <p className="products-subtitle--productos">
            Gestiona las categorías y los productos de tu tienda.
          </p>
        </div>
      </header>

      {/* ===== CONTENIDO ===== */}
      <section className="products-content-card--productos">
        <ShopProducts />
      </section>
    </div>
  );
}
