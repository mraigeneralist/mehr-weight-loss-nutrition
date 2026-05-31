type Props = {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  value: string;
  hint?: string;
};

export function KpiCard({ icon: Icon, label, value, hint }: Props) {
  return (
    <div className="rounded-2xl border border-border bg-card p-5">
      <div className="flex items-start justify-between">
        <p className="text-xs uppercase tracking-[0.18em] text-muted-foreground">
          {label}
        </p>
        <span className="grid h-8 w-8 place-items-center rounded-full bg-sand text-sage-deep">
          <Icon className="h-4 w-4" />
        </span>
      </div>
      <p className="mt-3 font-display text-2xl font-bold tabular-nums">
        {value}
      </p>
      {hint && (
        <p className="mt-1 text-xs text-muted-foreground">{hint}</p>
      )}
    </div>
  );
}
