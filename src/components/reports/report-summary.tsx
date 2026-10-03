import { formatRupiah } from './report-utils'

type ReportMetricProps = {
  label: string
  value: number
  caption: string
}

export function ReportMetric({ label, value, caption }: ReportMetricProps) {
  return (
    <div className="flex min-h-32 flex-col justify-between rounded-2xl border bg-card p-4 sm:p-5">
      <div>
        <p className="text-sm text-muted-foreground">{label}</p>

        <p className="mt-2 text-xl font-semibold tracking-tight tabular-nums">
          {formatRupiah(value)}
        </p>
      </div>

      <p className="mt-4 text-xs text-muted-foreground">{caption}</p>
    </div>
  )
}
