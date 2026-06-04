import { Link } from "react-router-dom";
import TopBar from "../../components/TopBar/TopBar";
import Footer from "../../components/Footer/Footer";
import SEOHead from "../../components/SEO/SEOHead";
import { BreadcrumbStructuredData } from "../../components/SEO/StructuredData";
import "../features/CartaQR.css";
import "./Blog.css";

const posts = [
  {
    slug: "que-es-verifactu-restaurantes",
    tag: "Legal",
    title: "Qué es VeriFactu y cómo afecta a tu restaurante en 2027",
    desc: "Todo lo que necesitas saber sobre la nueva ley de facturación electrónica: plazos, requisitos, multas y cómo prepararte sin complicaciones.",
    date: "4 junio 2026",
    readTime: "8 min",
  },
  {
    slug: "control-stock-restaurante-guia",
    tag: "Operaciones",
    title: "Guía completa de control de stock para restaurantes",
    desc: "Desde el inventario básico hasta la predicción con IA. Cómo pasar de contar a mano a que el sistema pida solo.",
    date: "4 junio 2026",
    readTime: "10 min",
  },
  {
    slug: "calcular-margenes-restaurante",
    tag: "Finanzas",
    title: "Cómo calcular los márgenes reales de tu restaurante",
    desc: "El escandallo no basta. Aprende a calcular el coste real por plato, detectar fugas de margen y proteger tu rentabilidad.",
    date: "4 junio 2026",
    readTime: "9 min",
  },
  {
    slug: "facturacion-electronica-hosteleria",
    tag: "Legal",
    title: "Facturación electrónica para hostelería: guía práctica",
    desc: "Qué cambia, qué necesitas, y cómo automatizar todo el proceso para que las facturas de tus proveedores se procesen solas.",
    date: "4 junio 2026",
    readTime: "7 min",
  },
  {
    slug: "automatizacion-restaurantes-ia",
    tag: "Tecnología",
    title: "Automatización de restaurantes con IA: qué se puede hacer hoy",
    desc: "Instagram automático, pedidos a proveedor, respuestas a reseñas, predicción de demanda. Qué es real y qué es humo.",
    date: "4 junio 2026",
    readTime: "9 min",
  },
];

export default function BlogIndex() {
  return (
    <div className="BlogIndex">
      <TopBar />
      <SEOHead
        title="Blog — Gestión de restaurantes, stock, facturación y automatización"
        description="Artículos sobre gestión de restaurantes: control de stock, márgenes, facturación electrónica, VeriFactu, automatización con IA y más. Por el equipo de ALEF."
        path="/blog"
      />
      <BreadcrumbStructuredData items={[{ name: "Inicio", path: "/" }, { name: "Blog", path: "/blog" }]} />

      <div className="BlogIndex-hero">
        <h1>Blog ALEF</h1>
        <p>
          Guías prácticas sobre gestión de restaurantes, facturación, stock,
          márgenes y automatización. Sin humo, con datos.
        </p>
      </div>

      <div className="BlogIndex-grid">
        {posts.map((p) => (
          <Link key={p.slug} to={`/blog/${p.slug}`} className="BlogIndex-card">
            <span className="BlogIndex-card-tag">{p.tag}</span>
            <h2>{p.title}</h2>
            <p>{p.desc}</p>
            <span className="BlogIndex-card-meta">{p.date} · {p.readTime} lectura</span>
          </Link>
        ))}
      </div>

      <Footer />
    </div>
  );
}
