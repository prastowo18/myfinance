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

type Transaction = {
  id: string
  type: 'expense' | 'income' | 'transfer' | 'investment'
  title: string
  amount: number
  accountId: string
  categoryId: string | null
  targetAccountId: string | null
  transactionDate: string
  note: string | null
}

type TransactionEditSheetProps = {
  transaction: Transaction
  accounts: Account[]
  categories: Category[]
  onUpdated?: () => void | Promise<void>
}

export function TransactionEditSheet({
  transaction,
  accounts,
  categories,
  onUpdated,
}: TransactionEditSheetProps) {
  const [open, setOpen] = useState(false)

  const initialValues: TransactionFormValues = {
    type: transaction.type,
    title: transaction.title,
    amount: transaction.amount,
    accountId: transaction.accountId,
    categoryId: transaction.categoryId ?? '',
    targetAccountId: transaction.targetAccountId ?? '',
    transactionDate: transaction.transactionDate,
    note: transaction.note ?? '',
  }

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <Button type="button" variant="outline" size="sm">
          Edit
        </Button>
      </SheetTrigger>

      <SheetContent side="right" className="w-full overflow-y-auto sm:max-w-lg">
        <SheetHeader className="mb-6">
          <SheetTitle>Edit Transaksi</SheetTitle>

          <SheetDescription>
            Perbaiki data transaksi yang sudah dicatat.
          </SheetDescription>
        </SheetHeader>

        <div className="px-4 pb-4">
          <TransactionForm
            accounts={accounts}
            categories={categories}
            transactionId={transaction.id}
            initialValues={initialValues}
            onUpdated={async () => {
              await onUpdated?.()
              setOpen(false)
            }}
          />
        </div>
      </SheetContent>
    </Sheet>
  )
}
