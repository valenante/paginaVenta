import { useMemo } from "react";
import { useLocale } from "../../hooks/useLocale";
import { resolveEstiloTicket } from "../../utils/resolveEstiloTicket.js";
import "./TicketPreview.css";

const SEPARATORS = {
  linea: "_",
  guion: "-",
  igual: "=",
  punto: ".",
  espacio: " ",
};

const SIZE_CLASS = {
  normal: "tp-size-normal",
  doble_alto: "tp-size-dh",
  doble_ancho: "tp-size-dw",
  doble: "tp-size-dhw",
};

/* Frases fijas según idioma — debe reflejar lo que imprime el print server
   (es = comportamiento actual del ticket). */
const PHRASES = {
  es: { consulta: "CONSULTA", propinas: "Propinas no incluidas / Tips not included", ticket: "TICKET", qrCaption: "Escanea para más info" },
  en: { consulta: "CHECK", propinas: "Tips not included", ticket: "RECEIPT", qrCaption: "Scan for more info" },
  fr: { consulta: "ADDITION", propinas: "Pourboire non inclus", ticket: "TICKET", qrCaption: "Scannez pour plus d'infos" },
  bilingue: { consulta: "CONSULTA / CHECK", propinas: "Propinas no incluidas / Tips not included", ticket: "TICKET", qrCaption: "Escanea para más info / Scan for info" },
};

/* Mapea la clave de override (porTipo) al layout de preview a dibujar */
const LAYOUT_MAP = {
  general: "cuenta",
  comanda: "pedido",
  pedido: "pedido",
  cuenta: "cuenta",
  factura: "factura",
  shop: "shop",
};

const DUMMY_PRODUCTOS = [
  { nombre: "Paella Valenciana", cantidad: 2, precio: 14.5 },
  { nombre: "Croquetas caseras", cantidad: 1, precio: 8.0 },
  { nombre: "Vino tinto Ribera", cantidad: 1, precio: 12.0 },
  { nombre: "Agua mineral", cantidad: 2, precio: 2.5 },
];

function hr(estilo, width) {
  const ch = SEPARATORS[estilo] || "-";
  return ch.repeat(width);
}

function fmtPrice(n) {
  return Number(n || 0).toFixed(2).replace(".", ",");
}

/**
 * Vista previa de un ticket térmico — puro CSS, sin API call.
 * Se actualiza en tiempo real con cada cambio del formulario.
 *
 * Acepta el estilo COMPLETO (`estiloTicket`, con porTipo) + el `tipo` seleccionado
 * y aplica la MISMA resolución que el backend (base + porTipo[tipo]).
 * Se mantiene compatibilidad con la firma antigua (`estilo` plano + `tipoTicket`).
 */
export default function TicketPreview({
  estiloTicket = null,
  estilo: estiloFlat = null,
  tipo = null,
  tipoTicket = null,
  fiscal = {},
  logoUrl = null,
  nombreRestaurante = "",
}) {
  const { taxIdLabel, taxRates, taxAuthorityCode, taxIdPlaceholder, addressPlaceholder } = useLocale();


  // Clave de tipo (comanda/cuenta/factura/shop/general) y layout a dibujar
  const tipoKey = tipo || tipoTicket || "cuenta";
  const layout = LAYOUT_MAP[tipoKey] || "cuenta";

  // Estilo resuelto: si nos pasan el objeto completo, resolvemos base+porTipo;
  // si nos pasan el plano antiguo, lo usamos tal cual.
  const estilo = useMemo(() => {
    if (estiloTicket) {
      return resolveEstiloTicket(estiloTicket, tipoKey === "general" ? null : tipoKey);
    }
    return estiloFlat || {};
  }, [estiloTicket, estiloFlat, tipoKey]);

  const is58 = estilo.anchoPapel === "58mm";
  const width = is58 ? 32 : 48;
  const sep = hr(estilo.estiloSeparador, width);
  const ph = PHRASES[estilo.idioma] || PHRASES.es;

  const sizeTitulo = SIZE_CLASS[estilo.tamanoTitulo] || "tp-size-dh";
  const sizeProducto = SIZE_CLASS[estilo.tamanoProducto] || "tp-size-dh";
  const sizeDetalle = SIZE_CLASS[estilo.tamanoDetalle] || "tp-size-normal";
  const sizeTotal = SIZE_CLASS[estilo.tamanoTotal] || "tp-size-dhw";

  const razonSocial = fiscal?.razonSocial || fiscal?.nombreComercial || nombreRestaurante || "Mi Restaurante";
  const direccion = fiscal?.direccion || addressPlaceholder;
  const nif = fiscal?.nif || fiscal?.cif || taxIdPlaceholder;

  // Columnas de la tabla (cuenta/factura) — default = mostrar
  const showQty = estilo.mostrarColumnaCantidad !== false;
  const showPrice = estilo.mostrarColumnaPrecio !== false;
  const showAmt = estilo.mostrarColumnaImporte !== false;

  // Factura: si verifactu está activo, los datos fiscales/QR AEAT NO son ocultables
  const verifactuActivo = !!fiscal?.verifactuActivo;
  const mostrarDatosFiscales = verifactuActivo ? true : estilo.mostrarDatosFiscales !== false;

  const total = useMemo(
    () => DUMMY_PRODUCTOS.reduce((acc, p) => acc + p.cantidad * p.precio, 0),
    []
  );

  const renderTablaProductos = () =>
    DUMMY_PRODUCTOS.map((p, i) => (
      <div key={i} className="tp-table-row">
        <span className="tp-col-art">{p.nombre}</span>
        {showQty && <span className="tp-col-qty">{p.cantidad}</span>}
        {showPrice && <span className="tp-col-price">{fmtPrice(p.precio)}</span>}
        {showAmt && <span className="tp-col-amt">{fmtPrice(p.cantidad * p.precio)}</span>}
      </div>
    ));

  return (
    <div className={`tp-wrapper ${is58 ? "tp-58mm" : "tp-80mm"}`}>
      <div className="tp-paper">
        {/* Logo */}
        {estilo.logoEnTicket && logoUrl && (
          <div className="tp-logo">
            <img
              src={logoUrl}
              alt="Logo"
              style={{ maxWidth: estilo.logoAncho || 300 }}
            />
          </div>
        )}

        {/* Encabezado custom */}
        {estilo.encabezado && (
          <div className="tp-center tp-encabezado">{estilo.encabezado}</div>
        )}

        {/* Cabecera fiscal */}
        {estilo.mostrarNombreRestaurante !== false && (
          <div className={`tp-center tp-bold ${sizeTitulo}`}>{razonSocial}</div>
        )}
        {estilo.mostrarDireccion !== false && (
          <>
            <div className="tp-center">{direccion}</div>
            <div className="tp-center">{taxIdLabel}: {nif}</div>
          </>
        )}

        <div className="tp-sep">{sep}</div>

        {/* ── CUENTA ── */}
        {layout === "cuenta" && (
          <>
            <div className={`tp-center tp-bold ${sizeTitulo}`}>Mesa N.o 5</div>
            <div className="tp-row">
              <span>{ph.consulta}</span>
              <span>27/03/2026 14:30</span>
            </div>
            <div className="tp-sep">{sep}</div>

            {/* Tabla productos */}
            <div className="tp-table-header">
              <span className="tp-col-art">Articulo</span>
              {showQty && <span className="tp-col-qty">Ctd</span>}
              {showPrice && <span className="tp-col-price">Precio</span>}
              {showAmt && <span className="tp-col-amt">Importe</span>}
            </div>
            <div className="tp-sep">{sep}</div>

            {renderTablaProductos()}

            <div className="tp-sep">{sep}</div>
            <div className={`tp-row tp-bold ${sizeTotal}`}>
              <span>TOTAL:</span>
              <span>{fmtPrice(total)}</span>
            </div>
            <div className="tp-sep">{sep}</div>
            <div className="tp-center tp-small">
              {ph.propinas}
            </div>
          </>
        )}

        {/* ── COMANDA (pedido) ── */}
        {layout === "pedido" && (
          <>
            <div className={`tp-center tp-bold ${sizeTitulo}`}>PEDIDO</div>
            <div className="tp-sep">{sep}</div>
            <div className="tp-center">Mesa N.o 5</div>
            <div className="tp-sep">{sep}</div>
            <div className="tp-row">
              <span>27/03/2026</span>
              <span>14:30:22</span>
            </div>
            {estilo.mostrarComensales === true && <div>Comensales: 4</div>}
            {estilo.mostrarAlergias === true && (
              <div className="tp-bold">Alergias: Gluten, Frutos secos</div>
            )}
            <div className="tp-sep">{sep}</div>

            {DUMMY_PRODUCTOS.map((p, i) => (
              <div key={i} className="tp-producto">
                <div className={`tp-bold ${sizeProducto}`}>
                  {p.cantidad} {p.nombre}
                </div>
                {i === 0 && (
                  <div className={`tp-detalle ${sizeDetalle}`}>
                    Msg: Sin sal
                  </div>
                )}
                {i === 1 && (
                  <div className={`tp-detalle ${sizeDetalle}`}>
                    Extras: Salsa brava
                  </div>
                )}
              </div>
            ))}

            <div className="tp-sep">{sep}</div>
            <div className="tp-row">
              <span>OPR: Camarero 1</span>
              <span>[Puesto 01]</span>
            </div>
          </>
        )}

        {/* ── FACTURA ── */}
        {layout === "factura" && (
          <>
            <div className={`tp-center tp-bold ${sizeTitulo}`}>FACTURA</div>
            <div className="tp-sep">{sep}</div>
            {mostrarDatosFiscales && (
              <>
                <div className="tp-center tp-bold">Datos del cliente</div>
                <div className="tp-center">Juan Garcia Lopez</div>
                <div className="tp-center">{taxIdLabel}: {taxIdPlaceholder}</div>
                <div className="tp-sep">{sep}</div>
              </>
            )}
            <div className="tp-row">
              <span>Factura: 2026-0042</span>
              <span>27/03/2026</span>
            </div>
            <div>Mesa N.o 5{estilo.mostrarComensales === true ? " Comensales: 4" : ""}</div>
            <div className="tp-sep">{sep}</div>

            {/* Tabla productos */}
            <div className="tp-table-header">
              <span className="tp-col-art">Articulo</span>
              {showQty && <span className="tp-col-qty">Ctd</span>}
              {showPrice && <span className="tp-col-price">Precio</span>}
              {showAmt && <span className="tp-col-amt">Importe</span>}
            </div>
            <div className="tp-sep">{sep}</div>

            {renderTablaProductos()}

            <div className="tp-sep">{sep}</div>
            {mostrarDatosFiscales && (
              <>
                <div className="tp-row">
                  <span>Base imponible:</span>
                  <span>{fmtPrice(total / (1 + taxRates.comida / 100))}</span>
                </div>
                <div className="tp-row">
                  <span>IVA {taxRates.comida}% (incluido):</span>
                  <span>{fmtPrice(total - total / (1 + taxRates.comida / 100))}</span>
                </div>
              </>
            )}
            <div className={`tp-row tp-bold ${sizeTotal}`}>
              <span>TOTAL:</span>
              <span>{fmtPrice(total)}</span>
            </div>
            <div className="tp-sep">{sep}</div>
            <div className="tp-center tp-small">
              Hash: a1b2c3d4e5f6...
            </div>

            {/* QR AEAT — sagrado: siempre en factura fiscal */}
            <div className="tp-qr-placeholder">
              <div className="tp-qr-box">QR</div>
              <div className="tp-small">QR tributario {taxAuthorityCode}</div>
            </div>
          </>
        )}

        {/* ── TIENDA (shop) ── */}
        {layout === "shop" && (
          <>
            <div className={`tp-center tp-bold ${sizeTitulo}`}>{ph.ticket}</div>
            <div className="tp-sep">{sep}</div>
            <div className="tp-row">
              <span>Ticket: 000123</span>
              <span>27/03/2026</span>
            </div>
            <div className="tp-sep">{sep}</div>

            {DUMMY_PRODUCTOS.map((p, i) => (
              <div key={i} className="tp-table-row">
                <span className="tp-col-art">{p.nombre}</span>
                {showQty && <span className="tp-col-qty">{p.cantidad}</span>}
                {showAmt && <span className="tp-col-amt">{fmtPrice(p.cantidad * p.precio)}</span>}
              </div>
            ))}

            <div className="tp-sep">{sep}</div>
            <div className={`tp-row tp-bold ${sizeTotal}`}>
              <span>TOTAL:</span>
              <span>{fmtPrice(total)}</span>
            </div>
          </>
        )}

        {/* QR genérico (nuevo) — cualquier tipo si está activo Y hay contenido.
            Sin qrUrl el print server no imprime nada, así que el preview tampoco. */}
        {estilo.qrActivo === true && estilo.qrUrl && (
          <>
            <div className="tp-sep">{sep}</div>
            <div className="tp-qr-placeholder">
              <div className="tp-qr-box">QR</div>
              <div className="tp-small">{ph.qrCaption}</div>
              <div className="tp-small tp-qr-url">{estilo.qrUrl}</div>
            </div>
          </>
        )}

        {/* Mensaje de agradecimiento (nuevo) */}
        {estilo.mensajeAgradecimiento && (
          <>
            <div className="tp-sep">{sep}</div>
            <div className="tp-center tp-bold">{estilo.mensajeAgradecimiento}</div>
          </>
        )}

        {/* Pie legal (nuevo) */}
        {estilo.pieLegal && (
          <div className="tp-center tp-small">{estilo.pieLegal}</div>
        )}

        {/* Pie custom */}
        {estilo.pie && (
          <>
            <div className="tp-sep">{sep}</div>
            <div className="tp-center tp-pie">{estilo.pie}</div>
          </>
        )}

        {/* Corte simulado */}
        <div className="tp-cut" />
      </div>
    </div>
  );
}
