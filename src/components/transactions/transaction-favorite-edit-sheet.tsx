import { zodResolver } from '@hookform/resolvers/zod'
import { Controller, useForm } from 'react-hook-form'
import { useEffect, useState } from 'react'
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
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '#/components/ui/sheet'
import { Textarea } from '#/components/ui/textarea'

import { updateFavoriteSchema } from '#/schemas/favorite'
import type { UpdateFavoriteValues } from '#/schemas/favorite'
import { updateFavorite } from '#/server/favorites.functions'
import { formatRupiah } from '#/lib/money'
import { MoneyInput } from '../ui/money-input'

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

type Favorite = {
  id: string
  title: string
  type: 'expense' | 'income' | 'transfer' | 'investment'
  amount: number

  accountId: string
  accountName: string

  categoryId: string | null
  categoryName: string | null

  targetAccountId: string | null
  targetAccountName: string | null

  note: string | null
  isActive: boolean
}

type TransactionFavoriteEditSheetProps = {
  favorite: Favorite
  accounts: Account[]
  categories: Category[]
  onUpdated?: () => void | Promise<void>
}

const favoriteTypes = [
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

export function TransactionFavoriteEditSheet({
  favorite,
  accounts,
  categories,
  onUpdated,
}: TransactionFavoriteEditSheetProps) {
  const [open, setOpen] = useState(false)

  const form = useForm<UpdateFavoriteValues>({
    resolver: zodResolver(updateFavoriteSchema),

    defaultValues: {
      id: favorite.id,
      title: favorite.title,
      type: favorite.type,
      amount: favorite.amount,
      accountId: favorite.accountId,
      categoryId: favorite.categoryId ?? undefined,
      targetAccountId: favorite.targetAccountId ?? undefined,
      note: favorite.note ?? undefined,
    },
  })

  const favoriteType = form.watch('type')

  const sourceAccountId = form.watch('accountId')

  const isSubmitting = form.formState.isSubmitting

  useEffect(() => {
    if (!open) {
      return
    }

    form.reset({
      id: favorite.id,
      title: favorite.title,
      type: favorite.type,
      amount: favorite.amount,
      accountId: favorite.accountId,
      categoryId: favorite.categoryId ?? undefined,
      targetAccountId: favorite.targetAccountId ?? undefined,
      note: favorite.note ?? undefined,
    })
  }, [favorite, form, open])

  const availableCategories = categories.filter(
    (category) => category.type === favoriteType && category.isActive,
  )

  const sourceAccounts = accounts.filter(
    (account) => account.type !== 'investment' && account.isActive,
  )

  const targetAccounts =
    favoriteType === 'investment'
      ? accounts.filter(
          (account) => account.type === 'investment' && account.isActive,
        )
      : accounts.filter(
          (account) =>
            account.type !== 'investment' &&
            account.id !== sourceAccountId &&
            account.isActive,
        )

  async function onSubmit(values: UpdateFavoriteValues) {
    try {
      const updated = await updateFavorite({
        data: {
          ...values,

          categoryId: values.categoryId || undefined,

          targetAccountId: values.targetAccountId || undefined,

          note: values.note?.trim() || undefined,
        },
      })

      toast.success('Favorit berhasil diperbarui', {
        description: updated.title,
      })

      await onUpdated?.()

      setOpen(false)
    } catch (error) {
      toast.error('Favorit gagal diperbarui', {
        description:
          error instanceof Error
            ? error.message
            : 'Terjadi kesalahan saat memperbarui favorit',
      })
    }
  }

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <Button type="button" variant="ghost" size="sm">
          Edit
        </Button>
      </SheetTrigger>

      <SheetContent side="right" className="w-full overflow-y-auto sm:max-w-lg">
        <SheetHeader className="mb-6">
          <SheetTitle>Edit Favorit</SheetTitle>

          <SheetDescription>Ubah template transaksi favorit.</SheetDescription>
        </SheetHeader>

        <form
          onSubmit={form.handleSubmit(onSubmit)}
          className="space-y-6 px-4 pb-8"
        >
          {/* Jenis */}
          <div className="space-y-2">
            <p className="text-sm font-medium">Jenis transaksi</p>

            <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
              {favoriteTypes.map((item) => (
                <Button
                  key={item.value}
                  type="button"
                  variant={favoriteType === item.value ? 'default' : 'outline'}
                  onClick={() => {
                    form.setValue('type', item.value, {
                      shouldDirty: true,
                      shouldValidate: true,
                    })

                    form.setValue('categoryId', undefined)

                    form.setValue('targetAccountId', undefined)
                  }}
                >
                  {item.label}
                </Button>
              ))}
            </div>
          </div>

          {/* Nominal */}
          <Controller
            control={form.control}
            name="amount"
            render={({ field, fieldState }) => (
              <div className="space-y-2">
                <Label htmlFor="favoriteAmount">Nominal</Label>

                <div className="relative">
                  <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-lg font-semibold text-muted-foreground">
                    Rp
                  </span>

                  <MoneyInput
                    id="favoriteAmount"
                    value={field.value}
                    onChange={field.onChange}
                    onBlur={field.onBlur}
                    invalid={fieldState.invalid}
                    className="h-14 pl-11 text-2xl font-semibold tabular-nums"
                  />
                </div>

                {fieldState.error && (
                  <p className="text-sm text-destructive">
                    {fieldState.error.message}
                  </p>
                )}
              </div>
            )}
          />

          {/* Nama */}
          <div className="space-y-2">
            <Label htmlFor="favoriteTitle">Nama favorit</Label>

            <Input id="favoriteTitle" {...form.register('title')} />

            {form.formState.errors.title && (
              <p className="text-sm text-destructive">
                {form.formState.errors.title.message}
              </p>
            )}
          </div>

          {/* Account sumber */}
          <Controller
            control={form.control}
            name="accountId"
            render={({ field, fieldState }) => (
              <div className="space-y-2">
                <Label>
                  {favoriteType === 'income'
                    ? 'Masuk ke account'
                    : 'Dari account'}
                </Label>

                <Select
                  value={field.value}
                  onValueChange={(value) => {
                    field.onChange(value)

                    if (
                      favoriteType === 'transfer' ||
                      favoriteType === 'investment'
                    ) {
                      form.setValue('targetAccountId', undefined)
                    }
                  }}
                >
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Pilih account" />
                  </SelectTrigger>

                  <SelectContent>
                    {sourceAccounts.map((account) => (
                      <SelectItem key={account.id} value={account.id}>
                        {account.name}
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
          {(favoriteType === 'expense' || favoriteType === 'income') && (
            <Controller
              control={form.control}
              name="categoryId"
              render={({ field, fieldState }) => (
                <div className="space-y-2">
                  <Label>Kategori</Label>

                  <Select
                    value={field.value ?? ''}
                    onValueChange={field.onChange}
                  >
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="Pilih kategori" />
                    </SelectTrigger>

                    <SelectContent>
                      {availableCategories.map((category) => (
                        <SelectItem key={category.id} value={category.id}>
                          {category.name}
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
          {(favoriteType === 'transfer' || favoriteType === 'investment') && (
            <Controller
              control={form.control}
              name="targetAccountId"
              render={({ field, fieldState }) => (
                <div className="space-y-2">
                  <Label>
                    {favoriteType === 'investment'
                      ? 'Ke investasi'
                      : 'Ke account'}
                  </Label>

                  <Select
                    value={field.value ?? ''}
                    onValueChange={field.onChange}
                  >
                    <SelectTrigger className="w-full">
                      <SelectValue
                        placeholder={
                          favoriteType === 'investment'
                            ? 'Pilih account investasi'
                            : 'Pilih account tujuan'
                        }
                      />
                    </SelectTrigger>

                    <SelectContent>
                      {targetAccounts.map((account) => (
                        <SelectItem key={account.id} value={account.id}>
                          {account.name}
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

          {/* Catatan */}
          <div className="space-y-2">
            <Label htmlFor="favoriteNote">Catatan</Label>

            <Textarea
              id="favoriteNote"
              rows={3}
              placeholder="Opsional"
              {...form.register('note')}
            />

            {form.formState.errors.note && (
              <p className="text-sm text-destructive">
                {form.formState.errors.note.message}
              </p>
            )}
          </div>

          <Button type="submit" disabled={isSubmitting} className="h-12 w-full">
            {isSubmitting ? 'Menyimpan...' : 'Simpan Perubahan'}
          </Button>
        </form>
      </SheetContent>
    </Sheet>
  )
}
