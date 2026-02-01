import React from "react";
import "./FacturasHelpModal.css";

export default function FacturasHelpModal({ onClose }) {
  return (
    <div className="facturashelp-overlay" onClick={onClose}>
      <div className="facturashelp-modal" onClick={(e) => e.stopPropagation()}>
        <header className="facturashelp-header">
          <div>
            <h2>Ayuda — Facturas Encadenadas</h2>
            <p>
              Aquí tienes una guía rápida para entender qué puedes hacer en esta pantalla y cómo
              funcionan las rectificaciones según criterios habituales de la AEAT.
            </p>
          </div>

          <button className="facturashelp-close" onClick={onClose} aria-label="Cerrar">
            ✕
          </button>
        </header>

        <div className="facturashelp-body">
          {/* BLOQUE: QUÉ PUEDO HACER */}
          <section className="facturashelp-section">
            <h3>Qué puedes hacer en esta pantalla</h3>

            <div className="facturashelp-grid">
              <article className="facturashelp-card">
                <h4>🔎 Buscar y filtrar</h4>
                <p>
                  Filtra por <strong>año</strong> o por <strong>rango de fechas</strong>. También
                  puedes buscar por <strong>número de factura</strong>, <strong>NIF</strong> o{" "}
                  <strong>hash</strong>.
                </p>
              </article>

              <article className="facturashelp-card">
                <h4>📤 Exportar (CSV / PDF)</h4>
                <p>
                  Exporta el listado actual respetando los filtros. El CSV sirve para Excel; el PDF
                  es ideal para compartir o archivar.
                </p>
              </article>

              <article className="facturashelp-card">
                <h4>✏️ Rectificar</h4>
                <p>
                  Crea una <strong>factura rectificativa</strong> asociada a una factura anterior
                  para corregir datos o importes.
                </p>
                <p className="facturashelp-note">
                  La rectificación no elimina la original: genera un documento nuevo que la corrige.
                </p>
              </article>

              <article className="facturashelp-card">
                <h4>🗑 Anular</h4>
                <p>
                  Marca una factura como <strong>anulada</strong>. Es una acción irreversible, pensada
                  para casos de emisión errónea o invalidación interna del registro.
                </p>
              </article>

              <article className="facturashelp-card">
                <h4>📄 Ver XML</h4>
                <p>
                  Abre el <strong>XML firmado</strong> (si existe). Es el documento técnico que
                  respalda la trazabilidad y la integridad del registro.
                </p>
              </article>

              <article className="facturashelp-card">
                <h4>🏛 Ver respuesta AEAT</h4>
                <p>
                  Si existe, muestra la respuesta asociada a la comunicación con la <strong>AEAT</strong>.
                  Útil para auditorías o trazabilidad del envío.
                </p>
              </article>
            </div>
          </section>

          {/* BLOQUE: ESTADOS */}
          <section className="facturashelp-section">
            <h3>Estados típicos</h3>
            <div className="facturashelp-tags">
              <span className="facturashelp-tag ok">Correcto</span>
              <span className="facturashelp-tag warn">Enviado</span>
              <span className="facturashelp-tag bad">Incorrecto</span>
              <span className="facturashelp-tag neutral">Anulada</span>
            </div>
            <p className="facturashelp-muted">
              Nota: los nombres exactos pueden variar según tu implementación, pero la idea es la misma:
              indicar si la factura es válida, si está enviada, si tuvo error o si fue anulada.
            </p>
          </section>

          {/* BLOQUE: TIPOS AEAT */}
          <section className="facturashelp-section">
            <h3>Tipos de rectificación (AEAT) — R1 a R5</h3>
            <p className="facturashelp-muted">
              En la rectificación eliges el tipo según el motivo. Estos códigos se usan de forma habitual
              en sistemas fiscales. Si tienes dudas en un caso real, consulta con tu asesoría.
            </p>

            <div className="facturashelp-aeat">
              <div className="facturashelp-aeat-item">
                <div className="facturashelp-aeat-code">R1</div>
                <div>
                  <h4>Sustitución</h4>
                  <p>
                    Rectifica <strong>sustituyendo completamente</strong> la factura original
                    (cuando el error es global: datos, importes, etc.).
                  </p>
                </div>
              </div>

              <div className="facturashelp-aeat-item">
                <div className="facturashelp-aeat-code">R2</div>
                <div>
                  <h4>Diferencias</h4>
                  <p>
                    Rectifica por <strong>diferencias</strong>: ajusta importes (base/IVA/total)
                    respecto a la original sin reemplazarla por completo.
                  </p>
                </div>
              </div>

              <div className="facturashelp-aeat-item">
                <div className="facturashelp-aeat-code">R3</div>
                <div>
                  <h4>Devolución</h4>
                  <p>
                    Para <strong>devoluciones</strong> (total o parcial) cuando hay que reflejarlo
                    fiscalmente.
                  </p>
                </div>
              </div>

              <div className="facturashelp-aeat-item">
                <div className="facturashelp-aeat-code">R4</div>
                <div>
                  <h4>Descuento</h4>
                  <p>
                    Para <strong>descuentos posteriores</strong> a la factura original (abonos/acuerdos
                    después de la venta).
                  </p>
                </div>
              </div>

              <div className="facturashelp-aeat-item">
                <div className="facturashelp-aeat-code">R5</div>
                <div>
                  <h4>Simplificada</h4>
                  <p>
                    Rectificación vinculada a <strong>facturas simplificadas</strong> (tickets) cuando
                    procede identificar destinatario u otros datos.
                  </p>
                </div>
              </div>
            </div>

            <div className="facturashelp-subtipos">
              <h4>Subtipo (solo para R1 y R2)</h4>
              <ul>
                <li>
                  <strong>S — Sustitución:</strong> reemplaza completamente la factura original.
                </li>
                <li>
                  <strong>I — Diferencias:</strong> corrige solo las diferencias respecto a la original.
                </li>
              </ul>
            </div>
          </section>

          {/* FOOTER */}
          <footer className="facturashelp-footer">
            <button className="facturashelp-btn" onClick={onClose}>
              Entendido
            </button>
          </footer>
        </div>
      </div>
    </div>
  );
}
