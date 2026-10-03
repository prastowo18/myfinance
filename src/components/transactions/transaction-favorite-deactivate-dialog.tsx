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
import { deactivateFavorite } from '#/server/favorites.functions'

type TransactionFavoriteDeactivateDialogProps = {
  favorite: {
    id: string
    title: string
  }
  onDeactivated?: () => void | Promise<void>
}

export function TransactionFavoriteDeactivateDialog({
  favorite,
  onDeactivated,
}: TransactionFavoriteDeactivateDialogProps) {
  const [open, setOpen] = useState(false)

  const [isDeleting, setIsDeleting] = useState(false)

  async function handleDelete() {
    try {
      setIsDeleting(true)

      await deactivateFavorite({
        data: {
          id: favorite.id,
        },
      })

      toast.success('Favorit berhasil dihapus')

      await onDeactivated?.()

      setOpen(false)
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : 'Gagal menghapus favorit',
      )
    } finally {
      setIsDeleting(false)
    }
  }

  return (
    <AlertDialog open={open} onOpenChange={setOpen}>
      <AlertDialogTrigger asChild>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          className="text-destructive hover:text-destructive"
        >
          Hapus
        </Button>
      </AlertDialogTrigger>

      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Hapus favorit?</AlertDialogTitle>

          <AlertDialogDescription>
            Favorit &quot;
            {favorite.title}&quot; akan dihapus dari daftar Quick Add. Riwayat
            transaksi tidak akan terpengaruh.
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
            {isDeleting ? 'Menghapus...' : 'Hapus Favorit'}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}
