import {
  bigint,
  boolean,
  date,
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
])

export const accounts = pgTable('accounts', {
  id: uuid('id').defaultRandom().primaryKey(),

  name: varchar('name', {
    length: 100,
  }).notNull(),

  type: accountTypeEnum('type').notNull(),

  initialBalance: bigint('initial_balance', {
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

  title: varchar('title', {
    length: 100,
  }).notNull(),

  amount: bigint('amount', {
    mode: 'number',
  }).notNull(),

  accountId: uuid('account_id')
    .notNull()
    .references(() => accounts.id),

  categoryId: uuid('category_id').references(() => categories.id),

  targetAccountId: uuid('target_account_id').references(() => accounts.id),

  transactionDate: date('transaction_date', {
    mode: 'string',
  }).notNull(),

  note: text('note'),

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

export const transactionFavorites = pgTable('transaction_favorites', {
  id: uuid('id').defaultRandom().primaryKey(),

  title: varchar('title', {
    length: 100,
  }).notNull(),

  type: transactionTypeEnum('type').notNull(),

  amount: bigint('amount', {
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
