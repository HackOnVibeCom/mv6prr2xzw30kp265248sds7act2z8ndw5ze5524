import { StrictMode, startTransition } from "react";
import { createRoot, hydrateRoot } from "react-dom/client";
import { RouterProvider } from "@tanstack/react-router";
import { getRouter } from "./router";

const router = getRouter();

startTransition(() => {
  const container = document.getElementById("root");
  if (container) {
    if (container.hasChildNodes()) {
      hydrateRoot(
        container,
        <StrictMode>
          <RouterProvider router={router} />
        </StrictMode>,
      );
    } else {
      createRoot(container).render(
        <StrictMode>
          <RouterProvider router={router} />
        </StrictMode>,
      );
    }
  }
});
