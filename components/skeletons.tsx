import { cn } from "@/lib/utils";

export function Skeleton({ className }: { className?: string }) {
  return <div className={cn("animate-pulse rounded-2xl bg-muted", className)} aria-hidden />;
}

/** Shared page-level loading state, so navigation between app screens never shows a blank page. */
export function PageSkeleton({ rows = 3, narrow = false }: { rows?: number; narrow?: boolean }) {
  return (
    <>
      <div className="h-16 border-b" aria-hidden />
      <main className={cn("container grid gap-4 py-6", narrow && "max-w-2xl")} aria-busy="true" aria-label="Loading">
        <Skeleton className="h-8 w-48" />
        {Array.from({ length: rows }).map((_, i) => (
          <Skeleton key={i} className="h-32" />
        ))}
      </main>
    </>
  );
}
