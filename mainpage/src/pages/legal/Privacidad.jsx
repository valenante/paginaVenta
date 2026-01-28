import LegalLayout from "./LegalLayout";

export default function Privacidad() {
  return (
    <LegalLayout title="Política de privacidad">
      <p>
        De conformidad con el Reglamento (UE) 2016/679 (RGPD), se informa a los
        usuarios sobre el tratamiento de sus datos personales.
      </p>

      <h2>Responsable del tratamiento</h2>
      <ul>
        <li><strong>Responsable:</strong> Valentino Antenucci</li>
        <li><strong>Email:</strong> contacto@softalef.com</li>
        <li><strong>Ubicación:</strong> España</li>
      </ul>

      <h2>Finalidad del tratamiento</h2>
      <p>Los datos personales se utilizan para:</p>
      <ul>
        <li>Gestión de cuentas de usuario</li>
        <li>Prestación del servicio contratado</li>
        <li>Soporte técnico y atención al cliente</li>
        <li>Cumplimiento de obligaciones legales</li>
      </ul>

      <h2>Base legal</h2>
      <p>
        La base legal para el tratamiento de los datos es la ejecución del
        contrato y, cuando proceda, el consentimiento del usuario.
      </p>

      <h2>Conservación de los datos</h2>
      <p>
        Los datos se conservarán mientras exista una relación contractual
        activa o durante los plazos exigidos por la normativa aplicable.
      </p>

      <h2>Derechos del usuario</h2>
      <p>
        El usuario puede ejercer sus derechos de acceso, rectificación,
        supresión, oposición, limitación y portabilidad enviando un correo a{" "}
        <strong>contacto@softalef.com</strong>.
      </p>
    </LegalLayout>
  );
}
