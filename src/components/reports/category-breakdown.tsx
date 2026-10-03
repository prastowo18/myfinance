import type { CategoryBreakdownItem } from './report-types'

import { formatPercentage, formatRupiah } from './report-utils'

type CategoryBreakdownProps = {
  title: string
  description: string
  data: CategoryBreakdownItem[]
  total: number
}

export function CategoryBreakdown({
  title,
  description,
  data,
  total,
}: CategoryBreakdownProps) {
  return (
    <section className="overflow-hidden rounded-2xl border bg-card">
      <div className="border-b px-5 py-4">
        <h2 className="font-semibold">{title}</h2>

        <p className="mt-1 text-sm text-muted-foreground">{description}</p>
      </div>

      {data.length === 0 ? (
        <div className="px-5 py-10 text-center">
          <p className="text-sm font-medium">Belum ada data</p>

          <p className="mt-1 text-sm text-muted-foreground">
            Tidak ada transaksi pada periode ini.
          </p>
        </div>
      ) : (
        <div className="divide-y">
          {data.map((item) => (
            <div key={item.categoryId} className="px-5 py-4">
              <div className="flex items-start justify-between gap-4">
                <div className="min-w-0">
                  <p className="truncate text-sm font-medium">
                    {item.categoryName}
                  </p>

                  <p className="mt-1 text-xs text-muted-foreground">
                    {item.transactionCount} transaksi
                  </p>
                </div>

                <div className="shrink-0 text-right">
                  <p className="text-sm font-semibold tabular-nums">
                    {formatRupiah(item.amount)}
                  </p>

                  <p className="mt-1 text-xs text-muted-foreground">
                    {formatPercentage(item.percentage)}%
                  </p>
                </div>
              </div>

              <div className="mt-3 h-2 overflow-hidden rounded-full bg-muted">
                <div
                  className="h-full rounded-full bg-primary"
                  style={{
                    width: `${Math.min(item.percentage, 100)}%`,
                  }}
                />
              </div>
            </div>
          ))}
        </div>
      )}

      {data.length > 0 && (
        <div className="flex items-center justify-between border-t bg-muted/20 px-5 py-3">
          <span className="text-xs text-muted-foreground">Total</span>

          <span className="text-sm font-semibold tabular-nums">
            {formatRupiah(total)}
          </span>
        </div>
      )}
    </section>
  )
}
