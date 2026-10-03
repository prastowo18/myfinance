import { useEffect, useState } from 'react'
import { zodResolver } from '@hookform/resolvers/zod'
import { Controller, useForm } from 'react-hook-form'
import { toast } from 'sonner'

import { Button } from '#/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '#/components/ui/dialog'
import { Input } from '#/components/ui/input'
import { Label } from '#/components/ui/label'
import { updateAccountSchema } from '#/schemas/account'
import type { UpdateAccountFormValues } from '#/schemas/account'
import { updateAccount } from '#/server/accounts.functions'
import { MoneyInput } from '../ui/money-input'

type AccountEditDialogProps = {
  account: {
    id: string
    name: string
    type: 'bank' | 'ewallet' | 'cash' | 'credit_card' | 'investment'
    initialBalance: number
    isActive: boolean
  }

  onUpdated?: () => void | Promise<void>
}

const accountTypeLabels = {
  bank: 'Bank',
  ewallet: 'E-Wallet',
  cash: 'Cash',
  credit_card: 'Kartu Kredit',
  investment: 'Investasi',
} as const

export function AccountEditDialog({
  account,
  onUpdated,
}: AccountEditDialogProps) {
  const [open, setOpen] = useState(false)

  const form = useForm<UpdateAccountFormValues>({
    resolver: zodResolver(updateAccountSchema),

    defaultValues: {
      id: account.id,
      name: account.name,
      initialBalance: account.initialBalance,
      isActive: account.isActive,
    },
  })

  useEffect(() => {
    if (!open) {
      return
    }

    form.reset({
      id: account.id,
      name: account.name,
      initialBalance: account.initialBalance,
      isActive: account.isActive,
    })
  }, [
    account.id,
    account.name,
    account.initialBalance,
    account.isActive,
    form,
    open,
  ])

  const isSubmitting = form.formState.isSubmitting

  async function onSubmit(values: UpdateAccountFormValues) {
    try {
      await updateAccount({
        data: values,
      })

      toast.success('Account berhasil diperbarui', {
        description: values.name,
      })

      setOpen(false)

      await onUpdated?.()
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : 'Terjadi kesalahan saat memperbarui account'

      toast.error('Account gagal diperbarui', {
        description: message,
      })
    }
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(nextOpen) => {
        setOpen(nextOpen)

        if (!nextOpen) {
          form.clearErrors()
        }
      }}
    >
      <DialogTrigger asChild>
        <Button type="button" variant="outline" size="sm">
          Edit
        </Button>
      </DialogTrigger>

      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Edit Account</DialogTitle>

          <DialogDescription>
            Ubah nama atau saldo awal account.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5">
          <input type="hidden" {...form.register('id')} />

          <div className="space-y-2">
            <Label htmlFor={`account-name-${account.id}`}>Nama account</Label>

            <Input
              id={`account-name-${account.id}`}
              autoComplete="off"
              {...form.register('name')}
            />

            {form.formState.errors.name && (
              <p className="text-sm text-destructive">
                {form.formState.errors.name.message}
              </p>
            )}
          </div>

          <div className="space-y-2">
            <Label>Jenis account</Label>

            <div className="flex h-11 items-center rounded-xl border bg-muted/30 px-3">
              <span className="text-sm font-medium">
                {accountTypeLabels[account.type]}
              </span>
            </div>

            <p className="text-xs text-muted-foreground">
              Jenis account tidak dapat diubah.
            </p>
          </div>

          <Controller
            control={form.control}
            name="initialBalance"
            render={({ field, fieldState }) => (
              <div className="space-y-2">
                <Label htmlFor={`initial-balance-${account.id}`}>
                  Saldo awal
                </Label>

                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">
                    Rp
                  </span>

                  <MoneyInput
                    id={`initial-balance-${account.id}`}
                    value={field.value}
                    onChange={field.onChange}
                    onBlur={field.onBlur}
                    allowNegative
                    invalid={fieldState.invalid}
                    className="pl-10"
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

          <div className="space-y-2">
            <Label>Status</Label>

            <div className="rounded-xl bg-muted/50 p-1">
              <div className="grid grid-cols-2 gap-1">
                <Button
                  type="button"
                  variant={form.watch('isActive') ? 'default' : 'ghost'}
                  className="h-10 rounded-lg"
                  onClick={() => {
                    form.setValue('isActive', true, {
                      shouldDirty: true,
                    })
                  }}
                >
                  Aktif
                </Button>

                <Button
                  type="button"
                  variant={!form.watch('isActive') ? 'default' : 'ghost'}
                  className="h-10 rounded-lg"
                  onClick={() => {
                    form.setValue('isActive', false, {
                      shouldDirty: true,
                    })
                  }}
                >
                  Nonaktif
                </Button>
              </div>
            </div>

            {!form.watch('isActive') && (
              <p className="text-xs leading-5 text-muted-foreground">
                Account tidak akan tersedia untuk transaksi baru. Riwayat dan
                saldo tetap dipertahankan.
              </p>
            )}
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              disabled={isSubmitting}
              onClick={() => setOpen(false)}
            >
              Batal
            </Button>

            <Button
              type="submit"
              disabled={isSubmitting}
              className="h-12 w-full rounded-xl text-base font-semibold"
            >
              {isSubmitting ? 'Menyimpan...' : 'Simpan Perubahan'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
