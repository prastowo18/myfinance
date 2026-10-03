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
import { TransactionForm } from './transaction-form'

type TransactionSuggestion = {
  title: string
  accountId: string
  accountName: string
  categoryId: string
  categoryName: string
  lastAmount: number
  usageCount: number
  lastUsedDate: string
}

type Account = {
  id: string
  name: string
  type: 'bank' | 'ewallet' | 'cash' | 'credit_card' | 'investment'
  initialBalance: number
  balance: number
  isActive: boolean
}

type Category = {
  id: string
  name: string
  type: 'expense' | 'income'
  isActive: boolean
}

type TransactionSheetProps = {
  accounts: Account[]
  categories: Category[]
  suggestions: TransactionSuggestion[]
  onCreated?: () => void | Promise<void>
}

export function TransactionSheet({
  accounts,
  categories,
  suggestions,
  onCreated,
}: TransactionSheetProps) {
  const [open, setOpen] = useState(false)

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <Button type="button">+ Tambah Transaksi</Button>
      </SheetTrigger>

      <SheetContent side="right" className="w-full overflow-y-auto sm:max-w-lg">
        <SheetHeader className="mb-6">
          <SheetTitle>Tambah Transaksi</SheetTitle>

          <SheetDescription>
            Catat pemasukan, pengeluaran, transfer, atau investasi.
          </SheetDescription>
        </SheetHeader>

        <div className="px-4 pb-4">
          <TransactionForm
            accounts={accounts}
            categories={categories}
            suggestions={suggestions}
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
