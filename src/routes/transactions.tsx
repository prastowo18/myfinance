import { createFileRoute, useRouter } from '@tanstack/react-router'

import { TransactionSheet } from '#/components/transactions/transaction-sheet'
import { getAccounts } from '#/server/accounts.functions'
import { getAllCategories, getCategories } from '#/server/categories.functions'
import {
  getTransactions,
  getTransactionSuggestions,
} from '#/server/transactions.functions'
import { transactionHistoryFilterSchema } from '#/schemas/transaction'
import { TransactionFilters } from '#/components/transactions/transaction-filters'
import { TransactionEditSheet } from '#/components/transactions/transaction-edit-sheet'
import { TransactionDeleteDialog } from '#/components/transactions/transaction-delete-dialog'
import { TransactionRepeatSheet } from '#/components/transactions/transaction-repeat-sheet'
import { getFavorites } from '#/server/favorites.functions'
import { TransactionFavoriteSheet } from '#/components/transactions/transaction-favorite-sheet'
import { TransactionFavoriteDeactivateDialog } from '#/components/transactions/transaction-favorite-deactivate-dialog'
import { TransactionFavoriteEditSheet } from '#/components/transactions/transaction-favorite-edit-sheet'

export const Route = createFileRoute('/transactions')({
  validateSearch: (search) => {
    const result = transactionHistoryFilterSchema.safeParse(search)

    if (!result.success) {
      return {}
    }

    return result.data
  },

  loaderDeps: ({ search }) => ({
    month: search.month,
    type: search.type,
    accountId: search.accountId,
    categoryId: search.categoryId,
    search: search.search,
  }),

  loader: async ({ deps }) => {
    const [
      accounts,
      categories,
      allCategories,
      transactions,
      suggestions,
      favorites,
    ] = await Promise.all([
      getAccounts(),
      getCategories(),
      getAllCategories(),
      getTransactions({
        data: deps,
      }),
      getTransactionSuggestions(),
      getFavorites(),
    ])

    return {
      accounts,
      categories,
      allCategories,
      transactions,
      suggestions,
      favorites,
    }
  },

  component: TransactionsPage,
})

const transactionTypeLabels = {
  expense: 'Pengeluaran',
  income: 'Pemasukan',
  transfer: 'Transfer',
  investment: 'Investasi',
} as const

function formatRupiah(value: number) {
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    maximumFractionDigits: 0,
  }).format(value)
}

function formatDate(value: string) {
  return new Intl.DateTimeFormat('id-ID', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    timeZone: 'Asia/Jakarta',
  }).format(new Date(`${value}T00:00:00+07:00`))
}

function TransactionsPage() {
  const router = useRouter()

  const {
    accounts,
    categories,
    allCategories,
    transactions,
    suggestions,
    favorites,
  } = Route.useLoaderData()

  const filters = Route.useSearch()

  return (
    <main className="mx-auto w-full max-w-6xl px-4 py-6 sm:px-6 lg:py-8">
      <div className="space-y-10">
        {/* Header */}
        <header className="flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
          <div className="max-w-xl">
            <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">
              Transaksi
            </h1>

            <p className="mt-2 text-sm leading-6 text-muted-foreground">
              Catat dan kelola pemasukan, pengeluaran, transfer, serta
              investasi.
            </p>
          </div>

          <div className="sm:shrink-0">
            <TransactionSheet
              accounts={accounts}
              categories={categories}
              suggestions={suggestions}
              onCreated={async () => {
                await router.invalidate()
              }}
            />
          </div>
        </header>

        {/* Favorit */}
        {favorites.length > 0 && (
          <section className="space-y-4">
            <div className="flex items-center justify-between gap-4">
              <div>
                <h2 className="text-base font-semibold">Favorit</h2>

                <p className="mt-1 text-sm text-muted-foreground">
                  Transaksi yang sering digunakan.
                </p>
              </div>

              <span className="rounded-full bg-muted px-3 py-1 text-xs font-medium text-muted-foreground">
                {favorites.length} favorit
              </span>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              {favorites.map((favorite) => {
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
                    className="rounded-2xl border bg-card p-5 shadow-sm"
                  >
                    <div className="flex min-h-16 items-start justify-between gap-5">
                      <div className="min-w-0">
                        <p className="truncate text-base font-semibold">
                          {favorite.title}
                        </p>

                        <p className="mt-1 truncate text-sm text-muted-foreground">
                          {description}
                        </p>
                      </div>

                      <div className="shrink-0 text-right">
                        <p className="text-sm text-muted-foreground">Nominal</p>

                        <p className="mt-1 text-lg font-semibold tabular-nums">
                          {formatRupiah(favorite.amount)}
                        </p>
                      </div>
                    </div>

                    <div className="mt-5 flex flex-wrap items-center gap-1 border-t pt-3">
                      <TransactionFavoriteSheet
                        favorite={favorite}
                        accounts={accounts}
                        categories={categories}
                        onCreated={async () => {
                          await router.invalidate()
                        }}
                      />

                      <TransactionFavoriteEditSheet
                        favorite={favorite}
                        accounts={accounts}
                        categories={allCategories}
                        onUpdated={async () => {
                          await router.invalidate()
                        }}
                      />

                      <TransactionFavoriteDeactivateDialog
                        favorite={favorite}
                        onDeactivated={async () => {
                          await router.invalidate()
                        }}
                      />
                    </div>
                  </article>
                )
              })}
            </div>
          </section>
        )}

        {/* Filter */}
        <section className="rounded-2xl border bg-muted/20 p-4 sm:p-5">
          <div className="mb-5">
            <h2 className="text-base font-semibold">Cari & Filter</h2>

            <p className="mt-1 text-sm text-muted-foreground">
              Temukan transaksi berdasarkan periode, jenis, account, atau
              kategori.
            </p>
          </div>

          <TransactionFilters
            filters={filters}
            accounts={accounts}
            categories={allCategories}
          />
        </section>

        {/* Riwayat */}
        <section className="overflow-hidden rounded-2xl border bg-card">
          <div className="flex flex-col gap-1 border-b px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h2 className="text-base font-semibold">Riwayat Transaksi</h2>

              <p className="mt-1 text-sm text-muted-foreground">
                Semua transaksi sesuai filter aktif.
              </p>
            </div>

            <p className="text-sm text-muted-foreground">
              {transactions.length} transaksi
            </p>
          </div>

          {transactions.length === 0 ? (
            <div className="px-6 py-16 text-center">
              <p className="font-medium">Belum ada transaksi</p>

              <p className="mt-1 text-sm text-muted-foreground">
                Tambahkan transaksi pertama Anda.
              </p>
            </div>
          ) : (
            <div className="divide-y">
              {transactions.map((transaction) => (
                <div
                  key={transaction.id}
                  className="grid gap-4 px-5 py-4 sm:grid-cols-[minmax(0,1fr)_180px] sm:items-center"
                >
                  {/* Informasi */}
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
                      <p className="truncate font-medium">
                        {transaction.title}
                      </p>

                      <span className="rounded-full bg-muted px-2 py-0.5 text-[11px] font-medium text-muted-foreground">
                        {transactionTypeLabels[transaction.type]}
                      </span>
                    </div>

                    <p className="mt-1.5 text-sm text-muted-foreground">
                      {transaction.accountName}

                      {transaction.categoryName
                        ? ` • ${transaction.categoryName}`
                        : ''}

                      {transaction.targetAccountName
                        ? ` → ${transaction.targetAccountName}`
                        : ''}
                    </p>

                    <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1">
                      <p className="text-xs text-muted-foreground">
                        {formatDate(transaction.transactionDate)}
                      </p>

                      {transaction.note && (
                        <p className="truncate text-xs text-muted-foreground">
                          {transaction.note}
                        </p>
                      )}
                    </div>
                  </div>

                  {/* Nominal + aksi */}
                  <div className="flex items-center justify-between gap-3 sm:flex-col sm:items-end">
                    <TransactionAmount
                      type={transaction.type}
                      amount={transaction.amount}
                    />

                    <div className="flex flex-wrap justify-end gap-1">
                      <TransactionRepeatSheet
                        transaction={transaction}
                        accounts={accounts}
                        categories={categories}
                        onCreated={async () => {
                          await router.invalidate()
                        }}
                      />

                      <TransactionEditSheet
                        transaction={transaction}
                        accounts={accounts}
                        categories={allCategories}
                        onUpdated={async () => {
                          await router.invalidate()
                        }}
                      />

                      <TransactionDeleteDialog
                        transaction={transaction}
                        onDeleted={async () => {
                          await router.invalidate()
                        }}
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>
      </div>
    </main>
  )
}

type TransactionAmountProps = {
  type: 'expense' | 'income' | 'transfer' | 'investment'
  amount: number
}

function TransactionAmount({ type, amount }: TransactionAmountProps) {
  const prefix = type === 'income' ? '+' : type === 'expense' ? '-' : ''

  return (
    <p className="whitespace-nowrap text-base font-semibold tabular-nums">
      {prefix}
      {formatRupiah(amount)}
    </p>
  )
}
