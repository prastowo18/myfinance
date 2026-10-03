ALTER TABLE "accounts" ALTER COLUMN "initial_balance" SET DATA TYPE numeric(15, 2);--> statement-breakpoint
ALTER TABLE "transaction_favorites" ALTER COLUMN "amount" SET DATA TYPE numeric(15, 2);--> statement-breakpoint
ALTER TABLE "transactions" ALTER COLUMN "amount" SET DATA TYPE numeric(15, 2);