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

type TransactionRepeatSheetProps = {
  transaction: Transaction
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

export function TransactionRepeatSheet({
  transaction,
  accounts,
  categories,
  onCreated,
}: TransactionRepeatSheetProps) {
  const [open, setOpen] = useState(false)

  const sourceAccount = accounts.find(
    (account) =>
      account.id === transaction.accountId &&
      account.isActive &&
      account.type !== 'investment',
  )

  const category = categories.find(
    (item) =>
      item.id === transaction.categoryId &&
      item.isActive &&
      item.type === transaction.type,
  )

  const targetAccount = accounts.find(
    (account) => account.id === transaction.targetAccountId && account.isActive,
  )

  const initialValues: TransactionFormValues = {
    type: transaction.type,
    title: transaction.title,
    amount: transaction.amount,

    accountId: sourceAccount?.id ?? '',

    categoryId:
      transaction.type === 'expense' || transaction.type === 'income'
        ? (category?.id ?? '')
        : '',

    targetAccountId:
      transaction.type === 'transfer' || transaction.type === 'investment'
        ? (targetAccount?.id ?? '')
        : '',

    transactionDate: getLocalDateString(),

    note: transaction.note ?? '',
  }

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <Button type="button" variant="outline" size="sm">
          Ulangi
        </Button>
      </SheetTrigger>

      <SheetContent side="right" className="w-full overflow-y-auto sm:max-w-lg">
        <SheetHeader className="mb-6">
          <SheetTitle>Ulangi Transaksi</SheetTitle>

          <SheetDescription>
            Data transaksi lama disalin sebagai transaksi baru. Tanggal otomatis
            menjadi hari ini.
          </SheetDescription>
        </SheetHeader>

        <div className="px-4 pb-4">
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
