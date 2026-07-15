"use client";

import { SCALE_LABELS } from "@/lib/questions";

interface ScalePickerProps {
  value: number | undefined;
  onSelect: (value: number) => void;
}

export default function ScalePicker({ value, onSelect }: ScalePickerProps) {
  return (
    <div className="flex flex-col gap-3">
      {SCALE_LABELS.map((label, idx) => {
        const optionValue = idx + 1;
        const selected = value === optionValue;
        return (
          <button
            key={optionValue}
            type="button"
            onClick={() => onSelect(optionValue)}
            className={`flex w-full items-center gap-4 rounded-2xl border-2 px-5 py-4 text-left transition-all active:scale-[0.98] ${
              selected
                ? "border-accent bg-accent-tint"
                : "border-border bg-card"
            }`}
          >
            <span
              className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full border-2 text-sm font-semibold ${
                selected
                  ? "border-accent bg-accent text-on-accent"
                  : "border-border text-muted"
              }`}
            >
              {optionValue}
            </span>
            <span
              className={`text-base font-medium ${
                selected ? "text-foreground" : "text-foreground/80"
              }`}
            >
              {label}
            </span>
          </button>
        );
      })}
    </div>
  );
}
