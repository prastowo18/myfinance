import { createFileRoute, useRouter } from '@tanstack/react-router'

import { CategoryDialog } from '#/components/categories/category-dialog'
import { CategoryEditDialog } from '#/components/categories/category-edit-dialog'
import { getAllCategories } from '#/server/categories.functions'

export const Route = createFileRoute('/categories')({
  loader: async () => {
    const categories = await getAllCategories()

    return {
      categories,
    }
  },

  component: CategoriesPage,
})

const categoryTypeLabels = {
  expense: 'Pengeluaran',
  income: 'Pemasukan',
} as const

function CategoriesPage() {
  const router = useRouter()
  const { categories } = Route.useLoaderData()

  const activeExpense = categories
    .filter((category) => category.type === 'expense' && category.isActive)
    .sort((a, b) => a.name.localeCompare(b.name, 'id'))

  const activeIncome = categories
    .filter((category) => category.type === 'income' && category.isActive)
    .sort((a, b) => a.name.localeCompare(b.name, 'id'))

  const inactiveCategories = categories
    .filter((category) => !category.isActive)
    .sort((a, b) => a.name.localeCompare(b.name, 'id'))

  return (
    <main className="mx-auto w-full max-w-6xl px-4 py-6 sm:px-6 lg:py-8">
      <div className="space-y-8">
        {/* Header */}
        <header className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">
              Kategori
            </h1>

            <p className="mt-1 text-sm text-muted-foreground">
              Kelompokkan pemasukan dan pengeluaran agar laporan lebih mudah
              dibaca.
            </p>
          </div>

          <CategoryDialog
            onCreated={async () => {
              await router.invalidate()
            }}
          />
        </header>

        {/* Ringkasan */}
        <section className="grid gap-4 sm:grid-cols-2">
          <div className="rounded-2xl border bg-card p-5">
            <p className="text-sm text-muted-foreground">
              Kategori Pengeluaran
            </p>

            <p className="mt-2 text-3xl font-semibold tabular-nums">
              {activeExpense.length}
            </p>

            <p className="mt-2 text-xs text-muted-foreground">
              Aktif dan tersedia untuk transaksi baru.
            </p>
          </div>

          <div className="rounded-2xl border bg-card p-5">
            <p className="text-sm text-muted-foreground">Kategori Pemasukan</p>

            <p className="mt-2 text-3xl font-semibold tabular-nums">
              {activeIncome.length}
            </p>

            <p className="mt-2 text-xs text-muted-foreground">
              Aktif dan tersedia untuk transaksi baru.
            </p>
          </div>
        </section>

        {/* Kategori aktif */}
        <div className="grid gap-6 lg:grid-cols-2">
          <CategoryGroup
            title="Pengeluaran"
            description="Kategori untuk mencatat uang keluar."
            categories={activeExpense}
            onUpdated={async () => {
              await router.invalidate()
            }}
          />

          <CategoryGroup
            title="Pemasukan"
            description="Kategori untuk mencatat uang masuk."
            categories={activeIncome}
            onUpdated={async () => {
              await router.invalidate()
            }}
          />
        </div>

        {/* Nonaktif */}
        {inactiveCategories.length > 0 && (
          <section className="space-y-4 border-t pt-7">
            <div>
              <h2 className="text-base font-semibold">Kategori Nonaktif</h2>

              <p className="mt-1 text-sm text-muted-foreground">
                Tidak tersedia untuk transaksi baru, tetapi tetap dipertahankan
                untuk riwayat lama.
              </p>
            </div>

            <div className="overflow-hidden rounded-2xl border bg-muted/10">
              <div className="divide-y">
                {inactiveCategories.map((category) => (
                  <div
                    key={category.id}
                    className="flex items-center justify-between gap-4 px-5 py-4 opacity-70"
                  >
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <p className="truncate text-sm font-medium">
                          {category.name}
                        </p>

                        <span className="rounded-full bg-muted px-2 py-0.5 text-[10px] font-medium text-muted-foreground">
                          Nonaktif
                        </span>
                      </div>

                      <p className="mt-1 text-xs text-muted-foreground">
                        {categoryTypeLabels[category.type]}
                      </p>
                    </div>

                    <CategoryEditDialog
                      category={category}
                      onUpdated={async () => {
                        await router.invalidate()
                      }}
                    />
                  </div>
                ))}
              </div>
            </div>
          </section>
        )}
      </div>
    </main>
  )
}

type CategoryItem = {
  id: string
  name: string
  type: 'expense' | 'income'
  isActive: boolean
}

type CategoryGroupProps = {
  title: string
  description: string
  categories: CategoryItem[]
  onUpdated: () => void | Promise<void>
}

function CategoryGroup({
  title,
  description,
  categories,
  onUpdated,
}: CategoryGroupProps) {
  return (
    <section className="overflow-hidden rounded-2xl border bg-card">
      <div className="border-b px-5 py-4">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h2 className="font-semibold">{title}</h2>

            <p className="mt-1 text-sm text-muted-foreground">{description}</p>
          </div>

          <span className="rounded-full bg-muted px-3 py-1 text-xs font-medium text-muted-foreground">
            {categories.length}
          </span>
        </div>
      </div>

      {categories.length === 0 ? (
        <div className="px-5 py-10 text-center">
          <p className="text-sm font-medium">Belum ada kategori</p>

          <p className="mt-1 text-sm text-muted-foreground">
            Tambahkan kategori baru untuk mulai menggunakannya.
          </p>
        </div>
      ) : (
        <div className="divide-y">
          {categories.map((category) => (
            <div
              key={category.id}
              className="flex items-center justify-between gap-4 px-5 py-4"
            >
              <p className="truncate text-sm font-medium">{category.name}</p>

              <CategoryEditDialog category={category} onUpdated={onUpdated} />
            </div>
          ))}
        </div>
      )}
    </section>
  )
}
