import { redirect, notFound } from "next/navigation";
import { getCurrentUser } from "@/app/actions/user";
import { getOrganizationDetail } from "@/app/actions/activities";
import { db } from "@/db";
import { activityUser, announcements, achievements, events, users } from "@/db/schema";
import { eq, and, or, desc, sql } from "drizzle-orm";
import OrgDetailClient from "./OrgDetailClient";

interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function OrganizationDetailPage({ params }: PageProps) {
  const session = await getCurrentUser();

  if (!session || !session.auth || !session.profile) {
    redirect("/login");
  }

  const { id } = await params;
  const orgId = parseInt(id);

  if (isNaN(orgId)) {
    notFound();
  }

  const { profile } = session;
  const detailResultPromise = getOrganizationDetail(orgId);

  // Check current user's membership role and status in this organization
  const userMembershipPromise = db
    .select()
    .from(activityUser)
    .where(and(eq(activityUser.userId, profile.id), eq(activityUser.activityId, orgId)))
    .limit(1);

  // Fetch announcements for this organization (public OR for approved members/admins)
  const orgAnnouncementsPromise = db
    .select({
      id: announcements.id,
      title: announcements.title,
      content: announcements.content,
      isUrgent: announcements.isUrgent,
      isPublic: announcements.isPublic,
      createdAt: announcements.createdAt,
      creatorName: users.name,
    })
    .from(announcements)
    .leftJoin(users, eq(announcements.userId, users.id))
    .where(
      and(
        eq(announcements.activityId, orgId),
        or(
          eq(announcements.isPublic, true),
          sql`${profile.role} = 'admin' OR EXISTS (
            SELECT 1 FROM activity_user 
            WHERE user_id = ${profile.id} 
              AND activity_id = ${orgId} 
              AND status = 'approved'
          )`
        )
      )
    )
    .orderBy(desc(announcements.createdAt));

  // Fetch achievements for this organization
  const orgAchievementsPromise = db
    .select()
    .from(achievements)
    .where(eq(achievements.activityId, orgId))
    .orderBy(desc(achievements.achievementDate));

  // Fetch events for this organization (filter by role permissions in SQL)
  const orgEventsPromise = db
    .select()
    .from(events)
    .where(
      and(
        eq(events.activityId, orgId),
        sql`(${profile.role} = 'admin' OR EXISTS (
          SELECT 1 FROM activity_user 
          WHERE user_id = ${profile.id} 
            AND activity_id = ${orgId} 
            AND status = 'approved' 
            AND activity_role IN ('leader', 'manager')
        ) OR ${events.status} IN ('open', 'closed'))`
      )
    )
    .orderBy(desc(events.createdAt));

  const [detailResult, userMembership, orgAnnouncements, orgAchievements, orgEvents] = await Promise.all([
    detailResultPromise,
    userMembershipPromise,
    orgAnnouncementsPromise,
    orgAchievementsPromise,
    orgEventsPromise,
  ]);

  if (!detailResult.success || !detailResult.data) {
    notFound();
  }

  const { organization, creatorName, members, pendingRequests } = detailResult.data;

  const membershipRole = userMembership[0]?.activityRole || null; // 'leader', 'manager', 'member'
  const membershipStatus = userMembership[0]?.status || null; // 'pending', 'approved', 'rejected'

  return (
    <OrgDetailClient
      organization={organization}
      creatorName={creatorName}
      members={members}
      pendingRequests={pendingRequests}
      announcements={orgAnnouncements}
      achievements={orgAchievements}
      events={orgEvents}
      user={{
        id: profile.id,
        name: profile.name,
        role: profile.role,
        nim: profile.nim,
      }}
      membership={{
        role: membershipRole,
        status: membershipStatus,
      }}
    />
  );
}
