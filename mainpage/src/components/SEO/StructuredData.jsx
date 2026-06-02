import { Helmet } from "react-helmet-async";

/* ── Organization + SoftwareApplication — se inyecta en la home ── */
export function HomeStructuredData() {
  const org = {
    "@context": "https://schema.org",
    "@type": "Organization",
    name: "ALEF",
    url: "https://softalef.com",
    logo: "https://softalef.com/og.png",
    description:
      "Software de gestión integral para restaurantes. TPV, carta QR, stock predictivo, facturación automática y VeriFactu.",
    contactPoint: {
      "@type": "ContactPoint",
      contactType: "sales",
      availableLanguage: ["Spanish", "English"],
    },
    sameAs: ["https://instagram.com/softalef"],
  };

  const software = {
    "@context": "https://schema.org",
    "@type": "SoftwareApplication",
    name: "ALEF",
    applicationCategory: "BusinessApplication",
    operatingSystem: "Web, iOS, Android, Windows",
    description:
      "Sistema de gestión integral para restaurantes con TPV, carta QR inteligente, stock predictivo, facturación automática y cumplimiento VeriFactu.",
    offers: {
      "@type": "Offer",
      price: "129",
      priceCurrency: "EUR",
      priceValidUntil: "2027-12-31",
      availability: "https://schema.org/InStock",
      description: "Plan Premium — todo incluido, sin permanencia",
    },
    featureList: [
      "TPV táctil para sala y barra",
      "Carta QR inteligente con IA",
      "Stock predictivo automático",
      "Facturación automática desde email",
      "VeriFactu incluido",
      "Copiloto IA para gestión",
      "Instagram automático",
      "Analytics en tiempo real",
    ],
  };

  return (
    <Helmet>
      <script type="application/ld+json">{JSON.stringify(org)}</script>
      <script type="application/ld+json">{JSON.stringify(software)}</script>
    </Helmet>
  );
}

/* ── FAQPage — se inyecta donde haya FAQ ── */
export function FAQStructuredData({ faqs }) {
  if (!faqs?.length) return null;

  const data = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: faqs.map((faq) => ({
      "@type": "Question",
      name: faq.question,
      acceptedAnswer: {
        "@type": "Answer",
        text: faq.answer,
      },
    })),
  };

  return (
    <Helmet>
      <script type="application/ld+json">{JSON.stringify(data)}</script>
    </Helmet>
  );
}

/* ── Article — para guías y blog posts ── */
export function ArticleStructuredData({ title, description, path, datePublished, dateModified }) {
  const data = {
    "@context": "https://schema.org",
    "@type": "Article",
    headline: title,
    description,
    url: `https://softalef.com${path}`,
    datePublished,
    dateModified: dateModified || datePublished,
    author: {
      "@type": "Organization",
      name: "ALEF",
      url: "https://softalef.com",
    },
    publisher: {
      "@type": "Organization",
      name: "ALEF",
      logo: {
        "@type": "ImageObject",
        url: "https://softalef.com/og.png",
      },
    },
  };

  return (
    <Helmet>
      <script type="application/ld+json">{JSON.stringify(data)}</script>
    </Helmet>
  );
}

/* ── BreadcrumbList — para navegación interna ── */
export function BreadcrumbStructuredData({ items }) {
  const data = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: items.map((item, i) => ({
      "@type": "ListItem",
      position: i + 1,
      name: item.name,
      item: `https://softalef.com${item.path}`,
    })),
  };

  return (
    <Helmet>
      <script type="application/ld+json">{JSON.stringify(data)}</script>
    </Helmet>
  );
}
