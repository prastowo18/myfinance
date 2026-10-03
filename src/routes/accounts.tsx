import { createFileRoute, useRouter } from '@tanstack/react-router'

import { AccountBalanceAdjustmentDialog } from '#/components/accounts/account-balance-adjustment-dialog'
import { AccountDialog } from '#/components/accounts/account-dialog'
import { AccountEditDialog } from '#/components/accounts/account-edit-dialog'
import { getAccounts } from '#/server/accounts.functions'

export const Route = createFileRoute('/accounts')({
  loader: async () => {
    const accounts = await getAccounts()

    return {
      accounts,
    }
  },

  component: AccountsPage,
})

const accountTypeLabels = {
  bank: 'Bank',
  ewallet: 'E-Wallet',
  cash: 'Cash',
  credit_card: 'Kartu Kredit',
  investment: 'Investasi',
} as const

function formatRupiah(value: number) {
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    maximumFractionDigits: 0,
  }).format(value)
}

function AccountsPage() {
  const router = useRouter()
  const { accounts } = Route.useLoaderData()

  const activeAccounts = accounts
    .filter((account) => account.isActive)
    .sort((a, b) => b.balance - a.balance)

  const inactiveAccounts = accounts
    .filter((account) => !account.isActive)
    .sort((a, b) => a.name.localeCompare(b.name, 'id'))

  const totalBalance = accounts.reduce(
    (total, account) => total + account.balance,
    0,
  )

  const activeBalance = activeAccounts.reduce(
    (total, account) => total + account.balance,
    0,
  )

  return (
    <main className="mx-auto w-full max-w-6xl px-4 py-6 sm:px-6 lg:py-8">
      <div className="space-y-8">
        {/* Header */}
        <header className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">
              Account
            </h1>

            <p className="mt-1 text-sm text-muted-foreground">
              Kelola bank, cash, e-wallet, kartu kredit, dan investasi.
            </p>
          </div>

          <AccountDialog
            onCreated={async () => {
              await router.invalidate()
            }}
          />
        </header>

        {/* Ringkasan */}
        <section className="grid gap-4 sm:grid-cols-3">
          <div className="rounded-2xl border bg-card p-5 sm:col-span-2">
            <p className="text-sm text-muted-foreground">Total Saldo</p>

            <p className="mt-2 text-3xl font-semibold tracking-tight tabular-nums">
              {formatRupiah(totalBalance)}
            </p>

            <p className="mt-2 text-xs text-muted-foreground">
              Termasuk account aktif dan nonaktif.
            </p>
          </div>

          <div className="rounded-2xl border bg-card p-5">
            <p className="text-sm text-muted-foreground">Account Aktif</p>

            <p className="mt-2 text-3xl font-semibold tabular-nums">
              {activeAccounts.length}
            </p>

            <p className="mt-2 text-xs text-muted-foreground">
              Saldo aktif {formatRupiah(activeBalance)}
            </p>
          </div>
        </section>

        {/* Account aktif */}
        <section className="space-y-4">
          <div>
            <h2 className="text-lg font-semibold">Account Aktif</h2>

            <p className="mt-1 text-sm text-muted-foreground">
              Account yang tersedia untuk transaksi baru.
            </p>
          </div>

          {activeAccounts.length === 0 ? (
            <div className="rounded-2xl border px-6 py-12 text-center">
              <p className="font-medium">Belum ada account aktif</p>

              <p className="mt-1 text-sm text-muted-foreground">
                Tambahkan account untuk mulai mencatat transaksi.
              </p>
            </div>
          ) : (
            <div className="grid gap-4 md:grid-cols-2">
              {activeAccounts.map((account) => (
                <article
                  key={account.id}
                  className="rounded-2xl border bg-card p-5"
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="min-w-0">
                      <p className="truncate text-base font-semibold">
                        {account.name}
                      </p>

                      <span className="mt-2 inline-flex rounded-md bg-muted px-2 py-1 text-[11px] font-medium text-muted-foreground">
                        {accountTypeLabels[account.type]}
                      </span>
                    </div>

                    <div className="shrink-0 text-right">
                      <p className="text-xs text-muted-foreground">Saldo</p>

                      <p className="mt-1 text-lg font-semibold tabular-nums">
                        {formatRupiah(account.balance)}
                      </p>
                    </div>
                  </div>

                  <div className="mt-5 border-t pt-4">
                    <div className="flex items-end justify-between gap-4">
                      <div>
                        <p className="text-xs text-muted-foreground">
                          Saldo awal
                        </p>

                        <p className="mt-1 text-sm font-medium tabular-nums">
                          {formatRupiah(account.initialBalance)}
                        </p>
                      </div>

                      <div className="flex flex-wrap justify-end gap-2">
                        <AccountBalanceAdjustmentDialog
                          account={account}
                          onAdjusted={async () => {
                            await router.invalidate()
                          }}
                        />

                        <AccountEditDialog
                          account={account}
                          onUpdated={async () => {
                            await router.invalidate()
                          }}
                        />
                      </div>
                    </div>
                  </div>
                </article>
              ))}
            </div>
          )}
        </section>

        {/* Account nonaktif */}
        {inactiveAccounts.length > 0 && (
          <section className="space-y-4 border-t pt-7">
            <div>
              <h2 className="text-base font-semibold">Account Nonaktif</h2>

              <p className="mt-1 text-sm text-muted-foreground">
                Tidak dapat dipakai untuk transaksi baru, tetapi riwayat dan
                saldo tetap dipertahankan.
              </p>
            </div>

            <div className="overflow-hidden rounded-2xl border bg-muted/10">
              <div className="divide-y">
                {inactiveAccounts.map((account) => (
                  <div
                    key={account.id}
                    className="flex flex-col gap-3 px-5 py-4 opacity-70 sm:flex-row sm:items-center sm:justify-between"
                  >
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <p className="truncate text-sm font-medium">
                          {account.name}
                        </p>

                        <span className="rounded-full bg-muted px-2 py-0.5 text-[10px] font-medium text-muted-foreground">
                          Nonaktif
                        </span>
                      </div>

                      <p className="mt-1 text-xs text-muted-foreground">
                        {accountTypeLabels[account.type]}
                      </p>
                    </div>

                    <div className="flex items-center justify-between gap-4 sm:justify-end">
                      <p className="text-sm font-semibold tabular-nums">
                        {formatRupiah(account.balance)}
                      </p>

                      <AccountEditDialog
                        account={account}
                        onUpdated={async () => {
                          await router.invalidate()
                        }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </section>
        )}
      </div>
    </main>
  )
}
