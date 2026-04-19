import { FareSettingsForm } from "@/components/admin/fare-settings-form";
import { requireAdminSession } from "@/lib/auth";
import { decimalToNumber } from "@/lib/utils";
import { listFareRules } from "@/services/order-service";

export default async function AdminFaresPage() {
  await requireAdminSession();
  const rules = await listFareRules();

  return (
    <div className="mx-auto max-w-6xl space-y-4">
      <div>
        <p className="text-sm font-semibold uppercase tracking-[0.25em] text-brand-700">Fare settings</p>
        <h1 className="mt-2 text-3xl font-bold text-ink">Distance band pricing</h1>
      </div>
      <FareSettingsForm
        rules={rules.map((rule) => ({
          id: rule.id,
          serviceType: rule.serviceType,
          baseFare: decimalToNumber(rule.baseFare) ?? 0,
          shortDistanceFare: decimalToNumber(rule.shortDistanceFare) ?? 0,
          mediumDistanceFare: decimalToNumber(rule.mediumDistanceFare) ?? 0,
          longDistanceFare: decimalToNumber(rule.longDistanceFare) ?? 0,
          priorityCharge: decimalToNumber(rule.priorityCharge) ?? 0,
          waitingCharge: decimalToNumber(rule.waitingCharge) ?? 0,
          isActive: rule.isActive,
        }))}
      />
    </div>
  );
}