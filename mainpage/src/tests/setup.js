// setupFiles de vitest para el panel.
// Añade los matchers de jest-dom (toBeChecked, toBeInTheDocument, …) y limpia
// el DOM entre tests para que no se filtre estado de un render al siguiente.
import "@testing-library/jest-dom/vitest";
import { cleanup } from "@testing-library/react";
import { afterEach } from "vitest";

afterEach(() => {
  cleanup();
});
