'use server'

import { db } from "@/db";
import { announcements, achievements, activities, users, activityUser } from "@/db/schema";
import { eq, and, or, desc, sql } from "drizzle-orm";
import { createClient } from "@/utils/supabase/server";
import { cookies } from "next/headers";
import { revalidatePath } from "next/cache";
import { z } from "zod";

const announcementSchema = z.object({
  title: z.string().min(5, "Judul minimal 5 karakter"),
  content: z.string().min(10, "Isi pengumuman minimal 10 karakter"),
  isUrgent: z.boolean().default(false),
  isPublic: z.boolean().default(true),
  activityId: z.number().int(),
});

const achievementSchema = z.object({
  title: z.string().min(5, "Judul prestasi minimal 5 karakter"),
  rank: z.string().min(1, "Juara / Peringkat wajib diisi"),
  year: z.coerce.number().int().positive("Tahun harus positif"),
  description: z.string().optional(),
  activityId: z.number().int(),
});

// Helper to verify if user has authorization for organization-specific actions
async function verifyUserRoleInOrganization(activityId: number, allowedRoles: ("leader" | "manager" | "member")[] = ["leader", "manager"]) {
  const cookieStore = await cookies();
  const supabase = createClient(cookieStore);
  const { data: { user: authUser } } = await supabase.auth.getUser();

  if (!authUser) {
    throw new Error("Sesi Anda berakhir. Silakan login kembali.");
  }

  // 1. Check if user is system admin
  const [profile] = await db.select().from(users).where(eq(users.id, authUser.id)).limit(1);
  if (profile && profile.role === "admin") {
    return { user: profile, membership: null };
  }

  // 2. Check if user has an approved membership with an allowed role
  const [membership] = await db
    .select()
    .from(activityUser)
    .where(
      and(
        eq(activityUser.userId, authUser.id),
        eq(activityUser.activityId, activityId),
        eq(activityUser.status, "approved")
      )
    )
    .limit(1);

  if (!membership || !allowedRoles.includes(membership.activityRole as any)) {
    throw new Error("Anda tidak memiliki akses untuk melakukan tindakan ini.");
  }

  return { user: profile, membership };
}

// 1. Create announcement (by Ormawa leaders/managers)
export async function createAnnouncement(formData: FormData) {
  const cookieStore = await cookies();
  const supabase = createClient(cookieStore);
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { success: false, error: "Tidak diizinkan. Silakan login." };

  const title = formData.get("title") as string;
  const content = formData.get("content") as string;
  const isUrgent = formData.get("isUrgent") === "true";
  const isPublic = formData.get("isPublic") === "true";
  const activityId = parseInt(formData.get("activityId") as string);

  const validation = announcementSchema.safeParse({ title, content, isUrgent, isPublic, activityId });
  if (!validation.success) {
    return { success: false, error: "Form pengisian tidak valid." };
  }

  try {
    // Server-side authorization check
    await verifyUserRoleInOrganization(activityId, ["leader", "manager"]);

    await db.insert(announcements).values({
      title,
      content,
      isUrgent,
      isPublic,
      activityId,
      userId: user.id,
    });

    revalidatePath("/dashboard/announcements");
    revalidatePath("/dashboard");
    return { success: true };
  } catch (err: any) {
    return { success: false, error: err.message };
  }
}

// 2. Create achievement (by Ormawa leaders/managers)
export async function createAchievement(formData: FormData) {
  const title = formData.get("title") as string;
  const rank = formData.get("rank") as string;
  const year = parseInt(formData.get("year") as string);
  const description = formData.get("description") as string;
  const activityId = parseInt(formData.get("activityId") as string);

  const validation = achievementSchema.safeParse({ title, rank, year, description, activityId });
  if (!validation.success) {
    return { success: false, error: "Form pengisian tidak valid." };
  }

  try {
    // Server-side authorization check (only managers/leaders or admins)
    await verifyUserRoleInOrganization(activityId, ["leader", "manager"]);

    await db.insert(achievements).values({
      title,
      rank,
      year,
      description,
      activityId,
    });

    revalidatePath("/dashboard/achievements");
    revalidatePath("/dashboard");
    return { success: true };
  } catch (err: any) {
    return { success: false, error: err.message };
  }
}

// 3. Get announcements list
export async function getAnnouncements() {
  const cookieStore = await cookies();
  const supabase = createClient(cookieStore);
  const { data: { user: authUser } } = await supabase.auth.getUser();

  try {
    let list;
    if (!authUser) {
      // If not logged in, only return public
      list = await db
        .select({
          id: announcements.id,
          title: announcements.title,
          content: announcements.content,
          isUrgent: announcements.isUrgent,
          isPublic: announcements.isPublic,
          createdAt: announcements.createdAt,
          activityName: activities.name,
          scopeName: activities.scopeName,
        })
        .from(announcements)
        .innerJoin(activities, eq(announcements.activityId, activities.id))
        .where(eq(announcements.isPublic, true))
        .orderBy(desc(announcements.createdAt));
    } else {
      // Get user profile role
      const [profile] = await db.select().from(users).where(eq(users.id, authUser.id)).limit(1);

      if (profile && profile.role === "admin") {
        // Admins see everything
        list = await db
          .select({
            id: announcements.id,
            title: announcements.title,
            content: announcements.content,
            isUrgent: announcements.isUrgent,
            isPublic: announcements.isPublic,
            createdAt: announcements.createdAt,
            activityName: activities.name,
            scopeName: activities.scopeName,
          })
          .from(announcements)
          .innerJoin(activities, eq(announcements.activityId, activities.id))
          .orderBy(desc(announcements.createdAt));
      } else {
        // Logged in user: public announcements OR user is an approved member of the organization
        list = await db
          .select({
            id: announcements.id,
            title: announcements.title,
            content: announcements.content,
            isUrgent: announcements.isUrgent,
            isPublic: announcements.isPublic,
            createdAt: announcements.createdAt,
            activityName: activities.name,
            scopeName: activities.scopeName,
          })
          .from(announcements)
          .innerJoin(activities, eq(announcements.activityId, activities.id))
          .where(
            or(
              eq(announcements.isPublic, true),
              sql`EXISTS (
                SELECT 1 FROM activity_user 
                WHERE user_id = ${authUser.id} 
                  AND activity_id = ${announcements.activityId} 
                  AND status = 'approved'
              )`
            )
          )
          .orderBy(desc(announcements.createdAt));
      }
    }
    return { success: true, announcements: list };
  } catch (err: any) {
    return { success: false, error: err.message, announcements: [] };
  }
}

// 4. Get achievements list
export async function getAchievements() {
  try {
    const list = await db
      .select({
        id: achievements.id,
        title: achievements.title,
        rank: achievements.rank,
        year: achievements.year,
        description: achievements.description,
        createdAt: achievements.createdAt,
        activityName: activities.name,
        scopeName: activities.scopeName,
      })
      .from(achievements)
      .innerJoin(activities, eq(achievements.activityId, activities.id))
      .orderBy(desc(achievements.createdAt));
    return { success: true, achievements: list };
  } catch (err: any) {
    return { success: false, error: err.message, achievements: [] };
  }
}
