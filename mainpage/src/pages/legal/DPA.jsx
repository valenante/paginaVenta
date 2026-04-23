import LegalLayout from "./LegalLayout";

export default function DPA() {
  return (
    <LegalLayout title="Acuerdo de Procesamiento de Datos (DPA)">
      <p><em>Conforme al Articulo 28 del RGPD. Ultima actualizacion: 23 de abril de 2026.</em></p>

      <h2>1. Partes</h2>
      <p><strong>Responsable del tratamiento</strong> ("el Cliente"): El titular de la cuenta Alef (restaurante, bar, tienda o comercio).</p>
      <p><strong>Encargado del tratamiento</strong> ("Alef"): Valentino Antenucci, con domicilio en Malaga, Espana. Email: privacidad@softalef.com</p>

      <h2>2. Objeto</h2>
      <p>Alef trata datos personales por cuenta del Cliente unicamente para prestar el Servicio: gestion de pedidos, facturacion, reservas, carta digital, valoraciones, estadisticas e impresion de tickets.</p>

      <h2>3. Datos tratados</h2>
      <table>
        <thead>
          <tr><th>Categoria</th><th>Datos</th><th>Interesados</th></tr>
        </thead>
        <tbody>
          <tr><td>Identificacion</td><td>Nombre, email, telefono</td><td>Empleados, comensales</td></tr>
          <tr><td>Acceso</td><td>PIN, rol, actividad en el sistema</td><td>Empleados</td></tr>
          <tr><td>Transacciones</td><td>Pedidos, importes, metodo de pago</td><td>Comensales</td></tr>
          <tr><td>Reservas</td><td>Nombre, telefono, fecha, comensales</td><td>Comensales</td></tr>
          <tr><td>Fiscales</td><td>NIF/CIF, direccion fiscal, facturas</td><td>Cliente</td></tr>
        </tbody>
      </table>
      <p>No se tratan datos sensibles (salud, religion, orientacion sexual, etc.).</p>

      <h2>4. Obligaciones de Alef</h2>

      <h3>Instrucciones</h3>
      <p>Tratar datos unicamente siguiendo las instrucciones del Cliente. Si Alef considera que una instruccion infringe el RGPD, informara al Cliente inmediatamente.</p>

      <h3>Confidencialidad</h3>
      <p>Las personas autorizadas para tratar datos se comprometen a respetar la confidencialidad. Esta obligacion se mantiene incluso tras la finalizacion del contrato, sin limite temporal.</p>

      <h3>Seguridad</h3>
      <ul>
        <li>Cifrado en transito (TLS 1.2+)</li>
        <li>Cifrado en reposo</li>
        <li>Bases de datos aisladas por tenant</li>
        <li>Autenticacion JWT con versionado y revocacion de tokens</li>
        <li>Control de acceso basado en roles</li>
        <li>Proteccion CSRF</li>
        <li>Rate limiting por IP y por tenant</li>
        <li>Copias de seguridad diarias automatizadas</li>
        <li>Monitorizacion continua con alertas automaticas</li>
      </ul>

      <h3>Sub-procesadores</h3>
      <p>El Cliente autoriza a Alef a recurrir a los siguientes sub-procesadores:</p>
      <table>
        <thead><tr><th>Proveedor</th><th>Servicio</th><th>Ubicacion</th><th>Garantias</th></tr></thead>
        <tbody>
          <tr><td>DigitalOcean</td><td>Hosting (VPS)</td><td>UE (Frankfurt)</td><td>RGPD, ISO 27001</td></tr>
          <tr><td>MongoDB Atlas</td><td>Base de datos</td><td>UE (Frankfurt)</td><td>RGPD, SOC 2</td></tr>
          <tr><td>Stripe</td><td>Pagos</td><td>UE (Irlanda) / EEUU</td><td>DPA, SCC, PCI-DSS</td></tr>
          <tr><td>Tailscale</td><td>VPN agentes de impresion</td><td>EEUU</td><td>Datos minimos (solo IPs)</td></tr>
        </tbody>
      </table>
      <p>Alef notificara cambios en la lista de sub-procesadores con un preaviso minimo de 15 dias. El Cliente podra oponerse en 10 dias. Si no se alcanza acuerdo, cualquiera de las partes podra resolver el contrato.</p>

      <h3>Derechos de los interesados</h3>
      <p>Alef asistira al Cliente para atender solicitudes de acceso, rectificacion, supresion, portabilidad, oposicion y limitacion en un plazo maximo de 5 dias habiles. El Cliente dispone de herramientas de exportacion (CSV/JSON) y eliminacion en su panel.</p>

      <h3>Brechas de seguridad</h3>
      <p>Alef notificara al Cliente <strong>en un plazo maximo de 48 horas</strong> desde que tenga conocimiento de cualquier violacion de seguridad, indicando:</p>
      <ul>
        <li>Naturaleza de la violacion</li>
        <li>Categorias y numero de interesados afectados</li>
        <li>Posibles consecuencias</li>
        <li>Medidas adoptadas o propuestas</li>
      </ul>
      <p>Alef colaborara con el Cliente para que este pueda notificar a la AEPD en el plazo de 72 horas del RGPD.</p>

      <h3>Devolucion y eliminacion</h3>
      <table>
        <thead><tr><th>Fase</th><th>Plazo</th><th>Accion</th></tr></thead>
        <tbody>
          <tr><td>Exportacion</td><td>0 a 30 dias</td><td>El Cliente puede exportar todos sus datos</td></tr>
          <tr><td>Borrado logico</td><td>Dia 30</td><td>Eliminacion de la base de datos activa</td></tr>
          <tr><td>Borrado en backups</td><td>Dia 30 a 90</td><td>Eliminacion progresiva por rotacion</td></tr>
          <tr><td>Eliminacion total</td><td>Dia 90</td><td>No quedan datos en ningun sistema</td></tr>
        </tbody>
      </table>
      <p><strong>Excepciones legales:</strong> datos de facturacion (4 anos, Ley General Tributaria) y datos contables (6 anos, Codigo de Comercio). Estos datos se conservan bloqueados y no se utilizan para otra finalidad.</p>

      <h3>Auditorias</h3>
      <p>El Cliente puede verificar el cumplimiento de este Acuerdo con un preaviso de 15 dias.</p>

      <h2>5. Obligaciones del Cliente</h2>
      <p>El Cliente se compromete a cumplir con el RGPD y la LOPDGDD, informar a sus empleados y clientes sobre el tratamiento de datos, y obtener consentimiento cuando sea exigible.</p>

      <h2>6. Transferencias internacionales</h2>
      <p>Los datos se tratan principalmente en la UE (Frankfurt). Stripe y Tailscale operan parcialmente desde EEUU. Las transferencias se amparan en las Clausulas Contractuales Tipo (SCC) de la Comision Europea adoptadas por dichos proveedores.</p>

      <h2>7. Duracion</h2>
      <p>Este Acuerdo tiene la misma duracion que la relacion contractual. Las obligaciones de confidencialidad y eliminacion sobreviven a su finalizacion.</p>

      <h2>8. Contacto</h2>
      <p>privacidad@softalef.com</p>
    </LegalLayout>
  );
}
