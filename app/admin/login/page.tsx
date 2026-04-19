import { redirect } from "next/navigation";

import { AdminLoginForm } from "@/components/admin/login-form";
import { getAdminSession } from "@/lib/auth";

export default async function AdminLoginPage() {
  const session = await getAdminSession();

  if (session) {
    redirect("/admin/dashboard");
  }

  return (
    <div className="flex min-h-[80vh] items-center justify-center">
      <AdminLoginForm />
    </div>
  );
}