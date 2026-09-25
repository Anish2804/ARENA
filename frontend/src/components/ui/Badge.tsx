import React from "react";

export type BadgeVariant = "default" | "success" | "warning" | "danger" | "info" | "neutral";

interface BadgeProps {
  children: React.ReactNode;
  variant?: BadgeVariant;
  size?: "sm" | "md";
  dot?: boolean;
  className?: string;
}

export function Badge({
  children,
  variant = "default",
  size = "sm",
  dot = false,
  className = ""
}: BadgeProps) {
  const variantStyles: Record<BadgeVariant, { badge: string; dot: string }> = {
    default: {
      badge: "bg-blue-500/10 text-blue-400 border-blue-500/20",
      dot: "bg-blue-400"
    },
    success: {
      badge: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20",
      dot: "bg-emerald-400"
    },
    warning: {
      badge: "bg-amber-500/10 text-amber-400 border-amber-500/20",
      dot: "bg-amber-400 animate-pulse"
    },
    danger: {
      badge: "bg-rose-500/10 text-rose-400 border-rose-500/20",
      dot: "bg-rose-400"
    },
    info: {
      badge: "bg-sky-500/10 text-sky-400 border-sky-500/20",
      dot: "bg-sky-400"
    },
    neutral: {
      badge: "bg-white/[0.05] text-zinc-400 border-white/[0.08]",
      dot: "bg-zinc-500"
    }
  };

  const sizeStyles = {
    sm: "text-[11px] px-2 py-0.5 font-mono",
    md: "text-xs px-2.5 py-1 font-medium"
  };

  const style = variantStyles[variant];

  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded border tracking-tight font-medium ${style.badge} ${sizeStyles[size]} ${className}`}
    >
      {dot && <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${style.dot}`} />}
      {children}
    </span>
  );
}

export function StatusBadge({ status }: { status: string }) {
  const normalized = status.toLowerCase();

  if (normalized === "completed" || normalized === "accepted" || normalized === "active") {
    return (
      <Badge variant="success" dot size="sm">
        {status.toUpperCase()}
      </Badge>
    );
  }

  if (normalized === "running" || normalized === "queued" || normalized === "dispatching") {
    return (
      <Badge variant="warning" dot size="sm">
        {status.toUpperCase()}
      </Badge>
    );
  }

  if (normalized === "failed" || normalized === "rejected") {
    return (
      <Badge variant="danger" dot size="sm">
        {status.toUpperCase()}
      </Badge>
    );
  }

  return (
    <Badge variant="neutral" dot size="sm">
      {status.toUpperCase()}
    </Badge>
  );
}
