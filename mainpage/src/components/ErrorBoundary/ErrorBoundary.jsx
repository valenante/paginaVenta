import { Component } from "react";

/**
 * ErrorBoundary global para rutas lazy.
 * Captura errores de render antes de que React desmonte todo el árbol.
 * El usuario ve un mensaje de error con opción de recargar en lugar de
 * quedarse atrapado en un LoadingScreen infinito.
 */
export default class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, info) {
    console.error("[ErrorBoundary]", error, info.componentStack);
  }

  handleRetry = () => {
    this.setState({ hasError: false, error: null });
  };

  render() {
    if (!this.state.hasError) return this.props.children;

    return (
      <div style={styles.container}>
        <div style={styles.card}>
          <div style={styles.icon}>⚠️</div>
          <h2 style={styles.title}>Algo ha ido mal</h2>
          <p style={styles.message}>
            Se ha producido un error inesperado. Puedes intentar recargar la
            página o volver al inicio.
          </p>
          {import.meta.env.DEV && this.state.error && (
            <pre style={styles.detail}>
              {this.state.error.message}
            </pre>
          )}
          <div style={styles.actions}>
            <button style={styles.btnPrimary} onClick={this.handleRetry}>
              Reintentar
            </button>
            <button
              style={styles.btnSecondary}
              onClick={() => window.location.replace("/")}
            >
              Ir al inicio
            </button>
          </div>
        </div>
      </div>
    );
  }
}

const styles = {
  container: {
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    minHeight: "100vh",
    background: "var(--color-bg, #0f0f1a)",
    padding: "2rem",
  },
  card: {
    background: "var(--color-surface, #1a1a2e)",
    border: "1px solid rgba(255,255,255,0.1)",
    borderRadius: "1rem",
    padding: "2.5rem",
    maxWidth: "440px",
    width: "100%",
    textAlign: "center",
    color: "#e5e7eb",
  },
  icon: { fontSize: "2.5rem", marginBottom: "1rem" },
  title: {
    fontSize: "1.4rem",
    fontWeight: 700,
    marginBottom: "0.75rem",
    color: "#fff",
  },
  message: {
    fontSize: "0.95rem",
    color: "#9ca3af",
    lineHeight: 1.6,
    marginBottom: "1.5rem",
  },
  detail: {
    background: "rgba(255,0,0,0.08)",
    border: "1px solid rgba(255,0,0,0.2)",
    borderRadius: "0.5rem",
    padding: "0.75rem",
    fontSize: "0.8rem",
    color: "#f87171",
    textAlign: "left",
    overflowX: "auto",
    marginBottom: "1.5rem",
    whiteSpace: "pre-wrap",
    wordBreak: "break-word",
  },
  actions: { display: "flex", gap: "0.75rem", justifyContent: "center" },
  btnPrimary: {
    padding: "0.6rem 1.4rem",
    background: "#6a0dad",
    color: "#fff",
    border: "none",
    borderRadius: "0.5rem",
    cursor: "pointer",
    fontWeight: 600,
    fontSize: "0.9rem",
  },
  btnSecondary: {
    padding: "0.6rem 1.4rem",
    background: "transparent",
    color: "#9ca3af",
    border: "1px solid rgba(255,255,255,0.15)",
    borderRadius: "0.5rem",
    cursor: "pointer",
    fontWeight: 600,
    fontSize: "0.9rem",
  },
};
