'use server'

import { db } from "@/db";
import { activities, activityUser, events, eventUser, announcements, achievements, users } from "@/db/schema";
import { eq, and, or, sql, desc } from "drizzle-orm";

// 1. Fetch data for Student Dashboard (Optimized with Promise.all to run parallel queries)
export async function getStudentDashboardData(userId: string) {
  try {
    const [
      registered,
      memberships,
      latestAnnouncements,
      latestAchievements,
      openActivities
    ] = await Promise.all([
      // Fetch user event registrations
      db
        .select({
          id: eventUser.id,
          status: eventUser.status,
          event: {
            id: events.id,
            name: events.name,
            category: events.category,
            endDate: events.endDate,
          }
        })
        .from(eventUser)
        .innerJoin(events, eq(eventUser.eventId, events.id))
        .where(eq(eventUser.userId, userId)),

      // Fetch user Ormawa memberships
      db
        .select({
          id: activityUser.id,
          role: activityUser.activityRole,
          status: activityUser.status,
          organization: {
            id: activities.id,
            name: activities.name,
            orgType: activities.orgType,
            scopeName: activities.scopeName,
          }
        })
        .from(activityUser)
        .innerJoin(activities, eq(activityUser.activityId, activities.id))
        .where(eq(activityUser.userId, userId)),

      // Fetch latest announcements
      db
        .select({
          id: announcements.id,
          title: announcements.title,
          content: announcements.content,
          isUrgent: announcements.isUrgent,
          isPublic: announcements.isPublic,
          createdAt: announcements.createdAt,
          orgName: activities.name,
          scopeName: activities.scopeName,
        })
        .from(announcements)
        .innerJoin(activities, eq(announcements.activityId, activities.id))
        .where(
          or(
            eq(announcements.isPublic, true),
            sql`EXISTS (
              SELECT 1 FROM activity_user 
              WHERE user_id = ${userId} 
                AND activity_id = ${announcements.activityId} 
                AND status = 'approved'
            )`
          )
        )
        .orderBy(desc(announcements.createdAt))
        .limit(5),

      // Fetch latest achievements
      db
        .select({
          id: achievements.id,
          title: achievements.title,
          rank: achievements.rank,
          year: achievements.year,
          orgName: activities.name,
          scopeName: activities.scopeName,
          createdAt: achievements.createdAt,
        })
        .from(achievements)
        .innerJoin(activities, eq(achievements.activityId, activities.id))
        .orderBy(desc(achievements.createdAt))
        .limit(5),

      // Fetch active events (open for registration)
      db
        .select({
          id: events.id,
          name: events.name,
          category: events.category,
          orgName: activities.name,
          scopeName: activities.scopeName,
        })
        .from(events)
        .innerJoin(activities, eq(events.activityId, activities.id))
        .where(eq(events.status, "open"))
        .limit(6)
    ]);

    return {
      success: true,
      registered,
      memberships,
      announcements: latestAnnouncements,
      achievements: latestAchievements,
      openActivities,
    };
  } catch (error: any) {
    return {
      success: false,
      error: error.message,
      registered: [],
      memberships: [],
      announcements: [],
      achievements: [],
      openActivities: [],
    };
  }
}

// 2. Fetch data for Admin / Vice Dean Dashboard (Optimized with Promise.all to run parallel queries)
export async function getAdminDashboardData() {
  try {
    const [
      pendingProposals,
      totalUsersCount,
      totalEventsCount,
      openEventsCount
    ] = await Promise.all([
      // Fetch pending dean approvals
      db
        .select({
          id: events.id,
          name: events.name,
          category: events.category,
          orgName: activities.name,
          scopeName: activities.scopeName,
          createdAt: events.createdAt,
          creatorName: users.name,
        })
        .from(events)
        .innerJoin(activities, eq(events.activityId, activities.id))
        .leftJoin(users, eq(events.createdBy, users.id))
        .where(eq(events.status, "pending_dean"))
        .orderBy(desc(events.createdAt)),

      // Count stats
      db.select({ count: sql<number>`count(*)` }).from(users),
      db.select({ count: sql<number>`count(*)` }).from(events),
      db.select({ count: sql<number>`count(*)` }).from(events).where(eq(events.status, "open"))
    ]);

    return {
      success: true,
      pendingProposals,
      stats: {
        totalUsers: totalUsersCount[0]?.count || 0,
        totalActivities: totalEventsCount[0]?.count || 0,
        openRegistrations: openEventsCount[0]?.count || 0,
      }
    };
  } catch (error: any) {
    return {
      success: false,
      error: error.message,
      pendingProposals: [],
      stats: {
        totalUsers: 0,
        totalActivities: 0,
        openRegistrations: 0,
      }
    };
  }
}

