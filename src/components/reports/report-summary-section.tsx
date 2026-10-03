import type { ReportSummary } from './report-types'

import { ReportMetric } from './report-summary'
import { formatMonth, formatRupiah } from './report-utils'

type ReportSummarySectionProps = {
  month: string
  previousMonth: string
  summary: ReportSummary
  previousSummary: ReportSummary
}

export function ReportSummarySection({
  month,
  previousMonth,
  summary,
  previousSummary,
}: ReportSummarySectionProps) {
  return (
    <section className="space-y-4">
      <div>
        <h2 className="text-lg font-semibold">Ringkasan Bulan</h2>

        <p className="mt-1 text-sm text-muted-foreground">
          Pemasukan, pengeluaran, dan alokasi dana selama {formatMonth(month)}.
        </p>
      </div>

      <div className="grid gap-4 lg:grid-cols-5">
        <div className="flex min-h-56 flex-col justify-between rounded-2xl border bg-card p-5 sm:p-6 lg:col-span-2">
          <div>
            <p className="text-sm font-medium text-muted-foreground">
              Cash Flow
            </p>

            <p className="mt-3 wrap-break-word text-3xl font-semibold tracking-tight tabular-nums sm:text-4xl">
              {formatRupiah(summary.cashFlow)}
            </p>

            <p className="mt-2 text-sm leading-6 text-muted-foreground">
              Sisa pemasukan setelah pengeluaran dan investasi.
            </p>
          </div>

          <div className="mt-8 border-t pt-4">
            <p className="text-xs text-muted-foreground">Bulan sebelumnya</p>

            <p className="mt-1 text-lg font-semibold tabular-nums">
              {formatRupiah(previousSummary.cashFlow)}
            </p>

            <p className="mt-1 text-xs text-muted-foreground">
              {formatMonth(previousMonth)}
            </p>
          </div>
        </div>

        <div className="grid gap-4 sm:grid-cols-3 lg:col-span-3">
          <ReportMetric
            label="Pemasukan"
            value={summary.income}
            caption="Total uang masuk"
          />

          <ReportMetric
            label="Pengeluaran"
            value={summary.expense}
            caption="Total uang keluar"
          />

          <ReportMetric
            label="Investasi"
            value={summary.investment}
            caption="Dana dialokasikan"
          />
        </div>
      </div>
    </section>
  )
}
