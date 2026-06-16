import LegalLayout from "./LegalLayout";
import SEOHead from "../../components/SEO/SEOHead";

export default function Cookies() {
  return (
    <LegalLayout title="Política de cookies">
      <SEOHead title="Política de cookies" description="Cookies técnicas y analíticas utilizadas por ALEF. Cómo gestionarlas y revocar el consentimiento." path="/cookies" />
      <p><em>Última actualización: 16 de junio de 2026</em></p>

      <h2>Cookies técnicas (siempre activas)</h2>
      <p>Necesarias para el funcionamiento básico del sistema. No requieren consentimiento.</p>
      <table>
        <thead><tr><th>Cookie</th><th>Finalidad</th><th>Duración</th></tr></thead>
        <tbody>
          <tr><td>globalToken</td><td>Autenticación de sesión</td><td>15 minutos</td></tr>
          <tr><td>refreshToken</td><td>Renovación de sesión</td><td>7 días</td></tr>
          <tr><td>cartaSession</td><td>Sesión de carta digital (comensales)</td><td>8 horas</td></tr>
          <tr><td>alef_cookies_ok</td><td>Recordar preferencia de cookies</td><td>1 año</td></tr>
          <tr><td>locale</td><td>Idioma preferido</td><td>Persistente</td></tr>
        </tbody>
      </table>

      <h2>Cookies analíticas (opcionales)</h2>
      <p>Solo se activan si aceptas «Aceptar todas» en el banner de cookies. Nos ayudan a entender cómo se usa la web para mejorarla.</p>
      <table>
        <thead><tr><th>Cookie</th><th>Proveedor</th><th>Finalidad</th><th>Duración</th></tr></thead>
        <tbody>
          <tr><td>_ga, _ga_*</td><td>Google Analytics 4</td><td>Estadísticas de visitas anónimas</td><td>2 años</td></tr>
        </tbody>
      </table>
      <p>Puedes revocar el consentimiento en cualquier momento borrando las cookies de tu navegador.</p>

      <h2>Cookies publicitarias</h2>
      <p>No utilizamos cookies publicitarias ni de seguimiento de terceros.</p>

      <h2>Más información</h2>
      <p>Si tienes dudas sobre el uso de cookies, contáctanos en <strong>contacto@softalef.com</strong>.</p>
    </LegalLayout>
  );
}
