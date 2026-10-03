import { useEffect, useState } from 'react'
import { zodResolver } from '@hookform/resolvers/zod'
import { useForm } from 'react-hook-form'
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
import { updateCategorySchema } from '#/schemas/category'
import type { UpdateCategoryFormValues } from '#/schemas/category'
import { updateCategory } from '#/server/categories.functions'

type CategoryEditDialogProps = {
  category: {
    id: string
    name: string
    type: 'expense' | 'income'
    isActive: boolean
  }

  onUpdated?: () => void | Promise<void>
}

const categoryTypeLabels = {
  expense: 'Pengeluaran',
  income: 'Pemasukan',
} as const

export function CategoryEditDialog({
  category,
  onUpdated,
}: CategoryEditDialogProps) {
  const [open, setOpen] = useState(false)

  const form = useForm<UpdateCategoryFormValues>({
    resolver: zodResolver(updateCategorySchema),

    defaultValues: {
      id: category.id,
      name: category.name,
      isActive: category.isActive,
    },
  })

  useEffect(() => {
    if (!open) {
      return
    }

    form.reset({
      id: category.id,
      name: category.name,
      isActive: category.isActive,
    })
  }, [category.id, category.name, category.isActive, form, open])

  const isSubmitting = form.formState.isSubmitting

  async function onSubmit(values: UpdateCategoryFormValues) {
    try {
      await updateCategory({
        data: values,
      })

      toast.success('Kategori berhasil diperbarui', {
        description: values.name,
      })

      setOpen(false)

      await onUpdated?.()
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : 'Terjadi kesalahan saat memperbarui kategori'

      toast.error('Kategori gagal diperbarui', {
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
          <DialogTitle>Edit Kategori</DialogTitle>

          <DialogDescription>Ubah nama atau status kategori.</DialogDescription>
        </DialogHeader>

        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5">
          <input type="hidden" {...form.register('id')} />

          <div className="space-y-2">
            <Label htmlFor={`category-name-${category.id}`}>
              Nama kategori
            </Label>

            <Input
              id={`category-name-${category.id}`}
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
            <Label>Jenis kategori</Label>

            <div className="flex h-11 items-center rounded-xl border bg-muted/30 px-3">
              <span className="text-sm font-medium">
                {categoryTypeLabels[category.type]}
              </span>
            </div>

            <p className="text-xs text-muted-foreground">
              Jenis kategori tidak dapat diubah.
            </p>
          </div>

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
                Kategori tidak akan tersedia untuk transaksi baru. Riwayat lama
                tetap dipertahankan.
              </p>
            )}
          </div>

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
              {isSubmitting ? 'Menyimpan...' : 'Simpan Perubahan'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
