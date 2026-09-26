interface BadgeProps {
  children: React.ReactNode;
  variant?: "default" | "success" | "warning" | "danger" | "info" | "outline";
  className?: string;
  dot?: boolean;
}

export function Badge({ children, variant = "default", className = "", dot = false }: BadgeProps) {
  const baseStyles = "inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md text-[10px] font-medium transition-colors border";
  
  const variants = {
    default: "bg-white/[0.04] text-white/40 border-white/[0.06]",
    success: "bg-emerald-500/[0.08] text-emerald-400/70 border-emerald-500/[0.12]",
    warning: "bg-amber-500/[0.08] text-amber-400/70 border-amber-500/[0.12]",
    danger:  "bg-rose-500/[0.08] text-rose-400/70 border-rose-500/[0.12]",
    info:    "bg-sky-500/[0.08] text-sky-400/70 border-sky-500/[0.12]",
    outline: "bg-transparent text-white/25 border-white/[0.08]",
  };

  const dotColors = {
    default: "bg-white/40",
    success: "bg-emerald-400/60",
    warning: "bg-amber-400/60",
    danger:  "bg-rose-400/60",
    info:    "bg-sky-400/60",
    outline: "bg-white/25",
  };

  return (
    <span className={`${baseStyles} ${variants[variant]} ${className}`}>
      {dot && (
        <span className="relative flex h-1.5 w-1.5">
          <span className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${dotColors[variant]}`}></span>
          <span className={`relative inline-flex rounded-full h-1.5 w-1.5 ${dotColors[variant]}`}></span>
        </span>
      )}
      {children}
    </span>
  );
}

export function StatusBadge({ status }: { status: string }) {
  const statusMap: Record<string, BadgeProps["variant"]> = {
    running: "info",
    queued: "warning",
    completed: "success",
    failed: "danger",
    active: "success",
    inactive: "outline",
    error: "danger"
  };
  
  const variant = statusMap[status.toLowerCase()] || "default";
  const showDot = ["running", "active"].includes(status.toLowerCase());

  return (
    <Badge variant={variant} dot={showDot} className="capitalize font-mono text-[10px] tracking-wider">
      {status}
    </Badge>
  );
}
