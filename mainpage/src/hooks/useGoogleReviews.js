import { useCallback, useEffect, useState } from "react";
import api from "../utils/api";

const BASE = "/admin/google";

// ─── Status de la integración ────────────────────────────
export function useGoogleStatus() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetch = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const { data: res } = await api.get(`${BASE}/status`);
      setData(res);
    } catch (err) {
      setError(err?.response?.data?.message || err.message || "Error");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetch(); }, [fetch]);

  return { data, loading, error, refetch: fetch };
}

// ─── Listado de reseñas (paginado + filtro) ──────────────
export function useGoogleReviews({ status, page = 1, limit = 20 } = {}) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetch = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const params = { page, limit };
      if (status) params.status = status;
      const { data: res } = await api.get(`${BASE}/reviews`, { params });
      setData(res);
    } catch (err) {
      setError(err?.response?.data?.message || err.message || "Error");
    } finally {
      setLoading(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [status, page, limit]);

  useEffect(() => { fetch(); }, [fetch]);

  return { data, loading, error, refetch: fetch };
}

// ─── Reseñas pendientes ──────────────────────────────────
export function useGooglePending() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetch = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const { data: res } = await api.get(`${BASE}/reviews/pending`);
      setData(res);
    } catch (err) {
      setError(err?.response?.data?.message || err.message || "Error");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetch(); }, [fetch]);

  return { data, loading, error, refetch: fetch };
}

// ─── Acciones ────────────────────────────────────────────
// `respuesta` AUSENTE = publicar el borrador tal cual. Desde R2-ART16 el backend exige entonces la
// `huellaBorrador` (sha256 del texto que saldría) del borrador que el dueño VIO, tal como llegó en el
// GET: sin huella ⇒ 400; distinta ⇒ 409 `BORRADOR_CAMBIADO` (alguien/algo lo cambió entretanto).
// Presente = el texto editado por el dueño (`googleApproveSchema`, 1..4000): lo que ve es lo que manda.
export async function approveReview(id, respuesta, huellaBorrador) {
  const { data } = respuesta === undefined
    ? await api.post(`${BASE}/reviews/${id}/approve`, { huellaBorrador })
    : await api.post(`${BASE}/reviews/${id}/approve`, { respuesta });
  return data;
}

/** ¿El 409 dice que el borrador cambió desde que se abrió? */
export function esBorradorCambiado(err) {
  const d = err?._server || err?.response?._server || err?.response?.data || {};
  return d.code === "BORRADOR_CAMBIADO";
}

// Guarda el borrador editado SIN publicar (PUT /reviews/:id/borrador).
export async function saveDraftReview(id, respuesta) {
  const { data } = await api.put(`${BASE}/reviews/${id}/borrador`, { respuesta });
  return data;
}

// Publica un texto PROPIO (también tras rechazar el borrador IA). POST /reviews/:id/responder.
export async function respondReview(id, respuesta) {
  const { data } = await api.post(`${BASE}/reviews/${id}/responder`, { respuesta });
  return data;
}

// ─── Onboarding: cuenta y ficha de Google Business ───────
export async function listGoogleAccounts() {
  const { data } = await api.get(`${BASE}/accounts`);
  return data?.accounts || [];
}

// ⚠️ SUPUESTO / CONTRATO PROPUESTO: el backend de hoy (`googleReviewsRoutes.js` GET /locations)
// lista las fichas de la cuenta YA GUARDADA en el tenant e ignora `accountId`; y la única forma
// de guardar la cuenta (PUT /location) exige también `locationId`. Se manda `accountId` en la
// query para que el backend pueda leerlo; mientras no lo haga, un tenant recién conectado
// recibirá 409 GOOGLE_SIN_NEGOCIO y la pantalla enseña ese mensaje (no lo traga).
export async function listGoogleLocations(accountId) {
  const { data } = await api.get(`${BASE}/locations`, { params: accountId ? { accountId } : undefined });
  return data?.locations || [];
}

export async function selectGoogleLocation({ accountId, locationId, locationName }) {
  const { data } = await api.put(`${BASE}/location`, { accountId, locationId, locationName: locationName || "" });
  return data;
}

export async function rejectReview(id, reason) {
  const { data } = await api.post(`${BASE}/reviews/${id}/reject`, { reason });
  return data;
}

export async function updateGoogleConfig(payload) {
  const { data } = await api.put(`${BASE}/config`, payload);
  return data;
}

export async function getAuthUrl() {
  const { data } = await api.get(`${BASE}/auth-url`);
  return data;
}

export async function disconnectGoogle() {
  const { data } = await api.delete(`${BASE}/disconnect`);
  return data;
}
