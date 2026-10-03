import type { TrendItem, TrendRange } from './report-types'

import {
  formatCompactRupiah,
  formatMonth,
  formatRupiah,
  formatShortMonth,
} from './report-utils'

type FinancialTrendProps = {
  data: TrendItem[]
  range: TrendRange
  onRangeChange: (range: TrendRange) => void
}

export function FinancialTrend({
  data,
  range,
  onRangeChange,
}: FinancialTrendProps) {
  const maximumValue = Math.max(
    1,
    ...data.flatMap((item) => [
      item.summary.income,
      item.summary.expense,
      item.summary.investment,
    ]),
  )

  const totalExpense = data.reduce((sum, item) => sum + item.summary.expense, 0)

  const totalCashFlow = data.reduce(
    (sum, item) => sum + item.summary.cashFlow,
    0,
  )

  const averageExpense = data.length > 0 ? totalExpense / data.length : 0

  const averageCashFlow = data.length > 0 ? totalCashFlow / data.length : 0

  const highestExpenseMonth =
    data.length > 0
      ? data.reduce((highest, item) =>
          item.summary.expense > highest.summary.expense ? item : highest,
        )
      : null

  const lowestCashFlowMonth =
    data.length > 0
      ? data.reduce((lowest, item) =>
          item.summary.cashFlow < lowest.summary.cashFlow ? item : lowest,
        )
      : null

  const ranges: TrendRange[] = [3, 6, 12]

  return (
    <section className="overflow-hidden rounded-2xl border bg-card">
      <div className="flex flex-col gap-4 border-b px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="font-semibold">Tren Keuangan</h2>

          <p className="mt-1 text-sm text-muted-foreground">
            Pergerakan pemasukan, pengeluaran, investasi, dan cash flow.
          </p>
        </div>

        <div className="rounded-xl bg-muted/50 p-1">
          <div className="grid grid-cols-3 gap-1">
            {ranges.map((item) => (
              <button
                key={item}
                type="button"
                onClick={() => onRangeChange(item)}
                className={
                  range === item
                    ? 'h-9 rounded-lg bg-background px-3 text-xs font-medium shadow-sm'
                    : 'h-9 rounded-lg px-3 text-xs font-medium text-muted-foreground transition hover:text-foreground'
                }
              >
                {item} Bulan
              </button>
            ))}
          </div>
        </div>
      </div>

      {data.length > 0 && (
        <div className="grid gap-px border-b bg-border sm:grid-cols-2 xl:grid-cols-4">
          <TrendSummaryItem
            label="Rata-rata Pengeluaran"
            value={formatCompactRupiah(averageExpense)}
            description={`Per bulan selama ${range} bulan`}
          />

          <TrendSummaryItem
            label="Rata-rata Cash Flow"
            value={formatCompactRupiah(averageCashFlow)}
            description={`Per bulan selama ${range} bulan`}
          />

          <TrendSummaryItem
            label="Pengeluaran Tertinggi"
            value={
              highestExpenseMonth
                ? formatCompactRupiah(highestExpenseMonth.summary.expense)
                : '—'
            }
            description={
              highestExpenseMonth
                ? formatMonth(highestExpenseMonth.month)
                : 'Belum ada data'
            }
          />

          <TrendSummaryItem
            label="Cash Flow Terendah"
            value={
              lowestCashFlowMonth
                ? formatCompactRupiah(lowestCashFlowMonth.summary.cashFlow)
                : '—'
            }
            description={
              lowestCashFlowMonth
                ? formatMonth(lowestCashFlowMonth.month)
                : 'Belum ada data'
            }
            negative={(lowestCashFlowMonth?.summary.cashFlow ?? 0) < 0}
          />
        </div>
      )}

      <div className="flex flex-wrap gap-x-5 gap-y-2 border-b px-5 py-3 text-xs text-muted-foreground">
        <TrendLegend className="bg-emerald-500" label="Pemasukan" />

        <TrendLegend className="bg-rose-500" label="Pengeluaran" />

        <TrendLegend className="bg-blue-500" label="Investasi" />
      </div>

      {data.length === 0 ? (
        <div className="px-5 py-12 text-center">
          <p className="text-sm font-medium">Belum ada data tren</p>

          <p className="mt-1 text-sm text-muted-foreground">
            Data akan muncul setelah transaksi tersedia.
          </p>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <div
            className="px-5 pb-5 pt-6"
            style={{
              minWidth: range === 12 ? '900px' : range === 6 ? '560px' : '100%',
            }}
          >
            <div
              className="grid gap-3"
              style={{
                gridTemplateColumns: `repeat(${data.length}, minmax(0, 1fr))`,
              }}
            >
              {data.map((item) => (
                <TrendColumn
                  key={item.month}
                  item={item}
                  maximumValue={maximumValue}
                />
              ))}
            </div>
          </div>
        </div>
      )}
    </section>
  )
}

type TrendLegendProps = {
  className: string
  label: string
}

function TrendLegend({ className, label }: TrendLegendProps) {
  return (
    <div className="flex items-center gap-2">
      <span className={`h-2.5 w-2.5 rounded-full ${className}`} />

      <span>{label}</span>
    </div>
  )
}

type TrendSummaryItemProps = {
  label: string
  value: string
  description: string
  negative?: boolean
}

function TrendSummaryItem({
  label,
  value,
  description,
  negative = false,
}: TrendSummaryItemProps) {
  return (
    <div className="bg-card px-5 py-4">
      <p className="text-xs text-muted-foreground">{label}</p>

      <p
        className={
          negative
            ? 'mt-1 text-lg font-semibold tabular-nums text-destructive'
            : 'mt-1 text-lg font-semibold tabular-nums'
        }
      >
        {value}
      </p>

      <p className="mt-1 text-xs text-muted-foreground">{description}</p>
    </div>
  )
}

type TrendColumnProps = {
  item: TrendItem
  maximumValue: number
}

function TrendColumn({ item, maximumValue }: TrendColumnProps) {
  const incomeHeight = (item.summary.income / maximumValue) * 100

  const expenseHeight = (item.summary.expense / maximumValue) * 100

  const investmentHeight = (item.summary.investment / maximumValue) * 100

  return (
    <div className="min-w-0">
      <div className="flex h-40 items-end justify-center gap-1.5 border-b">
        <div
          title={`Pemasukan ${formatRupiah(item.summary.income)}`}
          className="w-3 rounded-t bg-emerald-500 sm:w-4"
          style={{
            height:
              item.summary.income > 0 ? `${Math.max(incomeHeight, 3)}%` : '0%',
          }}
        />

        <div
          title={`Pengeluaran ${formatRupiah(item.summary.expense)}`}
          className="w-3 rounded-t bg-rose-500 sm:w-4"
          style={{
            height:
              item.summary.expense > 0
                ? `${Math.max(expenseHeight, 3)}%`
                : '0%',
          }}
        />

        <div
          title={`Investasi ${formatRupiah(item.summary.investment)}`}
          className="w-3 rounded-t bg-blue-500 sm:w-4"
          style={{
            height:
              item.summary.investment > 0
                ? `${Math.max(investmentHeight, 3)}%`
                : '0%',
          }}
        />
      </div>

      <div className="pt-3 text-center">
        <p className="text-xs font-medium">{formatShortMonth(item.month)}</p>

        <p className="mt-2 text-[10px] text-muted-foreground">Cash Flow</p>

        <p
          className={
            item.summary.cashFlow < 0
              ? 'mt-0.5 truncate text-xs font-medium tabular-nums text-destructive'
              : 'mt-0.5 truncate text-xs font-medium tabular-nums'
          }
          title={formatRupiah(item.summary.cashFlow)}
        >
          {formatCompactRupiah(item.summary.cashFlow)}
        </p>
      </div>
    </div>
  )
}
