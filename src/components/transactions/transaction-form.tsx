import { zodResolver } from '@hookform/resolvers/zod'
import { Controller, useForm } from 'react-hook-form'
import { toast } from 'sonner'

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
import { Textarea } from '#/components/ui/textarea'

import { transactionSchema } from '#/schemas/transaction'
import type { TransactionFormValues } from '#/schemas/transaction'
import {
  createTransaction,
  updateTransaction,
} from '#/server/transactions.functions'
import { useState } from 'react'
import { createFavorite } from '#/server/favorites.functions'

type TransactionSuggestion = {
  title: string
  accountId: string
  accountName: string
  categoryId: string
  categoryName: string
  lastAmount: number
  usageCount: number
  lastUsedDate: string
}

type Account = {
  id: string
  name: string
  type: 'bank' | 'ewallet' | 'cash' | 'credit_card' | 'investment'
  initialBalance: number
  isActive: boolean
}

type Category = {
  id: string
  name: string
  type: 'expense' | 'income'
  isActive: boolean
}

type TransactionFormProps = {
  accounts: Account[]
  categories: Category[]
  suggestions?: TransactionSuggestion[]

  transactionId?: string
  initialValues?: TransactionFormValues

  onCreated?: () => void | Promise<void>
  onUpdated?: () => void | Promise<void>
}

const transactionTypes = [
  {
    value: 'expense',
    label: 'Pengeluaran',
  },
  {
    value: 'income',
    label: 'Pemasukan',
  },
  {
    value: 'transfer',
    label: 'Transfer',
  },
  {
    value: 'investment',
    label: 'Investasi',
  },
] as const

function getLocalDateString() {
  const date = new Date()

  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')

  return `${year}-${month}-${day}`
}

function formatRupiah(value: number) {
  if (!value) {
    return ''
  }

  return new Intl.NumberFormat('id-ID').format(value)
}

function normalizeText(value: string) {
  return value.trim().toLowerCase().replace(/\s+/g, ' ')
}

function getSuggestionScore(suggestion: TransactionSuggestion, query: string) {
  const normalizedQuery = normalizeText(query)

  const normalizedTitle = normalizeText(suggestion.title)

  let score = 0

  // Frekuensi penggunaan.
  score += Math.min(suggestion.usageCount * 5, 50)

  // Recency.
  const lastUsed = new Date(`${suggestion.lastUsedDate}T00:00:00`)

  const daysAgo = Math.max(
    0,
    Math.floor((Date.now() - lastUsed.getTime()) / 86_400_000),
  )

  score += Math.max(0, 30 - daysAgo)

  // Jika user belum mengetik,
  // frequency + recency sudah cukup.
  if (!normalizedQuery) {
    return score
  }

  if (normalizedTitle === normalizedQuery) {
    score += 200
  } else if (normalizedTitle.startsWith(normalizedQuery)) {
    score += 120
  } else if (normalizedTitle.includes(normalizedQuery)) {
    score += 70
  } else {
    return -1
  }

  return score
}

export function TransactionForm({
  accounts,
  categories,
  suggestions = [],
  transactionId,
  initialValues,
  onCreated,
  onUpdated,
}: TransactionFormProps) {
  const isEditMode = Boolean(transactionId)

  const [isSavingFavorite, setIsSavingFavorite] = useState(false)
  const [showDetails, setShowDetails] = useState(isEditMode)

  const form = useForm<TransactionFormValues>({
    resolver: zodResolver(transactionSchema),

    defaultValues: initialValues ?? {
      type: 'expense',
      title: '',
      amount: 0,
      accountId: '',
      categoryId: '',
      targetAccountId: '',
      transactionDate: getLocalDateString(),
      note: '',
    },
  })

  const transactionType = form.watch('type')
  const amount = form.watch('amount')
  const title = form.watch('title')
  const sourceAccountId = form.watch('accountId')

  const isSubmitting = form.formState.isSubmitting

  const availableCategories = categories.filter(
    (category) =>
      category.type === transactionType &&
      (category.isActive || category.id === initialValues?.categoryId),
  )

  const matchingSuggestions = suggestions
    .map((item) => ({
      item,
      score: getSuggestionScore(item, title),
    }))
    .filter(({ score }) => score >= 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, 4)
    .map(({ item }) => item)

  async function onSubmit(values: TransactionFormValues) {
    try {
      if (transactionId) {
        const transaction = await updateTransaction({
          data: {
            id: transactionId,
            ...values,
          },
        })

        toast.success('Transaksi berhasil diperbarui', {
          description: `${transaction.title} • Rp${formatRupiah(
            transaction.amount,
          )}`,
        })

        await onUpdated?.()

        return
      }

      const transaction = await createTransaction({
        data: values,
      })

      toast.success('Transaksi berhasil disimpan', {
        description: `${transaction.title} • Rp${formatRupiah(
          transaction.amount,
        )}`,
      })

      form.reset({
        type: 'expense',
        title: '',
        amount: 0,

        // Pertahankan account terakhir agar
        // input transaksi berikutnya lebih cepat.
        accountId: values.accountId,

        categoryId: '',
        targetAccountId: '',
        transactionDate: getLocalDateString(),
        note: '',
      })

      await onCreated?.()
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : isEditMode
            ? 'Terjadi kesalahan saat memperbarui transaksi'
            : 'Terjadi kesalahan saat menyimpan transaksi'

      toast.error(
        isEditMode ? 'Transaksi gagal diperbarui' : 'Transaksi gagal disimpan',
        {
          description: message,
        },
      )
    }
  }

  function getSubmitLabel() {
    if (isSubmitting) {
      return isEditMode ? 'Menyimpan perubahan...' : 'Menyimpan...'
    }

    if (isEditMode) {
      return 'Simpan Perubahan'
    }

    if (amount > 0) {
      return `Simpan Rp${formatRupiah(amount)}`
    }

    return 'Simpan transaksi'
  }

  async function saveAsFavorite(data: TransactionFormValues) {
    try {
      setIsSavingFavorite(true)

      await createFavorite({
        data: {
          title: data.title,
          type: data.type,
          amount: data.amount,
          accountId: data.accountId,

          categoryId: data.categoryId || undefined,

          targetAccountId: data.targetAccountId || undefined,

          note: data.note?.trim() || undefined,
        },
      })

      toast.success('Transaksi disimpan sebagai favorit')
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : 'Gagal menyimpan favorit',
      )
    } finally {
      setIsSavingFavorite(false)
    }
  }

  return (
    <form
      onSubmit={form.handleSubmit(onSubmit)}
      className="space-y-5 sm:space-y-6"
    >
      {/* Jenis transaksi */}
      <div className="space-y-2">
        <p className="text-sm font-medium">Jenis transaksi</p>

        <div className="rounded-xl bg-muted/50 p-1">
          <div className="grid grid-cols-2 gap-1 sm:grid-cols-4">
            {transactionTypes.map((item) => {
              const isActive = transactionType === item.value

              return (
                <Button
                  key={item.value}
                  type="button"
                  variant={isActive ? 'default' : 'ghost'}
                  className="h-10 rounded-lg"
                  onClick={() => {
                    if (isActive) {
                      return
                    }

                    form.setValue('type', item.value, {
                      shouldValidate: true,
                      shouldDirty: true,
                    })

                    form.setValue('categoryId', '')

                    form.setValue('targetAccountId', '')
                  }}
                >
                  {item.label}
                </Button>
              )
            })}
          </div>
        </div>
      </div>

      {/* Nominal */}
      <div className="space-y-2">
        <Label htmlFor="amount">Nominal</Label>

        <Controller
          control={form.control}
          name="amount"
          render={({ field, fieldState }) => (
            <>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-lg font-semibold text-muted-foreground">
                  Rp
                </span>

                <Input
                  id="amount"
                  type="text"
                  inputMode="numeric"
                  autoComplete="off"
                  placeholder="0"
                  value={formatRupiah(field.value)}
                  onChange={(event) => {
                    const digits = event.target.value.replace(/\D/g, '')

                    field.onChange(digits.length > 0 ? Number(digits) : 0)
                  }}
                  className="h-16 rounded-xl pl-11 text-2xl font-semibold tabular-nums"
                  aria-invalid={fieldState.invalid}
                />
              </div>

              {fieldState.error && (
                <p className="text-sm text-destructive">
                  {fieldState.error.message}
                </p>
              )}
            </>
          )}
        />
      </div>

      {/* Nama transaksi */}
      <div className="space-y-2">
        <Label htmlFor="title">Nama transaksi</Label>

        <Input
          id="title"
          placeholder="Contoh: Makan siang"
          autoComplete="off"
          {...form.register('title')}
        />

        {form.formState.errors.title && (
          <p className="text-sm text-destructive">
            {form.formState.errors.title.message}
          </p>
        )}

        {/* Suggestion */}
        {!isEditMode &&
          transactionType === 'expense' &&
          matchingSuggestions.length > 0 && (
            <div className="space-y-2 pt-1">
              <p className="text-xs font-medium text-muted-foreground">
                {title.trim() ? 'Saran yang cocok' : 'Sering digunakan'}
              </p>

              <div className="grid gap-2 sm:grid-cols-2">
                {matchingSuggestions.map((item) => (
                  <button
                    key={[item.title, item.accountId, item.categoryId].join(
                      '|',
                    )}
                    type="button"
                    className="rounded-xl border p-3 text-left transition-colors hover:bg-muted/50"
                    onClick={() => {
                      form.setValue('title', item.title, {
                        shouldDirty: true,
                      })

                      form.setValue('amount', item.lastAmount, {
                        shouldDirty: true,
                        shouldValidate: true,
                      })

                      form.setValue('accountId', item.accountId, {
                        shouldDirty: true,
                        shouldValidate: true,
                      })

                      form.setValue('categoryId', item.categoryId, {
                        shouldDirty: true,
                        shouldValidate: true,
                      })
                    }}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <p className="truncate text-sm font-medium">
                          {item.title}
                        </p>

                        <p className="mt-1 truncate text-xs text-muted-foreground">
                          {item.accountName}
                          {' • '}
                          {item.categoryName}
                        </p>
                      </div>

                      <p className="shrink-0 text-sm font-semibold tabular-nums">
                        Rp
                        {formatRupiah(item.lastAmount)}
                      </p>
                    </div>

                    <p className="mt-2 text-xs text-muted-foreground">
                      {item.usageCount}x digunakan
                    </p>
                  </button>
                ))}
              </div>
            </div>
          )}
      </div>

      {/* Sumber dan klasifikasi */}
      <div className="rounded-xl border p-4">
        <div className="grid gap-4 sm:grid-cols-2">
          {/* Account sumber */}
          <Controller
            control={form.control}
            name="accountId"
            render={({ field, fieldState }) => (
              <div className="space-y-2">
                <Label htmlFor="accountId">
                  {transactionType === 'income'
                    ? 'Masuk ke'
                    : transactionType === 'expense'
                      ? 'Bayar dari'
                      : 'Dari'}
                </Label>

                <Select
                  value={field.value}
                  onValueChange={(value) => {
                    field.onChange(value)

                    if (
                      transactionType === 'transfer' ||
                      transactionType === 'investment'
                    ) {
                      form.setValue('targetAccountId', '')
                    }
                  }}
                >
                  <SelectTrigger
                    id="accountId"
                    aria-invalid={fieldState.invalid}
                    className="h-11 w-full rounded-xl"
                  >
                    <SelectValue placeholder="Pilih account" />
                  </SelectTrigger>

                  <SelectContent>
                    {accounts
                      .filter(
                        (account) =>
                          account.type !== 'investment' &&
                          (account.isActive ||
                            account.id === initialValues?.accountId),
                      )
                      .map((account) => (
                        <SelectItem key={account.id} value={account.id}>
                          {account.name}
                          {!account.isActive ? ' (Nonaktif)' : ''}
                        </SelectItem>
                      ))}
                  </SelectContent>
                </Select>

                {fieldState.error && (
                  <p className="text-sm text-destructive">
                    {fieldState.error.message}
                  </p>
                )}
              </div>
            )}
          />

          {/* Kategori */}
          {(transactionType === 'expense' || transactionType === 'income') && (
            <Controller
              control={form.control}
              name="categoryId"
              render={({ field, fieldState }) => (
                <div className="space-y-2">
                  <Label htmlFor="categoryId">Kategori</Label>

                  <Select
                    value={field.value ?? ''}
                    onValueChange={field.onChange}
                  >
                    <SelectTrigger
                      id="categoryId"
                      aria-invalid={fieldState.invalid}
                      className="h-11 w-full rounded-xl"
                    >
                      <SelectValue placeholder="Pilih kategori" />
                    </SelectTrigger>

                    <SelectContent>
                      {availableCategories.map((category) => (
                        <SelectItem key={category.id} value={category.id}>
                          {category.name}
                          {!category.isActive ? ' (Nonaktif)' : ''}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>

                  {fieldState.error && (
                    <p className="text-sm text-destructive">
                      {fieldState.error.message}
                    </p>
                  )}
                </div>
              )}
            />
          )}

          {/* Account tujuan */}
          {(transactionType === 'transfer' ||
            transactionType === 'investment') && (
            <Controller
              control={form.control}
              name="targetAccountId"
              render={({ field, fieldState }) => {
                const targetAccounts =
                  transactionType === 'investment'
                    ? accounts.filter(
                        (account) =>
                          account.type === 'investment' &&
                          (account.isActive ||
                            account.id === initialValues?.targetAccountId),
                      )
                    : accounts.filter(
                        (account) =>
                          account.type !== 'investment' &&
                          account.id !== sourceAccountId &&
                          (account.isActive ||
                            account.id === initialValues?.targetAccountId),
                      )

                return (
                  <div className="space-y-2">
                    <Label htmlFor="targetAccountId">
                      {transactionType === 'investment'
                        ? 'Tujuan investasi'
                        : 'Ke'}
                    </Label>

                    <Select
                      value={field.value ?? ''}
                      onValueChange={field.onChange}
                    >
                      <SelectTrigger
                        id="targetAccountId"
                        aria-invalid={fieldState.invalid}
                        className="h-11 w-full rounded-xl"
                      >
                        <SelectValue
                          placeholder={
                            transactionType === 'investment'
                              ? 'Pilih account investasi'
                              : 'Pilih account tujuan'
                          }
                        />
                      </SelectTrigger>

                      <SelectContent>
                        {targetAccounts.map((account) => (
                          <SelectItem key={account.id} value={account.id}>
                            {account.name}
                            {!account.isActive ? ' (Nonaktif)' : ''}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>

                    {fieldState.error && (
                      <p className="text-sm text-destructive">
                        {fieldState.error.message}
                      </p>
                    )}
                  </div>
                )
              }}
            />
          )}
        </div>
      </div>

      {/* Detail tambahan */}
      <div className="rounded-xl border">
        <button
          type="button"
          className="flex w-full items-center justify-between gap-4 px-4 py-3 text-left"
          onClick={() => {
            setShowDetails((value) => !value)
          }}
        >
          <div>
            <p className="text-sm font-medium">Detail tambahan</p>

            <p className="mt-0.5 text-xs text-muted-foreground">
              Tanggal dan catatan
            </p>
          </div>

          <span className="text-sm text-muted-foreground">
            {showDetails ? 'Tutup' : 'Buka'}
          </span>
        </button>

        {showDetails && (
          <div className="space-y-5 border-t px-4 py-4">
            {/* Tanggal */}
            <div className="space-y-2">
              <Label htmlFor="transactionDate">Tanggal</Label>

              <Input
                id="transactionDate"
                type="date"
                {...form.register('transactionDate')}
              />

              {form.formState.errors.transactionDate && (
                <p className="text-sm text-destructive">
                  {form.formState.errors.transactionDate.message}
                </p>
              )}
            </div>

            {/* Catatan */}
            <div className="space-y-2">
              <Label htmlFor="note">Catatan</Label>

              <Textarea
                id="note"
                placeholder="Opsional"
                rows={3}
                {...form.register('note')}
              />

              {form.formState.errors.note && (
                <p className="text-sm text-destructive">
                  {form.formState.errors.note.message}
                </p>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Action bar */}
      <div className="sticky bottom-0 z-20 -mx-4 border-t bg-background/95 px-4 pb-3 pt-3 backdrop-blur sm:static sm:mx-0 sm:border-t sm:bg-transparent sm:px-0 sm:pb-0 sm:pt-4">
        <div className="flex flex-col-reverse gap-2 sm:flex-row">
          {!isEditMode && (
            <Button
              type="button"
              variant="outline"
              disabled={isSavingFavorite || isSubmitting}
              className="h-10 sm:h-12 sm:flex-1"
              onClick={() => {
                void form.handleSubmit(saveAsFavorite)()
              }}
            >
              {isSavingFavorite
                ? 'Menyimpan Favorit...'
                : 'Simpan sebagai Favorit'}
            </Button>
          )}

          <Button
            type="submit"
            disabled={isSubmitting || isSavingFavorite}
            className="h-12 text-base font-semibold sm:flex-1"
          >
            {getSubmitLabel()}
          </Button>
        </div>
      </div>
    </form>
  )
}
