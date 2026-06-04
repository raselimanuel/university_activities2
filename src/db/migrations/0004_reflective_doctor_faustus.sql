CREATE INDEX "idx_activities_created_by" ON "activities" USING btree ("created_by");--> statement-breakpoint
CREATE INDEX "idx_activities_status" ON "activities" USING btree ("status");--> statement-breakpoint
CREATE INDEX "idx_activities_org_type" ON "activities" USING btree ("org_type");--> statement-breakpoint
CREATE INDEX "idx_events_created_by" ON "events" USING btree ("created_by");--> statement-breakpoint
CREATE INDEX "idx_users_role" ON "users" USING btree ("role");