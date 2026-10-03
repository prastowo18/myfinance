import { useState } from 'react'
import { toast } from 'sonner'

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '#/components/ui/alert-dialog'
import { Button } from '#/components/ui/button'
import { deleteTransaction } from '#/server/transactions.functions'

type TransactionDeleteDialogProps = {
  transaction: {
    id: string
    title: string
    amount: number
  }

  onDeleted?: () => void | Promise<void>
}

function formatRupiah(value: number) {
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    maximumFractionDigits: 0,
  }).format(value)
}

export function TransactionDeleteDialog({
  transaction,
  onDeleted,
}: TransactionDeleteDialogProps) {
  const [open, setOpen] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)

  async function handleDelete() {
    try {
      setIsDeleting(true)

      await deleteTransaction({
        data: {
          id: transaction.id,
        },
      })

      toast.success('Transaksi berhasil dihapus', {
        description: transaction.title,
      })

      setOpen(false)

      await onDeleted?.()
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : 'Terjadi kesalahan saat menghapus transaksi'

      toast.error('Transaksi gagal dihapus', {
        description: message,
      })
    } finally {
      setIsDeleting(false)
    }
  }

  return (
    <AlertDialog open={open} onOpenChange={setOpen}>
      <AlertDialogTrigger asChild>
        <Button type="button" variant="outline" size="sm">
          Hapus
        </Button>
      </AlertDialogTrigger>

      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Hapus transaksi?</AlertDialogTitle>

          <AlertDialogDescription>
            Transaksi "{transaction.title}" sebesar{' '}
            {formatRupiah(transaction.amount)} akan dihapus. Saldo account akan
            otomatis dihitung ulang.
          </AlertDialogDescription>
        </AlertDialogHeader>

        <AlertDialogFooter>
          <AlertDialogCancel disabled={isDeleting}>Batal</AlertDialogCancel>

          <AlertDialogAction
            disabled={isDeleting}
            onClick={(event) => {
              event.preventDefault()
              void handleDelete()
            }}
          >
            {isDeleting ? 'Menghapus...' : 'Hapus Transaksi'}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}
