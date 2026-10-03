import type { CategoryBreakdownItem } from './report-types'

import { ExpenseCategoryChangeRow } from './expense-category-change'
import { buildExpenseCategoryChanges } from './expense-category-utils'
import { formatMonth } from './report-utils'

type ExpenseCategoryChangeSectionProps = {
  month: string
  previousMonth: string
  current: CategoryBreakdownItem[]
  previous: CategoryBreakdownItem[]
}

export function ExpenseCategoryChangeSection({
  month,
  previousMonth,
  current,
  previous,
}: ExpenseCategoryChangeSectionProps) {
  const changes = buildExpenseCategoryChanges(current, previous)

  return (
    <section className="overflow-hidden rounded-2xl border bg-card">
      <div className="border-b px-5 py-4">
        <h2 className="font-semibold">Perubahan Pengeluaran per Kategori</h2>

        <p className="mt-1 text-sm text-muted-foreground">
          {formatMonth(month)} dibandingkan dengan {formatMonth(previousMonth)}.
        </p>
      </div>

      {changes.length === 0 ? (
        <div className="px-5 py-10 text-center">
          <p className="text-sm font-medium">Belum ada data pengeluaran</p>

          <p className="mt-1 text-sm text-muted-foreground">
            Belum ada kategori yang dapat dibandingkan.
          </p>
        </div>
      ) : (
        <div className="divide-y">
          {changes.map((item) => (
            <ExpenseCategoryChangeRow key={item.categoryId} item={item} />
          ))}
        </div>
      )}
    </section>
  )
}
