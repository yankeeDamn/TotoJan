import { DriverDashboardClient } from "@/components/driver/driver-dashboard-client";
import { requireDriverSession } from "@/lib/auth";
import { getDriverDashboard } from "@/services/order-service";

export default async function DriverDashboardPage() {
  const session = await requireDriverSession();
  const data = await getDriverDashboard(session.sub);

  return (
    <div className="mx-auto max-w-4xl">
      <DriverDashboardClient data={data} />
    </div>
  );
}
