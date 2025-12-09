import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth-server";
import PlanningManageClient from "./PlanningManageClient";

export default async function PlanningManagePage() {
  const user = await getCurrentUser();
  if (!user) {
    redirect("/login");
  }

  return <PlanningManageClient />;
}
