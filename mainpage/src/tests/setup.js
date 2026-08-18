// setupFiles de vitest para el panel.
// Añade los matchers de jest-dom (toBeChecked, toBeInTheDocument, …) y limpia
// el DOM entre tests para que no se filtre estado de un render al siguiente.
//
// MERGE main + fix/inputs-numericos: los dos lados crearon este fichero por su
// cuenta. La rama solo hacía `import "@testing-library/jest-dom"`; main usa el
// subpath `/vitest`, que es el entrypoint oficial para vitest (registra los
// matchers en el `expect` de vitest, no en el global de jest) y además añade el
// `cleanup()`. Es un SUPERCONJUNTO de lo que hacía la rama: nada se pierde.
import "@testing-library/jest-dom/vitest";
import { cleanup } from "@testing-library/react";
import { afterEach } from "vitest";

afterEach(() => {
  cleanup();
});
