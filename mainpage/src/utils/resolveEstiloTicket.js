/**
 * resolveEstiloTicket — replica en el front de la resolución del backend.
 * Aplana `estiloTicket` base + el override de `porTipo[tipo]`.
 *
 * Un override aplica SOLO si trae valor real: "", null o undefined => hereda de base.
 * `false` SÍ aplica (permite apagar un toggle solo para un tipo).
 *
 * @param {object} estiloTicket  estilo completo (con porTipo)
 * @param {string|null} tipo     "comanda" | "cuenta" | "factura" | "shop" | null (solo base)
 * @returns {object} estilo plano resuelto (sin porTipo)
 */
export function resolveEstiloTicket(estiloTicket = {}, tipo) {
  const { porTipo = {}, ...base } = estiloTicket || {};
  const ov = (tipo && porTipo && porTipo[tipo]) || {};
  const out = { ...base };
  for (const k of Object.keys(ov)) {
    const v = ov[k];
    if (v !== undefined && v !== null && v !== "") out[k] = v;
  }
  return out;
}

export default resolveEstiloTicket;
