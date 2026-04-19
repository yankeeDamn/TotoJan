import { OrdersTable } from "@/components/admin/orders-table";
import { requireAdminSession } from "@/lib/auth";
import { listDrivers, listOrders } from "@/services/order-service";

export default async function AdminOrdersPage({ searchParams }: { searchParams: Promise<{ status?: string }> }) {
  await requireAdminSession();
  const params = await searchParams;
  const [orders, drivers] = await Promise.all([listOrders(params.status), listDrivers()]);

  return (
    <div className="mx-auto max-w-6xl">
      <OrdersTable orders={orders} drivers={drivers} />
    </div>
  );
}