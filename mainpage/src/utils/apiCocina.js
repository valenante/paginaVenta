import api from "./api";

/**
 * ============================================
 * 📌 Cargar pedidos pendientes (platos y tapas)
 * ============================================
 */
export async function cargarPedidosAPI() {
  try {
    const { data } = await api.get("/pedidos/pendientes", {
      params: { tipo: ["plato", "tapaRacion"] },
    });
    return data?.data || [];
  } catch (err) {
    console.error("❌ Error cargarPedidosAPI:", err);
    throw err;
  }
}

/**
 * ============================================
 * 📌 Cargar mesas abiertas
 * ============================================
 */
export async function cargarMesasAPI() {
  try {
    const { data } = await api.get("/mesas/abiertas");
    return data?.data || [];
  } catch (err) {
    console.error("❌ Error cargarMesasAPI:", err);
    throw err;
  }
}

/**
 * ============================================
 * 📌 Cargar resumen de productos listos
 * ============================================
 */
export async function cargarProductosListosAPI() {
  try {
    const { data } = await api.get("/cocina/productos-listos");
    return data;
  } catch (err) {
    console.error("❌ Error cargarProductosListosAPI:", err);
    throw err;
  }
}

/**
 * ============================================
 * 📌 Marcar un item como listo/pending
 * ============================================
 */
export async function cambiarEstadoItemAPI(pedidoId, itemId, estado) {
  try {
    await api.post(`/cocina/${pedidoId}/items/${itemId}/estado`, { estado });
  } catch (err) {
    console.error(
      `❌ Error cambiarEstadoItemAPI (${pedidoId}, ${itemId}):`,
      err
    );
    throw err;
  }
}

/**
 * ============================================
 * 📌 Marcar un pedido COMPLETO como listo
 * ============================================
 */
export async function marcarPedidoComoListoAPI(pedidoId) {
  try {
    await api.put(`/pedidos/${pedidoId}`, { estado: "listo" });
  } catch (err) {
    console.error(`❌ Error marcarPedidoComoListoAPI (${pedidoId}):`, err);
    throw err;
  }
}

/**
 * ============================================
 * 📌 Cerrar estación del pedido (frío, frito o plancha)
 * ============================================
 */
export async function cerrarSeccionAPI(pedidoId, estacion) {
  try {
    await api.put(`/pedidos/${pedidoId}/cerrar-estacion`, { estacion });
  } catch (err) {
    console.error(
      `❌ Error cerrarSeccionAPI (${pedidoId}, ${estacion}):`,
      err
    );
    throw err;
  }
}

/**
 * ============================================
 * 📌 Solicitar item (enviar desde central a otra estación)
 * ============================================
 */
export async function solicitarItemAPI(pedidoId, itemId, destino) {
  try {
    await api.post(`/cocina/${pedidoId}/items/${itemId}/solicitar`, {
      solicitadoA: destino,
      solicitadoPor: "frito",
    });
  } catch (err) {
    console.error("❌ Error solicitarItemAPI:", err);
    throw err;
  }
}

/* ============================================================
   📌 📌 📌  SECCIONES DINÁMICAS (CRUD COMPLETO) 📌 📌 📌
   ============================================================ */

/**
 * Obtener todas las secciones
 */
export async function cargarSeccionesAPI() {
  try {
    const { data } = await api.get("/secciones", {
      params: { destino: "cocina" }
    });
    return data;
  } catch (err) {
    console.error("❌ Error cargarSeccionesCocinaAPI:", err);
    throw err;
  }
}

/**
 * Crear una nueva sección
 */
export async function crearSeccionAPI(seccion) {
  try {
    const { data } = await api.post("/secciones", seccion);
    return data;
  } catch (err) {
    console.error("❌ Error crearSeccionAPI:", err);
    throw err;
  }
}

/**
 * Actualizar una sección
 */
export async function actualizarSeccionAPI(id, seccion) {
  try {
    const { data } = await api.put(`/secciones/${id}`, seccion);
    return data;
  } catch (err) {
    console.error(`❌ Error actualizarSeccionAPI (${id}):`, err);
    throw err;
  }
}

/**
 * Eliminar una sección
 */
export async function eliminarSeccionAPI(id) {
  try {
    const { data } = await api.delete(`/secciones/${id}`);
    return data;
  } catch (err) {
    console.error(`❌ Error eliminarSeccionAPI (${id}):`, err);
    throw err;
  }
}

export async function cargarEstacionesAPI() {
  const { data } = await api.get("/estaciones", {
    params: { destino: "cocina" },
  });
  return data;
}

/**
 * Crear una nueva estación
 */
export async function crearEstacionAPI(estacion) {
  try {
    const { data } = await api.post("/estaciones", estacion);
    return data;
  } catch (err) {
    console.error("❌ Error crearEstacionAPI:", err);
    throw err;
  }
}

/**
 * Actualizar una estación
 */
export async function actualizarEstacionAPI(id, estacion) {
  try {
    const { data } = await api.put(`/estaciones/${id}`, estacion);
    return data;
  } catch (err) {
    console.error(`❌ Error actualizarEstacionAPI (${id}):`, err);
    throw err;
  }
}

/**
 * Eliminar una estación
 */
export async function eliminarEstacionAPI(id) {
  try {
    const { data } = await api.delete(`/estaciones/${id}`);
    return data;
  } catch (err) {
    console.error(`❌ Error eliminarEstacionAPI (${id}):`, err);
    throw err;
  }
}