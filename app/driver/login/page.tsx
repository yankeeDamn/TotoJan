import { redirect } from "next/navigation";

import { DriverLoginForm } from "@/components/driver/login-form";
import { getDriverSession } from "@/lib/auth";

export default async function DriverLoginPage() {
  const session = await getDriverSession();

  if (session) {
    redirect("/driver/dashboard");
  }

  return (
    <div className="flex min-h-[80vh] items-center justify-center">
      <DriverLoginForm />
    </div>
  );
}
