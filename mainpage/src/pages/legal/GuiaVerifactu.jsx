import LegalLayout from "./LegalLayout";

export default function GuiaVerifactu() {
  return (
    <LegalLayout title="VERI*FACTU: Lo que tu restaurante necesita saber">
      <p><em>Guia actualizada a abril de 2026. Escrita en lenguaje claro, sin tecnicismos.</em></p>

      <h2>¿Que es VERI*FACTU?</h2>
      <p>
        VERI*FACTU es el nuevo sistema de facturacion electronica de la Agencia Tributaria (Hacienda).
        Forma parte de la <strong>Ley 11/2021</strong> (conocida como "Ley Antifraude") y del reglamento
        <strong> HAC/1177/2024</strong> que la desarrolla.
      </p>
      <p>
        En resumen: a partir de <strong>julio de 2027</strong>, todo negocio de hosteleria que emita
        facturas o tickets debe hacerlo con un software que cumpla ciertos requisitos tecnicos.
        Ya no vale un programa cualquiera ni una caja registradora antigua.
      </p>

      <h2>¿Me afecta?</h2>
      <p><strong>Si.</strong> Si tienes un restaurante, bar, cafeteria o cualquier negocio de hosteleria en Espana
        y emites facturas o tickets, te afecta. No importa si eres autonomo o sociedad, ni el tamano del negocio.</p>

      <h2>¿Que exige la ley exactamente?</h2>
      <p>Que tu software de facturacion (tu TPV) cumpla estas condiciones:</p>
      <ul>
        <li><strong>Facturas encadenadas:</strong> Cada factura o ticket debe estar vinculado al anterior mediante un codigo hash. Esto impide borrar o modificar facturas sin que quede rastro.</li>
        <li><strong>Hash antifraude:</strong> Cada documento lleva una huella digital unica (hash SHA-256) que garantiza que no se ha manipulado.</li>
        <li><strong>Registro inalterable:</strong> El software debe registrar cada emision, modificacion y anulacion con fecha y hora exactas.</li>
        <li><strong>Preparado para enviar a Hacienda:</strong> El sistema debe poder enviar los registros a la AEAT cuando esta lo solicite (o de forma automatica cuando VERI*FACTU este completamente activo).</li>
        <li><strong>Software certificado:</strong> El fabricante del software debe declarar que cumple con los requisitos.</li>
      </ul>

      <h2>¿Que pasa si no cumplo?</h2>
      <p>La ley contempla sanciones de <strong>hasta 50.000 euros</strong> por usar software no certificado.
        Las sanciones pueden aplicarse tanto al negocio que usa el software como al fabricante.</p>

      <h2>¿Como me cubre Alef?</h2>
      <p>Alef ya cumple con todos los requisitos tecnicos:</p>

      <table style={{width: "100%", borderCollapse: "collapse", fontSize: "0.9rem", marginBottom: "1.5rem"}}>
        <thead>
          <tr style={{borderBottom: "2px solid #ddd", textAlign: "left"}}>
            <th style={{padding: "0.6rem"}}>Requisito legal</th>
            <th style={{padding: "0.6rem"}}>Estado en Alef</th>
          </tr>
        </thead>
        <tbody>
          <tr style={{borderBottom: "1px solid #eee"}}>
            <td style={{padding: "0.6rem"}}>Facturacion encadenada</td>
            <td style={{padding: "0.6rem", color: "#16a34a", fontWeight: 600}}>Implementado</td>
          </tr>
          <tr style={{borderBottom: "1px solid #eee"}}>
            <td style={{padding: "0.6rem"}}>Hash antifraude (SHA-256)</td>
            <td style={{padding: "0.6rem", color: "#16a34a", fontWeight: 600}}>Implementado</td>
          </tr>
          <tr style={{borderBottom: "1px solid #eee"}}>
            <td style={{padding: "0.6rem"}}>Registro inalterable de emisiones</td>
            <td style={{padding: "0.6rem", color: "#16a34a", fontWeight: 600}}>Implementado</td>
          </tr>
          <tr style={{borderBottom: "1px solid #eee"}}>
            <td style={{padding: "0.6rem"}}>Registro de anulaciones y rectificaciones</td>
            <td style={{padding: "0.6rem", color: "#16a34a", fontWeight: 600}}>Implementado</td>
          </tr>
          <tr style={{borderBottom: "1px solid #eee"}}>
            <td style={{padding: "0.6rem"}}>Envio a la AEAT (VERI*FACTU)</td>
            <td style={{padding: "0.6rem", color: "#2563eb", fontWeight: 600}}>Preparado (pendiente activacion AEAT)</td>
          </tr>
          <tr style={{borderBottom: "1px solid #eee"}}>
            <td style={{padding: "0.6rem"}}>QR de verificacion en facturas</td>
            <td style={{padding: "0.6rem", color: "#16a34a", fontWeight: 600}}>Implementado</td>
          </tr>
          <tr style={{borderBottom: "1px solid #eee"}}>
            <td style={{padding: "0.6rem"}}>Firma electronica (XAdES)</td>
            <td style={{padding: "0.6rem", color: "#16a34a", fontWeight: 600}}>Implementado</td>
          </tr>
        </tbody>
      </table>

      <h2>¿Que tengo que hacer yo como restaurante?</h2>
      <ol>
        <li><strong>Usar Alef como tu TPV.</strong> Al usar Alef para emitir facturas y tickets, ya cumples con los requisitos tecnicos de la ley.</li>
        <li><strong>Configurar tus datos fiscales.</strong> Desde el panel de Alef, introduce tu NIF/CIF, razon social y direccion fiscal. Alef los incluye automaticamente en cada factura.</li>
        <li><strong>No modificar facturas fuera del sistema.</strong> Si necesitas anular o rectificar una factura, hazlo siempre desde Alef. El sistema registra cada cambio con su hash.</li>
        <li><strong>Nada mas.</strong> Alef se encarga del resto: encadenamiento, hash, registro, QR y envio a Hacienda.</li>
      </ol>

      <h2>¿Que pasa con mis facturas antiguas?</h2>
      <p>Las facturas emitidas antes de activar Alef no se encadenan retroactivamente.
        La cadena empieza desde tu primera factura en Alef. Esto es normal y la ley lo contempla.</p>

      <h2>¿Cuando entra en vigor?</h2>
      <p>El plazo para que los negocios usen software certificado es <strong>julio de 2027</strong>.
        La AEAT aun no ha activado la recepcion automatica de registros (VERI*FACTU en tiempo real),
        pero cuando lo haga, Alef ya esta preparado para enviarlos.</p>

      <h2>Preguntas frecuentes</h2>

      <h3>¿Los tickets de caja tambien cuentan?</h3>
      <p>Si. Todo documento que registre una operacion economica (factura simplificada, ticket, factura completa) debe cumplir con la ley.</p>

      <h3>¿Y si uso otro TPV ademas de Alef?</h3>
      <p>Solo puedes usar un sistema de facturacion por establecimiento. Si usas Alef, todas las facturas deben emitirse desde Alef para mantener la cadena intacta.</p>

      <h3>¿Puedo seguir dando tickets a mano?</h3>
      <p>No. La ley exige que los tickets se generen desde un software certificado. Los tickets escritos a mano no cumplen.</p>

      <h3>¿Alef guarda mis facturas?</h3>
      <p>Si. Todas las facturas quedan registradas en tu base de datos con su hash, fecha y hora. Puedes consultarlas, exportarlas y reimprimirlas desde el panel en cualquier momento.</p>

      <h3>¿Tengo que contratar un plan especifico?</h3>
      <p>No. La facturacion encadenada y antifraude esta incluida en todos los planes de Alef, desde el Esencial.</p>

      <h2>¿Necesitas ayuda?</h2>
      <p>Si tienes dudas sobre como te afecta la ley o como configurar tus datos fiscales en Alef,
        escribenos a <a href="mailto:contacto@softalef.com">contacto@softalef.com</a> o por
        <a href="https://wa.me/34623754328" target="_blank" rel="noreferrer"> WhatsApp</a>.
        Te lo explicamos sin compromiso.</p>
    </LegalLayout>
  );
}
