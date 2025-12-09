import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth-server";
import SessionsManageClient from "./SessionsManageClient";

export default async function SessionsManagePage() {
  const user = await getCurrentUser();
  if (!user) {
    redirect("/login");
  }

  return <SessionsManageClient />;
}
