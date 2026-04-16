import React, { useEffect, useMemo, useState } from "react";
import ModalBase from "./ModalBase";
import api from "../../utils/api";
import "./ModalCrearMesa.css";

function suggestPositionPct(mesasZona) {
  const used = (mesasZona || [])
    .map((m) => m?.posicion)
    .filter(Boolean)
    .map((p) => ({ x: Number(p.x ?? 0), y: Number(p.y ?? 0) }));

  const step = 10;
  const minDist = 8;

  for (let y = 5; y <= 95; y += step) {
    for (let x = 5; x <= 95; x += step) {
      const ok = used.every((u) => {
        const dx = u.x - x;
        const dy = u.y - y;
        return Math.sqrt(dx * dx + dy * dy) >= minDist;
      });
      if (ok) return { x, y };
    }
  }
  return { x: 5, y: 5 };
}

export default function ModalCrearMesa({
  open,
  onClose,
  zonaDefault,
  mesasZona,
  onCreated,
}) {
  const [numero, setNumero] = useState("");
  const [zona, setZona] = useState(zonaDefault || "interior");
  const [capacidad, setCapacidad] = useState("");

  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState("");

  useEffect(() => {
    if (!open) return;
    setNumero("");
    setZona(zonaDefault || "interior");
    setCapacidad("");
    setErr("");
  }, [open, zonaDefault]);

  const suggestedPos = useMemo(
    () => suggestPositionPct(mesasZona || []),
    [mesasZona]
  );

  const submit = async (e) => {
    e.preventDefault();
    if (loading) return;

    setErr("");
    setLoading(true);
    try {
      // Numero ahora es String canónico. Acepta "12", "S1", "T2", "REC1".
      const numeroCanonico = String(numero).trim().toUpperCase();
      if (!/^[A-Z]{0,3}\d+$/.test(numeroCanonico)) {
        setErr("Formato inválido. Usa dígitos (12) o letra+número (s1, t2, rec1).");
        setLoading(false);
        return;
      }
      await api.post("/mesas", {
        numero: numeroCanonico,
        zona,
        capacidad: capacidad === "" ? undefined : Number(capacidad),
        posicion: suggestedPos,
      });

      onCreated?.();
      onClose?.();
    } catch (error) {
      const code = error?.response?.data?.code || error?.response?.data?.error || "";
      const msg = mapCrearError(code) || error?.response?.data?.message || "Error al crear la mesa.";
      setErr(msg);
    } finally {
      setLoading(false);
    }
  };

  const footer = (
    <div className="alefForm-actions">
      <button
        type="button"
        className="alefBtn ghost"
        onClick={onClose}
        disabled={loading}
      >
        Cancelar
      </button>

      <button
        type="submit"
        form="alefCrearMesaForm"
        className="alefBtn primary"
        disabled={loading}
      >
        {loading ? "Creando..." : "Crear mesa"}
      </button>
    </div>
  );

  return (
    <ModalBase
      open={open}
      title="Crear nueva mesa"
      subtitle="Se creará con una posición inicial sugerida en el plano."
      onClose={onClose}
      footer={footer}
      width={640}
    >
      <form id="alefCrearMesaForm" onSubmit={submit} className="alefForm">
        <div className="alefForm-grid">
          <label className="alefField">
            <span className="alefField-label">Número</span>
            <input
              className="alefField-input"
              type="text"
              inputMode="text"
              maxLength="10"
              pattern="[A-Za-z]{0,3}\d+"
              value={numero}
              onChange={(e) => setNumero(e.target.value)}
              required
              autoFocus
              placeholder="Ej: 12, S1, T2, R1"
              title="Solo dígitos o letra+número (s1, t2, rec1)"
            />
          </label>

          <label className="alefField">
            <span className="alefField-label">Zona</span>
            <select
              className="alefField-input"
              value={zona}
              onChange={(e) => setZona(e.target.value)}
            >
              <option value="interior">Interior</option>
              <option value="exterior">Terraza</option>
              <option value="auxiliar">Auxiliar</option>
            </select>
          </label>

          <label className="alefField">
            <span className="alefField-label">Capacidad (opcional)</span>
            <input
              className="alefField-input"
              type="number"
              min="1"
              value={capacidad}
              onChange={(e) => setCapacidad(e.target.value)}
              placeholder="Ej: 4"
            />
          </label>
        </div>

        <div className="alefHint">
          🧭 Posición inicial sugerida:{" "}
          <b>{Math.round(suggestedPos.x)}%</b> / <b>{Math.round(suggestedPos.y)}%</b>
        </div>

        {err && <div className="alefError">{err}</div>}
      </form>
    </ModalBase>
  );
}

function mapCrearError(code) {
  const map = {
    MESA_YA_EXISTE: "Ya existe una mesa con ese número.",
    NUMERO_INVALIDO: "El número de mesa no es válido.",
    ZONA_INVALIDA: "La zona seleccionada no es válida.",
    CAPACIDAD_INVALIDA: "La capacidad debe ser un número mayor a 0.",
    VALIDATION_ERROR: "Datos inválidos. Revisa los campos.",
  };
  return map[code] || null;
}
