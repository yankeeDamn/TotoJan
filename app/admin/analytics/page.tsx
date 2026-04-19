import { Card, CardDescription, CardTitle } from "@/components/ui/card";
import { requireAdminSession } from "@/lib/auth";
import { formatCurrency, getServiceLabel } from "@/lib/utils";
import { getAnalytics, getDashboardSummary } from "@/services/order-service";

export default async function AdminAnalyticsPage() {
  await requireAdminSession();
  const [analytics, summary] = await Promise.all([getAnalytics(), getDashboardSummary()]);

  return (
    <div className="mx-auto max-w-6xl space-y-6">
      <div>
        <p className="text-sm font-semibold uppercase tracking-[0.25em] text-brand-700">Analytics</p>
        <h1 className="mt-2 text-3xl font-bold text-ink">Business overview</h1>
      </div>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <StatCard title="Orders today" value={String(summary.totalOrdersToday)} note="All bookings since midnight" />
        <StatCard title="Active (pending)" value={String(summary.pendingOrders)} note="Awaiting completion" />
        <StatCard title="Completed" value={String(summary.completedOrders)} note="Finished trips and deliveries" />
        <StatCard title="Online drivers" value={String(summary.activeDrivers)} note="Currently available" />
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card className="p-6">
          <CardTitle>Revenue</CardTitle>
          <CardDescription className="mt-2">
            Total final fares collected from completed orders.
          </CardDescription>
          <p className="mt-6 text-5xl font-bold text-ink">{formatCurrency(analytics.revenue)}</p>
          <p className="mt-2 text-sm text-slate-500">Across all service types</p>
        </Card>

        <Card className="p-6">
          <CardTitle>Orders by service type</CardTitle>
          <CardDescription className="mt-2">
            Breakdown of total bookings per service category.
          </CardDescription>
          <div className="mt-5 space-y-3">
            {analytics.ordersByService.map((row) => (
              <div key={row.serviceType} className="flex items-center justify-between rounded-3xl border border-slate-200 px-4 py-3">
                <span className="text-sm font-semibold text-slate-700">
                  {getServiceLabel(row.serviceType as "travel" | "transport" | "delivery")}
                </span>
                <span className="text-sm font-bold text-ink">{row._count} orders</span>
              </div>
            ))}
          </div>
        </Card>

        <Card className="p-6 lg:col-span-2">
          <CardTitle>Orders by status</CardTitle>
          <CardDescription className="mt-2">
            Current distribution of all bookings by status.
          </CardDescription>
          <div className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {analytics.ordersByStatus.map((row) => (
              <div key={row.status} className="rounded-3xl bg-slate-50 p-4">
                <p className="text-xs uppercase tracking-[0.2em] text-slate-500">{row.status.replaceAll("_", " ")}</p>
                <p className="mt-2 text-3xl font-bold text-ink">{row._count}</p>
              </div>
            ))}
          </div>
        </Card>
      </div>
    </div>
  );
}

function StatCard({ title, value, note }: { title: string; value: string; note: string }) {
  return (
    <Card className="p-6">
      <p className="text-sm text-slate-500">{title}</p>
      <p className="mt-3 text-4xl font-bold text-ink">{value}</p>
      <p className="mt-3 text-sm text-slate-500">{note}</p>
    </Card>
  );
}
