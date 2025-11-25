import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import api from "../utils/api";
import "../styles/Registro.css";

import Paso1DatosRestaurante from "../components/Registro/Paso1DatosRestaurante.jsx";
import Paso2ConfiguracionBasica from "../components/Registro/Paso2ConfiguracionBasica.jsx";
import Paso3ServiciosExtras from "../components/Registro/Paso3ServiciosExtras.jsx";
import Paso4ResumenPago from "../components/Registro/Paso4ResumenPago.jsx";
import PanelPrecio from "../components/Registro/PanelPrecio.jsx";

export default function Registro() {
  const navigate = useNavigate();
  const [paso, setPaso] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  // ======== ESTADOS PRINCIPALES ========
  const [tenant, setTenant] = useState({ nombre: "", email: "", plan: "premium" });
  const [admin, setAdmin] = useState({ name: "", password: "", admin: "" });

  const params = new URLSearchParams(window.location.search);
  const planSlug = params.get("plan");

  useEffect(() => {
    if (!planSlug) {
      navigate("/?seleccionarPlan=1");
    }
  }, []);

  const [config, setConfig] = useState({
    permitePedidosComida: true,
    permitePedidosBebida: true,
    stockHabilitado: true,
    colores: { principal: "#6A0DAD", secundario: "#FF6700" },
    informacionRestaurante: { telefono: "", direccion: "" },
  });
  const [planSeleccionado, setPlanSeleccionado] = useState(null);
  const [precioBasePlan, setPrecioBasePlan] = useState(0);
  const [servicios, setServicios] = useState({
    vozCocina: false,
    vozComandas: false,
    impresoras: 0,
    pantallas: 0,
    pda: 0,
    fotografia: false,
    cargaDatos: false,
  });

  const [precio, setPrecio] = useState({
    mensual: 0,
    unico: 0,
    totalPrimerMes: 0,
  });
  const [pago, setPago] = useState({ metodo: "simulado", idPago: "TEST-" + Date.now() });

  useEffect(() => {
    const cargarPlan = async () => {
      if (!planSlug) return;

      try {
        const { data } = await api.get("/superadminPlans/publicPlans");

        const encontrado = data.find((p) => p.slug.toLowerCase() === planSlug.toLowerCase());

        if (!encontrado) {
          alert("El plan seleccionado no existe.");
          navigate("/");
          return;
        }

        // 🔥 Guardar datos del plan
        setPlanSeleccionado(encontrado);

        // guardar plan en tenant
        setTenant((prev) => ({
          ...prev,
          plan: encontrado.slug,
        }));

        // actualizar precios
        setPrecio((prev) => ({
          ...prev,
          mensual: encontrado.precioMensual,
          totalPrimerMes: encontrado.precioMensual + prev.unico,
        }));

        // actualizar precio base del plan
        setPrecioBasePlan(encontrado.precioMensual);

      } catch (err) {
        console.error("Error cargando plan:", err);
      }
    };

    cargarPlan();
  }, [planSlug]);

  // ======== CALCULAR PRECIO ========
  useEffect(() => {
    const mensual =
      precioBasePlan +
      (servicios.vozCocina ? 10 : 0) +
      (servicios.vozComandas ? 10 : 0);

    const unico =
      servicios.impresoras * 150 +
      servicios.pantallas * 250 +
      servicios.pda * 180 +
      (servicios.fotografia ? 120 : 0) +
      (servicios.cargaDatos ? 100 : 0);

    setPrecio({
      mensual,
      unico,
      totalPrimerMes: mensual + unico,
    });
  }, [servicios, precioBasePlan]);

  useEffect(() => {
    const cargarPlan = async () => {
      if (!planSlug) return; // si no hay plan, se manejará después

      try {
        const { data } = await api.get("/superadminPlans/publicPlans");

        const encontrado = data.find((p) => p.slug.toLowerCase() === planSlug.toLowerCase());

        if (!encontrado) {
          alert("El plan seleccionado no existe.");
          navigate("/");
          return;
        }

        // 💾 Guardamos en tenant
        setTenant((prev) => ({
          ...prev,
          plan: encontrado.slug,
        }));

        // 💰 Actualizamos precio base según el plan
        setPrecio((prev) => ({
          ...prev,
          mensual: encontrado.precioMensual,
          totalPrimerMes: encontrado.precioMensual + prev.unico
        }));

      } catch (err) {
        console.error("Error cargando plan:", err);
      }
    };

    cargarPlan();
  }, [planSlug]);

  // ======== SUBMIT FINAL ========
  const handleSubmit = async () => {
    setLoading(true);
    setError("");
    setSuccess(false);
    try {
      await api.post("/tenants/registro-avanzado", {
        tenant,
        admin,
        config,
        servicios,
        precio,
        pago,
      });
      setSuccess(true);
      setTimeout(() => navigate("/"), 1500);
    } catch (err) {
      setError(err.response?.data?.error || "Error al registrar el restaurante.");
    } finally {
      setLoading(false);
    }
  };

  // ======== RENDER ========
  const pasos = [
    <Paso1DatosRestaurante tenant={tenant} setTenant={setTenant} admin={admin} setAdmin={setAdmin} />,
    <Paso2ConfiguracionBasica
      config={config}
      setConfig={setConfig}
      plan={planSeleccionado}
    />,
    <Paso3ServiciosExtras servicios={servicios} setServicios={setServicios} />,
    <Paso4ResumenPago
      tenant={tenant}
      admin={admin}
      config={config}
      servicios={servicios}
      precio={precio}
      pago={pago}
      onSubmit={handleSubmit}
      loading={loading}
      success={success}
      precioBasePlan={precioBasePlan}
      plan={planSeleccionado}
    />
  ];

  return (
    <main className="registro-avanzado">
      <div className="registro-container">
        <h1>Configura tu restaurante</h1>
        <p>Paso {paso} de 4</p>
        {error && <p className="registro-error">{error}</p>}
        {pasos[paso - 1]}
        <div className="registro-nav">
          {paso > 1 && <button onClick={() => setPaso(paso - 1)}>Anterior</button>}
          {paso < 4 && <button onClick={() => setPaso(paso + 1)}>Siguiente</button>}
        </div>
      </div>
      <PanelPrecio precio={precio} />
    </main>
  );
}
