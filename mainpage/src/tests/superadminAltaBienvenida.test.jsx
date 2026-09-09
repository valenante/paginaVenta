/**
 * superadminAltaBienvenida.test.jsx
 *
 * ⚖️ Constitución ALEF · Art. 4(b) la red va ANTES y sale ROJA con el bug dentro
 *                        Art. 4(c) matar al mutante
 *                        Art. 5    fail-loud NUNCA fail-silent
 *                        Art. 10   un fix de backend NO está probado hasta ver al FRONTEND
 *                        Art. 2    zona sensible: onboarding + acceso del cliente
 *
 * ══════════════════════════════════════════════════════════════════════════════════════
 * LA CICATRIZ QUE VIGILA (C2-3, 2026-08-19)
 *
 * El lote C le puso autoridad de entorno al correo de onboarding: en un proceso NO productivo
 * —o con `ALEF_ENV_MODE` ausente o no reconocido— la bienvenida NO se envía. El backend lo
 * calcula y, desde C2-3, lo dice: `bienvenidaEnviada` / `bienvenidaMotivo`.
 *
 * La revisión adversarial encontró que ese aviso MORÍA en el camino:
 *   · `superadminOnboardingController.js` tiraba los dos campos  → arreglado en C2-3 (backend)
 *   · y este componente pintaba «Tenant creado» EN VERDE pasara lo que pasara:
 *
 *       :104   const d = provRes.data?.data || provRes.data;
 *       :106   if (d?.passwordSetupUrl) setSuccess(`Tenant creado. Link set-password: ...`)
 *
 *     Un `setSuccess` para los dos casos ⇒ el superadmin cerraba la pantalla convencido de que
 *     el cliente había recibido su correo. Y el subtítulo de :125 se lo confirmaba por escrito:
 *     «Provisión directa sin pago. Se envía email con link de contraseña.»
 *
 * ⭐ QUIÉN PIERDE: el dueño del restaurante que acaba de darse de alta y NUNCA recibe el enlace
 *    para ponerse la contraseña. No puede entrar. Y nadie se entera, porque la pantalla dijo
 *    que todo fue bien.
 *
 * ⚠️ LO QUE ESTA RED **NO** AFIRMA (Art. 9): no hay reintento automático. El aviso existe para
 *    que el humano REENVÍE A MANO el `passwordSetupUrl`, que ya viene en la misma respuesta.
 *    No se genera un segundo token, no hay endpoint nuevo, no se persiste nada.
 * ══════════════════════════════════════════════════════════════════════════════════════
 */
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";

const H = vi.hoisted(() => ({ get: vi.fn(), post: vi.fn() }));
vi.mock("../utils/api", () => ({ default: { get: H.get, post: H.post } }));

const SuperadminAltaTenant = (await import("../pages/admin/SuperadminAltaTenant/SuperadminAltaTenant.jsx")).default;

const PASSWORD_URL = "https://panel.softalef.com/set-password?token=abc123";
const PLANES = [{ slug: "pro", nombre: "Pro", precioMensual: 49, tipoNegocio: "restaurante" }];

/** Rellena el paso 1, avanza al 2 y pulsa «Crear y provisionar». */
async function altaCompleta({ bienvenidaEnviada, bienvenidaMotivo }) {
  H.get.mockResolvedValue({ data: PLANES });
  H.post.mockImplementation((url) => {
    if (url.includes("precheckout")) return Promise.resolve({ data: { precheckoutId: "pre_1" } });
    return Promise.resolve({
      data: {
        data: {
          tenantSlug: "bar-pepe",
          tenantId: "t1",
          passwordSetupUrl: PASSWORD_URL,
          bienvenidaEnviada,
          bienvenidaMotivo,
        },
      },
    });
  });

  render(<MemoryRouter><SuperadminAltaTenant /></MemoryRouter>);

  await waitFor(() => expect(H.get).toHaveBeenCalled());

  fireEvent.change(screen.getByRole("combobox"), { target: { value: "pro" } });
  fireEvent.change(screen.getByPlaceholderText("Ej. Zabor Feten"), { target: { value: "Bar Pepe" } });
  fireEvent.change(screen.getByPlaceholderText("admin@restaurante.com"), { target: { value: "duenyo@barpepe.example" } });
  fireEvent.change(screen.getByPlaceholderText("Ej. Manuel García"), { target: { value: "Pepe" } });

  fireEvent.click(screen.getByText(/Continuar|Siguiente/i));
  fireEvent.click(screen.getByText(/Crear y provisionar/i));

  await waitFor(() => expect(H.post).toHaveBeenCalledTimes(2));
}

beforeEach(() => { H.get.mockReset(); H.post.mockReset(); });

describe("C2-3 · el superadmin no puede ver SUCCESS si la bienvenida no salió", () => {
  it("F1 · 🟢 CONTROL POSITIVO: bienvenida ENVIADA ⇒ éxito de siempre, sin avisos", async () => {
    await altaCompleta({ bienvenidaEnviada: true, bienvenidaMotivo: null });

    // Sin este caso, «pintar siempre el aviso» pondría F2 verde y sería peor que el bug:
    // un aviso que sale siempre deja de leerse.
    await waitFor(() =>
      expect(screen.getByText(/Tenant creado/i), "el camino feliz tiene que seguir intacto").toBeTruthy()
    );
    expect(
      screen.queryByText(/NO se ha enviado|NO se envió|no ha salido/i),
      "no puede avisarse de nada cuando el correo SÍ salió"
    ).toBeNull();
  });

  it("F2 · 🔴 bienvenida CONTENIDA ⇒ el operador ve el aviso, no un éxito liso", async () => {
    await altaCompleta({ bienvenidaEnviada: false, bienvenidaMotivo: "EXT_CONTENIDO_POR_ENTORNO" });

    // (a) Tiene que decir, sin ambigüedad, que el correo NO salió.
    await waitFor(() =>
      expect(
        screen.queryByText(/no se ha enviado|no se envió|no ha salido/i),
        "el panel sigue pintando el éxito de siempre: el superadmin cierra la pantalla creyendo " +
        "que el cliente recibió su enlace, y el cliente no puede entrar. Art. 10."
      ).toBeTruthy()
    );

    // (b) Y tiene que enseñar el enlace, que es LA salida: se pasa a mano.
    expect(
      screen.getByText(new RegExp(PASSWORD_URL.replace(/[.?*+^$[\]\\(){}|-]/g, "\\$&"))),
      "sin el enlace delante, el aviso no sirve de nada: el superadmin no puede rescatar al cliente"
    ).toBeTruthy();

    // (c) Y NO puede seguir prometiendo que el email se envía.
    expect(
      screen.queryByText(/Se envía email con link de contraseña/i),
      "el subtítulo sigue prometiendo por escrito que se manda el correo, justo debajo del " +
      "aviso de que no se ha mandado. La pantalla se contradice a sí misma."
    ).toBeNull();
  });
});
