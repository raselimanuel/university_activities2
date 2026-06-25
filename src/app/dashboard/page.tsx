import Link from "next/link";
import { redirect } from "next/navigation";
import { getCurrentUser } from "@/app/actions/user";
import {
  getStudentDashboardData,
  getAdminDashboardData
} from "@/app/actions/dashboard";
import { getFacultyStyle } from "@/utils/faculty";
import PremiumIcon from "@/components/PremiumIcon";
import AdminDashboardClient from "@/components/AdminDashboardClient";
import { adminGetActivities } from "@/app/actions/admin";

export default async function DashboardPage() {
  const session = await getCurrentUser();

  if (!session || !session.auth || !session.profile) {
    redirect("/login");
  }

  const { profile } = session;

  if (profile.role === "admin") {
    return <AdminDashboard profile={profile} />;
  } else {
    return <StudentDashboard profile={profile} />;
  }
}

// ==========================================
// 1. STUDENT DASHBOARD VIEW
// ==========================================
async function StudentDashboard({ profile }: { profile: any }) {
  const data = await getStudentDashboardData(profile.id);
  const facultyStyle = getFacultyStyle(profile.faculty);

  const approvedMemberships = data.memberships.filter((m: any) => m.status === "approved");
  const leaderOrManager = approvedMemberships.find((m: any) => m.role === "leader" || m.role === "manager");
  const roleText = leaderOrManager 
    ? `${leaderOrManager.role === "leader" ? "Ketua" : "Pengurus"} ${leaderOrManager.organization.name}`
    : "Mahasiswa";

  return (
    <div className="container-fluid p-0">
      
      {/* Welcome Banner */}
      <div className="card border-0 rounded-4 text-white p-4 p-md-5 mb-4 shadow-sm"
        style={{
          background: facultyStyle.gradient,
        }}
      >
        <div className="row align-items-center">
          <div className="col-md-8">
            <div className="d-flex align-items-center gap-2 mb-2">
              <span className="badge bg-white bg-opacity-20 text-white border border-white border-opacity-30 px-3 py-1 rounded-pill small fw-semibold text-uppercase" style={{ fontSize: '0.75rem' }}>
                {roleText}
              </span>
            </div>
            <h1 className="fw-extrabold text-white mb-2">Halo, {profile.name}</h1>
            <p className="lead mb-0 text-white-50 small">
              Temukan organisasi, kegiatan, dan kabar ORMAWA yang relevan untuk {profile.faculty || "Universitas Sam Ratulangi"}.
            </p>
          </div>
          <div className="col-md-4 text-md-end mt-3 mt-md-0">
            <Link href="/dashboard/activities" className="btn btn-light fw-bold px-4 py-2 hover-lift rounded-pill" style={{ color: facultyStyle.primary }}>
              <i className="bi bi-compass-fill me-2"></i> Lihat Kegiatan
            </Link>
          </div>
        </div>
      </div>

      {/* Student Ormawa Membership quick stats */}
      {data.memberships.length > 0 && (
        <div className="card border-0 rounded-4 mb-4 card-glass-static">
          <div className="card-header bg-transparent border-0 pt-4 px-4 pb-0">
            <h6 className="fw-bold text-secondary uppercase small mb-0">Keanggotaan ORMAWA Saya</h6>
          </div>
          <div className="card-body px-4 pb-4">
            <div className="row g-3">
              {data.memberships.map((mbr) => {
                const orgStyle = getFacultyStyle(mbr.organization.scopeName || mbr.organization.name);
                return (
                  <div key={mbr.id} className="col-md-4">
                    <div className="p-3 border rounded-4 bg-light d-flex justify-content-between align-items-center border-start border-4" style={{ borderLeftColor: orgStyle.primary }}>
                      <div>
                        <strong className="text-dark small d-block">{mbr.organization.name}</strong>
                        <span className="text-muted small d-block">{mbr.organization.orgType}</span>
                      </div>
                      {mbr.status === "approved" ? (
                        <span className="badge bg-success-subtle text-success border border-success-subtle px-2.5 py-1 text-capitalize small">
                          {mbr.role}
                        </span>
                      ) : (
                        <span className="badge bg-warning-subtle text-warning border border-warning-subtle px-2.5 py-1 small">
                          Menunggu
                        </span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      <div className="row g-4">
        
        {/* Left Side: Registered Activities & Announcements */}
        <div className="col-xl-8">
          
          {/* Registered Activities */}
          <div className="card border-0 rounded-4 mb-4 card-glass-static">
            <div className="card-header bg-transparent border-0 pt-4 px-4 pb-0">
              <h5 className="fw-bold text-dark mb-0">Kegiatan yang Saya Ikuti</h5>
            </div>
            <div className="card-body px-4 pb-4">
              {data.registered.length === 0 ? (
                <div className="text-center py-5">
                  <i className="bi bi-calendar2-x display-4 text-secondary opacity-50 mb-3"></i>
                  <p className="text-secondary small mb-0">Anda belum mengikuti kegiatan apa pun.</p>
                  <Link href="/dashboard/activities" className="btn btn-outline-primary btn-sm px-3 mt-3">Cari Kegiatan</Link>
                </div>
              ) : (
                <div className="table-responsive">
                  <table className="table table-hover align-middle no-line-table">
                    <thead>
                      <tr className="text-secondary small">
                        <th>Nama Kegiatan</th>
                        <th>Kategori</th>
                        <th>Status Keikutsertaan</th>
                        <th className="text-end">Aksi</th>
                      </tr>
                    </thead>
                    <tbody>
                      {data.registered.map((reg) => (
                        <tr key={reg.id}>
                          <td>
                            <span className="fw-semibold text-dark">{reg.event.name}</span>
                          </td>
                          <td>
                            <span className="badge bg-light text-secondary">{reg.event.category}</span>
                          </td>
                          <td>
                            {reg.status === "approved" ? (
                              <span className="badge bg-success-subtle text-success border border-success-subtle px-2 py-1">Terdaftar</span>
                            ) : reg.status === "rejected" ? (
                              <span className="badge bg-danger-subtle text-danger border border-danger-subtle px-2 py-1">Ditolak</span>
                            ) : (
                              <span className="badge bg-warning-subtle text-warning border border-warning-subtle px-2 py-1">Menunggu</span>
                            )}
                          </td>
                          <td className="text-end">
                            <Link href={`/dashboard/activities/${reg.event.id}`} className="btn btn-sm btn-outline-secondary px-3">
                              Lihat
                            </Link>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>

          {/* Announcements Section */}
          <div className="card border-0 rounded-4 card-glass-static">
            <div className="card-header bg-transparent border-0 pt-4 px-4 pb-0 d-flex justify-content-between align-items-center">
              <h5 className="fw-bold text-dark mb-0">Kabar Terbaru</h5>
              <Link href="/dashboard/announcements" className="text-primary text-decoration-none small fw-semibold">Lihat semua</Link>
            </div>
            <div className="card-body px-4 pb-4">
              {data.announcements.length === 0 ? (
                <p className="text-secondary text-center py-4 small mb-0">Belum ada kabar baru.</p>
              ) : (
                <div className="d-flex flex-column gap-3">
                  {data.announcements.map((ann) => {
                    const orgStyle = getFacultyStyle(ann.scopeName || ann.orgName);
                    return (
                      <div key={ann.id} className="p-3 rounded-3 border-start border-4 bg-light" style={{ borderLeftColor: orgStyle.primary }}>
                        <div className="d-flex justify-content-between mb-1">
                          <h6 className="fw-bold mb-0 text-dark">{ann.title}</h6>
                          <span className="text-muted small">{new Date(ann.createdAt).toLocaleDateString("id-ID")}</span>
                        </div>
                        <span className="text-muted small d-block mb-2">Dari: <strong style={{ color: orgStyle.primary }}>{ann.orgName}</strong></span>
                        <p className="text-secondary small mb-0">{ann.content}</p>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>

        </div>

        {/* Right Side: Active Events & Achievements */}
        <div className="col-xl-4">
          
          {/* Open Activities */}
          <div className="card border-0 rounded-4 mb-4 card-glass-static">
            <div className="card-header bg-transparent border-0 pt-4 px-4 pb-0">
              <h5 className="fw-bold text-dark mb-0">Kegiatan yang Dibuka</h5>
            </div>
            <div className="card-body px-4 pb-4">
              {data.openActivities.length === 0 ? (
                <p className="text-secondary small text-center py-4 mb-0">Belum ada kegiatan yang sedang membuka pendaftaran.</p>
              ) : (
                <div className="d-flex flex-column gap-3">
                  {data.openActivities.map((act) => {
                    const orgStyle = getFacultyStyle(act.scopeName || act.name);
                    return (
                      <div key={act.id} className="d-flex align-items-center gap-3 p-2 rounded-3 hover-lift border bg-white">
                        <PremiumIcon 
                          icon={orgStyle.icon}
                          primaryColor={orgStyle.primary}
                          lightBgColor={orgStyle.lightBg}
                          size={42}
                        />
                        <div className="overflow-hidden flex-grow-1">
                          <h6 className="fw-bold text-dark mb-0 text-truncate">{act.name}</h6>
                          <span className="text-muted small d-block mb-1 text-truncate">{act.orgName}</span>
                          <span className="badge bg-light text-secondary small">{act.category}</span>
                        </div>
                        <Link href={`/dashboard/activities/${act.id}`} className="btn btn-sm text-white" style={{ background: orgStyle.gradient }}>
                          Daftar
                        </Link>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>

          {/* Achievements */}
          <div className="card border-0 rounded-4 card-glass-static">
            <div className="card-header bg-transparent border-0 pt-4 px-4 pb-0 d-flex justify-content-between align-items-center">
              <h5 className="fw-bold text-dark mb-0">Prestasi ORMAWA</h5>
              <Link href="/dashboard/achievements" className="text-primary text-decoration-none small fw-semibold">Lihat semua</Link>
            </div>
            <div className="card-body px-4 pb-4">
              {data.achievements.length === 0 ? (
                <p className="text-secondary small text-center py-4 mb-0">Belum ada prestasi yang dipublikasikan.</p>
              ) : (
                <div className="d-flex flex-column gap-3">
                  {data.achievements.map((ach) => {
                    const orgStyle = getFacultyStyle(ach.scopeName || ach.orgName);
                    return (
                      <div key={ach.id} className="d-flex gap-3 align-items-center">
                        <PremiumIcon 
                          icon="bi-trophy-fill"
                          primaryColor={orgStyle.primary}
                          lightBgColor={orgStyle.lightBg}
                          size={42}
                        />
                        <div>
                          <h6 className="fw-bold text-dark mb-0">{ach.title}</h6>
                          <span className="text-muted small d-block">Dari: <strong style={{ color: orgStyle.primary }}>{ach.orgName}</strong></span>
                          <span className="text-muted small">Juara {ach.rank} - {ach.year}</span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>

        </div>

      </div>

    </div>
  );
}


// ==========================================
// 3. ADMIN / VICE DEAN DASHBOARD VIEW
// ==========================================
async function AdminDashboard({ profile }: { profile: any }) {
  const [data, activitiesResult] = await Promise.all([
    getAdminDashboardData(),
    adminGetActivities(),
  ]);

  return (
    <AdminDashboardClient
      profile={profile}
      pendingProposals={data.pendingProposals}
      stats={data.stats}
      initialActivities={activitiesResult.success ? (activitiesResult.activities as any[]) : []}
    />
  );
}
