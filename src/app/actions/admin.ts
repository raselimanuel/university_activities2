'use server'

import { db } from "@/db";
import { achievements, activities, activityUser, announcements, eventUser, events, users, notifications } from "@/db/schema";
import { eq, and, or, sql, inArray, gte, lte } from "drizzle-orm";
import { createClient } from "@/utils/supabase/server";
import { cookies } from "next/headers";
import { revalidatePath } from "next/cache";

// Helper to verify if the user has admin role
async function verifyAdmin() {
  const cookieStore = await cookies();
  const supabase = createClient(cookieStore);
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    throw new Error("Sesi Anda berakhir. Silakan login kembali.");
  }

  const [profile] = await db.select().from(users).where(eq(users.id, user.id)).limit(1);
  if (!profile || profile.role !== "admin") {
    throw new Error("Akses ditolak. Anda tidak memiliki izin Administrator.");
  }
  return profile;
}

// 1. Get all activities (organizations) with details
export async function adminGetActivities() {
  try {
    await verifyAdmin();
    const result = await db
      .select({
        id: activities.id,
        name: activities.name,
        description: activities.description,
        category: activities.category,
        quota: activities.quota,
        status: activities.status,
        registered: activities.registered,
        orgType: activities.orgType,
        organizationLevel: activities.organizationLevel,
        scopeName: activities.scopeName,
        whatsappLink: activities.whatsappLink,
        imageUrl: activities.imageUrl,
        registrationStart: activities.registrationStart,
        registrationEnd: activities.registrationEnd,
      })
      .from(activities)
      .orderBy(activities.name);

    return { success: true, activities: result };
  } catch (error: any) {
    return { success: false, error: error.message, activities: [] };
  }
}

// 2. Create new activity (organization)
export async function adminCreateActivity(formData: FormData) {
  try {
    await verifyAdmin();

    const name = formData.get("name") as string;
    const description = formData.get("description") as string;
    const category = formData.get("category") as string;
    const quota = parseInt(formData.get("quota") as string);
    const status = (formData.get("status") as "open" | "closed") || "open";
    const orgType = formData.get("orgType") as any;
    const organizationLevel = formData.get("organizationLevel") as string;
    const scopeName = formData.get("scopeName") as string;
    const whatsappLink = formData.get("whatsappLink") as string;
    const imageUrl = formData.get("imageUrl") as string;
    const registrationStartStr = formData.get("registrationStart") as string;
    const registrationEndStr = formData.get("registrationEnd") as string;

    if (!name || isNaN(quota)) {
      return { success: false, error: "Nama dan kuota wajib diisi." };
    }

    await db.insert(activities).values({
      name,
      description: description || null,
      category: category || "Akademik",
      quota,
      status,
      orgType: orgType || "UKM",
      organizationLevel: organizationLevel || "Universitas",
      scopeName: scopeName || null,
      whatsappLink: whatsappLink || null,
      imageUrl: imageUrl || null,
      registrationStart: registrationStartStr ? new Date(registrationStartStr) : null,
      registrationEnd: registrationEndStr ? new Date(registrationEndStr) : null,
      registered: 0,
    });

    revalidatePath("/dashboard");
    revalidatePath("/dashboard/organizations");
    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

// 3. Update existing activity (organization)
export async function adminUpdateActivity(formData: FormData) {
  try {
    await verifyAdmin();

    const id = parseInt(formData.get("id") as string);
    const name = formData.get("name") as string;
    const description = formData.get("description") as string;
    const category = formData.get("category") as string;
    const quota = parseInt(formData.get("quota") as string);
    const status = (formData.get("status") as "open" | "closed") || "open";
    const orgType = formData.get("orgType") as any;
    const organizationLevel = formData.get("organizationLevel") as string;
    const scopeName = formData.get("scopeName") as string;
    const whatsappLink = formData.get("whatsappLink") as string;
    const imageUrl = formData.get("imageUrl") as string;
    const registrationStartStr = formData.get("registrationStart") as string;
    const registrationEndStr = formData.get("registrationEnd") as string;

    if (isNaN(id) || !name || isNaN(quota)) {
      return { success: false, error: "ID, Nama, dan kuota wajib diisi." };
    }

    await db
      .update(activities)
      .set({
        name,
        description: description || null,
        category: category || "Akademik",
        quota,
        status,
        orgType: orgType || "UKM",
        organizationLevel: organizationLevel || "Universitas",
        scopeName: scopeName || null,
        whatsappLink: whatsappLink || null,
        imageUrl: imageUrl || null,
        registrationStart: registrationStartStr ? new Date(registrationStartStr) : null,
        registrationEnd: registrationEndStr ? new Date(registrationEndStr) : null,
        updatedAt: new Date(),
      })
      .where(eq(activities.id, id));

    revalidatePath("/dashboard");
    revalidatePath(`/dashboard/organizations/${id}`);
    revalidatePath("/dashboard/organizations");
    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

// 4. Delete activity (organization)
export async function adminDeleteActivity(id: number) {
  try {
    await verifyAdmin();

    if (!Number.isInteger(id) || id <= 0) {
      return { success: false, error: "ID ORMAWA tidak valid." };
    }

    const existing = await db
      .select({ id: activities.id })
      .from(activities)
      .where(eq(activities.id, id))
      .limit(1);

    if (existing.length === 0) {
      return { success: false, error: "ORMAWA tidak ditemukan." };
    }

    await db.transaction(async (tx) => {
      const relatedEvents = await tx
        .select({ id: events.id })
        .from(events)
        .where(eq(events.activityId, id));

      if (relatedEvents.length > 0) {
        await tx
          .delete(eventUser)
          .where(inArray(eventUser.eventId, relatedEvents.map((event) => event.id)));
      }

      await tx.delete(activityUser).where(eq(activityUser.activityId, id));
      await tx.delete(announcements).where(eq(announcements.activityId, id));
      await tx.delete(achievements).where(eq(achievements.activityId, id));
      await tx.delete(events).where(eq(events.activityId, id));
      await tx.delete(activities).where(eq(activities.id, id));
    });

    revalidatePath("/dashboard");
    revalidatePath("/dashboard/organizations");
    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

// 5. Toggle activity (organization) open/closed status
export async function adminToggleActivityStatus(id: number) {
  try {
    await verifyAdmin();

    const result = await db.select().from(activities).where(eq(activities.id, id)).limit(1);
    if (result.length === 0) {
      return { success: false, error: "Organisasi tidak ditemukan." };
    }

    const currentStatus = result[0].status;
    const nextStatus = currentStatus === "open" ? "closed" : "open";

    await db
      .update(activities)
      .set({ status: nextStatus, updatedAt: new Date() })
      .where(eq(activities.id, id));

    revalidatePath("/dashboard");
    revalidatePath("/dashboard/organizations");
    return { success: true, nextStatus };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

// 6. Search student users (role = student)
export async function adminSearchStudents(query: string) {
  try {
    await verifyAdmin();

    if (!query || query.trim().length < 3) {
      return { success: true, students: [] };
    }

    const cleanQuery = `%${query.trim()}%`;
    const result = await db
      .select({
        id: users.id,
        name: users.name,
        nim: users.nim,
      })
      .from(users)
      .where(
        and(
          eq(users.role, "student"),
          or(
            sql`${users.name} ILIKE ${cleanQuery}`,
            sql`${users.nim} ILIKE ${cleanQuery}`
          )
        )
      )
      .limit(5);

    return { success: true, students: result };
  } catch (error: any) {
    return { success: false, error: error.message, students: [] };
  }
}

// 7. Assign student as organization leader (Kingmaker logic)
export async function adminAssignLeader(activityId: number, studentId: string) {
  try {
    await verifyAdmin();

    const studentResult = await db.select().from(users).where(eq(users.id, studentId)).limit(1);
    if (studentResult.length === 0) {
      return { success: false, error: "Mahasiswa tidak ditemukan." };
    }
    const student = studentResult[0];

    const orgResult = await db.select().from(activities).where(eq(activities.id, activityId)).limit(1);
    if (orgResult.length === 0) {
      return { success: false, error: "Organisasi tidak ditemukan." };
    }
    const org = orgResult[0];

    await db.transaction(async (tx) => {
      // 1. Demote any current approved leaders of this organization to member
      await tx
        .update(activityUser)
        .set({ activityRole: "member", updatedAt: new Date() })
        .where(
          and(
            eq(activityUser.activityId, activityId),
            eq(activityUser.activityRole, "leader"),
            eq(activityUser.status, "approved")
          )
        );

      // 2. Check if the target student already has a membership entry
      const existing = await tx
        .select()
        .from(activityUser)
        .where(
          and(
            eq(activityUser.userId, studentId),
            eq(activityUser.activityId, activityId)
          )
        )
        .limit(1);

      if (existing.length > 0) {
        // Update role to leader and set status to approved
        await tx
          .update(activityUser)
          .set({
            activityRole: "leader",
            status: "approved",
            updatedAt: new Date(),
          })
          .where(eq(activityUser.id, existing[0].id));

        // If they weren't approved before, increment the registered count of the organization
        if (existing[0].status !== "approved") {
          await tx
            .update(activities)
            .set({
              registered: org.registered + 1,
              updatedAt: new Date(),
            })
            .where(eq(activities.id, activityId));
        }
      } else {
        // Create new membership as leader and approved
        await tx.insert(activityUser).values({
          userId: studentId,
          activityId,
          activityRole: "leader",
          status: "approved",
        });

        // Increment registered count
        await tx
          .update(activities)
          .set({
            registered: org.registered + 1,
            updatedAt: new Date(),
          })
          .where(eq(activities.id, activityId));
      }

      // 3. Create notification for the student
      await tx.insert(notifications).values({
        userId: studentId,
        title: "Penunjukan Ketua Baru",
        message: `Selamat! Anda telah ditunjuk sebagai Ketua di organisasi "${org.name}" oleh Administrator.`,
      });
    });

    revalidatePath("/dashboard");
    revalidatePath(`/dashboard/organizations/${activityId}`);
    return { success: true, studentName: student.name, orgName: org.name };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

// 8. Get export data for global report (with optional date range filter and report type)
export async function adminGetExportData(
  startDate?: string, 
  endDate?: string,
  reportType: "membership" | "events" | "all" = "all"
) {
  try {
    await verifyAdmin();

    const membershipData: any[] = [];
    const eventData: any[] = [];

    // --- MEMBERSHIP DATA (Keanggotaan ORMAWA) ---
    if (reportType === "membership" || reportType === "all") {
      const joinConditions: any[] = [
        eq(activityUser.userId, users.id),
        eq(activityUser.status, "approved"),
      ];

      if (startDate) {
        joinConditions.push(gte(activityUser.createdAt, new Date(startDate)));
      }
      if (endDate) {
        const endOfDay = new Date(endDate);
        endOfDay.setHours(23, 59, 59, 999);
        joinConditions.push(lte(activityUser.createdAt, endOfDay));
      }

      const result = await db
        .select({
          nim: users.nim,
          name: users.name,
          orgName: activities.name,
          role: activityUser.activityRole,
          joinedAt: activityUser.createdAt,
        })
        .from(users)
        .leftJoin(activityUser, and(...joinConditions))
        .leftJoin(activities, eq(activityUser.activityId, activities.id))
        .where(eq(users.role, "student"))
        .orderBy(users.nim);

      result.forEach(row => {
        membershipData.push({
          type: "Keanggotaan",
          nim: row.nim,
          name: row.name,
          orgName: row.orgName || "Tidak Ada",
          eventName: "-",
          eventCategory: "-",
          role: row.role ? row.role.charAt(0).toUpperCase() + row.role.slice(1) : "-",
          eventStatus: "-",
          date: row.joinedAt ? row.joinedAt.toISOString() : null,
          startDate: null,
          endDate: null,
        });
      });
    }

    // --- EVENT DATA (Kegiatan / Program Kerja / Delegasi Lomba) ---
    if (reportType === "events" || reportType === "all") {
      const eventJoinConditions: any[] = [
        eq(eventUser.userId, users.id),
        eq(eventUser.status, "approved"),
      ];

      if (startDate) {
        eventJoinConditions.push(gte(eventUser.createdAt, new Date(startDate)));
      }
      if (endDate) {
        const endOfDay = new Date(endDate);
        endOfDay.setHours(23, 59, 59, 999);
        eventJoinConditions.push(lte(eventUser.createdAt, endOfDay));
      }

      const eventResult = await db
        .select({
          nim: users.nim,
          name: users.name,
          eventName: events.name,
          eventCategory: events.category,
          eventStartDate: events.startDate,
          eventEndDate: events.endDate,
          eventState: events.eventState,
          orgName: activities.name,
          registeredAt: eventUser.createdAt,
          participantStatus: eventUser.status,
        })
        .from(users)
        .innerJoin(eventUser, and(...eventJoinConditions))
        .innerJoin(events, eq(eventUser.eventId, events.id))
        .innerJoin(activities, eq(events.activityId, activities.id))
        .where(eq(users.role, "student"))
        .orderBy(users.nim);

      eventResult.forEach(row => {
        eventData.push({
          type: "Kegiatan",
          nim: row.nim,
          name: row.name,
          orgName: row.orgName || "-",
          eventName: row.eventName || "-",
          eventCategory: row.eventCategory || "-",
          role: "-",
          eventStatus: row.eventState || "-",
          date: row.registeredAt ? row.registeredAt.toISOString() : null,
          startDate: row.eventStartDate ? row.eventStartDate.toISOString() : null,
          endDate: row.eventEndDate ? row.eventEndDate.toISOString() : null,
        });
      });
    }

    // Combine results
    const combined = [...membershipData, ...eventData];

    return { success: true, data: combined, reportType };
  } catch (error: any) {
    return { success: false, error: error.message, data: [], reportType };
  }
}
