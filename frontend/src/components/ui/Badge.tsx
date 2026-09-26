interface BadgeProps {
  children: React.ReactNode;
  variant?: "default" | "success" | "warning" | "danger" | "info" | "outline";
  className?: string;
  dot?: boolean;
}

export function Badge({ children, variant = "default", className = "", dot = false }: BadgeProps) {
  const baseStyles = "inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-medium transition-colors border";
  
  const variants = {
    default: "bg-[#111] text-[#ededed] border-[#333]",
    success: "bg-[#052e16] text-[#34d399] border-[#065f46]",
    warning: "bg-[#451a03] text-[#fbbf24] border-[#78350f]",
    danger:  "bg-[#4c0519] text-[#fb7185] border-[#881337]",
    info:    "bg-[#172554] text-[#60a5fa] border-[#1e3a8a]",
    outline: "bg-transparent text-[#888] border-[#333]",
  };

  const dotColors = {
    default: "bg-[#ededed]",
    success: "bg-[#34d399]",
    warning: "bg-[#fbbf24]",
    danger:  "bg-[#fb7185]",
    info:    "bg-[#60a5fa]",
    outline: "bg-[#888]",
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
    <Badge variant={variant} dot={showDot} className="capitalize uppercase tracking-wide font-mono text-[10px]">
      {status}
    </Badge>
  );
}
