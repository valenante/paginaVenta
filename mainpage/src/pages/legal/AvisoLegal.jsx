import LegalLayout from "./LegalLayout";

export default function AvisoLegal() {
  return (
    <LegalLayout title="Aviso legal">
      <p>
        En cumplimiento de la Ley 34/2002 (LSSI-CE), se informa que este
        sitio web es titularidad de:
      </p>

      <ul>
        <li><strong>Nombre comercial:</strong> Alef TPV</li>
        <li><strong>Responsable:</strong> Valentino Antenucci</li>
        <li><strong>Domicilio:</strong> Málaga, España</li>
        <li><strong>Email:</strong> contacto@softalef.com</li>
      </ul>

      <h2>Objeto</h2>
      <p>
        Alef es una plataforma web de gestión para restaurantes y comercios,
        incluyendo TPV, carta digital, reservas, facturación y estadísticas.
      </p>

      <h2>Propiedad intelectual</h2>
      <p>
        Todos los contenidos, diseño y código son propiedad del titular o
        cuentan con licencia de uso. Queda prohibida su reproducción sin
        autorización expresa.
      </p>
    </LegalLayout>
  );
}
