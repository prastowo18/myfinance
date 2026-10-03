import { calculateChange, formatPercentage, formatRupiah } from './report-utils'

type ComparisonRowProps = {
  label: string
  current: number
  previous: number
}

export function ComparisonRow({
  label,
  current,
  previous,
}: ComparisonRowProps) {
  const change = calculateChange(current, previous)

  return (
    <div className="grid gap-3 px-5 py-4 sm:grid-cols-[minmax(0,1fr)_180px_120px] sm:items-center">
      <p className="text-sm font-medium">{label}</p>

      <div className="sm:text-right">
        <p className="text-xs text-muted-foreground">Bulan ini</p>

        <p className="mt-1 text-sm font-semibold tabular-nums">
          {formatRupiah(current)}
        </p>
      </div>

      <div className="sm:text-right">
        <p className="text-xs text-muted-foreground">Perubahan</p>

        <p className="mt-1 text-sm font-medium tabular-nums">
          {change === null
            ? '—'
            : `${change > 0 ? '+' : ''}${formatPercentage(change)}%`}
        </p>
      </div>
    </div>
  )
}
