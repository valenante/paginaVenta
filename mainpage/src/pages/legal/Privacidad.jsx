import LegalLayout from "./LegalLayout";

export default function Privacidad() {
  return (
    <LegalLayout title="Politica de Privacidad">
      <p><em>Ultima actualizacion: 23 de abril de 2026</em></p>

      <h2>1. Responsable del tratamiento</h2>
      <table>
        <tbody>
          <tr><td><strong>Responsable</strong></td><td>Valentino Antenucci</td></tr>
          <tr><td><strong>Domicilio</strong></td><td>Malaga, Espana</td></tr>
          <tr><td><strong>Email</strong></td><td>privacidad@softalef.com</td></tr>
          <tr><td><strong>Web</strong></td><td>softalef.com</td></tr>
        </tbody>
      </table>

      <h2>2. Que datos recogemos y para que</h2>

      <h3>Usuarios del servicio SaaS</h3>
      <table>
        <thead><tr><th>Datos</th><th>Finalidad</th><th>Base legal</th></tr></thead>
        <tbody>
          <tr><td>Nombre, email, telefono</td><td>Gestion de la cuenta y comunicaciones</td><td>Ejecucion del contrato (art. 6.1.b RGPD)</td></tr>
          <tr><td>Datos de facturacion (CIF, direccion fiscal)</td><td>Facturacion y cumplimiento fiscal</td><td>Obligacion legal (art. 6.1.c RGPD)</td></tr>
          <tr><td>Datos de uso (logs, actividad)</td><td>Mantenimiento, soporte y mejora del servicio</td><td>Interes legitimo (art. 6.1.f RGPD)</td></tr>
          <tr><td>IP, dispositivo, navegador</td><td>Seguridad y prevencion de fraude</td><td>Interes legitimo (art. 6.1.f RGPD)</td></tr>
        </tbody>
      </table>

      <h3>Visitantes de la web</h3>
      <table>
        <thead><tr><th>Datos</th><th>Finalidad</th><th>Base legal</th></tr></thead>
        <tbody>
          <tr><td>Datos de navegacion (cookies tecnicas)</td><td>Funcionamiento de la web</td><td>Interes legitimo</td></tr>
          <tr><td>Datos de contacto (formulario)</td><td>Atender consultas comerciales</td><td>Consentimiento (art. 6.1.a RGPD)</td></tr>
        </tbody>
      </table>

      <h3>Clientes finales de los establecimientos</h3>
      <p>Alef actua como <strong>encargado del tratamiento</strong> por cuenta del establecimiento (responsable). Los datos de comensales (nombre, telefono, email en reservas) se tratan conforme al <a href="/dpa">Acuerdo de Procesamiento de Datos (DPA)</a>.</p>

      <h2>3. Cuanto tiempo conservamos los datos</h2>
      <table>
        <thead><tr><th>Tipo de dato</th><th>Plazo</th></tr></thead>
        <tbody>
          <tr><td>Datos de cuenta activa</td><td>Mientras dure la relacion contractual</td></tr>
          <tr><td>Datos tras baja del servicio</td><td>30 dias para exportacion, borrado total en 90 dias</td></tr>
          <tr><td>Datos de facturacion</td><td>4 anos (Ley General Tributaria)</td></tr>
          <tr><td>Datos contables</td><td>6 anos (Codigo de Comercio)</td></tr>
          <tr><td>Datos de contacto web</td><td>1 ano desde la ultima comunicacion</td></tr>
        </tbody>
      </table>

      <h2>4. A quien comunicamos los datos</h2>
      <p>No vendemos datos a terceros. Solo compartimos datos con los proveedores necesarios para prestar el servicio:</p>
      <table>
        <thead><tr><th>Proveedor</th><th>Servicio</th><th>Ubicacion</th></tr></thead>
        <tbody>
          <tr><td>DigitalOcean</td><td>Hosting</td><td>UE (Frankfurt)</td></tr>
          <tr><td>MongoDB Atlas</td><td>Base de datos</td><td>UE (Frankfurt)</td></tr>
          <tr><td>Stripe</td><td>Pagos</td><td>UE (Irlanda) / EEUU</td></tr>
          <tr><td>Tailscale</td><td>VPN agentes de impresion</td><td>EEUU</td></tr>
        </tbody>
      </table>
      <p>Las transferencias fuera del EEE se realizan bajo Clausulas Contractuales Tipo (SCC) aprobadas por la Comision Europea.</p>

      <h2>5. Tus derechos</h2>
      <p>Puedes ejercer en cualquier momento:</p>
      <ul>
        <li><strong>Acceso</strong> — saber que datos tenemos sobre ti</li>
        <li><strong>Rectificacion</strong> — corregir datos inexactos</li>
        <li><strong>Supresion</strong> — solicitar el borrado de tus datos</li>
        <li><strong>Portabilidad</strong> — recibir tus datos en formato estructurado</li>
        <li><strong>Oposicion</strong> — oponerte al tratamiento</li>
        <li><strong>Limitacion</strong> — restringir el uso de tus datos</li>
      </ul>
      <p>Envia un email a <strong>privacidad@softalef.com</strong> indicando tu identidad y el derecho que deseas ejercer. Responderemos en un plazo maximo de 30 dias.</p>
      <p>Si consideras que tus derechos no han sido atendidos, puedes reclamar ante la <strong>Agencia Espanola de Proteccion de Datos (AEPD)</strong> en <a href="https://www.aepd.es" target="_blank" rel="noopener noreferrer">www.aepd.es</a>.</p>

      <h2>6. Seguridad</h2>
      <ul>
        <li>Cifrado en transito (HTTPS/TLS 1.2+)</li>
        <li>Cifrado en reposo</li>
        <li>Autenticacion segura con tokens versionados</li>
        <li>Control de acceso basado en roles</li>
        <li>Copias de seguridad diarias</li>
        <li>Monitorizacion continua</li>
      </ul>

      <h2>7. Contacto</h2>
      <p>Para cualquier consulta sobre privacidad: <strong>privacidad@softalef.com</strong></p>
    </LegalLayout>
  );
}
