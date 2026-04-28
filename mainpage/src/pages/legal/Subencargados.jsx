import LegalLayout from "./LegalLayout";

export default function Subencargados() {
  return (
    <LegalLayout title="Lista de Subencargados del Tratamiento">
      <p><em>Ultima actualizacion: 28 de abril de 2026</em></p>

      <p>De conformidad con el articulo 28 del RGPD y el <a href="/dpa">Acuerdo de Procesamiento de Datos</a>, Alef mantiene esta lista publica de subencargados que participan en el tratamiento de datos personales de los clientes del Servicio.</p>
      <p>Cualquier cambio en esta lista se notificara al titular con un preaviso minimo de 15 dias por email. El titular dispone de 10 dias desde la notificacion para oponerse por escrito.</p>

      <h2>Subencargados actuales</h2>

      <table className="legal-table">
        <thead>
          <tr>
            <th>Proveedor</th>
            <th>Servicio</th>
            <th>Ubicacion</th>
            <th>Garantias</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td><strong>MongoDB, Inc.</strong></td>
            <td>Base de datos (Atlas)</td>
            <td>Frankfurt, Alemania (UE)</td>
            <td>SOC 2 Tipo II, RGPD, cifrado en reposo y en transito</td>
          </tr>
          <tr>
            <td><strong>DigitalOcean, LLC</strong></td>
            <td>Hosting (VPS)</td>
            <td>Frankfurt, Alemania (UE)</td>
            <td>ISO 27001, SOC 2, RGPD, DPA firmado</td>
          </tr>
          <tr>
            <td><strong>Stripe, Inc.</strong></td>
            <td>Procesamiento de pagos y facturacion</td>
            <td>Irlanda (UE) / EE.UU. (SCC)</td>
            <td>PCI-DSS Nivel 1, RGPD, DPA, Clausulas Contractuales Tipo</td>
          </tr>
          <tr>
            <td><strong>Resend, Inc.</strong></td>
            <td>Email transaccional (MFA, notificaciones)</td>
            <td>UE / EE.UU. (SCC)</td>
            <td>RGPD, cifrado TLS, datos minimos (email + contenido)</td>
          </tr>
          <tr>
            <td><strong>Cloudflare, Inc.</strong></td>
            <td>DNS, CDN, almacenamiento de assets (R2)</td>
            <td>Global / UE preferente</td>
            <td>ISO 27001, SOC 2, RGPD, DPA</td>
          </tr>
          <tr>
            <td><strong>OpenAI, Inc.</strong></td>
            <td>Asistente de voz (transcripcion y TTS, opcional)</td>
            <td>EE.UU. (SCC)</td>
            <td>Enterprise Privacy, zero data retention en API, DPA disponible</td>
          </tr>
          <tr>
            <td><strong>Sentry (Functional Software, Inc.)</strong></td>
            <td>Monitorizacion de errores</td>
            <td>UE (endpoints EU disponibles)</td>
            <td>SOC 2, RGPD, datos minimos (trazas de error, sin PII)</td>
          </tr>
          <tr>
            <td><strong>Tailscale, Inc.</strong></td>
            <td>VPN para agentes de impresion</td>
            <td>EE.UU.</td>
            <td>Datos minimos (solo IPs de dispositivos), cifrado WireGuard</td>
          </tr>
          <tr>
            <td><strong>Google LLC</strong></td>
            <td>Analitica web (Google Analytics 4, con consentimiento)</td>
            <td>UE / EE.UU. (SCC)</td>
            <td>RGPD, consentimiento previo via banner de cookies, anonimizacion IP</td>
          </tr>
        </tbody>
      </table>

      <h2>Datos tratados por subencargado</h2>
      <ul>
        <li><strong>MongoDB / DigitalOcean:</strong> Todos los datos operativos del tenant (pedidos, productos, mesas, usuarios, facturas).</li>
        <li><strong>Stripe:</strong> Datos de facturacion (nombre, email, metodo de pago del titular). No almacena datos de comensales.</li>
        <li><strong>Resend:</strong> Direcciones de email para envios transaccionales (MFA, alertas, facturas).</li>
        <li><strong>Cloudflare:</strong> Contenido estatico (logos, imagenes). No procesa datos personales directamente.</li>
        <li><strong>OpenAI:</strong> Audio de voz procesado en tiempo real (sin almacenamiento). Solo si la funcionalidad de voz esta activada.</li>
        <li><strong>Sentry:</strong> Trazas de error tecnicas. Se minimizan datos personales (sin nombres, emails ni datos de comensales).</li>
        <li><strong>Tailscale:</strong> Solo direcciones IP de dispositivos con agente de impresion instalado.</li>
        <li><strong>Google Analytics:</strong> Datos anonimizados de navegacion web. Solo con consentimiento explicito del visitante.</li>
      </ul>

      <h2>Transferencias internacionales</h2>
      <p>Todos los subencargados con sede fuera del Espacio Economico Europeo operan bajo Clausulas Contractuales Tipo (SCC) aprobadas por la Comision Europea, o cuentan con decision de adecuacion equivalente. Alef aplica medidas tecnicas complementarias (cifrado extremo a extremo, minimizacion de datos) conforme a las recomendaciones del EDPB.</p>

      <h2>Historico de cambios</h2>
      <ul>
        <li><strong>28 abril 2026:</strong> Publicacion inicial de la lista.</li>
      </ul>

      <h2>Contacto</h2>
      <p>Para consultas sobre subencargados: <a href="mailto:privacidad@softalef.com">privacidad@softalef.com</a></p>
    </LegalLayout>
  );
}
