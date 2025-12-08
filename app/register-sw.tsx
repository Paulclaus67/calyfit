"use client";

import { useEffect } from "react";

export function ServiceWorkerRegister() {
  useEffect(() => {
    if (typeof window === "undefined") return;
    if (!("serviceWorker" in navigator)) return;

    // 👉 En DEV, on ne veut PAS de service worker (sinon gros cache relou)
    if (process.env.NODE_ENV !== "production") {
      // En plus, on nettoie ceux qui existent déjà
      navigator.serviceWorker
        .getRegistrations()
        .then((regs) => regs.forEach((r) => r.unregister()))
        .catch(() => {});
      return;
    }

    // 👉 En PROD, on enregistre le SW normalement
    navigator.serviceWorker
      .register("/sw.js")
      .catch((err) => console.error("SW registration failed:", err));
  }, []);

  return null;
}
