import React from "react";
import { useState } from "react";
import Modal from "react-modal";
import api from "../../../../utils/api";
import { useTenantForm } from "../../../../Hooks/useTenantForm";

Modal.setAppElement("#root");

export default function NuevoTenantModal({ isOpen, onClose, onCreated }) {
  const { tenant, setTenant, admin, setAdmin, config, setConfig, pago } = useTenantForm();
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState(null);

  const handleChange = (setFn) => (e) => {
    const { name, value, type, checked } = e.target;
    setFn((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));
  };

  const handleColorChange = (e) => {
    const { name, value } = e.target;
    setConfig((prev) => ({
      ...prev,
      colores: { ...prev.colores, [name]: value },
    }));
  };

  const handleInfoChange = (e) => {
    const { name, value } = e.target;
    setConfig((prev) => ({
      ...prev,
      informacionRestaurante: { ...prev.informacionRestaurante, [name]: value },
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage(null);

    try {
      const payload = { tenant, admin, config, pago };
      const { data } = await api.post("/superadmin/crear-tenant-avanzado", payload);
      setMessage(`✅ Restaurante ${data.tenant.nombre} creado correctamente.`);
      onCreated();
      setTimeout(() => onClose(), 2500);
    } catch (err) {
      console.error(err);
      setMessage("❌ Error al crear restaurante. Revisa los datos.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onRequestClose={onClose}
      className="tenant-modal"
      overlayClassName="modal-overlay"
    >
      <h2>Nuevo Restaurante</h2>

      <form onSubmit={handleSubmit} className="tenant-form">
        {/* ====== DATOS BÁSICOS ====== */}
        <label>Nombre del restaurante</label>
        <input name="nombre" value={tenant.nombre} onChange={handleChange(setTenant)} required />

        <label>Email del dueño</label>
        <input type="email" name="email" value={tenant.email} onChange={handleChange(setTenant)} required />

        <label>Plan</label>
        <select name="plan" value={tenant.plan} onChange={handleChange(setTenant)}>
          <option value="gratis">Gratis</option>
          <option value="premium">Premium</option>
          <option value="enterprise">Enterprise</option>
        </select>

        <hr />

        {/* ====== ADMIN ====== */}
        <h4>Administrador principal</h4>
        <label>Nombre</label>
        <input name="name" value={admin.name} onChange={handleChange(setAdmin)} required />

        <label>Contraseña</label>
        <input type="password" name="password" value={admin.password} onChange={handleChange(setAdmin)} required />

        <hr />

        {/* ====== CONFIGURACIÓN INICIAL ====== */}
        <h4>Configuración inicial</h4>

        <div className="config-section">
          <label>
            <input
              type="checkbox"
              name="permitePedidosComida"
              checked={config.permitePedidosComida}
              onChange={handleChange(setConfig)}
            />
            Permitir pedidos de comida
          </label>

          <label>
            <input
              type="checkbox"
              name="permitePedidosBebida"
              checked={config.permitePedidosBebida}
              onChange={handleChange(setConfig)}
            />
            Permitir pedidos de bebida
          </label>

          <label>
            <input
              type="checkbox"
              name="stockHabilitado"
              checked={config.stockHabilitado}
              onChange={handleChange(setConfig)}
            />
            Habilitar control de stock
          </label>
        </div>

        {/* ====== COLORES ====== */}
        <div className="color-picker">
          <label>Color principal</label>
          <input type="color" name="principal" value={config.colores.principal} onChange={handleColorChange} />
          <label>Color secundario</label>
          <input type="color" name="secundario" value={config.colores.secundario} onChange={handleColorChange} />
        </div>

        {/* ====== INFORMACIÓN RESTAURANTE ====== */}
        <h4>Información del restaurante</h4>
        <label>Teléfono</label>
        <input name="telefono" value={config.informacionRestaurante.telefono} onChange={handleInfoChange} />

        <label>Dirección</label>
        <input name="direccion" value={config.informacionRestaurante.direccion} onChange={handleInfoChange} />

        <label>Días de apertura</label>
        <div className="dias-apertura">
          {["Lunes", "Martes", "Miércoles", "Jueves", "Viernes", "Sábado", "Domingo"].map((dia) => (
            <label key={dia}>
              <input
                type="checkbox"
                checked={config.informacionRestaurante.diasApertura.includes(dia)}
                onChange={(e) => {
                  const checked = e.target.checked;
                  setConfig((prev) => {
                    const dias = new Set(prev.informacionRestaurante.diasApertura);
                    checked ? dias.add(dia) : dias.delete(dia);
                    return {
                      ...prev,
                      informacionRestaurante: {
                        ...prev.informacionRestaurante,
                        diasApertura: Array.from(dias),
                      },
                    };
                  });
                }}
              />
              {dia}
            </label>
          ))}
        </div>

        <label>Horario (comida)</label>
        <input
          type="text"
          name="comida"
          value={config.informacionRestaurante.horarios.comida}
          onChange={(e) =>
            setConfig((prev) => ({
              ...prev,
              informacionRestaurante: {
                ...prev.informacionRestaurante,
                horarios: { ...prev.informacionRestaurante.horarios, comida: e.target.value },
              },
            }))
          }
        />

        <label>Horario (cena)</label>
        <input
          type="text"
          name="cena"
          value={config.informacionRestaurante.horarios.cena}
          onChange={(e) =>
            setConfig((prev) => ({
              ...prev,
              informacionRestaurante: {
                ...prev.informacionRestaurante,
                horarios: { ...prev.informacionRestaurante.horarios, cena: e.target.value },
              },
            }))
          }
        />

        {message && <p className="form-message">{message}</p>}

        <button type="submit" disabled={loading}>
          {loading ? "Creando..." : "Crear Restaurante"}
        </button>
      </form>

      <button className="close-btn" onClick={onClose}>
        Cerrar
      </button>
    </Modal>
  );
}
