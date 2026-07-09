interface Props {
  progress: number;
  label?: string;
}

export default function ProgressBar({ progress, label }: Props) {
  const clamped = Math.min(100, Math.max(0, progress));

  return (
    <div className="w-full">
      {label && (
        <div className="mb-1 flex items-center justify-between font-pixel-body text-sm text-mc-text-muted">
          <span>{label}</span>
          <span>{clamped}%</span>
        </div>
      )}
      <div className="h-4 w-full border-2 border-mc-border bg-mc-bg">
        <div
          className="h-full bg-mc-accent transition-all duration-500 ease-out"
          style={{ width: `${clamped}%` }}
        />
      </div>
    </div>
  );
}
