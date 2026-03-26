import React from "react";
import "./CartaOrdenSection.css";

export default function CartaOrdenSection({ form, handleChange }) {
  const modoOrden = form?.carta?.modoOrden || "por_categoria";

  return (
    <section className="config-section">
      <div className="config-section-header">
        <h3 className="section-title">🍽 Opciones de la carta</h3>
        <p className="section-description">
          Define qué información se muestra y el orden de visualización.
        </p>
      </div>

      {/* checkboxes existentes */}
      <label className="checkbox-row">
        <input
          type="checkbox"
          name="carta.mostrarFotos"
          checked={!!form.carta?.mostrarFotos}
          onChange={handleChange}
        />
        <span>Mostrar fotos</span>
      </label>

      <label className="checkbox-row">
        <input
          type="checkbox"
          name="carta.mostrarAlergenos"
          checked={!!form.carta?.mostrarAlergenos}
          onChange={handleChange}
        />
        <span>Mostrar alérgenos</span>
      </label>

      <label className="checkbox-row">
        <input
          type="checkbox"
          name="carta.mostrarValoraciones"
          checked={!!form.carta?.mostrarValoraciones}
          onChange={handleChange}
        />
        <span>Mostrar valoraciones</span>
      </label>

      <label className="checkbox-row">
        <input
          type="checkbox"
          name="carta.mostrarIconosCategorias"
          checked={!!form.carta?.mostrarIconosCategorias}
          onChange={handleChange}
        />
        <span>Mostrar iconos en categorías</span>
      </label>

      {/* tamaño */}
      <div className="config-field">
        <label>Tamaño de las imágenes de producto</label>
        <select
          name="carta.tamanoImagen"
          value={form.carta?.tamanoImagen || "mediano"}
          onChange={handleChange}
        >
          <option value="pequeno">Pequeño</option>
          <option value="mediano">Mediano (por defecto)</option>
          <option value="grande">Grande</option>
        </select>
      </div>

      {/* modo orden */}
      <div className="config-field">
        <label>Orden de la carta</label>
        <select name="carta.modoOrden" value={modoOrden} onChange={handleChange}>
          <option value="por_categoria">Por categorías (por defecto)</option>
          <option value="alfabetico">Alfabético (A-Z)</option>
          <option value="precio_asc">Precio: de menor a mayor</option>
          <option value="precio_desc">Precio: de mayor a menor</option>
        </select>
      </div>

      {/* columnas */}
      <div className="config-field-row">
        <div className="config-field">
          <label>Columnas en escritorio</label>
          <select
            name="carta.columnasDesktop"
            value={form.carta?.columnasDesktop ?? "auto"}
            onChange={handleChange}
          >
            <option value="auto">Automático (recomendado)</option>
            <option value="2">2 columnas</option>
            <option value="4">4 columnas</option>
          </select>
        </div>

        <div className="config-field">
          <label>Columnas en móvil</label>
          <select
            name="carta.columnasMovil"
            value={form.carta?.columnasMovil ?? "1"}
            onChange={handleChange}
          >
            <option value="1">1 columna</option>
            <option value="2">2 columnas</option>
          </select>
        </div>
      </div>
    </section>
  );
}
