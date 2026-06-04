import { Helmet } from "react-helmet-async";

const DEFAULTS = {
  siteName: "ALEF",
  siteUrl: "https://softalef.com",
  defaultTitle: "ALEF | Software de gestión para restaurantes — TPV, stock, facturación y VeriFactu",
  defaultDescription:
    "Software de hostelería con TPV, carta QR inteligente, stock predictivo, facturación automática y automatización con IA. VeriFactu incluido. Desde 129€/mes sin permanencia.",
  defaultImage: "https://softalef.com/og.png",
  locale: "es_ES",
};

export default function SEOHead({
  title,
  description,
  path = "",
  image,
  type = "website",
  noindex = false,
  children,
}) {
  const fullTitle = title
    ? `${title} | ALEF`
    : DEFAULTS.defaultTitle;
  const desc = description || DEFAULTS.defaultDescription;
  const url = `${DEFAULTS.siteUrl}${path}`;
  const img = image || DEFAULTS.defaultImage;

  return (
    <Helmet>
      <title>{fullTitle}</title>
      <meta name="description" content={desc} />
      <link rel="canonical" href={url} />
      {noindex && <meta name="robots" content="noindex,nofollow" />}

      {/* Open Graph */}
      <meta property="og:type" content={type} />
      <meta property="og:url" content={url} />
      <meta property="og:title" content={fullTitle} />
      <meta property="og:description" content={desc} />
      <meta property="og:image" content={img} />
      <meta property="og:locale" content={DEFAULTS.locale} />
      <meta property="og:site_name" content={DEFAULTS.siteName} />

      {/* Twitter */}
      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:title" content={fullTitle} />
      <meta name="twitter:description" content={desc} />
      <meta name="twitter:image" content={img} />

      {children}
    </Helmet>
  );
}
