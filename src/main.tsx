import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { RouterProvider } from "react-router-dom";

import { router } from "@/routes/router";
import "@/styles/globals.css";

if ('serviceWorker' in navigator) {
  if (import.meta.env.DEV) {
    // In development / preview mode, ensure stale service workers are cleared
    navigator.serviceWorker.getRegistrations().then((registrations) => {
      for (const registration of registrations) {
        registration.unregister();
      }
    });
  } else {
    window.addEventListener('load', () => {
      navigator.serviceWorker.register('/sw.js').catch((err) => {
        console.log('SW registration failed: ', err);
      });
    });
  }
}

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <RouterProvider router={router} />
  </StrictMode>,
);
