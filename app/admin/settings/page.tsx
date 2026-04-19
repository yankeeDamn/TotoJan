import { Badge } from "@/components/ui/badge";
import { Card, CardDescription, CardTitle } from "@/components/ui/card";
import { requireAdminSession } from "@/lib/auth";
import { getServiceAreas } from "@/services/order-service";

export default async function AdminSettingsPage() {
  await requireAdminSession();
  const areas = await getServiceAreas();

  return (
    <div className="mx-auto max-w-6xl space-y-6">
      <div>
        <p className="text-sm font-semibold uppercase tracking-[0.25em] text-brand-700">Service area</p>
        <h1 className="mt-2 text-3xl font-bold text-ink">Rampurhat-only coverage</h1>
      </div>
      <Card className="p-6">
        <CardTitle>Allowed booking localities</CardTitle>
        <CardDescription className="mt-2">The MVP is locked to Rampurhat localities. Orders outside this list are rejected during validation.</CardDescription>
        <div className="mt-5 flex flex-wrap gap-2">
          {areas.map((area) => (
            <Badge key={area.id} className="border-brand-200 bg-brand-50 text-brand-700">{area.areaName}</Badge>
          ))}
        </div>
      </Card>
    </div>
  );
}