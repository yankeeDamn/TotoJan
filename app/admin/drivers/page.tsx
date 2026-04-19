import { DriversManager } from "@/components/admin/drivers-manager";
import { requireAdminSession } from "@/lib/auth";
import { listDrivers } from "@/services/order-service";

export default async function AdminDriversPage() {
  await requireAdminSession();
  const drivers = await listDrivers();

  return (
    <div className="mx-auto max-w-6xl">
      <DriversManager drivers={drivers} />
    </div>
  );
}