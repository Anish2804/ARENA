import React from "react";

interface MetricCardProps {
  label: string;
  value: string | number;
  subtext?: string;
  badge?: string;
  icon?: React.ReactNode;
  trend?: "up" | "down" | "neutral";
  valueColor?: string;
}

export function MetricCard({
  label,
  value,
  subtext,
  badge,
  icon,
  valueColor = "text-zinc-100"
}: MetricCardProps) {
  return (
    <div className="bg-[#0f1117] hover:bg-[#131620] border border-white/[0.08] hover:border-white/[0.14] rounded-lg p-4 transition-all duration-150 flex flex-col justify-between">
      <div className="flex items-center justify-between gap-2 mb-2">
        <span className="text-[11px] uppercase tracking-wider font-mono font-medium text-zinc-400">
          {label}
        </span>
        {icon && <div className="text-zinc-400">{icon}</div>}
        {badge && (
          <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-white/[0.05] border border-white/[0.08] text-zinc-400">
            {badge}
          </span>
        )}
      </div>

      <div className="flex items-baseline justify-between mt-1">
        <div className={`text-2xl font-bold font-mono tracking-tight ${valueColor}`}>
          {value}
        </div>
      </div>

      {subtext && (
        <div className="text-[11px] text-zinc-500 font-mono mt-2 truncate">
          {subtext}
        </div>
      )}
    </div>
  );
}
