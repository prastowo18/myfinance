import { useState } from 'react'
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
import { Label } from '#/components/ui/label'
import { MoneyInput } from '#/components/ui/money-input'
import { Textarea } from '#/components/ui/textarea'
import { adjustAccountBalance } from '#/server/accounts.functions'

type AccountBalanceAdjustmentDialogProps = {
  account: {
    id: string
    name: string
    balance: number
    isActive: boolean
  }

  onAdjusted?: () => void | Promise<void>
}

function moneyToCents(value: number) {
  return Math.round(value * 100)
}

function centsToMoney(value: number) {
  return value / 100
}

function formatRupiah(value: number) {
  const cents = moneyToCents(value)

  const normalized = centsToMoney(cents)

  const hasDecimals = Math.abs(cents % 100) > 0

  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: hasDecimals ? 2 : 0,
    maximumFractionDigits: 2,
  }).format(normalized)
}

export function AccountBalanceAdjustmentDialog({
  account,
  onAdjusted,
}: AccountBalanceAdjustmentDialogProps) {
  const [open, setOpen] = useState(false)

  const [actualBalance, setActualBalance] = useState(account.balance)

  const [note, setNote] = useState('')

  const [isSubmitting, setIsSubmitting] = useState(false)

  const differenceCents =
    moneyToCents(actualBalance) - moneyToCents(account.balance)

  const difference = centsToMoney(differenceCents)

  function handleOpenChange(value: boolean) {
    setOpen(value)

    if (value) {
      setActualBalance(account.balance)

      setNote('')
    }
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()

    try {
      setIsSubmitting(true)

      const result = await adjustAccountBalance({
        data: {
          accountId: account.id,

          actualBalance: centsToMoney(moneyToCents(actualBalance)),

          note: note.trim() || undefined,
        },
      })

      if (!result.changed) {
        toast.info('Saldo sudah sesuai', {
          description:
            'Saldo terbaru di database sudah sama dengan saldo yang dimasukkan.',
        })

        setOpen(false)

        await onAdjusted?.()

        return
      }

      toast.success('Saldo berhasil disesuaikan', {
        description: `${result.accountName}: ${formatRupiah(
          result.previousBalance,
        )} → ${formatRupiah(result.actualBalance)}`,
      })

      setOpen(false)

      await onAdjusted?.()
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : 'Terjadi kesalahan saat menyesuaikan saldo'

      toast.error('Penyesuaian saldo gagal', {
        description: message,
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        <Button
          type="button"
          variant="outline"
          size="sm"
          disabled={!account.isActive}
        >
          Sesuaikan Saldo
        </Button>
      </DialogTrigger>

      <DialogContent className="sm:max-w-md">
        <form onSubmit={handleSubmit} className="space-y-5">
          <DialogHeader>
            <DialogTitle>Sesuaikan Saldo</DialogTitle>

            <DialogDescription>
              Cocokkan saldo <strong>{account.name}</strong> dengan saldo
              sebenarnya. Perubahan disimpan sebagai riwayat penyesuaian, bukan
              pemasukan atau pengeluaran.
            </DialogDescription>
          </DialogHeader>

          <div className="rounded-xl border bg-muted/30 p-4">
            <p className="text-sm text-muted-foreground">Saldo saat ini</p>

            <p className="mt-1 text-lg font-semibold tabular-nums">
              {formatRupiah(account.balance)}
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor={`actual-balance-${account.id}`}>
              Saldo sebenarnya
            </Label>

            <div className="relative">
              <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">
                Rp
              </span>

              <MoneyInput
                id={`actual-balance-${account.id}`}
                value={actualBalance}
                onChange={setActualBalance}
                allowNegative
                className="pl-10"
              />
            </div>

            <p className="text-xs text-muted-foreground">
              Mendukung maksimal 2 angka di belakang koma.
            </p>
          </div>

          {differenceCents !== 0 && (
            <div className="rounded-xl border p-4">
              <p className="text-sm text-muted-foreground">
                Perkiraan penyesuaian
              </p>

              <p className="mt-1 font-semibold tabular-nums">
                {difference > 0 ? '+' : '-'}
                {formatRupiah(Math.abs(difference))}
              </p>

              <p className="mt-1 text-xs text-muted-foreground">
                Nilai final tetap dihitung ulang dari saldo terbaru di server
                saat disimpan.
              </p>
            </div>
          )}

          <div className="space-y-2">
            <Label htmlFor={`adjustment-note-${account.id}`}>
              Catatan
              <span className="ml-1 text-muted-foreground">(opsional)</span>
            </Label>

            <Textarea
              id={`adjustment-note-${account.id}`}
              value={note}
              maxLength={300}
              placeholder="Contoh: Penyesuaian setelah rekonsiliasi saldo bank"
              onChange={(event) => setNote(event.target.value)}
            />
          </div>

          <DialogFooter className="grid grid-cols-2 gap-2 sm:grid-cols-2">
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
              disabled={isSubmitting || differenceCents === 0}
            >
              {isSubmitting ? 'Menyimpan...' : 'Sesuaikan Saldo'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
