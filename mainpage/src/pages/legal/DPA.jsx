import LegalLayout from "./LegalLayout";
import SEOHead from "../../components/SEO/SEOHead";

export default function DPA() {
  return (
    <LegalLayout title="Acuerdo de Procesamiento de Datos (DPA)">
      <SEOHead title="Acuerdo de procesamiento de datos (DPA)" description="Data Processing Agreement conforme al artículo 28 del RGPD. Obligaciones de ALEF como encargado del tratamiento de datos personales." path="/dpa" />
      <p><em>Conforme al Artículo 28 del RGPD. Última actualización: 16 de junio de 2026.</em></p>

      <h2>1. Partes</h2>
      <p><strong>Responsable del tratamiento</strong> («el Cliente»): El titular de la cuenta Alef (restaurante, bar, tienda o comercio).</p>
      <p><strong>Encargado del tratamiento</strong> («Alef»): Valentino Antenucci, con domicilio en Málaga, España. Email: contacto@softalef.com</p>

      <h2>2. Objeto</h2>
      <p>Alef trata datos personales por cuenta del Cliente únicamente para prestar el Servicio: gestión de pedidos, facturación, reservas, carta digital, valoraciones, estadísticas e impresión de tickets.</p>

      <h2>3. Datos tratados</h2>
      <table>
        <thead>
          <tr><th>Categoría</th><th>Datos</th><th>Interesados</th></tr>
        </thead>
        <tbody>
          <tr><td>Identificación</td><td>Nombre, email, teléfono</td><td>Empleados, comensales</td></tr>
          <tr><td>Acceso</td><td>PIN, rol, actividad en el sistema</td><td>Empleados</td></tr>
          <tr><td>Transacciones</td><td>Pedidos, importes, método de pago</td><td>Comensales</td></tr>
          <tr><td>Reservas</td><td>Nombre, teléfono, fecha, comensales</td><td>Comensales</td></tr>
          <tr><td>Fiscales</td><td>NIF/CIF, dirección fiscal, facturas</td><td>Cliente</td></tr>
        </tbody>
      </table>
      <p>No se tratan datos sensibles (salud, religión, orientación sexual, etc.).</p>

      <h2>4. Obligaciones de Alef</h2>

      <h3>Instrucciones</h3>
      <p>Tratar datos únicamente siguiendo las instrucciones del Cliente. Si Alef considera que una instrucción infringe el RGPD, informará al Cliente inmediatamente.</p>

      <h3>Confidencialidad</h3>
      <p>Las personas autorizadas para tratar datos se comprometen a respetar la confidencialidad. Esta obligación se mantiene incluso tras la finalización del contrato, sin límite temporal.</p>

      <h3>Seguridad</h3>
      <ul>
        <li>Cifrado en tránsito (TLS 1.2+)</li>
        <li>Cifrado en reposo</li>
        <li>Bases de datos aisladas por tenant</li>
        <li>Autenticación JWT con versionado y revocación de tokens</li>
        <li>Control de acceso basado en roles</li>
        <li>Protección CSRF</li>
        <li>Rate limiting por IP y por tenant</li>
        <li>Copias de seguridad diarias automatizadas</li>
        <li>Monitorización continua con alertas automáticas</li>
      </ul>

      <h3>Sub-procesadores</h3>
      <p>El Cliente autoriza a Alef a recurrir a los siguientes sub-procesadores:</p>
      <table>
        <thead><tr><th>Proveedor</th><th>Servicio</th><th>Ubicación</th><th>Garantías</th></tr></thead>
        <tbody>
          <tr><td>DigitalOcean</td><td>Hosting (VPS)</td><td>UE (Fráncfort)</td><td>RGPD, ISO 27001</td></tr>
          <tr><td>MongoDB Atlas</td><td>Base de datos</td><td>UE (Fráncfort)</td><td>RGPD, SOC 2</td></tr>
          <tr><td>Stripe</td><td>Pagos</td><td>UE (Irlanda) / EE.&nbsp;UU.</td><td>DPA, SCC, PCI-DSS</td></tr>
          <tr><td>Tailscale</td><td>VPN agentes de impresión</td><td>EE.&nbsp;UU.</td><td>Datos mínimos (solo IPs)</td></tr>
        </tbody>
      </table>
      <p>Alef notificará cambios en la lista de sub-procesadores con un preaviso mínimo de 15 días. El Cliente podrá oponerse en 10 días. Si no se alcanza acuerdo, cualquiera de las partes podrá resolver el contrato.</p>

      <h3>Derechos de los interesados</h3>
      <p>Alef asistirá al Cliente para atender solicitudes de acceso, rectificación, supresión, portabilidad, oposición y limitación en un plazo máximo de 5 días hábiles. El Cliente dispone de herramientas de exportación (CSV/JSON) y eliminación en su panel.</p>

      <h3>Brechas de seguridad</h3>
      <p>Alef notificará al Cliente <strong>en un plazo máximo de 48 horas</strong> desde que tenga conocimiento de cualquier violación de seguridad, indicando:</p>
      <ul>
        <li>Naturaleza de la violación</li>
        <li>Categorías y número de interesados afectados</li>
        <li>Posibles consecuencias</li>
        <li>Medidas adoptadas o propuestas</li>
      </ul>
      <p>Alef colaborará con el Cliente para que este pueda notificar a la AEPD en el plazo de 72 horas del RGPD.</p>

      <h3>Devolución y eliminación</h3>
      <table>
        <thead><tr><th>Fase</th><th>Plazo</th><th>Acción</th></tr></thead>
        <tbody>
          <tr><td>Exportación</td><td>0 a 30 días</td><td>El Cliente puede exportar todos sus datos</td></tr>
          <tr><td>Borrado lógico</td><td>Día 30</td><td>Eliminación de la base de datos activa</td></tr>
          <tr><td>Borrado en backups</td><td>Día 30 a 90</td><td>Eliminación progresiva por rotación</td></tr>
          <tr><td>Eliminación total</td><td>Día 90</td><td>No quedan datos en ningún sistema</td></tr>
        </tbody>
      </table>
      <p><strong>Excepciones legales:</strong> datos de facturación (4 años, Ley General Tributaria) y datos contables (6 años, Código de Comercio). Estos datos se conservan bloqueados y no se utilizan para otra finalidad.</p>

      <h3>Auditorías</h3>
      <p>El Cliente puede verificar el cumplimiento de este Acuerdo con un preaviso de 15 días.</p>

      <h2>5. Obligaciones del Cliente</h2>
      <p>El Cliente se compromete a cumplir con el RGPD y la LOPDGDD, informar a sus empleados y clientes sobre el tratamiento de datos, y obtener consentimiento cuando sea exigible.</p>

      <h2>6. Transferencias internacionales</h2>
      <p>Los datos se tratan principalmente en la UE (Fráncfort). Stripe y Tailscale operan parcialmente desde EE.&nbsp;UU. Las transferencias se amparan en las Cláusulas Contractuales Tipo (SCC) de la Comisión Europea adoptadas por dichos proveedores.</p>

      <h2>7. Duración</h2>
      <p>Este Acuerdo tiene la misma duración que la relación contractual. Las obligaciones de confidencialidad y eliminación sobreviven a su finalización.</p>

      <h2>8. Contacto</h2>
      <p>contacto@softalef.com</p>
    </LegalLayout>
  );
}
