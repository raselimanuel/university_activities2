import { redirect } from "next/navigation";
import { getCurrentUser } from "@/app/actions/user";
import { getEventsList } from "@/app/actions/activities";
import { db } from "@/db";
import { activities, activityUser } from "@/db/schema";
import { eq, and, sql } from "drizzle-orm";
import ActivitiesClient from "./ActivitiesClient";

export default async function ActivitiesPage() {
  const session = await getCurrentUser();

  if (!session || !session.auth || !session.profile) {
    redirect("/login");
  }

  const { profile } = session;

  const [result, managedOrgs] = await Promise.all([
    getEventsList(profile.role, profile.id),
    db
      .select({
        id: activities.id,
        name: activities.name,
      })
      .from(activityUser)
      .innerJoin(activities, eq(activityUser.activityId, activities.id))
      .where(
        and(
          eq(activityUser.userId, profile.id),
          eq(activityUser.status, "approved"),
          sql`${activityUser.activityRole} IN ('leader', 'manager')`
        )
      ),
  ]);

  return (
    <ActivitiesClient
      initialActivities={result.success ? result.events : []}
      managedOrganizations={managedOrgs}
      user={{
        id: profile.id,
        name: profile.name,
        role: profile.role,
      }}
    />
  );
}
