import { useState } from "react";

const defaultConfig = {
  permitePedidosComida: true,
  permitePedidosBebida: true,
  stockHabilitado: true,
  colores: {
    principal: "#6A0DAD",
    secundario: "#FF6700",
  },
  metodosPago: {
    efectivo: true,
    tarjeta: true,
    bizum: false,
    transferencia: false,
    propina: true,
  },
  reservas: {
    habilitadas: true,
    confirmacionAutomatica: false,
    limitePorDia: 40,
  },
  informacionRestaurante: {
    telefono: "",
    direccion: "",
    diasApertura: ["Lunes", "Martes", "Miércoles", "Jueves", "Viernes"],
    horarios: {
      comida: "13:00 - 17:00",
      cena: "20:00 - 24:00",
    },
  },
};

export function useTenantForm(initial = {}) {
  const [tenant, setTenant] = useState(initial.tenant || { nombre: "", email: "", plan: "gratis" });
  const [admin, setAdmin] = useState(initial.admin || { name: "", password: "" });
  const [config, setConfig] = useState(initial.config || defaultConfig);
  const [pago, setPago] = useState(initial.pago || { metodo: "manual", idPago: "dev-mode" });

  return { tenant, setTenant, admin, setAdmin, config, setConfig, pago, setPago };
}
