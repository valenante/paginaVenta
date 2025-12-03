// src/components/AlefSelect/AlefSelect.jsx
import React, { useState, useRef, useEffect } from "react";
import "./AlefSelect.css";

export default function AlefSelect({
  label,
  value,
  options = [],
  onChange,
  placeholder,
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef();

  /* ================================
   * Cerrar cuando clicas fuera
   * ================================ */
  useEffect(() => {
    const close = (e) => {
      if (ref.current && !ref.current.contains(e.target)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", close);
    return () => document.removeEventListener("mousedown", close);
  }, []);

  /* ================================
   * Normalizar opciones SIEMPRE:
   *  - string → {label, value}
   *  - object → se usa tal cual
   * ================================ */
  const normalizeOption = (opt) => {
    if (!opt) return null;

    if (typeof opt === "string") {
      return { label: opt, value: opt };
    }

    if (typeof opt === "object" && opt.value) {
      return {
        label: opt.label ?? opt.value,
        value: opt.value,
      };
    }

    return null;
  };

  const normalizedOptions = options
    .map(normalizeOption)
    .filter(Boolean); // evitar nulls

  /* ================================
   * Seleccionado actual
   * ================================ */
  const selected = normalizedOptions.find((o) => o.value === value) || null;

  /* ================================
   * Render
   * ================================ */
  return (
    <div className="alef-select-wrapper" ref={ref}>
      {label && <label className="alef-select-label">{label}</label>}

      <div
        className="alef-select-trigger"
        onClick={() => setOpen((prev) => !prev)}
      >
        <span>{selected?.label || placeholder || "Seleccionar..."}</span>
        <div className="alef-select-arrow">▾</div>
      </div>

      {open && (
        <div className="alef-select-menu">
          {normalizedOptions.length === 0 && (
            <div className="alef-select-option disabled">
              Sin opciones
            </div>
          )}

          {normalizedOptions.map((opt, index) => (
            <div
              key={`${opt.value}-${index}`}
              className={`alef-select-option ${
                value === opt.value ? "selected" : ""
              }`}
              onClick={() => {
                onChange(opt.value); // ← SIEMPRE string correcto
                setOpen(false);
              }}
            >
              {opt.label}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
