import LegalLayout from "./LegalLayout";
import SEOHead from "../../components/SEO/SEOHead";

export default function TerminosServicio() {
  return (
    <LegalLayout title="Condiciones Generales del Servicio">
      <SEOHead title="Condiciones generales del servicio" description="Términos y condiciones de uso de ALEF, plataforma SaaS de gestión para restaurantes. Planes, facturación, cancelación y responsabilidades." path="/terminos" />
      <p><em>Última actualización: 16 de junio de 2026</em></p>

      <h2>1. Identificación del prestador</h2>
      <ul>
        <li>Nombre comercial: <strong>Alef</strong></li>
        <li>Dominio: softalef.com</li>
        <li>Email: contacto@softalef.com</li>
        <li>Actividad: Plataforma SaaS de gestión para restaurantes y comercios.</li>
      </ul>

      <h2>2. Objeto</h2>
      <p>Estas condiciones regulan el acceso y uso de la plataforma Alef («el Servicio»), incluyendo el TPV web, la aplicación móvil, la carta digital, el panel de gestión, la impresión de tickets, y cualquier funcionalidad ofrecida a través de softalef.com y sus subdominios.</p>
      <p>Al registrarte y/o pagar una suscripción, aceptas estas condiciones en su totalidad.</p>

      <h2>3. Alta y cuenta de usuario</h2>
      <p>Para usar el Servicio es necesario crear una cuenta proporcionando datos veraces. Cada cuenta da acceso a un entorno aislado (tenant) con su propia base de datos, subdominios y configuración.</p>
      <p>El titular es responsable de mantener la confidencialidad de sus credenciales y de toda la actividad bajo su cuenta. Puede crear cuentas adicionales para su personal con distintos niveles de permisos.</p>

      <h2>4. Planes, precios y facturación</h2>
      <p>Alef ofrece distintos planes de suscripción publicados en softalef.com. Los precios no incluyen IVA salvo indicación expresa. La suscripción se cobra de forma recurrente (mensual o anual) a través de Stripe.</p>
      <p>Alef puede modificar los precios con un preaviso de 30 días por email. Si un cobro falla, el titular dispone de 15 días para actualizar su método de pago antes de que la cuenta sea suspendida.</p>

      <h2>5. Cancelación y reembolsos</h2>
      <p>El titular puede cancelar su suscripción en cualquier momento desde su panel de facturación o contactando a contacto@softalef.com. La cancelación tiene efecto al final del periodo ya pagado. No se realizan reembolsos proporcionales.</p>
      <p>Tras la cancelación, los datos se retienen 90 días antes de su eliminación definitiva. El titular puede solicitar la exportación de sus datos antes de la eliminación.</p>

      <h2>6. Uso aceptable</h2>
      <p>Queda prohibido utilizar el Servicio para actividades ilegales, intentar acceder a datos de otros tenants, realizar ingeniería inversa, o sobrecargar intencionadamente la infraestructura. El incumplimiento puede resultar en suspensión inmediata.</p>

      <h2>7. Disponibilidad</h2>
      <p>Alef se compromete a una disponibilidad objetivo del 99,5&nbsp;% mensual. No se contabilizan ventanas de mantenimiento planificado, incidencias en servicios de terceros, ni causas de fuerza mayor.</p>

      <h2>8. Datos y privacidad</h2>
      <p>El tratamiento de datos se rige por la <a href="/privacidad">Política de Privacidad</a>. El titular es responsable del tratamiento de los datos de sus clientes. Alef actúa como encargado del tratamiento conforme al <a href="/dpa">Acuerdo de Procesamiento de Datos</a>.</p>
      <p>Los datos de cada tenant se almacenan en una base de datos aislada en la Unión Europea. La lista de subencargados del tratamiento está disponible en <a href="/subencargados">softalef.com/subencargados</a>.</p>

      <h2>9. Datos agregados y analítica</h2>
      <p>Alef puede utilizar datos anonimizados y agregados, de los que no sea posible identificar al titular ni a sus clientes, para los siguientes fines:</p>
      <ul>
        <li>Mejorar y optimizar el Servicio (rendimiento, fiabilidad, funcionalidades).</li>
        <li>Generar estadísticas sectoriales agregadas (tiempos de servicio medios, productos más demandados por zona, tendencias de consumo).</li>
        <li>Entrenar y calibrar los modelos predictivos internos (motor de tiempos de cocina, estimaciones de stock, sugerencias de producto).</li>
      </ul>
      <p>En ningún caso se comparten datos individuales de un tenant con otro. Los datos agregados no permiten la reidentificación del titular ni de sus comensales.</p>

      <h2>10. Continuidad del servicio, backups y recuperación</h2>
      <p>Alef mantiene las siguientes medidas de continuidad operativa:</p>
      <ul>
        <li><strong>Backups automáticos:</strong> copias diarias de la base de datos con retención mínima de 14 días, más copias continuas gestionadas por el proveedor de base de datos (MongoDB Atlas).</li>
        <li><strong>Copias de infraestructura:</strong> snapshots horarios de la configuración del servidor con retención de al menos 100 copias.</li>
        <li><strong>Despliegue sin interrupción:</strong> arquitectura blue/green que permite actualizaciones y rollback sin tiempo de caída.</li>
        <li><strong>Objetivo de recuperación (RPO):</strong> pérdida máxima de datos estimada en 1 hora para infraestructura, 24 horas para datos de negocio (complementado con backup continuo de Atlas).</li>
        <li><strong>Tiempo de recuperación (RTO):</strong> restauración estimada en menos de 5 minutos para la base de datos, menos de 30 segundos para el servidor de aplicación.</li>
        <li><strong>Verificación:</strong> Alef realiza simulacros periódicos de restauración para validar la integridad de las copias de seguridad.</li>
      </ul>
      <p>Estos objetivos son estimaciones basadas en mediciones reales y no constituyen una garantía absoluta. Alef no será responsable de pérdidas derivadas de fallos en servicios de terceros (proveedor de base de datos, hosting, DNS) fuera de su control directo.</p>

      <h2>11. Propiedad intelectual y de datos</h2>
      <p>Alef, su código, marca y logotipos son propiedad del prestador. El titular conserva la propiedad sobre sus datos y contenido. El titular concede a Alef una licencia limitada para procesar dicho contenido con el fin de prestar el Servicio.</p>
      <p>Las configuraciones del tenant (productos, precios, categorías, recetas, mapa de mesas) son propiedad del titular. Alef ofrece exportación de datos en formatos estándar (CSV, JSON) a petición del titular o a través del panel de gestión.</p>

      <h2>12. Limitación de responsabilidad</h2>
      <p>La responsabilidad total de Alef no excederá el importe pagado por el titular en los 12 meses anteriores al evento. Quedan excluidas de esta limitación las responsabilidades derivadas de dolo o negligencia grave, así como las obligaciones en materia de protección de datos personales.</p>
      <p>Alef no será responsable de pérdida de ingresos, errores en la configuración del titular, ni incidencias en hardware o servicios de terceros.</p>

      <h2>13. Modificaciones</h2>
      <p>Alef puede modificar estas condiciones notificando al titular por email con 30 días de antelación. Si el titular no está de acuerdo, podrá resolver el contrato sin penalización antes de la entrada en vigor de los cambios.</p>

      <h2>14. Ley aplicable</h2>
      <p>Estas condiciones se rigen por la legislación española.</p>

      <h2>15. Contacto</h2>
      <p>contacto@softalef.com</p>
    </LegalLayout>
  );
}
