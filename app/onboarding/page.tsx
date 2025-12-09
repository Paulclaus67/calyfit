import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth-server";
import { prisma } from "@/lib/prisma";
import OnboardingClient from "./OnboardingClient";

export default async function OnboardingPage() {
  const user = await getCurrentUser();
  if (!user) {
    redirect("/login");
  }

  const hasPlan = await prisma.weekPlan.findFirst({
    where: { userId: user.id },
  });

  if (hasPlan) {
    redirect("/");
  }

  return <OnboardingClient />;
}
