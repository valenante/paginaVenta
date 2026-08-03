import React from "react";
import "./CartaOrdenSection.css";

export default function CartaOrdenSection({ form, handleChange }) {
  const modoOrden = form?.carta?.modoOrden || "por_categoria";

  return (
    <section className="config-section">
      <div className="config-section-header">
        <h3 className="section-title">Opciones de la carta</h3>
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
          name="carta.mostrarAgotados"
          checked={form.carta?.mostrarAgotados !== false}
          onChange={handleChange}
        />
        <span>Mostrar productos agotados</span>
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

      <label className="checkbox-row">
        <input
          type="checkbox"
          name="carta.mostrarPreciosCarrito"
          checked={form.carta?.mostrarPreciosCarrito !== false}
          onChange={handleChange}
        />
        <span>Mostrar precios en el carrito</span>
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

      {/* Presentación del cuerpo (F5) — cómo se ven los platos */}
      <div className="config-section-header" style={{ marginTop: "1.25rem" }}>
        <h3 className="section-title">Presentación de los platos</h3>
        <p className="section-description">
          Cambia cómo se muestran las tarjetas de producto y las secciones. El valor por
          defecto deja la carta exactamente como está ahora.
        </p>
      </div>

      <div className="config-field-row">
        <div className="config-field">
          <label>Estilo de las tarjetas</label>
          <select
            name="carta.presentacion.layoutCuerpo"
            value={form.carta?.presentacion?.layoutCuerpo ?? "tarjeta"}
            onChange={handleChange}
          >
            <option value="tarjeta">Tarjeta (por defecto)</option>
            <option value="compacta">Compacta (foto a un lado)</option>
            <option value="lista">Lista (fila con foto pequeña)</option>
          </select>
        </div>

        <div className="config-field">
          <label>Densidad</label>
          <select
            name="carta.presentacion.densidad"
            value={form.carta?.presentacion?.densidad ?? "comoda"}
            onChange={handleChange}
          >
            <option value="comoda">Cómoda (por defecto)</option>
            <option value="compacta">Compacta (más apretada)</option>
          </select>
        </div>
      </div>

      <div className="config-field">
        <label>Secciones de categorías</label>
        <select
          name="carta.presentacion.dispositivoSecciones"
          value={form.carta?.presentacion?.dispositivoSecciones ?? "apilado"}
          onChange={handleChange}
        >
          <option value="apilado">Apiladas (por defecto)</option>
          <option value="acordeon">Acordeón (plegar/desplegar cada categoría)</option>
        </select>
      </div>
    </section>
  );
}
