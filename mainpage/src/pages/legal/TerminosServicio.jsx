import LegalLayout from "./LegalLayout";

export default function TerminosServicio() {
  return (
    <LegalLayout title="Condiciones Generales del Servicio">
      <p><em>Ultima actualizacion: 28 de abril de 2026</em></p>

      <h2>1. Identificacion del prestador</h2>
      <ul>
        <li>Nombre comercial: <strong>Alef</strong></li>
        <li>Dominio: softalef.com</li>
        <li>Email: contacto@softalef.com</li>
        <li>Actividad: Plataforma SaaS de gestion para restaurantes y comercios.</li>
      </ul>

      <h2>2. Objeto</h2>
      <p>Estas condiciones regulan el acceso y uso de la plataforma Alef ("el Servicio"), incluyendo el TPV web, la carta digital, el panel de gestion, la impresion de tickets, y cualquier funcionalidad ofrecida a traves de softalef.com y sus subdominios.</p>
      <p>Al registrarte y/o pagar una suscripcion, aceptas estas condiciones en su totalidad.</p>

      <h2>3. Alta y cuenta de usuario</h2>
      <p>Para usar el Servicio es necesario crear una cuenta proporcionando datos veraces. Cada cuenta da acceso a un entorno aislado (tenant) con su propia base de datos, subdominios y configuracion.</p>
      <p>El titular es responsable de mantener la confidencialidad de sus credenciales y de toda la actividad bajo su cuenta. Puede crear cuentas adicionales para su personal con distintos niveles de permisos.</p>

      <h2>4. Planes, precios y facturacion</h2>
      <p>Alef ofrece distintos planes de suscripcion publicados en softalef.com. Los precios no incluyen IVA salvo indicacion expresa. La suscripcion se cobra de forma recurrente (mensual o anual) a traves de Stripe.</p>
      <p>Alef puede modificar los precios con un preaviso de 30 dias por email. Si un cobro falla, el titular dispone de 15 dias para actualizar su metodo de pago antes de que la cuenta sea suspendida.</p>

      <h2>5. Cancelacion y reembolsos</h2>
      <p>El titular puede cancelar su suscripcion en cualquier momento desde su panel de facturacion o contactando a contacto@softalef.com. La cancelacion tiene efecto al final del periodo ya pagado. No se realizan reembolsos proporcionales.</p>
      <p>Tras la cancelacion, los datos se retienen 90 dias antes de su eliminacion definitiva. El titular puede solicitar la exportacion de sus datos antes de la eliminacion.</p>

      <h2>6. Uso aceptable</h2>
      <p>Queda prohibido utilizar el Servicio para actividades ilegales, intentar acceder a datos de otros tenants, realizar ingenieria inversa, o sobrecargar intencionadamente la infraestructura. El incumplimiento puede resultar en suspension inmediata.</p>

      <h2>7. Disponibilidad</h2>
      <p>Alef se compromete a una disponibilidad objetivo del 99.5% mensual. No se contabilizan ventanas de mantenimiento planificado, incidencias en servicios de terceros, ni causas de fuerza mayor.</p>

      <h2>8. Datos y privacidad</h2>
      <p>El tratamiento de datos se rige por la <a href="/privacidad">Politica de Privacidad</a>. El titular es responsable del tratamiento de los datos de sus clientes. Alef actua como encargado del tratamiento conforme al <a href="/dpa">Acuerdo de Procesamiento de Datos</a>.</p>
      <p>Los datos de cada tenant se almacenan en una base de datos aislada en la Union Europea. La lista de subencargados del tratamiento esta disponible en <a href="/subencargados">softalef.com/subencargados</a>.</p>

      <h2>9. Datos agregados y analitica</h2>
      <p>Alef puede utilizar datos anonimizados y agregados, de los que no sea posible identificar al titular ni a sus clientes, para los siguientes fines:</p>
      <ul>
        <li>Mejorar y optimizar el Servicio (rendimiento, fiabilidad, funcionalidades).</li>
        <li>Generar estadisticas sectoriales agregadas (tiempos de servicio medios, productos mas demandados por zona, tendencias de consumo).</li>
        <li>Entrenar y calibrar los modelos predictivos internos (motor de tiempos de cocina, estimaciones de stock, sugerencias de producto).</li>
      </ul>
      <p>En ningun caso se comparten datos individuales de un tenant con otro. Los datos agregados no permiten la reidentificacion del titular ni de sus comensales.</p>

      <h2>10. Continuidad del servicio, backups y recuperacion</h2>
      <p>Alef mantiene las siguientes medidas de continuidad operativa:</p>
      <ul>
        <li><strong>Backups automaticos:</strong> copias diarias de la base de datos con retencion minima de 14 dias, mas copias continuas gestionadas por el proveedor de base de datos (MongoDB Atlas).</li>
        <li><strong>Copias de infraestructura:</strong> snapshots horarios de la configuracion del servidor con retencion de al menos 100 copias.</li>
        <li><strong>Despliegue sin interrupcion:</strong> arquitectura blue/green que permite actualizaciones y rollback sin tiempo de caida.</li>
        <li><strong>Objetivo de recuperacion (RPO):</strong> perdida maxima de datos estimada en 1 hora para infraestructura, 24 horas para datos de negocio (complementado con backup continuo de Atlas).</li>
        <li><strong>Tiempo de recuperacion (RTO):</strong> restauracion estimada en menos de 5 minutos para la base de datos, menos de 30 segundos para el servidor de aplicacion.</li>
        <li><strong>Verificacion:</strong> Alef realiza simulacros periodicos de restauracion para validar la integridad de las copias de seguridad.</li>
      </ul>
      <p>Estos objetivos son estimaciones basadas en mediciones reales y no constituyen una garantia absoluta. Alef no sera responsable de perdidas derivadas de fallos en servicios de terceros (proveedor de base de datos, hosting, DNS) fuera de su control directo.</p>

      <h2>11. Propiedad intelectual y de datos</h2>
      <p>Alef, su codigo, marca y logotipos son propiedad del prestador. El titular conserva la propiedad sobre sus datos y contenido. El titular concede a Alef una licencia limitada para procesar dicho contenido con el fin de prestar el Servicio.</p>
      <p>Las configuraciones del tenant (productos, precios, categorias, recetas, mapa de mesas) son propiedad del titular. Alef ofrece exportacion de datos en formatos estandar (CSV, JSON) a peticion del titular o a traves del panel de gestion.</p>

      <h2>12. Limitacion de responsabilidad</h2>
      <p>La responsabilidad total de Alef no excedera el importe pagado por el titular en los 12 meses anteriores al evento. Quedan excluidas de esta limitacion las responsabilidades derivadas de dolo o negligencia grave, asi como las obligaciones en materia de proteccion de datos personales.</p>
      <p>Alef no sera responsable de perdida de ingresos, errores en la configuracion del titular, ni incidencias en hardware o servicios de terceros.</p>

      <h2>13. Modificaciones</h2>
      <p>Alef puede modificar estas condiciones notificando al titular por email con 30 dias de antelacion. Si el titular no esta de acuerdo, podra resolver el contrato sin penalizacion antes de la entrada en vigor de los cambios.</p>

      <h2>14. Ley aplicable</h2>
      <p>Estas condiciones se rigen por la legislacion espanola.</p>

      <h2>15. Contacto</h2>
      <p>contacto@softalef.com</p>
    </LegalLayout>
  );
}
