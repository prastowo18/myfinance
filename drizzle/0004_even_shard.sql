CREATE TYPE "public"."adjustment_direction" AS ENUM('increase', 'decrease');--> statement-breakpoint
ALTER TYPE "public"."transaction_type" ADD VALUE 'adjustment';--> statement-breakpoint
ALTER TABLE "transactions" ALTER COLUMN "title" SET DATA TYPE text;--> statement-breakpoint
ALTER TABLE "transactions" ALTER COLUMN "created_at" SET DATA TYPE timestamp;--> statement-breakpoint
ALTER TABLE "transactions" ALTER COLUMN "created_at" SET DEFAULT now();--> statement-breakpoint
ALTER TABLE "transactions" ALTER COLUMN "updated_at" SET DATA TYPE timestamp;--> statement-breakpoint
ALTER TABLE "transactions" ALTER COLUMN "updated_at" SET DEFAULT now();--> statement-breakpoint
ALTER TABLE "transactions" ADD COLUMN "adjustment_direction" "adjustment_direction";