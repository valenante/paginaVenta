import LegalLayout from "./LegalLayout";

export default function Cookies() {
  return (
    <LegalLayout title="Política de cookies">
      <p>
        Alef utiliza únicamente cookies técnicas necesarias para el correcto
        funcionamiento del sistema.
      </p>

      <h2>Cookies utilizadas</h2>
      <ul>
        <li>Cookies de sesión y autenticación</li>
        <li>Cookies de idioma</li>
        <li>Cookies necesarias para pedidos y reservas</li>
      </ul>

      <p>
        No se utilizan cookies analíticas, publicitarias ni de seguimiento.
      </p>
    </LegalLayout>
  );
}
