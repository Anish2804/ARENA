"use client";

import { ReactNode, useRef, useState } from "react";
import { motion } from "framer-motion";

interface MetricCardProps {
  title: string;
  value: string | number;
  icon?: ReactNode;
  trend?: {
    value: string;
    isPositive: boolean;
  };
  subtitle?: string;
  className?: string;
}

export function MetricCard({
  title,
  value,
  icon,
  trend,
  subtitle,
  className = "",
}: MetricCardProps) {
  const divRef = useRef<HTMLDivElement>(null);
  const [isFocused, setIsFocused] = useState(false);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [opacity, setOpacity] = useState(0);

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!divRef.current || isFocused) return;

    const div = divRef.current;
    const rect = div.getBoundingClientRect();

    setPosition({ x: e.clientX - rect.left, y: e.clientY - rect.top });
  };

  const handleFocus = () => {
    setIsFocused(true);
    setOpacity(1);
  };

  const handleBlur = () => {
    setIsFocused(false);
    setOpacity(0);
  };

  const handleMouseEnter = () => {
    setOpacity(1);
  };

  const handleMouseLeave = () => {
    setOpacity(0);
  };

  return (
    <motion.div
      whileHover={{ y: -5 }}
      ref={divRef}
      onMouseMove={handleMouseMove}
      onFocus={handleFocus}
      onBlur={handleBlur}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      className={`resend-card p-6 flex flex-col gap-3 relative overflow-hidden group ${className}`}
    >
      <div
        className="pointer-events-none absolute -inset-px opacity-0 transition duration-300"
        style={{
          opacity,
          background: `radial-gradient(400px circle at ${position.x}px ${position.y}px, rgba(255,255,255,0.08), transparent 40%)`,
        }}
      />
      
      <div className="relative z-10 flex items-center justify-between">
        <h3 className="text-[12px] font-medium text-[#888] uppercase tracking-wider">
          {title}
        </h3>
        {icon && <div className="text-[#555] group-hover:text-indigo-400 transition-colors">{icon}</div>}
      </div>

      <div className="relative z-10 flex items-baseline gap-3">
        <div className="text-[32px] font-bold tracking-tight text-[#ededed]">
          {value}
        </div>
        {trend && (
          <div
            className={`text-[12px] font-medium ${
              trend.isPositive ? "text-emerald-500" : "text-rose-500"
            }`}
          >
            {trend.isPositive ? "+" : ""}
            {trend.value}
          </div>
        )}
      </div>

      {subtitle && (
        <div className="relative z-10 text-[12px] text-[#666] font-mono group-hover:text-[#888] transition-colors">
          {subtitle}
        </div>
      )}
    </motion.div>
  );
}
