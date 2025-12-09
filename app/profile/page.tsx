import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth-server";
import ProfileClient from "./ProfileClient";

export default async function ProfilePage() {
  const user = await getCurrentUser();
  if (!user) {
    redirect("/login");
  }

  const createdAtLabel = user.createdAt
    ? new Date(user.createdAt).toLocaleDateString("fr-FR", {
        day: "2-digit",
        month: "long",
        year: "numeric",
      })
    : null;

  return (
    <main className="px-4 pb-4 pt-3 space-y-4">
      <header className="space-y-1">
        <p className="text-[11px] uppercase tracking-[0.18em] text-slate-500">
          Profil
        </p>
        <h1 className="text-2xl font-semibold text-slate-50">
          Ton espace Calyfit
        </h1>
        <p className="text-xs text-slate-400">
          Gère ton compte et ta session sur cet appareil.
        </p>
      </header>

      <ProfileClient
        name={user.name}
        email={user.email}
        createdAtLabel={createdAtLabel}
      />
    </main>
  );
}
