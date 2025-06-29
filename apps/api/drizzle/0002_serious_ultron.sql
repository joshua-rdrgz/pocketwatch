ALTER TABLE "subtask" ADD COLUMN "scheduled_start" timestamp;--> statement-breakpoint
ALTER TABLE "subtask" ADD COLUMN "scheduled_end" timestamp;--> statement-breakpoint
ALTER TABLE "task" DROP COLUMN "expected_duration";