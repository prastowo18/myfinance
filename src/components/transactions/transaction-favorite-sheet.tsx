import { useState } from 'react'

import { Button } from '#/components/ui/button'
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '#/components/ui/sheet'
import type { TransactionFormValues } from '#/schemas/transaction'
import { TransactionForm } from './transaction-form'

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

type TransactionFavoriteSheetProps = {
  favorite: Favorite
  accounts: Account[]
  categories: Category[]
  onCreated?: () => void | Promise<void>
}

function getLocalDateString() {
  const date = new Date()

  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')

  const day = String(date.getDate()).padStart(2, '0')

  return `${year}-${month}-${day}`
}

export function TransactionFavoriteSheet({
  favorite,
  accounts,
  categories,
  onCreated,
}: TransactionFavoriteSheetProps) {
  const [open, setOpen] = useState(false)

  const initialValues: TransactionFormValues = {
    type: favorite.type,
    title: favorite.title,
    amount: favorite.amount,

    accountId: favorite.accountId,

    categoryId: favorite.categoryId ?? '',

    targetAccountId: favorite.targetAccountId ?? '',

    transactionDate: getLocalDateString(),

    note: favorite.note ?? '',
  }

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <Button type="button" variant="outline" size="sm">
          Gunakan
        </Button>
      </SheetTrigger>

      <SheetContent side="right" className="w-full overflow-y-auto sm:max-w-lg">
        <SheetHeader className="mb-6">
          <SheetTitle>Transaksi Favorit</SheetTitle>

          <SheetDescription>
            Periksa data lalu simpan transaksi.
          </SheetDescription>
        </SheetHeader>

        <div className="px-4 pb-8">
          <TransactionForm
            accounts={accounts}
            categories={categories}
            initialValues={initialValues}
            onCreated={async () => {
              await onCreated?.()
              setOpen(false)
            }}
          />
        </div>
      </SheetContent>
    </Sheet>
  )
}
