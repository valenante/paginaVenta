export default function AyudaSidebar({ section, setSection, sections = [] }) {
  return (
    <aside className="ayuda-sidebar">
      <h3 className="ayuda-sidebar-title">Centro de Ayuda</h3>

      {sections.map((s) => (
        <button
          key={s.key}
          className={section === s.key ? "active" : ""}
          onClick={() => setSection(s.key)}
          type="button"
        >
          {s.icon ? `${s.icon} ` : ""}
          {s.label}
        </button>
      ))}
    </aside>
  );
}
