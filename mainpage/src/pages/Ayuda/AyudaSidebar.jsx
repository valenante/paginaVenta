export default function AyudaSidebar({ section, setSection }) {
  return (
    <aside className="ayuda-sidebar">
      <h3 className="ayuda-sidebar-title">Centro de Ayuda</h3>

      <button
        className={section === "empezar" ? "active" : ""}
        onClick={() => setSection("empezar")}
      >
        📘 Empezando
      </button>

      <button
        className={section === "tpv" ? "active" : ""}
        onClick={() => setSection("tpv")}
      >
        🧾 TPV
      </button>

      <button
        className={section === "carta" ? "active" : ""}
        onClick={() => setSection("carta")}
      >
        🍽️ Carta
      </button>

      <button
        className={section === "dashboard" ? "active" : ""}
        onClick={() => setSection("dashboard")}
      >
        📊 Dashboard
      </button>
    </aside>
  );
}
