import LegalLayout from "./LegalLayout";

export default function Cookies() {
  return (
    <LegalLayout title="Politica de cookies">
      <p><em>Ultima actualizacion: 24 de abril de 2026</em></p>

      <h2>Cookies tecnicas (siempre activas)</h2>
      <p>Necesarias para el funcionamiento basico del sistema. No requieren consentimiento.</p>
      <table>
        <thead><tr><th>Cookie</th><th>Finalidad</th><th>Duracion</th></tr></thead>
        <tbody>
          <tr><td>globalToken</td><td>Autenticacion de sesion</td><td>15 minutos</td></tr>
          <tr><td>refreshToken</td><td>Renovacion de sesion</td><td>7 dias</td></tr>
          <tr><td>cartaSession</td><td>Sesion de carta digital (comensales)</td><td>8 horas</td></tr>
          <tr><td>alef_cookies_ok</td><td>Recordar preferencia de cookies</td><td>1 ano</td></tr>
          <tr><td>locale</td><td>Idioma preferido</td><td>Persistente</td></tr>
        </tbody>
      </table>

      <h2>Cookies analiticas (opcionales)</h2>
      <p>Solo se activan si aceptas "Aceptar todas" en el banner de cookies. Nos ayudan a entender como se usa la web para mejorarla.</p>
      <table>
        <thead><tr><th>Cookie</th><th>Proveedor</th><th>Finalidad</th><th>Duracion</th></tr></thead>
        <tbody>
          <tr><td>_ga, _ga_*</td><td>Google Analytics 4</td><td>Estadisticas de visitas anonimas</td><td>2 anos</td></tr>
        </tbody>
      </table>
      <p>Puedes revocar el consentimiento en cualquier momento borrando las cookies de tu navegador.</p>

      <h2>Cookies publicitarias</h2>
      <p>No utilizamos cookies publicitarias ni de seguimiento de terceros.</p>

      <h2>Mas informacion</h2>
      <p>Si tienes dudas sobre el uso de cookies, contactanos en <strong>contacto@softalef.com</strong>.</p>
    </LegalLayout>
  );
}
