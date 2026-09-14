import type { HTMLAttributes } from "react";
import { cn } from "@/lib/utils";

export function MovingBorder({ className, children, ...props }: HTMLAttributes<HTMLDivElement>) {
  return (
    <div className={cn("moving-border relative rounded-xl p-px", className)} {...props}>
      {children}
    </div>
  );
}