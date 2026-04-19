"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

import { Button } from "@/components/ui/button";
import { Card, CardDescription, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";

type FareRuleRecord = {
  id: string;
  serviceType: string;
  baseFare: number;
  shortDistanceFare: number;
  mediumDistanceFare: number;
  longDistanceFare: number;
  priorityCharge: number;
  waitingCharge: number;
  isActive: boolean;
};

export function FareSettingsForm({ rules }: { rules: FareRuleRecord[] }) {
  const router = useRouter();
  const [savingId, setSavingId] = useState<string | null>(null);
  const [drafts, setDrafts] = useState<Record<string, FareRuleRecord>>(
    Object.fromEntries(rules.map((rule) => [rule.id, rule])),
  );

  return (
    <div className="grid gap-4 lg:grid-cols-3">
      {rules.map((rule) => {
        const draft = drafts[rule.id];

        return (
          <Card key={rule.id} className="p-6">
            <CardTitle className="capitalize">{rule.serviceType}</CardTitle>
            <CardDescription className="mt-2">Base fare and distance band configuration for this service type.</CardDescription>
            <div className="mt-5 grid gap-3">
              {[
                ["baseFare", "Base fare"],
                ["shortDistanceFare", "Short band"],
                ["mediumDistanceFare", "Medium band"],
                ["longDistanceFare", "Long band"],
                ["priorityCharge", "Priority surcharge"],
                ["waitingCharge", "Waiting charge"],
              ].map(([key, label]) => (
                <label key={key} className="space-y-2 text-sm font-semibold text-slate-700">
                  <span>{label}</span>
                  <Input
                    type="number"
                    min="0"
                    value={draft[key as keyof FareRuleRecord] as number}
                    onChange={(event) =>
                      setDrafts((current) => ({
                        ...current,
                        [rule.id]: {
                          ...current[rule.id],
                          [key]: Number(event.target.value),
                        },
                      }))
                    }
                  />
                </label>
              ))}
            </div>
            <label className="mt-4 flex items-center gap-3 text-sm text-slate-700">
              <input
                className="h-4 w-4 accent-brand-500"
                type="checkbox"
                checked={draft.isActive}
                onChange={(event) =>
                  setDrafts((current) => ({
                    ...current,
                    [rule.id]: {
                      ...current[rule.id],
                      isActive: event.target.checked,
                    },
                  }))
                }
              />
              Rule active
            </label>
            <Button
              className="mt-5 w-full"
              disabled={savingId === rule.id}
              onClick={async () => {
                setSavingId(rule.id);
                await fetch(`/api/fares/${rule.id}`, {
                  method: "PUT",
                  headers: { "Content-Type": "application/json" },
                  body: JSON.stringify(draft),
                });
                setSavingId(null);
                router.refresh();
              }}
            >
              {savingId === rule.id ? "Saving..." : "Save settings"}
            </Button>
          </Card>
        );
      })}
    </div>
  );
}