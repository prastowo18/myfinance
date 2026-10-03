import { createFileRoute, Link, useRouter } from '@tanstack/react-router'

import { TransactionFavoriteSheet } from '#/components/transactions/transaction-favorite-sheet'
import { TransactionSheet } from '#/components/transactions/transaction-sheet'
import { getCategories } from '#/server/categories.functions'
import { getDashboardData } from '#/server/dashboard.functions'
import { getFavorites } from '#/server/favorites.functions'
import { getTransactionSuggestions } from '#/server/transactions.functions'
import { formatPlainRupiah, formatRupiah } from '#/lib/money'

export const Route = createFileRoute('/')({
  loader: async () => {
    const [dashboard, categories, suggestions, favorites] = await Promise.all([
      getDashboardData(),
      getCategories(),
      getTransactionSuggestions(),
      getFavorites(),
    ])

    return {
      dashboard,
      categories,
      suggestions,
      favorites,
    }
  },

  component: DashboardPage,
})

const transactionTypeLabels = {
  expense: 'Pengeluaran',
  income: 'Pemasukan',
  transfer: 'Transfer',
  investment: 'Investasi',
  adjustment: 'Penyesuaian Saldo',
} as const

const accountTypeLabels = {
  bank: 'Bank',
  ewallet: 'E-Wallet',
  cash: 'Cash',
  credit_card: 'Kartu Kredit',
  investment: 'Investasi',
} as const

function formatDate(value: string) {
  return new Intl.DateTimeFormat('id-ID', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    timeZone: 'Asia/Jakarta',
  }).format(new Date(`${value}T00:00:00+07:00`))
}

type SummaryMetricProps = {
  label: string
  value: number
  caption: string
}

function SummaryMetric({ label, value, caption }: SummaryMetricProps) {
  return (
    <div className="flex min-h-36 flex-col justify-between rounded-2xl border bg-card p-4 sm:p-5">
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

function DashboardPage() {
  const router = useRouter()

  const { dashboard, categories, suggestions, favorites } =
    Route.useLoaderData()

  const accounts = dashboard.accounts

  const sortedAccounts = [...accounts].sort((a, b) => {
    if (a.isActive !== b.isActive) {
      return a.isActive ? -1 : 1
    }

    return b.balance - a.balance
  })

  const activeAccountCount = accounts.filter(
    (account) => account.isActive,
  ).length

  return (
    <main className="mx-auto w-full max-w-6xl px-4 py-6 sm:px-6 lg:py-8">
      <div className="space-y-10">
        {/* Header */}
        <header className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">
              Dashboard
            </h1>

            <p className="mt-1 text-sm text-muted-foreground">
              Ringkasan kondisi keuangan Anda.
            </p>
          </div>

          <Link to="/transactions" className="text-sm font-medium text-primary">
            Lihat semua transaksi
          </Link>
        </header>

        {/* Ringkasan */}
        <section className="space-y-4">
          <div>
            <h2 className="text-lg font-semibold">Ringkasan</h2>

            <p className="mt-1 text-sm text-muted-foreground">
              Posisi keuangan dan aktivitas bulan berjalan.
            </p>
          </div>

          <div className="grid gap-4 lg:grid-cols-5">
            {/* Total saldo */}
            <div className="flex min-h-60 flex-col justify-between rounded-2xl border bg-card p-5 sm:p-6 lg:col-span-2">
              <div>
                <p className="text-sm font-medium text-muted-foreground">
                  Total Saldo
                </p>

                <p className="mt-3 wrap-break-word text-3xl font-semibold tracking-tight tabular-nums sm:text-4xl">
                  {formatRupiah(dashboard.totalBalance)}
                </p>

                <p className="mt-2 text-sm text-muted-foreground">
                  Gabungan saldo seluruh account
                </p>
              </div>

              <div className="mt-8 border-t pt-4">
                <p className="text-xs text-muted-foreground">
                  Cash Flow Bulan Ini
                </p>

                <p className="mt-1 text-xl font-semibold tabular-nums">
                  {formatRupiah(dashboard.cashFlowThisMonth)}
                </p>

                <p className="mt-1 text-xs leading-5 text-muted-foreground">
                  Pemasukan dikurangi pengeluaran dan dana yang dialokasikan ke
                  investasi.
                </p>
              </div>
            </div>

            {/* Statistik bulan */}
            <div className="grid gap-4 sm:grid-cols-3 lg:col-span-3">
              <SummaryMetric
                label="Pemasukan"
                value={dashboard.incomeThisMonth}
                caption="Bulan ini"
              />

              <SummaryMetric
                label="Pengeluaran"
                value={dashboard.expenseThisMonth}
                caption="Bulan ini"
              />

              <SummaryMetric
                label="Investasi"
                value={dashboard.investmentThisMonth}
                caption="Dialokasikan bulan ini"
              />
            </div>
          </div>
        </section>

        {/* Akses cepat */}
        <section className="space-y-4">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <h2 className="text-lg font-semibold">Akses Cepat</h2>

              <p className="mt-1 text-sm text-muted-foreground">
                Catat transaksi tanpa perlu membuka halaman lain.
              </p>
            </div>

            <TransactionSheet
              accounts={accounts}
              categories={categories}
              suggestions={suggestions}
              onCreated={async () => {
                await router.invalidate()
              }}
            />
          </div>

          {favorites.length > 0 && (
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {favorites.slice(0, 3).map((favorite) => {
                const description =
                  favorite.type === 'transfer' || favorite.type === 'investment'
                    ? `${favorite.accountName} → ${
                        favorite.targetAccountName ?? 'Account tujuan'
                      }`
                    : [favorite.accountName, favorite.categoryName]
                        .filter(Boolean)
                        .join(' • ')

                return (
                  <article
                    key={favorite.id}
                    className="flex min-h-36 flex-col justify-between rounded-2xl border bg-card p-4"
                  >
                    <div>
                      <div className="flex items-start justify-between gap-4">
                        <div className="min-w-0">
                          <p className="truncate font-medium">
                            {favorite.title}
                          </p>

                          <p className="mt-1 truncate text-sm text-muted-foreground">
                            {description}
                          </p>
                        </div>

                        <p className="shrink-0 font-semibold tabular-nums">
                          Rp{formatPlainRupiah(favorite.amount)}
                        </p>
                      </div>
                    </div>

                    <div className="mt-4 border-t pt-3">
                      <TransactionFavoriteSheet
                        favorite={favorite}
                        accounts={accounts}
                        categories={categories}
                        onCreated={async () => {
                          await router.invalidate()
                        }}
                      />
                    </div>
                  </article>
                )
              })}
            </div>
          )}
        </section>

        {/* Account + transaksi terbaru */}
        <div className="grid gap-5 lg:grid-cols-5">
          {/* Account */}
          <section className="overflow-hidden rounded-2xl border bg-card lg:col-span-2">
            <div className="border-b px-5 py-4">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <h2 className="font-semibold">Account</h2>

                  <p className="mt-1 text-sm text-muted-foreground">
                    {activeAccountCount} aktif dari {accounts.length} account
                  </p>
                </div>

                <Link
                  to="/accounts"
                  className="shrink-0 text-sm font-medium text-primary"
                >
                  Kelola
                </Link>
              </div>
            </div>

            {accounts.length === 0 ? (
              <div className="px-5 py-10 text-center">
                <p className="text-sm font-medium">Belum ada account</p>

                <p className="mt-1 text-sm text-muted-foreground">
                  Tambahkan bank, cash, e-wallet, atau account lainnya.
                </p>
              </div>
            ) : (
              <div className="divide-y">
                {sortedAccounts.map((account) => (
                  <div
                    key={account.id}
                    className={`px-5 py-4 ${
                      account.isActive ? '' : 'bg-muted/20 opacity-70'
                    }`}
                  >
                    <div className="flex items-center justify-between gap-4">
                      <div className="min-w-0">
                        <div className="flex flex-wrap items-center gap-2">
                          <p className="truncate text-sm font-semibold">
                            {account.name}
                          </p>

                          {!account.isActive && (
                            <span className="rounded-full bg-muted px-2 py-0.5 text-[10px] font-medium text-muted-foreground">
                              Nonaktif
                            </span>
                          )}
                        </div>

                        <div className="mt-1.5">
                          <span className="rounded-md bg-muted px-2 py-1 text-[11px] font-medium text-muted-foreground">
                            {accountTypeLabels[account.type]}
                          </span>
                        </div>
                      </div>

                      <div className="min-w-0 shrink-0 text-right">
                        <p className="text-sm font-semibold tabular-nums">
                          {formatRupiah(account.balance)}
                        </p>

                        <p className="mt-1 text-[11px] text-muted-foreground">
                          Saldo saat ini
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </section>

          {/* Transaksi terbaru */}
          <section className="overflow-hidden rounded-2xl border bg-card lg:col-span-3">
            <div className="border-b px-5 py-4">
              <div className="flex items-center justify-between gap-4">
                <div>
                  <h2 className="font-semibold">Transaksi Terbaru</h2>

                  <p className="mt-1 text-sm text-muted-foreground">
                    Aktivitas keuangan terakhir.
                  </p>
                </div>

                <Link
                  to="/transactions"
                  className="shrink-0 text-sm font-medium text-primary"
                >
                  Lihat semua
                </Link>
              </div>
            </div>

            {dashboard.latestTransactions.length === 0 ? (
              <div className="px-6 py-12 text-center">
                <p className="text-sm font-medium">Belum ada transaksi</p>

                <p className="mt-1 text-sm text-muted-foreground">
                  Catat transaksi pertama Anda.
                </p>
              </div>
            ) : (
              <div className="divide-y">
                {dashboard.latestTransactions.map((transaction) => (
                  <div key={transaction.id} className="px-5 py-4">
                    <div className="flex items-start justify-between gap-5">
                      {/* Kiri */}
                      <div className="min-w-0">
                        <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
                          <p className="truncate text-sm font-semibold">
                            {transaction.title}
                          </p>

                          <span className="text-[11px] font-medium text-muted-foreground">
                            {transactionTypeLabels[transaction.type]}
                          </span>
                        </div>

                        <p className="mt-1.5 truncate text-xs text-muted-foreground">
                          {transaction.accountName}

                          {transaction.categoryName
                            ? ` • ${transaction.categoryName}`
                            : ''}

                          {transaction.targetAccountName
                            ? ` → ${transaction.targetAccountName}`
                            : ''}
                        </p>

                        <p className="mt-1 text-[11px] text-muted-foreground">
                          {formatDate(transaction.transactionDate)}
                        </p>
                      </div>

                      {/* Kanan */}
                      <div className="shrink-0 pt-0.5 text-right">
                        <TransactionAmount
                          type={transaction.type}
                          amount={transaction.amount}
                          adjustmentDirection={transaction.adjustmentDirection}
                        />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </section>
        </div>
      </div>
    </main>
  )
}

type TransactionAmountProps = {
  type: 'expense' | 'income' | 'transfer' | 'investment' | 'adjustment'
  amount: number
  adjustmentDirection?: 'increase' | 'decrease' | null
}

function TransactionAmount({
  type,
  amount,
  adjustmentDirection,
}: TransactionAmountProps) {
  let prefix = ''

  if (type === 'income') {
    prefix = '+'
  }

  if (type === 'expense') {
    prefix = '-'
  }

  if (type === 'adjustment') {
    prefix =
      adjustmentDirection === 'increase'
        ? '+'
        : adjustmentDirection === 'decrease'
          ? '-'
          : ''
  }

  return (
    <p className="whitespace-nowrap text-sm font-semibold tabular-nums sm:text-right">
      {prefix}
      {formatRupiah(amount)}
    </p>
  )
}
