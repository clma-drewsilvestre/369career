interface ProgressBarProps {
  current: number;
  total: number;
  label?: string;
}

export default function ProgressBar({ current, total, label }: ProgressBarProps) {
  const pct = Math.min(100, Math.max(0, (current / total) * 100));

  return (
    <div className="w-full">
      <div className="mb-2 text-sm font-medium text-muted">
        {label ?? `Question ${current} of ${total}`}
      </div>
      <div className="h-2 w-full rounded-full bg-border">
        <div
          className="h-2 rounded-full bg-accent transition-all duration-300 ease-out"
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  );
}
