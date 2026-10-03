import { useState } from 'react'
import { zodResolver } from '@hookform/resolvers/zod'
import { Controller, useForm } from 'react-hook-form'
import { toast } from 'sonner'

import { Button } from '#/components/ui/button'
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '#/components/ui/dialog'
import { Input } from '#/components/ui/input'
import { Label } from '#/components/ui/label'
import { accountSchema } from '#/schemas/account'
import type { AccountFormValues } from '#/schemas/account'
import { createAccount } from '#/server/accounts.functions'
import { MoneyInput } from '../ui/money-input'

type AccountDialogProps = {
  onCreated?: () => void | Promise<void>
}

const accountTypes = [
  {
    value: 'bank',
    label: 'Bank',
  },
  {
    value: 'ewallet',
    label: 'E-Wallet',
  },
  {
    value: 'cash',
    label: 'Cash',
  },
  {
    value: 'credit_card',
    label: 'Kartu Kredit',
  },
  {
    value: 'investment',
    label: 'Investasi',
  },
] as const

export function AccountDialog({ onCreated }: AccountDialogProps) {
  const [open, setOpen] = useState(false)

  const form = useForm<AccountFormValues>({
    resolver: zodResolver(accountSchema),

    defaultValues: {
      name: '',
      type: 'bank',
      initialBalance: 0,
    },
  })

  const isSubmitting = form.formState.isSubmitting

  const accountType = form.watch('type')

  async function onSubmit(values: AccountFormValues) {
    try {
      const account = await createAccount({
        data: values,
      })

      toast.success('Account berhasil dibuat', {
        description: account.name,
      })

      form.reset({
        name: '',
        type: 'bank',
        initialBalance: 0,
      })

      setOpen(false)

      await onCreated?.()
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : 'Terjadi kesalahan saat membuat account'

      toast.error('Account gagal dibuat', {
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
        <Button type="button">+ Tambah Account</Button>
      </DialogTrigger>

      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Tambah Account</DialogTitle>

          <DialogDescription>
            Tambahkan rekening, e-wallet, cash, kartu kredit, atau account
            investasi.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5">
          <div className="space-y-2">
            <Label htmlFor="name">Nama account</Label>

            <Input
              id="name"
              placeholder={
                accountType === 'bank'
                  ? 'Contoh: BCA'
                  : accountType === 'ewallet'
                    ? 'Contoh: GoPay'
                    : accountType === 'cash'
                      ? 'Contoh: Dompet'
                      : accountType === 'credit_card'
                        ? 'Contoh: BCA Visa'
                        : 'Contoh: Investasi Saham'
              }
              className="h-11 rounded-xl"
              {...form.register('name')}
            />

            {form.formState.errors.name && (
              <p className="text-sm text-destructive">
                {form.formState.errors.name.message}
              </p>
            )}
          </div>

          {/* Jenis account */}
          <div className="space-y-2">
            <Label>Jenis account</Label>

            <div className="rounded-xl bg-muted/50 p-1">
              <div className="grid grid-cols-2 gap-1 sm:grid-cols-3">
                {accountTypes.map((item) => {
                  const isActive = accountType === item.value

                  return (
                    <Button
                      key={item.value}
                      type="button"
                      variant={isActive ? 'default' : 'ghost'}
                      className="h-10 rounded-lg"
                      onClick={() => {
                        form.setValue('type', item.value, {
                          shouldDirty: true,
                          shouldValidate: true,
                        })
                      }}
                    >
                      {item.label}
                    </Button>
                  )
                })}
              </div>
            </div>

            {form.formState.errors.type && (
              <p className="text-sm text-destructive">
                {form.formState.errors.type.message}
              </p>
            )}
          </div>

          <Controller
            control={form.control}
            name="initialBalance"
            render={({ field, fieldState }) => (
              <div className="space-y-2">
                <Label htmlFor="initialBalance">Saldo awal</Label>

                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 font-medium text-muted-foreground">
                    Rp
                  </span>

                  <MoneyInput
                    id="initialBalance"
                    value={field.value}
                    onChange={field.onChange}
                    onBlur={field.onBlur}
                    allowNegative
                    invalid={fieldState.invalid}
                    className="h-12 rounded-xl pl-10 text-lg font-semibold tabular-nums"
                  />
                </div>

                <p className="text-xs leading-5 text-muted-foreground">
                  Saldo pada saat account mulai dicatat di MyFinance.
                  {accountType === 'credit_card' &&
                    ' Gunakan angka negatif jika merupakan tagihan kartu kredit.'}
                </p>

                {fieldState.error && (
                  <p className="text-sm text-destructive">
                    {fieldState.error.message}
                  </p>
                )}
              </div>
            )}
          />

          <DialogFooter className="grid grid-cols-2 gap-3 pt-2 sm:grid-cols-2">
            <DialogClose asChild>
              <Button
                type="button"
                variant="outline"
                className="h-12 w-full rounded-xl"
                disabled={isSubmitting}
              >
                Batal
              </Button>
            </DialogClose>

            <Button
              type="submit"
              disabled={isSubmitting}
              className="h-12 w-full rounded-xl text-base font-semibold"
            >
              {isSubmitting ? 'Menyimpan...' : 'Tambah Account'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
