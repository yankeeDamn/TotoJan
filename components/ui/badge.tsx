import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const badgeVariants = cva("inline-flex items-center gap-1 rounded-full px-3 py-1 text-xs font-bold", {
  variants: {
    variant: {
      default: "bg-primary/15 text-primary",
      success: "bg-accent/15 text-accent",
      muted: "bg-muted text-muted-foreground",
      destructive: "bg-destructive/15 text-destructive",
    },
  },
  defaultVariants: { variant: "default" },
});

export interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement>, VariantProps<typeof badgeVariants> {}

export function Badge({ className, variant, ...props }: BadgeProps) {
  return <span className={cn(badgeVariants({ variant }), className)} {...props} />;
}
