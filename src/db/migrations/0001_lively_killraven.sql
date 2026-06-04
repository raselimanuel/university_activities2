CREATE TABLE "event_user" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" uuid NOT NULL,
	"event_id" integer NOT NULL,
	"status" text DEFAULT 'pending' NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "events" (
	"id" serial PRIMARY KEY NOT NULL,
	"activity_id" integer NOT NULL,
	"name" text NOT NULL,
	"description" text NOT NULL,
	"category" text DEFAULT 'Program Kerja' NOT NULL,
	"location" text,
	"external_organizer" text,
	"quota" integer,
	"registered" integer DEFAULT 0 NOT NULL,
	"start_date" timestamp NOT NULL,
	"end_date" timestamp NOT NULL,
	"status" text DEFAULT 'draft' NOT NULL,
	"event_state" text DEFAULT 'Akan Datang' NOT NULL,
	"is_achieved" boolean DEFAULT false NOT NULL,
	"achievement_photo" text,
	"created_by" uuid,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "activities" ALTER COLUMN "description" DROP NOT NULL;--> statement-breakpoint
ALTER TABLE "activities" ALTER COLUMN "category" SET DEFAULT 'Akademik';--> statement-breakpoint
ALTER TABLE "activities" ALTER COLUMN "category" DROP NOT NULL;--> statement-breakpoint
ALTER TABLE "activities" ALTER COLUMN "quota" SET DEFAULT 0;--> statement-breakpoint
ALTER TABLE "activities" ALTER COLUMN "status" SET DEFAULT 'closed';--> statement-breakpoint
ALTER TABLE "event_user" ADD CONSTRAINT "event_user_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "event_user" ADD CONSTRAINT "event_user_event_id_events_id_fk" FOREIGN KEY ("event_id") REFERENCES "public"."events"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "events" ADD CONSTRAINT "events_activity_id_activities_id_fk" FOREIGN KEY ("activity_id") REFERENCES "public"."activities"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "events" ADD CONSTRAINT "events_created_by_users_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;