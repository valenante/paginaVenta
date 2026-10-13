import "./NotasCliente.css";

// Lo que escribió el cliente al reservar. Las alergias van primero y destacadas: son lo que
// no se puede pasar por alto en sala ni en cocina.
export default function NotasCliente({ r }) {
  if (!r?.mensaje && !r?.alergias) return <span className="text-suave">—</span>;
  return (
    <div className="rc-notas-cliente">
      {r.alergias && (
        <span className="rc-alergias"><span className="rc-alergias-k">Alergias:</span> <span>{r.alergias}</span></span>
      )}
      {r.mensaje && <span className="rc-mensaje">{r.mensaje}</span>}
    </div>
  );
}
