import { useMemo } from "react";
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
 */
export default function TicketPreview({
  estilo = {},
  tipoTicket = "cuenta",
  fiscal = {},
  logoUrl = null,
  nombreRestaurante = "",
}) {
  const is58 = estilo.anchoPapel === "58mm";
  const width = is58 ? 32 : 48;
  const sep = hr(estilo.estiloSeparador, width);

  const sizeTitulo = SIZE_CLASS[estilo.tamanoTitulo] || "tp-size-dh";
  const sizeProducto = SIZE_CLASS[estilo.tamanoProducto] || "tp-size-dh";
  const sizeDetalle = SIZE_CLASS[estilo.tamanoDetalle] || "tp-size-normal";
  const sizeTotal = SIZE_CLASS[estilo.tamanoTotal] || "tp-size-dhw";

  const razonSocial = fiscal?.razonSocial || fiscal?.nombreComercial || nombreRestaurante || "Mi Restaurante";
  const direccion = fiscal?.direccion || "Calle Ejemplo 12";
  const nif = fiscal?.nif || fiscal?.cif || "B12345678";

  const total = useMemo(
    () => DUMMY_PRODUCTOS.reduce((acc, p) => acc + p.cantidad * p.precio, 0),
    []
  );

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
            <div className="tp-center">NIF: {nif}</div>
          </>
        )}

        <div className="tp-sep">{sep}</div>

        {/* Tipo de ticket */}
        {tipoTicket === "cuenta" && (
          <>
            <div className={`tp-center tp-bold ${sizeTitulo}`}>Mesa N.o 5</div>
            <div className="tp-row">
              <span>CONSULTA</span>
              <span>27/03/2026 14:30</span>
            </div>
            <div className="tp-sep">{sep}</div>

            {/* Tabla productos */}
            <div className="tp-table-header">
              <span className="tp-col-art">Articulo</span>
              <span className="tp-col-qty">Ctd</span>
              <span className="tp-col-price">Precio</span>
              <span className="tp-col-amt">Importe</span>
            </div>
            <div className="tp-sep">{sep}</div>

            {DUMMY_PRODUCTOS.map((p, i) => (
              <div key={i} className="tp-table-row">
                <span className="tp-col-art">{p.nombre}</span>
                <span className="tp-col-qty">{p.cantidad}</span>
                <span className="tp-col-price">{fmtPrice(p.precio)}</span>
                <span className="tp-col-amt">
                  {fmtPrice(p.cantidad * p.precio)}
                </span>
              </div>
            ))}

            <div className="tp-sep">{sep}</div>
            <div className={`tp-row tp-bold ${sizeTotal}`}>
              <span>TOTAL:</span>
              <span>{fmtPrice(total)}</span>
            </div>
            <div className="tp-sep">{sep}</div>
            <div className="tp-center tp-small">
              Propinas no incluidas / Tips not included
            </div>
          </>
        )}

        {tipoTicket === "pedido" && (
          <>
            <div className={`tp-center tp-bold ${sizeTitulo}`}>PEDIDO</div>
            <div className="tp-sep">{sep}</div>
            <div className="tp-center">Mesa N.o 5</div>
            <div className="tp-sep">{sep}</div>
            <div className="tp-row">
              <span>27/03/2026</span>
              <span>14:30:22</span>
            </div>
            <div>Comensales: 4</div>
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

        {tipoTicket === "factura" && (
          <>
            <div className={`tp-center tp-bold ${sizeTitulo}`}>FACTURA</div>
            <div className="tp-sep">{sep}</div>
            <div className="tp-center tp-bold">Datos del cliente</div>
            <div className="tp-center">Juan Garcia Lopez</div>
            <div className="tp-center">NIF: 12345678A</div>
            <div className="tp-sep">{sep}</div>
            <div className="tp-row">
              <span>Factura: 2026-0042</span>
              <span>27/03/2026</span>
            </div>
            <div>Mesa N.o 5 Comensales: 4</div>
            <div className="tp-sep">{sep}</div>

            {DUMMY_PRODUCTOS.map((p, i) => (
              <div key={i} className="tp-table-row">
                <span className="tp-col-art">{p.nombre}</span>
                <span className="tp-col-qty">{p.cantidad}</span>
                <span className="tp-col-price">{fmtPrice(p.precio)}</span>
                <span className="tp-col-amt">
                  {fmtPrice(p.cantidad * p.precio)}
                </span>
              </div>
            ))}

            <div className="tp-sep">{sep}</div>
            <div className="tp-row">
              <span>Base imponible:</span>
              <span>{fmtPrice(total / 1.1)}</span>
            </div>
            <div className="tp-row">
              <span>IVA 10% (incluido):</span>
              <span>{fmtPrice(total - total / 1.1)}</span>
            </div>
            <div className={`tp-row tp-bold ${sizeTotal}`}>
              <span>TOTAL:</span>
              <span>{fmtPrice(total)}</span>
            </div>
            <div className="tp-sep">{sep}</div>
            <div className="tp-center tp-small">
              Hash: a1b2c3d4e5f6...
            </div>

            {/* QR placeholder */}
            <div className="tp-qr-placeholder">
              <div className="tp-qr-box">QR</div>
              <div className="tp-small">QR tributario AEAT</div>
            </div>
          </>
        )}

        {/* QR valoraciones */}
        {estilo.qrValoracionesActivo !== false && tipoTicket === "cuenta" && (
          <>
            <div className="tp-sep">{sep}</div>
            <div className="tp-center tp-bold">
              {estilo.qrTexto || "Valora tu experiencia"}
            </div>
            <div className="tp-qr-placeholder">
              <div className="tp-qr-box">QR</div>
              <div className="tp-small">Escanea para valorar</div>
            </div>
          </>
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
