import { useEffect, useState } from 'react'
import { useNavigate } from '@tanstack/react-router'

import { Button } from '#/components/ui/button'
import { Input } from '#/components/ui/input'
import { Label } from '#/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '#/components/ui/select'
import type { TransactionHistoryFilterValues } from '#/schemas/transaction'

type Account = {
  id: string
  name: string
  type: 'bank' | 'ewallet' | 'cash' | 'credit_card' | 'investment'
  isActive: boolean
}

type Category = {
  id: string
  name: string
  type: 'expense' | 'income'
  isActive: boolean
}

type TransactionFiltersProps = {
  filters: TransactionHistoryFilterValues
  accounts: Account[]
  categories: Category[]
}

type TransactionTypeFilter =
  'expense' | 'income' | 'transfer' | 'investment' | 'adjustment'

export function TransactionFilters({
  filters,
  accounts,
  categories,
}: TransactionFiltersProps) {
  const navigate = useNavigate({
    from: '/transactions',
  })

  const [search, setSearch] = useState(filters.search ?? '')

  useEffect(() => {
    setSearch(filters.search ?? '')
  }, [filters.search])

  function updateFilter(values: Partial<TransactionHistoryFilterValues>) {
    void navigate({
      search: (previous) => ({
        ...previous,
        ...values,
      }),
      replace: true,
    })
  }

  function handleSearchSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()

    updateFilter({
      search: search.trim().length > 0 ? search.trim() : undefined,
    })
  }

  function clearFilters() {
    setSearch('')

    void navigate({
      search: {},
      replace: true,
    })
  }

  const hasFilters =
    Boolean(filters.month) ||
    Boolean(filters.type) ||
    Boolean(filters.accountId) ||
    Boolean(filters.categoryId) ||
    Boolean(filters.search)

  return (
    <div className="rounded-xl border p-4">
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <div className="space-y-2">
          <Label htmlFor="filter-month">Bulan</Label>

          <Input
            id="filter-month"
            type="month"
            value={filters.month ?? ''}
            onChange={(event) => {
              updateFilter({
                month: event.target.value || undefined,
              })
            }}
          />
        </div>

        <div className="space-y-2">
          <Label>Jenis</Label>

          <Select
            value={filters.type ?? 'all'}
            onValueChange={(value) => {
              updateFilter({
                type:
                  value === 'all'
                    ? undefined
                    : (value as TransactionTypeFilter),
              })
            }}
          >
            <SelectTrigger className="w-full">
              <SelectValue />
            </SelectTrigger>

            <SelectContent>
              <SelectItem value="all">Semua jenis</SelectItem>

              <SelectItem value="expense">Pengeluaran</SelectItem>

              <SelectItem value="income">Pemasukan</SelectItem>

              <SelectItem value="transfer">Transfer</SelectItem>

              <SelectItem value="investment">Investasi</SelectItem>

              <SelectItem value="adjustment">Penyesuaian Saldo</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label>Account</Label>

          <Select
            value={filters.accountId ?? 'all'}
            onValueChange={(value) => {
              updateFilter({
                accountId: value === 'all' ? undefined : value,
              })
            }}
          >
            <SelectTrigger className="w-full">
              <SelectValue />
            </SelectTrigger>

            <SelectContent>
              <SelectItem value="all">Semua account</SelectItem>

              {accounts.map((account) => (
                <SelectItem key={account.id} value={account.id}>
                  {account.name}
                  {!account.isActive ? ' (Nonaktif)' : ''}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label>Kategori</Label>

          <Select
            value={filters.categoryId ?? 'all'}
            onValueChange={(value) => {
              updateFilter({
                categoryId: value === 'all' ? undefined : value,
              })
            }}
          >
            <SelectTrigger className="w-full">
              <SelectValue />
            </SelectTrigger>

            <SelectContent>
              <SelectItem value="all">Semua kategori</SelectItem>

              {categories.map((category) => (
                <SelectItem key={category.id} value={category.id}>
                  {category.name}
                  {!category.isActive ? ' (Nonaktif)' : ''}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <form
        onSubmit={handleSearchSubmit}
        className="mt-4 flex flex-col gap-2 sm:flex-row"
      >
        <Input
          value={search}
          onChange={(event) => {
            setSearch(event.target.value)
          }}
          placeholder="Cari nama transaksi atau catatan..."
          className="flex-1"
        />

        <Button type="submit">Cari</Button>

        {hasFilters && (
          <Button type="button" variant="outline" onClick={clearFilters}>
            Reset
          </Button>
        )}
      </form>
    </div>
  )
}
