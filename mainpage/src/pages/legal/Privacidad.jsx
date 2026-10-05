import LegalLayout from "./LegalLayout";
import SEOHead from "../../components/SEO/SEOHead";

export default function Privacidad() {
  return (
    <LegalLayout title="Política de Privacidad">
      <SEOHead title="Política de privacidad" description="Cómo ALEF recoge, trata y protege los datos personales de usuarios y clientes. Cumplimiento RGPD y derechos del interesado." path="/privacidad" />
      <p><em>Última actualización: 5 de octubre de 2026</em></p>

      <h2>1. Responsable del tratamiento</h2>
      <table>
        <tbody>
          <tr><td><strong>Responsable</strong></td><td>Valentino Antenucci</td></tr>
          <tr><td><strong>Domicilio</strong></td><td>Málaga, España</td></tr>
          <tr><td><strong>Email</strong></td><td>contacto@softalef.com</td></tr>
          <tr><td><strong>Web</strong></td><td>softalef.com</td></tr>
        </tbody>
      </table>

      <h2>2. Qué datos recogemos y para qué</h2>

      <h3>Usuarios del servicio SaaS</h3>
      <table>
        <thead><tr><th>Datos</th><th>Finalidad</th><th>Base legal</th></tr></thead>
        <tbody>
          <tr><td>Nombre, email, teléfono</td><td>Gestión de la cuenta y comunicaciones</td><td>Ejecución del contrato (art. 6.1.b RGPD)</td></tr>
          <tr><td>Datos de facturación (CIF, dirección fiscal)</td><td>Facturación y cumplimiento fiscal</td><td>Obligación legal (art. 6.1.c RGPD)</td></tr>
          <tr><td>Datos de uso (logs, actividad)</td><td>Mantenimiento, soporte y mejora del servicio</td><td>Interés legítimo (art. 6.1.f RGPD)</td></tr>
          <tr><td>IP, dispositivo, navegador</td><td>Seguridad y prevención de fraude</td><td>Interés legítimo (art. 6.1.f RGPD)</td></tr>
        </tbody>
      </table>

      <h3>Visitantes de la web</h3>
      <table>
        <thead><tr><th>Datos</th><th>Finalidad</th><th>Base legal</th></tr></thead>
        <tbody>
          <tr><td>Datos de navegación (cookies técnicas)</td><td>Funcionamiento de la web</td><td>Interés legítimo</td></tr>
          <tr><td>Datos de contacto (formulario)</td><td>Atender consultas comerciales</td><td>Consentimiento (art. 6.1.a RGPD)</td></tr>
        </tbody>
      </table>

      <h3>Usuarios de la aplicación móvil</h3>
      <table>
        <thead><tr><th>Datos</th><th>Finalidad</th><th>Base legal</th></tr></thead>
        <tbody>
          <tr><td>Nombre, email, teléfono</td><td>Registro y gestión de la cuenta</td><td>Ejecución del contrato (art. 6.1.b RGPD)</td></tr>
          <tr><td>Token de notificaciones push</td><td>Envío de notificaciones sobre pedidos y actividad</td><td>Consentimiento (art. 6.1.a RGPD)</td></tr>
          <tr><td>Datos biométricos (Face ID / huella dactilar)</td><td>Inicio de sesión rápido (el dato biométrico no sale del dispositivo)</td><td>Consentimiento (art. 6.1.a RGPD)</td></tr>
          <tr><td>Fotos de cámara o galería</td><td>Subir imágenes de perfil, logo o carta</td><td>Consentimiento (art. 6.1.a RGPD)</td></tr>
          <tr><td>Audio del micrófono</td><td>Comandas por voz (procesado en el dispositivo y enviado como texto)</td><td>Consentimiento (art. 6.1.a RGPD)</td></tr>
        </tbody>
      </table>

      <h3>Clientes finales de los establecimientos</h3>
      <p>Alef actúa como <strong>encargado del tratamiento</strong> por cuenta del establecimiento (responsable). Los datos de comensales (nombre, teléfono, email en reservas) se tratan conforme al <a href="/dpa">Acuerdo de Procesamiento de Datos (DPA)</a>.</p>

      <h3>Integraciones con Instagram y con Google (opcionales)</h3>
      <p>El establecimiento puede conectar, si lo desea, su cuenta profesional de Instagram y su Perfil de Empresa en Google. Solo se accede a las cuentas que el propio establecimiento conecta y autoriza.</p>
      <table>
        <thead><tr><th>Datos</th><th>Finalidad</th><th>Base legal</th></tr></thead>
        <tbody>
          <tr><td>Instagram: token de acceso, identificador y nombre de usuario de la cuenta profesional; publicaciones que el establecimiento prepara en ALEF</td><td>Preparar y publicar en la cuenta del establecimiento las publicaciones que este aprueba</td><td>Ejecución del contrato (art. 6.1.b RGPD) y consentimiento al conectar la cuenta (art. 6.1.a RGPD)</td></tr>
          <tr><td>Google: token de acceso al Perfil de Empresa; reseñas recibidas (nombre del autor tal como lo muestra Google, puntuación y texto)</td><td>Mostrar las reseñas al establecimiento y publicar las respuestas que una persona del establecimiento aprueba</td><td>Ejecución del contrato (art. 6.1.b RGPD) e interés legítimo del establecimiento en atender a sus clientes (art. 6.1.f RGPD)</td></tr>
        </tbody>
      </table>
      <p>Los textos de las publicaciones y los borradores de respuesta a reseñas se generan con inteligencia artificial (Anthropic). <strong>Nada se publica sin la aprobación de una persona del establecimiento.</strong> No usamos estos datos para publicidad ni los vendemos.</p>
      <p><strong>Desconexión y borrado de datos de Instagram:</strong> el establecimiento puede desconectar la cuenta desde el panel de ALEF, o quitar el acceso de ALEF desde la configuración de Instagram o de Facebook. Si se solicita a Meta el borrado de datos, ALEF elimina el token, el identificador y el nombre de usuario de esa cuenta y facilita un código para consultar el estado de la solicitud. También puedes pedir el borrado escribiendo a contacto@softalef.com.</p>

      <h2>3. Cuánto tiempo conservamos los datos</h2>
      <table>
        <thead><tr><th>Tipo de dato</th><th>Plazo</th></tr></thead>
        <tbody>
          <tr><td>Datos de cuenta activa</td><td>Mientras dure la relación contractual</td></tr>
          <tr><td>Datos tras baja del servicio</td><td>30 días para exportación, borrado total en 90 días</td></tr>
          <tr><td>Datos de facturación</td><td>4 años (Ley General Tributaria)</td></tr>
          <tr><td>Datos contables</td><td>6 años (Código de Comercio)</td></tr>
          <tr><td>Datos de contacto web</td><td>1 año desde la última comunicación</td></tr>
        </tbody>
      </table>

      <h2>4. A quién comunicamos los datos</h2>
      <p>No vendemos datos a terceros. Solo compartimos datos con los proveedores necesarios para prestar el servicio:</p>
      <table>
        <thead><tr><th>Proveedor</th><th>Servicio</th><th>Ubicación</th></tr></thead>
        <tbody>
          <tr><td>DigitalOcean</td><td>Hosting</td><td>UE (Fráncfort)</td></tr>
          <tr><td>MongoDB Atlas</td><td>Base de datos</td><td>UE (Fráncfort)</td></tr>
          <tr><td>Stripe</td><td>Pagos</td><td>UE (Irlanda) / EE.&nbsp;UU.</td></tr>
          <tr><td>Tailscale</td><td>VPN agentes de impresión</td><td>EE.&nbsp;UU.</td></tr>
          <tr><td>Expo (EAS)</td><td>Distribución de actualizaciones de la app</td><td>EE.&nbsp;UU.</td></tr>
          <tr><td>Meta Platforms (Instagram)</td><td>Publicación en la cuenta de Instagram conectada por el establecimiento</td><td>UE (Irlanda) / EE.&nbsp;UU.</td></tr>
          <tr><td>Google</td><td>Lectura y respuesta de reseñas del Perfil de Empresa conectado</td><td>UE / EE.&nbsp;UU.</td></tr>
          <tr><td>Anthropic</td><td>Redacción asistida por IA de publicaciones y borradores de respuesta</td><td>EE.&nbsp;UU.</td></tr>
        </tbody>
      </table>
      <p>Las transferencias fuera del EEE se realizan bajo Cláusulas Contractuales Tipo (SCC) aprobadas por la Comisión Europea.</p>

      <h2>5. Tus derechos</h2>
      <p>Puedes ejercer en cualquier momento:</p>
      <ul>
        <li><strong>Acceso</strong> — saber qué datos tenemos sobre ti</li>
        <li><strong>Rectificación</strong> — corregir datos inexactos</li>
        <li><strong>Supresión</strong> — solicitar el borrado de tus datos</li>
        <li><strong>Portabilidad</strong> — recibir tus datos en formato estructurado</li>
        <li><strong>Oposición</strong> — oponerte al tratamiento</li>
        <li><strong>Limitación</strong> — restringir el uso de tus datos</li>
      </ul>
      <p>Envía un email a <strong>contacto@softalef.com</strong> indicando tu identidad y el derecho que deseas ejercer. Responderemos en un plazo máximo de 30 días.</p>
      <p>Si consideras que tus derechos no han sido atendidos, puedes reclamar ante la <strong>Agencia Española de Protección de Datos (AEPD)</strong> en <a href="https://www.aepd.es" target="_blank" rel="noopener noreferrer">www.aepd.es</a>.</p>

      <h2>6. Eliminación de cuenta</h2>
      <p>Puedes eliminar tu cuenta en cualquier momento:</p>
      <ul>
        <li><strong>Desde la app:</strong> en la sección «Cuenta» → «Borrar cuenta».</li>
        <li><strong>Desde el panel web:</strong> contactando a contacto@softalef.com.</li>
      </ul>
      <p>Al eliminar tu cuenta, tus datos personales se anonimizan de forma irreversible. Los datos fiscales se retienen el plazo legal mínimo.</p>

      <h2>7. Seguridad</h2>
      <ul>
        <li>Cifrado en tránsito (HTTPS/TLS 1.2+)</li>
        <li>Cifrado en reposo</li>
        <li>Autenticación segura con tokens versionados</li>
        <li>Almacenamiento seguro de credenciales en el dispositivo (Keychain en iOS, Keystore en Android)</li>
        <li>Control de acceso basado en roles</li>
        <li>Copias de seguridad diarias</li>
        <li>Monitorización continua</li>
      </ul>

      <h2>8. Contacto</h2>
      <p>Para cualquier consulta sobre privacidad: <strong>contacto@softalef.com</strong></p>
    </LegalLayout>
  );
}
