import { redirect } from "next/navigation";
import { getCurrentUser } from "@/app/actions/user";
import { getAnnouncements } from "@/app/actions/board";
import { db } from "@/db";
import { activities } from "@/db/schema";
import AnnouncementsClient from "./AnnouncementsClient";

export default async function AnnouncementsPage() {
  const session = await getCurrentUser();

  if (!session || !session.auth || !session.profile) {
    redirect("/login");
  }

  const { profile } = session;

  const [announcementsResult, activitiesList] = await Promise.all([
    getAnnouncements(),
    db
      .select({
        id: activities.id,
        name: activities.name,
      })
      .from(activities),
  ]);

  return (
    <AnnouncementsClient
      announcements={announcementsResult.announcements || []}
      activities={activitiesList}
      userRole={profile.role}
    />
  );
}
