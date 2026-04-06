import LegalLayout from "./LegalLayout";

export default function DPA() {
  return (
    <LegalLayout title="Acuerdo de Procesamiento de Datos (DPA)">
      <p><em>Conforme al Articulo 28 del RGPD. Ultima actualizacion: 6 de abril de 2026.</em></p>

      <h2>1. Partes</h2>
      <p><strong>Responsable del tratamiento</strong> ("el Cliente"): El titular de la cuenta Alef (restaurante, bar, tienda o comercio).</p>
      <p><strong>Encargado del tratamiento</strong> ("Alef"): El prestador del servicio, operador de softalef.com.</p>

      <h2>2. Objeto</h2>
      <p>Alef trata datos personales por cuenta del Cliente unicamente para prestar el Servicio: gestion de pedidos, facturacion, reservas, carta digital, valoraciones, estadisticas e impresion de tickets.</p>

      <h2>3. Datos tratados</h2>
      <table style={{width: "100%", borderCollapse: "collapse", fontSize: "0.9rem"}}>
        <thead>
          <tr style={{borderBottom: "2px solid #ddd", textAlign: "left"}}>
            <th style={{padding: "0.5rem"}}>Categoria</th>
            <th style={{padding: "0.5rem"}}>Datos</th>
            <th style={{padding: "0.5rem"}}>Interesados</th>
          </tr>
        </thead>
        <tbody>
          <tr style={{borderBottom: "1px solid #eee"}}>
            <td style={{padding: "0.5rem"}}>Identificacion</td>
            <td style={{padding: "0.5rem"}}>Nombre, email, telefono</td>
            <td style={{padding: "0.5rem"}}>Empleados, comensales</td>
          </tr>
          <tr style={{borderBottom: "1px solid #eee"}}>
            <td style={{padding: "0.5rem"}}>Transacciones</td>
            <td style={{padding: "0.5rem"}}>Pedidos, importes, metodo de pago</td>
            <td style={{padding: "0.5rem"}}>Comensales</td>
          </tr>
          <tr style={{borderBottom: "1px solid #eee"}}>
            <td style={{padding: "0.5rem"}}>Reservas</td>
            <td style={{padding: "0.5rem"}}>Nombre, telefono, fecha, comensales</td>
            <td style={{padding: "0.5rem"}}>Comensales</td>
          </tr>
          <tr style={{borderBottom: "1px solid #eee"}}>
            <td style={{padding: "0.5rem"}}>Fiscales</td>
            <td style={{padding: "0.5rem"}}>NIF/CIF, facturas</td>
            <td style={{padding: "0.5rem"}}>Cliente</td>
          </tr>
        </tbody>
      </table>

      <h2>4. Obligaciones de Alef</h2>
      <h3>Instrucciones</h3>
      <p>Tratar datos unicamente siguiendo las instrucciones del Cliente (el uso de la plataforma constituye instrucciones documentadas).</p>

      <h3>Confidencialidad</h3>
      <p>Las personas autorizadas para tratar datos se comprometen a respetar la confidencialidad.</p>

      <h3>Seguridad</h3>
      <ul>
        <li>Cifrado TLS 1.2+ en todas las comunicaciones</li>
        <li>Bases de datos aisladas por tenant</li>
        <li>Autenticacion JWT con rotacion y revocacion</li>
        <li>Proteccion CSRF triple capa</li>
        <li>Rate limiting por IP y por tenant</li>
        <li>Backups diarios cifrados offsite</li>
        <li>Monitoring 24/7 con alertas automaticas</li>
      </ul>

      <h3>Sub-procesadores</h3>
      <p>La lista de sub-procesadores esta en la <a href="/privacidad">Politica de Privacidad</a> (seccion 5). Alef notificara cambios con 15 dias de antelacion. Si el Cliente se opone, puede resolver el contrato sin penalizacion.</p>

      <h3>Derechos de los interesados</h3>
      <p>Alef asistira al Cliente para atender solicitudes de acceso, rectificacion, supresion, portabilidad, oposicion y limitacion. El Cliente dispone de herramientas de exportacion y eliminacion en su panel.</p>

      <h3>Brechas de seguridad</h3>
      <p>Alef notificara al Cliente en un maximo de 72 horas cualquier brecha que afecte a datos personales, indicando naturaleza, datos afectados, consecuencias y medidas adoptadas.</p>

      <h3>Devolucion y eliminacion</h3>
      <p>Tras la cancelacion, el Cliente puede exportar sus datos. Alef elimina todos los datos del tenant en 90 dias (base de datos, backups, archivos). Los datos fiscales se retienen 5 anos por obligacion legal.</p>

      <h3>Auditorias</h3>
      <p>El Cliente puede verificar el cumplimiento de este Acuerdo con preaviso de 30 dias.</p>

      <h2>5. Obligaciones del Cliente</h2>
      <p>El Cliente se compromete a cumplir con el RGPD/LOPDGDD, informar a sus empleados y clientes sobre el tratamiento de datos, y obtener consentimiento cuando sea exigible.</p>

      <h2>6. Transferencias internacionales</h2>
      <p>Los datos se tratan principalmente en la UE. Para sub-procesadores fuera del EEE (Stripe, OpenAI), Alef garantiza clausulas contractuales tipo aprobadas por la Comision Europea.</p>

      <h2>7. Duracion</h2>
      <p>Este Acuerdo tiene la misma duracion que la relacion contractual. Las obligaciones de confidencialidad y eliminacion sobreviven a su finalizacion.</p>

      <h2>8. Contacto</h2>
      <p>contacto@softalef.com</p>
    </LegalLayout>
  );
}
