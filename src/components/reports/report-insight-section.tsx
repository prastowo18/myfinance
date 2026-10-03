import type { CategoryBreakdownItem, ReportSummary } from './report-types'

import { InsightCard } from './report-insights'
import {
  calculateChange,
  formatMonth,
  formatPercentage,
  formatRupiah,
} from './report-utils'

type ReportInsightSectionProps = {
  previousMonth: string
  summary: ReportSummary
  previousSummary: ReportSummary
  expenseByCategory: CategoryBreakdownItem[]
}

export function ReportInsightSection({
  previousMonth,
  summary,
  previousSummary,
  expenseByCategory,
}: ReportInsightSectionProps) {
  const topExpense =
    expenseByCategory.length > 0
      ? [...expenseByCategory].sort((a, b) => b.amount - a.amount)[0]
      : null

  const expenseChange = calculateChange(
    summary.expense,
    previousSummary.expense,
  )

  const investmentRatio =
    summary.income > 0 ? (summary.investment / summary.income) * 100 : null

  const cashFlowStatus =
    summary.cashFlow > 0
      ? 'Surplus'
      : summary.cashFlow < 0
        ? 'Defisit'
        : 'Seimbang'

  return (
    <section className="space-y-4">
      <div>
        <h2 className="text-lg font-semibold">Insight Bulanan</h2>

        <p className="mt-1 text-sm text-muted-foreground">
          Beberapa hal penting dari aktivitas keuangan bulan ini.
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <InsightCard
          label="Pengeluaran Terbesar"
          value={topExpense ? topExpense.categoryName : 'Belum ada'}
          description={
            topExpense
              ? `${formatRupiah(topExpense.amount)} • ${formatPercentage(
                  topExpense.percentage,
                )}% dari pengeluaran`
              : 'Belum ada pengeluaran bulan ini.'
          }
        />

        <InsightCard
          label="Perubahan Pengeluaran"
          value={
            expenseChange === null
              ? 'Belum ada pembanding'
              : `${expenseChange > 0 ? '+' : ''}${formatPercentage(
                  expenseChange,
                )}%`
          }
          description={
            expenseChange === null
              ? `Tidak ada basis pembanding pada ${formatMonth(previousMonth)}.`
              : expenseChange > 0
                ? `Pengeluaran lebih tinggi dibanding ${formatMonth(
                    previousMonth,
                  )}.`
                : expenseChange < 0
                  ? `Pengeluaran lebih rendah dibanding ${formatMonth(
                      previousMonth,
                    )}.`
                  : 'Pengeluaran sama dengan bulan sebelumnya.'
          }
        />

        <InsightCard
          label="Posisi Cash Flow"
          value={cashFlowStatus}
          description={formatRupiah(summary.cashFlow)}
        />

        <InsightCard
          label="Porsi Investasi"
          value={
            investmentRatio === null
              ? '—'
              : `${formatPercentage(investmentRatio)}%`
          }
          description={
            investmentRatio === null
              ? 'Belum ada pemasukan bulan ini.'
              : 'Dari total pemasukan bulan ini.'
          }
        />
      </div>
    </section>
  )
}
