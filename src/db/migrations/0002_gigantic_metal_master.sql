CREATE INDEX "idx_achievements_activity" ON "achievements" USING btree ("activity_id");--> statement-breakpoint
CREATE INDEX "idx_activity_user_user" ON "activity_user" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "idx_activity_user_activity" ON "activity_user" USING btree ("activity_id");--> statement-breakpoint
CREATE INDEX "idx_activity_user_status" ON "activity_user" USING btree ("status");--> statement-breakpoint
CREATE INDEX "idx_activity_user_composite" ON "activity_user" USING btree ("user_id","activity_id");--> statement-breakpoint
CREATE INDEX "idx_announcements_activity" ON "announcements" USING btree ("activity_id");--> statement-breakpoint
CREATE INDEX "idx_event_user_user" ON "event_user" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "idx_event_user_event" ON "event_user" USING btree ("event_id");--> statement-breakpoint
CREATE INDEX "idx_event_user_status" ON "event_user" USING btree ("status");--> statement-breakpoint
CREATE INDEX "idx_event_user_composite" ON "event_user" USING btree ("user_id","event_id");--> statement-breakpoint
CREATE INDEX "idx_events_activity" ON "events" USING btree ("activity_id");--> statement-breakpoint
CREATE INDEX "idx_events_status" ON "events" USING btree ("status");--> statement-breakpoint
CREATE INDEX "idx_events_state" ON "events" USING btree ("event_state");--> statement-breakpoint
CREATE INDEX "idx_notifications_user" ON "notifications" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "idx_notifications_is_read" ON "notifications" USING btree ("is_read");