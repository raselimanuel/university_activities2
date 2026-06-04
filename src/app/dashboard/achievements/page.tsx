import { redirect } from "next/navigation";
import { getCurrentUser } from "@/app/actions/user";
import { getAchievements } from "@/app/actions/board";
import { db } from "@/db";
import { activities } from "@/db/schema";
import AchievementsClient from "./AchievementsClient";

export default async function AchievementsPage() {
  const session = await getCurrentUser();

  if (!session || !session.auth || !session.profile) {
    redirect("/login");
  }

  const { profile } = session;

  const [achievementsResult, activitiesList] = await Promise.all([
    getAchievements(),
    db
      .select({
        id: activities.id,
        name: activities.name,
      })
      .from(activities),
  ]);

  return (
    <AchievementsClient
      achievements={achievementsResult.achievements || []}
      activities={activitiesList}
      userRole={profile.role}
    />
  );
}
