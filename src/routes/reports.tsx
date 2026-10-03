import { useState } from 'react'

import { createFileRoute, useNavigate } from '@tanstack/react-router'

import { CategoryBreakdown } from '#/components/reports/category-breakdown'
import { ExpenseCategoryChangeSection } from '#/components/reports/expense-category-change-section'
import { FinancialTrend } from '#/components/reports/financial-trend'

import { ReportInsightSection } from '#/components/reports/report-insight-section'
import { ReportSummarySection } from '#/components/reports/report-summary-section'
import type { TrendRange } from '#/components/reports/report-types'
import { getCurrentMonth } from '#/components/reports/report-utils'
import { Input } from '#/components/ui/input'
import { Label } from '#/components/ui/label'
import { getMonthlyReport } from '#/server/reports.functions'
import { ReportComparisonSection } from '#/components/reports/report-comparison-section'

type ReportSearch = {
  month?: string
}

export const Route = createFileRoute('/reports')({
  validateSearch: (search): ReportSearch => {
    const month =
      typeof search.month === 'string' && /^\d{4}-\d{2}$/.test(search.month)
        ? search.month
        : undefined

    return {
      month,
    }
  },

  loaderDeps: ({ search }) => ({
    month: search.month,
  }),

  loader: async ({ deps }) => {
    const month = deps.month ?? getCurrentMonth()

    return getMonthlyReport({
      data: {
        month,
      },
    })
  },

  component: ReportsPage,
})

function ReportsPage() {
  const navigate = useNavigate({
    from: '/reports',
  })

  const report = Route.useLoaderData()

  const [trendRange, setTrendRange] = useState<TrendRange>(6)

  const visibleTrend = report.trend.slice(-trendRange)

  return (
    <main className="mx-auto w-full max-w-6xl px-4 py-6 sm:px-6 lg:py-8">
      <div className="space-y-10">
        {/* Header */}
        <header className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">
              Laporan
            </h1>

            <p className="mt-1 text-sm text-muted-foreground">
              Ringkasan pemasukan, pengeluaran, investasi, dan arus kas.
            </p>
          </div>

          <div className="w-full space-y-2 sm:w-52">
            <Label htmlFor="report-month">Bulan</Label>

            <Input
              id="report-month"
              type="month"
              value={report.month}
              className="h-11 rounded-xl"
              onChange={(event) => {
                const month = event.target.value

                if (!month) {
                  return
                }

                void navigate({
                  search: {
                    month,
                  },
                })
              }}
            />
          </div>
        </header>

        {/* Ringkasan */}
        <ReportSummarySection
          month={report.month}
          previousMonth={report.previousMonth}
          summary={report.summary}
          previousSummary={report.previousSummary}
        />

        {/* Insight */}
        <ReportInsightSection
          previousMonth={report.previousMonth}
          summary={report.summary}
          previousSummary={report.previousSummary}
          expenseByCategory={report.expenseByCategory}
        />

        {/* Tren */}
        <FinancialTrend
          data={visibleTrend}
          range={trendRange}
          onRangeChange={setTrendRange}
        />

        {/* Breakdown kategori */}
        <div className="grid gap-5 lg:grid-cols-2">
          <CategoryBreakdown
            title="Pengeluaran per Kategori"
            description="Distribusi pengeluaran bulan ini."
            data={report.expenseByCategory}
            total={report.summary.expense}
          />

          <CategoryBreakdown
            title="Pemasukan per Kategori"
            description="Sumber pemasukan bulan ini."
            data={report.incomeByCategory}
            total={report.summary.income}
          />
        </div>

        {/* Perubahan pengeluaran kategori */}
        <ExpenseCategoryChangeSection
          month={report.month}
          previousMonth={report.previousMonth}
          current={report.expenseByCategory}
          previous={report.previousExpenseByCategory}
        />

        {/* Perbandingan bulanan */}
        <ReportComparisonSection
          previousMonth={report.previousMonth}
          summary={report.summary}
          previousSummary={report.previousSummary}
        />
      </div>
    </main>
  )
}
