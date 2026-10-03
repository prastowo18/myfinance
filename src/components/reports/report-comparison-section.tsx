import type { ReportSummary } from './report-types'

import { ComparisonRow } from './report-comparison'
import { formatMonth } from './report-utils'

type ReportComparisonSectionProps = {
  previousMonth: string
  summary: ReportSummary
  previousSummary: ReportSummary
}

export function ReportComparisonSection({
  previousMonth,
  summary,
  previousSummary,
}: ReportComparisonSectionProps) {
  return (
    <section className="overflow-hidden rounded-2xl border bg-card">
      <div className="border-b px-5 py-4">
        <h2 className="font-semibold">Perbandingan Bulanan</h2>

        <p className="mt-1 text-sm text-muted-foreground">
          Dibandingkan dengan {formatMonth(previousMonth)}.
        </p>
      </div>

      <div className="divide-y">
        <ComparisonRow
          label="Pemasukan"
          current={summary.income}
          previous={previousSummary.income}
        />

        <ComparisonRow
          label="Pengeluaran"
          current={summary.expense}
          previous={previousSummary.expense}
        />

        <ComparisonRow
          label="Investasi"
          current={summary.investment}
          previous={previousSummary.investment}
        />

        <ComparisonRow
          label="Cash Flow"
          current={summary.cashFlow}
          previous={previousSummary.cashFlow}
        />
      </div>
    </section>
  )
}
