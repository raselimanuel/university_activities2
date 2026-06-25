import { redirect } from "next/navigation";
import { getCurrentUser } from "@/app/actions/user";
import DashboardShell from "@/components/DashboardShell";
import { db } from "@/db";
import { activityUser, activities } from "@/db/schema";
import { eq, and } from "drizzle-orm";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getCurrentUser();

  // If no auth user is logged in, redirect to login page
  if (!session || !session.auth) {
    redirect("/login");
  }

  // If user is authenticated but profile database record is missing
  if (!session.profile) {
    return (
      <div className="container min-vh-100 d-flex flex-column align-items-center justify-content-center text-center">
        <i className="bi bi-exclamation-octagon-fill text-danger display-1 mb-3"></i>
        <h3 className="fw-bold">Profil Akun Tidak Ditemukan</h3>
        <p className="text-secondary max-w-md">
          Sesi akun Anda aktif, tetapi profil mahasiswa belum terdaftar. Silakan hubungi administrator kemahasiswaan.
        </p>
        <a href="/login" className="btn btn-primary px-4 mt-2">Kembali ke Halaman Masuk</a>
      </div>
    );
  }

  // Fetch approved memberships to pass to DashboardShell for role display
  let approvedMemberships: any[] = [];
  try {
    approvedMemberships = await db
      .select({
        role: activityUser.activityRole,
        orgName: activities.name
      })
      .from(activityUser)
      .innerJoin(activities, eq(activityUser.activityId, activities.id))
      .where(
        and(
          eq(activityUser.userId, session.profile.id),
          eq(activityUser.status, "approved")
        )
      );
  } catch (error) {
    console.error("Error fetching memberships in layout:", error);
  }

  const userProfile = {
    ...session.profile,
    memberships: approvedMemberships
  };

  return (
    <DashboardShell user={userProfile}>
      {children}
    </DashboardShell>
  );
}
