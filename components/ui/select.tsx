import * as React from "react";

import { cn } from "@/lib/utils";

export const Select = React.forwardRef<HTMLSelectElement, React.SelectHTMLAttributes<HTMLSelectElement>>(function Select(
  { className, children, ...props },
  ref,
) {
  return (
    <select
      ref={ref}
      className={cn(
        "h-12 w-full rounded-2xl border border-slate-200 bg-white px-4 text-sm text-ink shadow-sm outline-none transition focus:border-brand-300 focus:ring-4 focus:ring-brand-100",
        className,
      )}
      {...props}
    >
      {children}
    </select>
  );
});