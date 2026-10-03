import type { ExpenseCategoryChange } from './report-types'

import { formatPercentage, formatRupiah } from './report-utils'

type ExpenseCategoryChangeRowProps = {
  item: ExpenseCategoryChange
}

export function ExpenseCategoryChangeRow({
  item,
}: ExpenseCategoryChangeRowProps) {
  const isNew = item.previousAmount === 0 && item.currentAmount > 0

  const isStopped = item.previousAmount > 0 && item.currentAmount === 0

  const differencePrefix = item.difference > 0 ? '+' : ''

  return (
    <div className="px-5 py-4">
      <div className="grid gap-4 sm:grid-cols-[minmax(0,1fr)_150px_170px] sm:items-center">
        <div className="min-w-0">
          <p className="truncate text-sm font-medium">{item.categoryName}</p>

          <p className="mt-1 text-xs text-muted-foreground">
            Sebelumnya {formatRupiah(item.previousAmount)}
          </p>
        </div>

        <div className="sm:text-right">
          <p className="text-xs text-muted-foreground">Bulan ini</p>

          <p className="mt-1 text-sm font-semibold tabular-nums">
            {formatRupiah(item.currentAmount)}
          </p>
        </div>

        <div className="sm:text-right">
          <p className="text-xs text-muted-foreground">Perubahan</p>

          <p className="mt-1 text-sm font-medium tabular-nums">
            {differencePrefix}
            {formatRupiah(item.difference)}
          </p>

          <p className="mt-1 text-xs text-muted-foreground">
            {isNew
              ? 'Baru bulan ini'
              : isStopped
                ? 'Tidak ada pengeluaran bulan ini'
                : item.percentageChange === null
                  ? '—'
                  : `${item.percentageChange > 0 ? '+' : ''}${formatPercentage(
                      item.percentageChange,
                    )}%`}
          </p>
        </div>
      </div>
    </div>
  )
}
