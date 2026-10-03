type InsightCardProps = {
  label: string
  value: string
  description: string
}

export function InsightCard({ label, value, description }: InsightCardProps) {
  return (
    <div className="rounded-2xl border bg-card p-4 sm:p-5">
      <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
        {label}
      </p>

      <p className="mt-2 text-lg font-semibold tracking-tight">{value}</p>

      <p className="mt-2 text-xs leading-5 text-muted-foreground">
        {description}
      </p>
    </div>
  )
}
