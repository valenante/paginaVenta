import LegalLayout from "./LegalLayout";
import SEOHead from "../../components/SEO/SEOHead";

export default function Subencargados() {
  return (
    <LegalLayout title="Lista de Subencargados del Tratamiento">
      <SEOHead title="Subencargados del tratamiento" description="Lista actualizada de proveedores que participan en el tratamiento de datos personales de clientes de ALEF. MongoDB, DigitalOcean, Stripe, OpenAI." path="/subencargados" />
      <p><em>Última actualización: 16 de junio de 2026</em></p>

      <p>De conformidad con el artículo 28 del RGPD y el <a href="/dpa">Acuerdo de Procesamiento de Datos</a>, Alef mantiene esta lista pública de subencargados que participan en el tratamiento de datos personales de los clientes del Servicio.</p>
      <p>Cualquier cambio en esta lista se notificará al titular con un preaviso mínimo de 15 días por email. El titular dispone de 10 días desde la notificación para oponerse por escrito.</p>

      <h2>Subencargados actuales</h2>

      <table className="legal-table">
        <thead>
          <tr>
            <th>Proveedor</th>
            <th>Servicio</th>
            <th>Ubicación</th>
            <th>Garantías</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td><strong>MongoDB, Inc.</strong></td>
            <td>Base de datos (Atlas)</td>
            <td>Fráncfort, Alemania (UE)</td>
            <td>SOC 2 Tipo II, RGPD, cifrado en reposo y en tránsito</td>
          </tr>
          <tr>
            <td><strong>DigitalOcean, LLC</strong></td>
            <td>Hosting (VPS)</td>
            <td>Fráncfort, Alemania (UE)</td>
            <td>ISO 27001, SOC 2, RGPD, DPA firmado</td>
          </tr>
          <tr>
            <td><strong>Stripe, Inc.</strong></td>
            <td>Procesamiento de pagos y facturación</td>
            <td>Irlanda (UE) / EE.&nbsp;UU. (SCC)</td>
            <td>PCI-DSS Nivel 1, RGPD, DPA, Cláusulas Contractuales Tipo</td>
          </tr>
          <tr>
            <td><strong>Resend, Inc.</strong></td>
            <td>Email transaccional (MFA, notificaciones)</td>
            <td>UE / EE.&nbsp;UU. (SCC)</td>
            <td>RGPD, cifrado TLS, datos mínimos (email + contenido)</td>
          </tr>
          <tr>
            <td><strong>Cloudflare, Inc.</strong></td>
            <td>DNS, CDN, almacenamiento de assets (R2)</td>
            <td>Global / UE preferente</td>
            <td>ISO 27001, SOC 2, RGPD, DPA</td>
          </tr>
          <tr>
            <td><strong>OpenAI, Inc.</strong></td>
            <td>Asistente de voz (transcripción y TTS, opcional)</td>
            <td>EE.&nbsp;UU. (SCC)</td>
            <td>Enterprise Privacy, zero data retention en API, DPA disponible</td>
          </tr>
          <tr>
            <td><strong>Sentry (Functional Software, Inc.)</strong></td>
            <td>Monitorización de errores</td>
            <td>UE (endpoints EU disponibles)</td>
            <td>SOC 2, RGPD, datos mínimos (trazas de error, sin PII)</td>
          </tr>
          <tr>
            <td><strong>Tailscale, Inc.</strong></td>
            <td>VPN para agentes de impresión</td>
            <td>EE.&nbsp;UU.</td>
            <td>Datos mínimos (solo IPs de dispositivos), cifrado WireGuard</td>
          </tr>
          <tr>
            <td><strong>Google LLC</strong></td>
            <td>Analítica web (Google Analytics 4, con consentimiento)</td>
            <td>UE / EE.&nbsp;UU. (SCC)</td>
            <td>RGPD, consentimiento previo vía banner de cookies, anonimización IP</td>
          </tr>
          <tr>
            <td><strong>Expo (820 Labs, Inc.)</strong></td>
            <td>Distribución de actualizaciones de la app móvil</td>
            <td>EE.&nbsp;UU. (SCC)</td>
            <td>Datos mínimos (token de dispositivo), cifrado TLS</td>
          </tr>
        </tbody>
      </table>

      <h2>Datos tratados por subencargado</h2>
      <ul>
        <li><strong>MongoDB / DigitalOcean:</strong> Todos los datos operativos del tenant (pedidos, productos, mesas, usuarios, facturas).</li>
        <li><strong>Stripe:</strong> Datos de facturación (nombre, email, método de pago del titular). No almacena datos de comensales.</li>
        <li><strong>Resend:</strong> Direcciones de email para envíos transaccionales (MFA, alertas, facturas).</li>
        <li><strong>Cloudflare:</strong> Contenido estático (logos, imágenes). No procesa datos personales directamente.</li>
        <li><strong>OpenAI:</strong> Audio de voz procesado en tiempo real (sin almacenamiento). Solo si la funcionalidad de voz está activada.</li>
        <li><strong>Sentry:</strong> Trazas de error técnicas. Se minimizan datos personales (sin nombres, emails ni datos de comensales).</li>
        <li><strong>Tailscale:</strong> Solo direcciones IP de dispositivos con agente de impresión instalado.</li>
        <li><strong>Google Analytics:</strong> Datos anonimizados de navegación web. Solo con consentimiento explícito del visitante.</li>
        <li><strong>Expo:</strong> Token de dispositivo para distribución de actualizaciones OTA. Sin datos personales.</li>
      </ul>

      <h2>Transferencias internacionales</h2>
      <p>Todos los subencargados con sede fuera del Espacio Económico Europeo operan bajo Cláusulas Contractuales Tipo (SCC) aprobadas por la Comisión Europea, o cuentan con decisión de adecuación equivalente. Alef aplica medidas técnicas complementarias (cifrado extremo a extremo, minimización de datos) conforme a las recomendaciones del EDPB.</p>

      <h2>Histórico de cambios</h2>
      <ul>
        <li><strong>28 abril 2026:</strong> Publicación inicial de la lista.</li>
        <li><strong>16 junio 2026:</strong> Añadido Expo (distribución app móvil). Correcciones ortográficas.</li>
      </ul>

      <h2>Contacto</h2>
      <p>Para consultas sobre subencargados: <a href="mailto:contacto@softalef.com">contacto@softalef.com</a></p>
    </LegalLayout>
  );
}
