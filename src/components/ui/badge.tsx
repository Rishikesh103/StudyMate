import * as React from "react";

export interface BadgeProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: "default" | "secondary" | "destructive" | "outline";
}

function Badge({ className = "", variant = "default", ...props }: BadgeProps) {
  return (
    <div className={`badge badge-${variant} ${className}`} {...props} />
  );
}

export { Badge, type BadgeProps as BadgeVariantsProps };
