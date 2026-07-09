"use client";

import { useEffect, useState } from "react";

interface SubBarProps {
  label: string;
  value: number;
  delayMs?: number;
}

export default function SubBar({ label, value, delayMs = 0 }: SubBarProps) {
  const clamped = Math.min(100, Math.max(0, value));
  const [animated, setAnimated] = useState(0);

  useEffect(() => {
    const timer = setTimeout(() => setAnimated(clamped), delayMs);
    return () => clearTimeout(timer);
  }, [clamped, delayMs]);

  return (
    <div className="w-full">
      <div className="mb-1.5 flex items-center justify-between text-sm font-medium">
        <span className="text-foreground">{label}</span>
        <span className="tabular-nums text-muted">{animated}</span>
      </div>
      <div className="h-2.5 w-full rounded-full bg-border">
        <div
          className="h-2.5 rounded-full bg-accent transition-all duration-700 ease-out"
          style={{ width: `${animated}%` }}
        />
      </div>
    </div>
  );
}
