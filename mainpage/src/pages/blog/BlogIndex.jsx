import { Link } from "react-router-dom";
import SEOHead from "../../components/SEO/SEOHead";
import { BreadcrumbStructuredData } from "../../components/SEO/StructuredData";
import "./Blog.css";

const posts = [
  {
    slug: "que-es-verifactu-restaurantes",
    tag: "Legal",
    title: "Que es VeriFactu y como afecta a tu restaurante en 2027",
    desc: "Todo lo que necesitas saber sobre la nueva ley de facturacion electronica: plazos, requisitos, multas y como prepararte sin complicaciones.",
    date: "4 junio 2026",
    readTime: "8 min",
  },
  {
    slug: "control-stock-restaurante-guia",
    tag: "Operaciones",
    title: "Guia completa de control de stock para restaurantes",
    desc: "Desde el inventario basico hasta la prediccion con IA. Como pasar de contar a mano a que el sistema pida solo.",
    date: "4 junio 2026",
    readTime: "10 min",
  },
  {
    slug: "calcular-margenes-restaurante",
    tag: "Finanzas",
    title: "Como calcular los margenes reales de tu restaurante",
    desc: "El escandallo no basta. Aprende a calcular el coste real por plato, detectar fugas de margen y proteger tu rentabilidad.",
    date: "4 junio 2026",
    readTime: "9 min",
  },
  {
    slug: "facturacion-electronica-hosteleria",
    tag: "Legal",
    title: "Facturacion electronica para hosteleria: guia practica",
    desc: "Que cambia, que necesitas, y como automatizar todo el proceso para que las facturas de tus proveedores se procesen solas.",
    date: "4 junio 2026",
    readTime: "7 min",
  },
  {
    slug: "automatizacion-restaurantes-ia",
    tag: "Tecnologia",
    title: "Automatizacion de restaurantes con IA: que se puede hacer hoy",
    desc: "Instagram automatico, pedidos a proveedor, respuestas a resenas, prediccion de demanda. Que es real y que es humo.",
    date: "4 junio 2026",
    readTime: "9 min",
  },
];

export default function BlogIndex() {
  return (
    <div className="BlogIndex">
      <SEOHead
        title="Blog — Gestion de restaurantes, stock, facturacion y automatizacion"
        description="Articulos sobre gestion de restaurantes: control de stock, margenes, facturacion electronica, VeriFactu, automatizacion con IA y mas. Por el equipo de ALEF."
        path="/blog"
      />
      <BreadcrumbStructuredData items={[{ name: "Inicio", path: "/" }, { name: "Blog", path: "/blog" }]} />

      <div className="BlogIndex-hero">
        <h1>Blog ALEF</h1>
        <p>
          Guias practicas sobre gestion de restaurantes, facturacion, stock,
          margenes y automatizacion. Sin humo, con datos.
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

      <footer className="FP-footer">
        <div className="FP-footer-bottom">
          <Link to="/">Volver a ALEF</Link>
          <span>&copy; {new Date().getFullYear()} ALEF</span>
        </div>
      </footer>
    </div>
  );
}
