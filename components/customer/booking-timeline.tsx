import { Badge } from "@/components/ui/badge";
import { Card, CardDescription, CardTitle } from "@/components/ui/card";
import { formatDateTime, getStatusTone } from "@/lib/utils";
import type { BookingStatus } from "@/types";

type TimelineEntry = {
  id: string;
  status: BookingStatus;
  note: string | null;
  changedBy: string;
  createdAt: string;
};

export function BookingTimeline({ logs }: { logs: TimelineEntry[] }) {
  return (
    <Card className="p-6">
      <CardTitle>Status timeline</CardTitle>
      <CardDescription className="mt-2">Follow each step of your booking in real time.</CardDescription>
      <div className="mt-5 space-y-4">
        {logs.map((log) => (
          <div key={log.id} className="rounded-3xl border border-slate-200 p-4">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <Badge className={getStatusTone(log.status)}>{log.status.replaceAll("_", " ")}</Badge>
              <span className="text-xs text-slate-500">{formatDateTime(log.createdAt)}</span>
            </div>
            {log.note ? <p className="mt-3 text-sm text-slate-700">{log.note}</p> : null}
            <p className="mt-1 text-xs text-slate-500">Updated by {log.changedBy}</p>
          </div>
        ))}
      </div>
    </Card>
  );
}