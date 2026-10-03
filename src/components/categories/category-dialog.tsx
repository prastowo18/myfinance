import { useState } from 'react'
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

import { categorySchema } from '#/schemas/category'
import type { CategoryFormValues } from '#/schemas/category'
import { createCategory } from '#/server/categories.functions'

type CategoryDialogProps = {
  onCreated?: () => void | Promise<void>
}

const categoryTypes = [
  {
    value: 'expense',
    label: 'Pengeluaran',
  },
  {
    value: 'income',
    label: 'Pemasukan',
  },
] as const

export function CategoryDialog({ onCreated }: CategoryDialogProps) {
  const [open, setOpen] = useState(false)

  const form = useForm<CategoryFormValues>({
    resolver: zodResolver(categorySchema),
    defaultValues: {
      name: '',
      type: 'expense',
    },
  })

  const categoryType = form.watch('type')
  const isSubmitting = form.formState.isSubmitting

  async function onSubmit(values: CategoryFormValues) {
    try {
      const category = await createCategory({
        data: values,
      })

      toast.success('Kategori berhasil dibuat', {
        description: category.name,
      })

      form.reset({
        name: '',
        type: 'expense',
      })

      setOpen(false)

      await onCreated?.()
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : 'Terjadi kesalahan saat membuat kategori'

      toast.error('Kategori gagal dibuat', {
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
        <Button type="button" variant="outline">
          + Tambah Kategori
        </Button>
      </DialogTrigger>

      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Tambah Kategori</DialogTitle>

          <DialogDescription>
            Tambahkan kategori pemasukan atau pengeluaran.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5">
          <div className="space-y-2">
            <Label htmlFor="name">Nama kategori</Label>

            <Input
              id="name"
              placeholder={
                categoryType === 'expense' ? 'Contoh: Makanan' : 'Contoh: Gaji'
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

          <div className="space-y-2">
            <Label>Jenis kategori</Label>

            <div className="rounded-xl bg-muted/50 p-1">
              <div className="grid grid-cols-2 gap-1">
                {categoryTypes.map((item) => {
                  const isActive = categoryType === item.value

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
              {isSubmitting ? 'Menyimpan...' : 'Tambah Kategori'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
