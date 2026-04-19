import { Card, CardDescription, CardTitle } from "@/components/ui/card";
import { requireAdminSession } from "@/lib/auth";
import { formatCurrency } from "@/lib/utils";
import { getAnalytics, getDashboardSummary, listOrders } from "@/services/order-service";

export default async function AdminDashboardPage() {
  await requireAdminSession();
  const [summary, analytics, recentOrders] = await Promise.all([getDashboardSummary(), getAnalytics(), listOrders()]);

  return (
    <div className="mx-auto max-w-6xl space-y-6">
      <div>
        <p className="text-sm font-semibold uppercase tracking-[0.25em] text-brand-700">Dashboard</p>
        <h1 className="mt-2 text-3xl font-bold text-ink">Operations snapshot</h1>
      </div>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <MetricCard title="Total orders today" value={String(summary.totalOrdersToday)} description="All bookings created since midnight." />
        <MetricCard title="Pending orders" value={String(summary.pendingOrders)} description="Awaiting assignment or completion." />
        <MetricCard title="Completed orders" value={String(summary.completedOrders)} description="Finished trips and deliveries." />
        <MetricCard title="Active drivers" value={String(summary.activeDrivers)} description="Currently online and verified." />
      </div>

      <div className="grid gap-4 lg:grid-cols-[0.9fr_1.1fr]">
        <Card className="p-6">
          <CardTitle>Quick analytics</CardTitle>
          <CardDescription className="mt-2">Current high-level business performance.</CardDescription>
          <div className="mt-5 grid gap-4 sm:grid-cols-2">
            <div className="rounded-3xl bg-slate-50 p-4">
              <p className="text-sm text-slate-500">Completed revenue</p>
              <p className="mt-2 text-2xl font-bold text-ink">{formatCurrency(analytics.revenue)}</p>
            </div>
            <div className="rounded-3xl bg-slate-50 p-4">
              <p className="text-sm text-slate-500">Tracked service types</p>
              <p className="mt-2 text-2xl font-bold text-ink">{analytics.ordersByService.length}</p>
            </div>
          </div>
        </Card>

        <Card className="p-6">
          <CardTitle>Latest bookings</CardTitle>
          <CardDescription className="mt-2">Recent customer requests entering dispatch.</CardDescription>
          <div className="mt-5 space-y-3">
            {recentOrders.slice(0, 5).map((order) => (
              <div key={order.id} className="rounded-3xl border border-slate-200 p-4">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <p className="font-semibold text-ink">{order.orderNumber}</p>
                    <p className="text-sm text-slate-600">{order.customerName} • {order.serviceType}</p>
                  </div>
                  <p className="text-sm font-semibold text-slate-700">{formatCurrency(order.estimatedFare)}</p>
                </div>
              </div>
            ))}
          </div>
        </Card>
      </div>
    </div>
  );
}

function MetricCard({ title, value, description }: { title: string; value: string; description: string }) {
  return (
    <Card className="p-6">
      <p className="text-sm text-slate-500">{title}</p>
      <p className="mt-3 text-4xl font-bold text-ink">{value}</p>
      <p className="mt-3 text-sm text-slate-600">{description}</p>
    </Card>
  );
}