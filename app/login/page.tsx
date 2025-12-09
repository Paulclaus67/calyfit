import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth-server";
import LoginClient from "./LoginClient";

export default async function LoginPage() {
  const user = await getCurrentUser();

  // Si déjà connecté, on ne montre pas l'écran de login
  if (user) {
    redirect("/");
  }

  return <LoginClient />;
}
