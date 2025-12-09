import type { Metadata, Viewport } from "next";
import "./globals.css";
import { ServiceWorkerRegister } from "./register-sw";
import { BottomNav } from "./_components/BottomNav";

export const metadata: Metadata = {
  title: "Calyfit",
  description: "Programme de calisthénie personnalisé",
  manifest: "/manifest.json",
};

export const viewport: Viewport = {
  themeColor: "#020617",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="fr">
      <head>
        <link rel="apple-touch-icon" href="/icon-192.png" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta
          name="apple-mobile-web-app-status-bar-style"
          content="black-translucent"
        />
        <meta name="apple-mobile-web-app-title" content="Calyfit" />
      </head>
      <body className="bg-slate-950 text-slate-50 min-h-screen">
        <ServiceWorkerRegister />
        <div className="mx-auto flex min-h-screen max-w-md flex-col">
          {/* contenu */}
          <div className="flex-1 pb-16 pt-2">{children}</div>
        </div>
        <BottomNav />
      </body>
    </html>
  );
}
