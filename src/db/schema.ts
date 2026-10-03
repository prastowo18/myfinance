import {
  boolean,
  date,
  numeric,
  pgEnum,
  pgTable,
  text,
  timestamp,
  uuid,
  varchar,
} from 'drizzle-orm/pg-core'

export const accountTypeEnum = pgEnum('account_type', [
  'bank',
  'ewallet',
  'cash',
  'credit_card',
  'investment',
])

export const categoryTypeEnum = pgEnum('category_type', ['expense', 'income'])

export const transactionTypeEnum = pgEnum('transaction_type', [
  'expense',
  'income',
  'transfer',
  'investment',
  'adjustment',
])

export const adjustmentDirectionEnum = pgEnum('adjustment_direction', [
  'increase',
  'decrease',
])

export const accounts = pgTable('accounts', {
  id: uuid('id').defaultRandom().primaryKey(),

  name: varchar('name', {
    length: 100,
  }).notNull(),

  type: accountTypeEnum('type').notNull(),

  initialBalance: numeric('initial_balance', {
    precision: 15,
    scale: 2,
    mode: 'number',
  })
    .notNull()
    .default(0),

  isActive: boolean('is_active').notNull().default(true),

  createdAt: timestamp('created_at', {
    withTimezone: true,
  })
    .notNull()
    .defaultNow(),

  updatedAt: timestamp('updated_at', {
    withTimezone: true,
  })
    .notNull()
    .defaultNow(),
})

export const categories = pgTable('categories', {
  id: uuid('id').defaultRandom().primaryKey(),

  name: varchar('name', {
    length: 100,
  }).notNull(),

  type: categoryTypeEnum('type').notNull(),

  isActive: boolean('is_active').notNull().default(true),

  createdAt: timestamp('created_at', {
    withTimezone: true,
  })
    .notNull()
    .defaultNow(),

  updatedAt: timestamp('updated_at', {
    withTimezone: true,
  })
    .notNull()
    .defaultNow(),
})

export const transactions = pgTable('transactions', {
  id: uuid('id').defaultRandom().primaryKey(),

  type: transactionTypeEnum('type').notNull(),

  title: text('title').notNull(),

  amount: numeric('amount', {
    precision: 15,
    scale: 2,
    mode: 'number',
  }).notNull(),

  accountId: uuid('account_id')
    .notNull()
    .references(() => accounts.id),

  categoryId: uuid('category_id').references(() => categories.id),

  targetAccountId: uuid('target_account_id').references(() => accounts.id),

  adjustmentDirection: adjustmentDirectionEnum('adjustment_direction'),

  transactionDate: date('transaction_date').notNull(),

  note: text('note'),

  createdAt: timestamp('created_at').defaultNow().notNull(),

  updatedAt: timestamp('updated_at').defaultNow().notNull(),
})

export const transactionFavorites = pgTable('transaction_favorites', {
  id: uuid('id').defaultRandom().primaryKey(),

  title: varchar('title', {
    length: 100,
  }).notNull(),

  type: transactionTypeEnum('type').notNull(),

  amount: numeric('amount', {
    precision: 15,
    scale: 2,
    mode: 'number',
  }).notNull(),

  accountId: uuid('account_id')
    .notNull()
    .references(() => accounts.id),

  categoryId: uuid('category_id').references(() => categories.id),

  targetAccountId: uuid('target_account_id').references(() => accounts.id),

  note: text('note'),

  isActive: boolean('is_active').notNull().default(true),

  createdAt: timestamp('created_at', {
    withTimezone: true,
  })
    .notNull()
    .defaultNow(),

  updatedAt: timestamp('updated_at', {
    withTimezone: true,
  })
    .notNull()
    .defaultNow(),
})
