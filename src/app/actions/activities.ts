'use server'

import { db } from "@/db";
import { activities, activityUser, events, eventUser, users, notifications, achievements } from "@/db/schema";
import { eq, and, sql, desc } from "drizzle-orm";
import { createClient } from "@/utils/supabase/server";
import { cookies } from "next/headers";
import { revalidatePath } from "next/cache";

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


// ==========================================
// A. ORMAWA (ORGANIZATION) ACTIONS
// ==========================================

// 1. Get all official organizations
export async function getOrganizationsList() {
  try {
    const result = await db
      .select()
      .from(activities)
      .orderBy(activities.name);
    return { success: true, organizations: result };
  } catch (error: any) {
    return { success: false, error: error.message, organizations: [] };
  }
}

// 2. Get detailed information for an organization
export async function getOrganizationDetail(id: number) {
  try {
    const orgPromise = db
      .select({
        organization: activities,
        creatorName: users.name,
      })
      .from(activities)
      .leftJoin(users, eq(activities.createdBy, users.id))
      .where(eq(activities.id, id))
      .limit(1);

    // Get approved members of this Ormawa
    const membersPromise = db
      .select({
        id: users.id,
        name: users.name,
        nim: users.nim,
        role: activityUser.activityRole,
        status: activityUser.status,
        membershipId: activityUser.id,
      })
      .from(activityUser)
      .innerJoin(users, eq(activityUser.userId, users.id))
      .where(and(eq(activityUser.activityId, id), eq(activityUser.status, "approved")));

    // Get pending joining requests (only visible to leaders/managers/admin)
    const pendingRequestsPromise = db
      .select({
        id: users.id,
        name: users.name,
        nim: users.nim,
        motivation: activityUser.motivation,
        membershipId: activityUser.id,
      })
      .from(activityUser)
      .innerJoin(users, eq(activityUser.userId, users.id))
      .where(and(eq(activityUser.activityId, id), eq(activityUser.status, "pending")));

    const [org, members, pendingRequests] = await Promise.all([
      orgPromise,
      membersPromise,
      pendingRequestsPromise,
    ]);

    if (org.length === 0) {
      return { success: false, error: "Organisasi tidak ditemukan" };
    }

    return { 
      success: true, 
      data: {
        organization: org[0].organization,
        creatorName: org[0].creatorName,
        members,
        pendingRequests
      } 
    };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

// 3. Apply to join an organization (membership)
export async function joinOrganization(activityId: number, motivation: string) {
  const cookieStore = await cookies();
  const supabase = createClient(cookieStore);
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) return { success: false, error: "Sesi Anda berakhir. Silakan login kembali." };

  try {
    // Check if organization exists and is open
    const orgResult = await db.select().from(activities).where(eq(activities.id, activityId)).limit(1);
    if (orgResult.length === 0) return { success: false, error: "Organisasi tidak ditemukan." };
    
    const org = orgResult[0];
    if (org.status !== "open") return { success: false, error: "Pendaftaran keanggotaan organisasi ini sedang ditutup." };
    if (org.registered >= org.quota) return { success: false, error: "Kuota keanggotaan organisasi ini sudah penuh." };

    // Check if already registered/member
    const existing = await db
      .select()
      .from(activityUser)
      .where(and(eq(activityUser.userId, user.id), eq(activityUser.activityId, activityId)))
      .limit(1);

    if (existing.length > 0) {
      return { success: false, error: "Anda sudah mengirimkan permohonan gabung untuk organisasi ini." };
    }

    await db.insert(activityUser).values({
      userId: user.id,
      activityId,
      motivation,
      activityRole: "member",
      status: "pending",
    });

    revalidatePath(`/dashboard/organizations/${activityId}`);
    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

// 4. Approve organization member request
export async function approveOrganizationMember(membershipId: number) {
  try {
    const membership = await db.select().from(activityUser).where(eq(activityUser.id, membershipId)).limit(1);
    if (membership.length === 0) return { success: false, error: "Permohonan tidak ditemukan." };

    const { activityId, userId } = membership[0];
    
    // Server-side authorization check
    await verifyUserRoleInOrganization(activityId, ["leader", "manager"]);

    const orgResult = await db.select().from(activities).where(eq(activities.id, activityId)).limit(1);
    if (orgResult.length === 0) return { success: false, error: "Organisasi tidak ditemukan." };

    const org = orgResult[0];
    if (org.registered >= org.quota) return { success: false, error: "Kuota anggota penuh." };

    // Approve, increment count, and notify in a single atomic transaction
    await db.transaction(async (tx) => {
      await tx
        .update(activityUser)
        .set({ status: "approved", updatedAt: new Date() })
        .where(eq(activityUser.id, membershipId));

      await tx
        .update(activities)
        .set({ registered: org.registered + 1, updatedAt: new Date() })
        .where(eq(activities.id, activityId));

      await tx.insert(notifications).values({
        userId,
        title: "Permohonan Gabung Diterima",
        message: `Selamat! Permohonan gabung Anda di organisasi "${org.name}" telah disetujui.`,
      });
    });

    revalidatePath(`/dashboard/organizations/${activityId}`);
    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

// 5. Reject organization member request
export async function rejectOrganizationMember(membershipId: number) {
  try {
    const membership = await db.select().from(activityUser).where(eq(activityUser.id, membershipId)).limit(1);
    if (membership.length === 0) return { success: false, error: "Permohonan tidak ditemukan." };

    const { activityId, userId } = membership[0];

    // Server-side authorization check
    await verifyUserRoleInOrganization(activityId, ["leader", "manager"]);

    const orgResult = await db.select().from(activities).where(eq(activities.id, activityId)).limit(1);
    const orgName = orgResult[0]?.name || "Organisasi";

    // Reject and notify in a single atomic transaction
    await db.transaction(async (tx) => {
      await tx
        .update(activityUser)
        .set({ status: "rejected", updatedAt: new Date() })
        .where(eq(activityUser.id, membershipId));

      await tx.insert(notifications).values({
        userId,
        title: "Permohonan Gabung Ditolak",
        message: `Maaf, permohonan gabung Anda di organisasi "${orgName}" ditolak oleh pengurus.`,
      });
    });

    revalidatePath(`/dashboard/organizations/${activityId}`);
    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

// 6. Update organization profile (by leader/manager)
export async function saveOrganizationProfile(formData: FormData) {
  const id = parseInt(formData.get("id") as string);
  const name = formData.get("name") as string;
  const description = formData.get("description") as string;
  const quota = parseInt(formData.get("quota") as string);
  const status = formData.get("status") as "open" | "closed";
  const whatsappLink = formData.get("whatsappLink") as string;

  if (isNaN(id) || !name || isNaN(quota)) {
    return { success: false, error: "Harap isi semua kolom wajib." };
  }

  try {
    // Server-side authorization check
    await verifyUserRoleInOrganization(id, ["leader", "manager"]);

    await db
      .update(activities)
      .set({
        name,
        description,
        quota,
        status,
        whatsappLink,
        updatedAt: new Date()
      })
      .where(eq(activities.id, id));

    revalidatePath(`/dashboard/organizations/${id}`);
    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}


// ==========================================
// B. EVENTS (KEGIATAN) ACTIONS
// ==========================================

// 1. Get list of events (filtered by role)
export async function getEventsList(role: string, userId: string) {
  try {
    let result;
    if (role === "student") {
      // Students see approved/open events
      result = await db
        .select({
          event: events,
          organizer: activities.name,
        })
        .from(events)
        .innerJoin(activities, eq(events.activityId, activities.id))
        .where(eq(events.status, "open"))
        .orderBy(desc(events.createdAt));
    } else {
      // Admin and Lecturers see everything
      result = await db
        .select({
          event: events,
          organizer: activities.name,
        })
        .from(events)
        .innerJoin(activities, eq(events.activityId, activities.id))
        .orderBy(desc(events.createdAt));
    }
    return { success: true, events: result };
  } catch (error: any) {
    return { success: false, error: error.message, events: [] };
  }
}

// 2. Get event detail
export async function getEventDetail(id: number) {
  try {
    const result = await db
      .select({
        event: events,
        organizer: activities,
        creatorName: users.name,
      })
      .from(events)
      .innerJoin(activities, eq(events.activityId, activities.id))
      .leftJoin(users, eq(events.createdBy, users.id))
      .where(eq(events.id, id))
      .limit(1);

    if (result.length === 0) {
      return { success: false, error: "Kegiatan tidak ditemukan" };
    }

    return { success: true, data: result[0] };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

// 3. Submit new event proposal (by Ormawa leaders/managers)
export async function submitNewEventProposal(formData: FormData) {
  const activityId = parseInt(formData.get("activityId") as string);
  const name = formData.get("name") as string;
  const description = formData.get("description") as string;
  const category = formData.get("category") as "Program Kerja" | "Delegasi/Lomba";
  const location = formData.get("location") as string;
  const externalOrganizer = formData.get("externalOrganizer") as string;
  const quotaInput = formData.get("quota") as string;
  const quota = quotaInput ? parseInt(quotaInput) : null;
  const startDateStr = formData.get("startDate") as string;
  const endDateStr = formData.get("endDate") as string;

  if (isNaN(activityId) || !name || !description || !startDateStr || !endDateStr) {
    return { success: false, error: "Harap isi semua kolom wajib." };
  }

  try {
    // Server-side authorization check
    const { user } = await verifyUserRoleInOrganization(activityId, ["leader", "manager"]);
    if (!user) return { success: false, error: "Profil pengguna tidak ditemukan." };

    await db.insert(events).values({
      activityId,
      name,
      description,
      category,
      location,
      externalOrganizer: category === "Delegasi/Lomba" ? externalOrganizer : null,
      quota: category === "Program Kerja" ? quota : null,
      startDate: new Date(startDateStr),
      endDate: new Date(endDateStr),
      status: "pending_advisor", // Default goes to Lecturer Review
      eventState: "Akan Datang",
      createdBy: user.id,
    });

    revalidatePath("/dashboard/activities");
    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

// 4. Approve event proposal (advisor / dean)
export async function approveEventProposal(id: number, currentRole: "lecturer" | "admin", comment?: string) {
  try {
    const eventResult = await db.select().from(events).where(eq(events.id, id)).limit(1);
    if (eventResult.length === 0) return { success: false, error: "Kegiatan tidak ditemukan." };

    const event = eventResult[0];

    // Check user role and verify they have the required role
    const cookieStore = await cookies();
    const supabase = createClient(cookieStore);
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return { success: false, error: "Sesi Anda berakhir. Silakan login kembali." };

    const [profile] = await db.select().from(users).where(eq(users.id, user.id)).limit(1);
    if (!profile || (profile.role !== "admin" && profile.role !== "lecturer") || profile.role !== currentRole) {
      return { success: false, error: "Akses ditolak. Peran tidak sesuai." };
    }

    let nextStatus: "pending_dean" | "open" = "pending_dean";
    let notificationTitle = "Proposal Kegiatan Disetujui Dosen Pembina";
    let notificationMsg = `Proposal kegiatan "${event.name}" telah disetujui Dosen Pembina dan dikirim ke Administrator.`;

    if (currentRole === "admin") {
      nextStatus = "open";
      notificationTitle = "Proposal Kegiatan Disetujui Administrator";
      notificationMsg = `Proposal kegiatan "${event.name}" telah disetujui Administrator. Pendaftaran kini dibuka!`;
    }

    // Run status update and notification inside a transaction
    await db.transaction(async (tx) => {
      await tx
        .update(events)
        .set({ status: nextStatus, updatedAt: new Date() })
        .where(eq(events.id, id));

      if (event.createdBy) {
        await tx.insert(notifications).values({
          userId: event.createdBy,
          title: notificationTitle,
          message: notificationMsg + (comment ? ` Catatan: "${comment}"` : ""),
        });
      }
    });

    revalidatePath(`/dashboard/activities/${id}`);
    revalidatePath("/dashboard");
    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

// 5. Reject event proposal
export async function rejectEventProposal(id: number, comment: string) {
  if (!comment || comment.trim() === "") {
    return { success: false, error: "Alasan penolakan wajib diisi." };
  }

  try {
    const eventResult = await db.select().from(events).where(eq(events.id, id)).limit(1);
    if (eventResult.length === 0) return { success: false, error: "Kegiatan tidak ditemukan." };

    const event = eventResult[0];

    // Check user role from Supabase Auth
    const cookieStore = await cookies();
    const supabase = createClient(cookieStore);
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return { success: false, error: "Sesi Anda berakhir." };

    const [profile] = await db.select().from(users).where(eq(users.id, user.id)).limit(1);
    if (!profile || (profile.role !== "admin" && profile.role !== "lecturer")) {
      return { success: false, error: "Anda tidak memiliki akses untuk melakukan tindakan ini." };
    }

    // Run rejection status update and notification in a transaction
    await db.transaction(async (tx) => {
      await tx
        .update(events)
        .set({ status: "rejected", updatedAt: new Date() })
        .where(eq(events.id, id));

      if (event.createdBy) {
        await tx.insert(notifications).values({
          userId: event.createdBy,
          title: "Proposal Kegiatan Ditolak",
          message: `Proposal kegiatan "${event.name}" ditolak. Alasan: "${comment}"`,
        });
      }
    });

    revalidatePath(`/dashboard/activities/${id}`);
    revalidatePath("/dashboard");
    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

// 6. Register student as participant in event
export async function registerForEvent(eventId: number) {
  const cookieStore = await cookies();
  const supabase = createClient(cookieStore);
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) return { success: false, error: "Sesi Anda berakhir. Silakan login kembali." };

  try {
    // Check if event is open and has quota
    const eventResult = await db.select().from(events).where(eq(events.id, eventId)).limit(1);
    if (eventResult.length === 0) return { success: false, error: "Kegiatan tidak ditemukan" };

    const event = eventResult[0];
    if (event.status !== "open") return { success: false, error: "Pendaftaran kegiatan ini sudah ditutup." };
    if (event.category !== "Program Kerja") return { success: false, error: "Event bertipe kompetisi/delegasi tidak dapat didaftar langsung." };
    if (event.quota && event.registered >= event.quota) return { success: false, error: "Kuota pendaftaran sudah penuh." };

    // Check if already registered
    const existing = await db
      .select()
      .from(eventUser)
      .where(and(eq(eventUser.userId, user.id), eq(eventUser.eventId, eventId)))
      .limit(1);

    if (existing.length > 0) {
      return { success: false, error: "Anda sudah mendaftar untuk kegiatan ini." };
    }

    // Register and increment count in a single atomic transaction
    await db.transaction(async (tx) => {
      await tx.insert(eventUser).values({
        userId: user.id,
        eventId,
        status: "approved", // auto-approved if there is quota
      });

      await tx
        .update(events)
        .set({ registered: event.registered + 1, updatedAt: new Date() })
        .where(eq(events.id, eventId));
    });

    revalidatePath(`/dashboard/activities/${eventId}`);
    revalidatePath("/dashboard");
    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

// 7. Mark event as completed & record achievement
export async function markEventAsAchievement(eventId: number) {
  try {
    const eventResult = await db.select().from(events).where(eq(events.id, eventId)).limit(1);
    if (eventResult.length === 0) return { success: false, error: "Kegiatan tidak ditemukan." };

    const event = eventResult[0];

    // Server-side authorization check (only leaders/managers of that organization or admins can mark completed)
    await verifyUserRoleInOrganization(event.activityId, ["leader", "manager"]);

    // Complete event and record achievement in a single transaction
    await db.transaction(async (tx) => {
      await tx
        .update(events)
        .set({ 
          eventState: "Selesai", 
          isAchieved: true,
          updatedAt: new Date() 
        })
        .where(eq(events.id, eventId));

      await tx.insert(achievements).values({
        activityId: event.activityId,
        title: `Prestasi: ${event.name}`,
        rank: event.category === "Delegasi/Lomba" ? "Delegasi Berhasil" : "Proker Sukses",
        year: new Date(event.endDate).getFullYear(),
        achievementDate: event.endDate,
        description: `Diselenggarakan/diikuti pada tanggal ${new Date(event.startDate).toLocaleDateString("id-ID")}. ${event.description}`,
      });
    });

    revalidatePath(`/dashboard/activities/${eventId}`);
    revalidatePath("/dashboard/achievements");
    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

