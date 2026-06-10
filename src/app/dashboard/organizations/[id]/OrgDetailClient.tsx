'use client'

import { useState } from "react";
import Link from "next/link";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Form, Button, Card, Modal, Tabs, Tab } from "react-bootstrap";
import { 
  joinOrganization, 
  approveOrganizationMember, 
  rejectOrganizationMember, 
  saveOrganizationProfile,
  submitNewEventProposal 
} from "@/app/actions/activities";
import { createAnnouncement, createAchievement } from "@/app/actions/board";
import { getFacultyStyle } from "@/utils/faculty";
import PremiumIcon from "@/components/PremiumIcon";

// Validation schemas
const joinFormSchema = z.object({
  motivation: z.string().min(15, "Surat motivasi minimal harus 15 karakter"),
});

const announcementFormSchema = z.object({
  title: z.string().min(5, "Judul minimal 5 karakter"),
  content: z.string().min(10, "Isi pengumuman minimal 10 karakter"),
  isUrgent: z.boolean().default(false),
  isPublic: z.boolean().default(true),
});

const achievementFormSchema = z.object({
  title: z.string().min(5, "Judul prestasi minimal 5 karakter"),
  rank: z.string().min(1, "Peringkat/Juara wajib diisi"),
  year: z.coerce.number().int().positive("Tahun harus positif"),
  description: z.string().optional(),
});

const eventFormSchema = z.object({
  name: z.string().min(5, "Nama kegiatan minimal 5 karakter"),
  description: z.string().min(10, "Deskripsi minimal 10 karakter"),
  category: z.enum(["Program Kerja", "Delegasi/Lomba"]),
  location: z.string().min(3, "Lokasi minimal 3 karakter"),
  externalOrganizer: z.string().optional(),
  quota: z.coerce.number().optional(),
  startDate: z.string().min(1, "Tanggal mulai wajib diisi"),
  endDate: z.string().min(1, "Tanggal selesai wajib diisi"),
});

type JoinInput = z.infer<typeof joinFormSchema>;
type AnnouncementInput = z.infer<typeof announcementFormSchema>;
type AchievementInput = z.infer<typeof achievementFormSchema>;
type EventInput = z.infer<typeof eventFormSchema>;

interface OrgDetailClientProps {
  organization: any;
  creatorName: string | null;
  members: any[];
  pendingRequests: any[];
  announcements: any[];
  achievements: any[];
  events: any[];
  user: {
    id: string;
    name: string;
    role: "student" | "lecturer" | "admin";
    nim: string;
  };
  membership: {
    role: "leader" | "manager" | "member" | null;
    status: "pending" | "approved" | "rejected" | null;
  };
}

export default function OrgDetailClient({
  organization,
  creatorName,
  members,
  pendingRequests,
  announcements,
  achievements,
  events,
  user,
  membership,
}: OrgDetailClientProps) {
  const [activeTab, setActiveTab] = useState<string>("announcements");
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  
  const orgStyle = getFacultyStyle(organization.scopeName || organization.name);
  
  // Modals state
  const [showJoinModal, setShowJoinModal] = useState(false);
  const [showEventModal, setShowEventModal] = useState(false);
  const [showAnnounceModal, setShowAnnounceModal] = useState(false);
  const [showAchieveModal, setShowAchieveModal] = useState(false);

  const isManagerOrLeader = membership.role === "leader" || membership.role === "manager" || user.role === "admin";
  const isLeader = membership.role === "leader" || user.role === "admin";

  // Hooks for Forms
  const { register: regJoin, handleSubmit: handleJoinSubmit, formState: { errors: joinErrorsRaw } } = useForm<any>({
    resolver: zodResolver(joinFormSchema) as any,
  });
  const joinErrors = joinErrorsRaw as any;

  const { register: regAnnounce, handleSubmit: handleAnnounceSubmit, formState: { errors: announceErrorsRaw }, reset: resetAnnounce } = useForm<any>({
    resolver: zodResolver(announcementFormSchema) as any,
    defaultValues: {
      isUrgent: false,
      isPublic: true,
    }
  });
  const announceErrors = announceErrorsRaw as any;

  const { register: regAchieve, handleSubmit: handleAchieveSubmit, formState: { errors: achieveErrorsRaw }, reset: resetAchieve } = useForm<any>({
    resolver: zodResolver(achievementFormSchema) as any,
  });
  const achieveErrors = achieveErrorsRaw as any;

  const { register: regEvent, handleSubmit: handleEventSubmit, formState: { errors: eventErrorsRaw }, watch: watchEvent, reset: resetEvent } = useForm<any>({
    resolver: zodResolver(eventFormSchema) as any,
    defaultValues: {
      category: "Program Kerja",
    }
  });
  const eventErrors = eventErrorsRaw as any;

  const watchedCategory = watchEvent("category");

  // Actions Callbacks
  const onJoin = async (data: JoinInput) => {
    setLoading(true);
    setErrorMsg(null);
    setSuccessMsg(null);
    try {
      const res = await joinOrganization(organization.id, data.motivation);
      if (res.success) {
        setSuccessMsg("Permohonan bergabung berhasil dikirim!");
        setShowJoinModal(false);
        setTimeout(() => window.location.reload(), 1500);
      } else {
        setErrorMsg(res.error || "Gagal mengajukan keanggotaan.");
      }
    } catch (err) {
      setErrorMsg("Koneksi gagal atau terjadi kesalahan server.");
    } finally {
      setLoading(false);
    }
  };

  const handleApproveMember = async (membershipId: number) => {
    if (!confirm("Setujui mahasiswa ini sebagai anggota?")) return;
    setLoading(true);
    try {
      const res = await approveOrganizationMember(membershipId);
      if (res.success) {
        setSuccessMsg("Anggota berhasil disetujui!");
        setTimeout(() => window.location.reload(), 1500);
      } else {
        setErrorMsg(res.error || "Gagal menyetujui anggota.");
      }
    } catch (err) {
      setErrorMsg("Terjadi kesalahan.");
    } finally {
      setLoading(false);
    }
  };

  const handleRejectMember = async (membershipId: number) => {
    if (!confirm("Tolak permohonan gabung mahasiswa ini?")) return;
    setLoading(true);
    try {
      const res = await rejectOrganizationMember(membershipId);
      if (res.success) {
        setSuccessMsg("Permohonan gabung ditolak.");
        setTimeout(() => window.location.reload(), 1500);
      } else {
        setErrorMsg(res.error || "Gagal menolak permohonan.");
      }
    } catch (err) {
      setErrorMsg("Terjadi kesalahan.");
    } finally {
      setLoading(false);
    }
  };

  const onAddAnnouncement = async (data: AnnouncementInput) => {
    setLoading(true);
    setErrorMsg(null);
    try {
      const formData = new FormData();
      formData.append("title", data.title);
      formData.append("content", data.content);
      formData.append("isUrgent", data.isUrgent ? "true" : "false");
      formData.append("isPublic", data.isPublic ? "true" : "false");
      formData.append("activityId", organization.id.toString());

      const res = await createAnnouncement(formData);
      if (res.success) {
        setSuccessMsg("Pengumuman berhasil diterbitkan!");
        setShowAnnounceModal(false);
        resetAnnounce();
        setTimeout(() => window.location.reload(), 1500);
      } else {
        setErrorMsg(res.error || "Gagal membuat pengumuman.");
      }
    } catch (err) {
      setErrorMsg("Terjadi kesalahan.");
    } finally {
      setLoading(false);
    }
  };

  const onAddAchievement = async (data: AchievementInput) => {
    setLoading(true);
    setErrorMsg(null);
    try {
      const formData = new FormData();
      formData.append("title", data.title);
      formData.append("rank", data.rank);
      formData.append("year", data.year.toString());
      formData.append("description", data.description || "");
      formData.append("activityId", organization.id.toString());

      const res = await createAchievement(formData);
      if (res.success) {
        setSuccessMsg("Prestasi berhasil ditambahkan!");
        setShowAchieveModal(false);
        resetAchieve();
        setTimeout(() => window.location.reload(), 1500);
      } else {
        setErrorMsg(res.error || "Gagal menambahkan prestasi.");
      }
    } catch (err) {
      setErrorMsg("Terjadi kesalahan.");
    } finally {
      setLoading(false);
    }
  };

  const onAddEvent = async (data: EventInput) => {
    setLoading(true);
    setErrorMsg(null);
    try {
      const formData = new FormData();
      formData.append("activityId", organization.id.toString());
      formData.append("name", data.name);
      formData.append("description", data.description);
      formData.append("category", data.category);
      formData.append("location", data.location);
      formData.append("externalOrganizer", data.externalOrganizer || "");
      formData.append("quota", data.quota ? data.quota.toString() : "");
      formData.append("startDate", data.startDate);
      formData.append("endDate", data.endDate);

      const res = await submitNewEventProposal(formData);
      if (res.success) {
        setSuccessMsg("Proposal kegiatan berhasil diajukan! Menunggu review Admin.");
        setShowEventModal(false);
        resetEvent();
        setTimeout(() => window.location.reload(), 1500);
      } else {
        setErrorMsg(res.error || "Gagal mengajukan proposal kegiatan.");
      }
    } catch (err) {
      setErrorMsg("Terjadi kesalahan.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container-fluid p-0">
      
      {/* Back Link */}
      <div className="mb-4">
        <Link href="/dashboard/organizations" className="text-secondary text-decoration-none small fw-semibold btn-back-hover d-inline-flex align-items-center gap-1">
          <i className="bi bi-arrow-left animate-arrow-left"></i> Kembali ke Daftar Ormawa
        </Link>
      </div>

      {errorMsg && <div className="alert alert-danger rounded-3 py-3 mb-4">{errorMsg}</div>}
      {successMsg && <div className="alert alert-success rounded-3 py-3 mb-4">{successMsg}</div>}

      {/* Header Profile Section */}
      <div className="card border-0 text-white p-4 p-md-5 mb-4 position-relative overflow-hidden shadow-sm"
        style={{
          background: orgStyle.gradient,
          borderRadius: "16px",
        }}
      >
        {/* Decorative background blobs */}
        <div className="position-absolute rounded-circle opacity-10" style={{ background: '#ffffff', width: '200px', height: '200px', filter: 'blur(18px)', top: '-50px', right: '-50px', pointerEvents: 'none' }}></div>
        <div className="position-absolute rounded-circle opacity-10" style={{ background: '#ffffff', width: '170px', height: '170px', filter: 'blur(18px)', bottom: '-50px', left: '-50px', pointerEvents: 'none' }}></div>

        <div className="row align-items-center position-relative" style={{ zIndex: 1 }}>
          <div className="col-md-8">
            <div className="mb-3 d-flex flex-wrap gap-2">
              <span className="badge text-white px-2.5 py-1.5 fw-semibold small text-uppercase"
                style={{
                  backgroundColor: 'rgba(255, 255, 255, 0.16)',
                  border: '1px solid rgba(255, 255, 255, 0.24)',
                  letterSpacing: '0.5px'
                }}
              >
                {organization.orgType}
              </span>
              <span className="badge text-white px-2.5 py-1.5 small"
                style={{
                  backgroundColor: 'rgba(255, 255, 255, 0.08)',
                  border: '1px solid rgba(255, 255, 255, 0.12)'
                }}
              >
                {organization.organizationLevel} {organization.scopeName ? `(${organization.scopeName})` : ""}
              </span>
            </div>
            <h2 className="fw-extrabold text-white mb-3">{organization.name}</h2>
            <p className="text-white-50 leading-relaxed mb-0">
              {organization.description || "Organisasi kemahasiswaan Universitas Sam Ratulangi."}
            </p>
          </div>
          
          {/* Action sidebar */}
          <div className="col-md-4 text-md-end mt-4 mt-md-0 border-start-md">
            
            {/* Membership Badge/Actions */}
            <div className="p-4 rounded-4 text-center d-flex flex-column gap-2 align-items-center justify-content-center shadow-sm ms-auto"
              style={{
                minWidth: "200px",
                maxWidth: "280px",
                background: "rgba(255, 255, 255, 0.12)",
                border: "1px solid rgba(255, 255, 255, 0.2)",
                color: "#ffffff"
              }}
            >
              <span className="text-white text-opacity-75 small fw-semibold uppercase block" style={{ letterSpacing: '0.5px' }}>Anggota Resmi</span>
              <h3 className="fw-extrabold text-white mb-2">{organization.registered} <span className="fs-6 text-white text-opacity-60">/ {organization.quota}</span></h3>
              
              {/* Student Join Button */}
              {user.role === "student" && (
                <>
                  {membership.status === "approved" ? (
                    <span className="badge bg-success text-white border-0 py-2 px-3 rounded-pill fw-bold w-100 shadow-sm">
                      <i className="bi bi-patch-check-fill me-1"></i> Anggota Aktif ({membership.role})
                    </span>
                  ) : membership.status === "pending" ? (
                    <span className="badge bg-warning text-dark border-0 py-2 px-3 rounded-pill fw-bold w-100 shadow-sm">
                      <i className="bi bi-clock-history me-1"></i> Permohonan Pending
                    </span>
                  ) : membership.status === "rejected" ? (
                    <span className="badge bg-danger text-white border-0 py-2 px-3 rounded-pill fw-bold w-100 shadow-sm">
                      Pendaftaran Ditolak
                    </span>
                  ) : (
                    <>
                      {organization.status === "open" ? (
                        <button className="btn btn-light w-100 py-2 rounded-pill fw-bold hover-lift btn-sm text-dark shadow-sm" onClick={() => setShowJoinModal(true)}>
                          Daftar Keanggotaan
                        </button>
                      ) : (
                        <button className="btn w-100 py-2 rounded-pill fw-semibold btn-sm text-white text-opacity-50"
                          style={{ backgroundColor: 'rgba(255, 255, 255, 0.08)', border: '1px solid rgba(255, 255, 255, 0.12)' }}
                          disabled
                        >
                          Pendaftaran Tutup
                        </button>
                      )}
                    </>
                  )}
                </>
              )}
            </div>

          </div>
        </div>
      </div>

      {/* Tabs Menu */}
      <Tabs
        activeKey={activeTab}
        onSelect={(k) => setActiveTab(k || "announcements")}
        className="mb-4 custom-tabs border-bottom-0"
      >
        
        {/* TAB 1: ANNOUNCEMENTS */}
        <Tab 
          eventKey="announcements" 
          title={
            <span className="d-flex align-items-center gap-2">
              <i className="bi bi-megaphone-fill transition-all-200" style={{ color: activeTab === "announcements" ? orgStyle.primary : "#6B7280" }}></i>
              <span>Pengumuman</span>
            </span>
          }
        >
          <div className="card-glass-static border-0 p-4 rounded-4 shadow-sm text-dark mb-4 animate-fade-in">
            <div className="d-flex justify-content-between align-items-center mb-4">
              <h5 className="fw-bold text-dark mb-0">Mading Pengumuman</h5>
              {isManagerOrLeader && (
                <button className="btn text-white btn-sm px-4 rounded-pill fw-bold hover-lift shadow-sm" style={{ background: orgStyle.gradient, border: 'none' }} onClick={() => setShowAnnounceModal(true)}>
                  + Buat Pengumuman
                </button>
              )}
            </div>

            {announcements.length === 0 ? (
              <div className="text-center py-5 d-flex flex-column align-items-center justify-content-center">
                <div className="rounded-circle d-flex align-items-center justify-content-center mb-3 shadow-sm"
                  style={{
                    width: "80px",
                    height: "80px",
                    background: orgStyle.lightBg,
                    border: `2px dashed ${orgStyle.borderSubtle}`
                  }}
                >
                  <i className="bi bi-megaphone-fill fs-2" style={{ color: orgStyle.primary }}></i>
                </div>
                <h6 className="fw-bold text-dark mb-1">Belum Ada Pengumuman</h6>
                <p className="text-muted small mb-0" style={{ maxWidth: "320px" }}>
                  Semua berita, rilis, dan pengumuman penting dari pengurus akan muncul di mading digital ini.
                </p>
              </div>
            ) : (
              <div className="d-flex flex-column gap-3">
                {announcements.map((ann) => (
                  <div key={ann.id} className="card-glass-static hover-lift border-0 p-4 rounded-4 shadow-sm" style={{ borderLeft: `4px solid ${ann.isUrgent ? '#dc3545' : orgStyle.primary}` }}>
                    <div className="d-flex justify-content-between align-items-start gap-2 mb-2">
                      <div>
                        <h6 className="fw-extrabold text-dark mb-1 d-flex align-items-center gap-2 flex-wrap">
                          {ann.title}
                          {ann.isUrgent && <span className="badge bg-danger bg-opacity-10 text-danger border border-danger-subtle px-2 py-0.5" style={{ fontSize: '0.72rem' }}>Penting</span>}
                          {ann.isPublic ? (
                            <span className="badge bg-success bg-opacity-10 text-success border border-success-subtle px-2 py-0.5" style={{ fontSize: '0.72rem' }}>Publik</span>
                          ) : (
                            <span className="badge bg-secondary bg-opacity-10 text-secondary border border-secondary-subtle px-2 py-0.5" style={{ fontSize: '0.72rem' }}>Internal Anggota</span>
                          )}
                        </h6>
                        <span className="text-muted small">Diterbitkan oleh <strong>{ann.creatorName || "Pengurus"}</strong></span>
                      </div>
                      <span className="text-muted small">{new Date(ann.createdAt).toLocaleDateString("id-ID")}</span>
                    </div>
                    <p className="text-secondary small mb-0 leading-relaxed" style={{ whiteSpace: "pre-line" }}>{ann.content}</p>
                  </div>
                ))}
              </div>
            )}
          </div>
        </Tab>

        {/* TAB 2: ACHIEVEMENTS */}
        <Tab 
          eventKey="achievements" 
          title={
            <span className="d-flex align-items-center gap-2">
              <i className="bi bi-trophy-fill transition-all-200" style={{ color: activeTab === "achievements" ? orgStyle.primary : "#6B7280" }}></i>
              <span>Prestasi</span>
            </span>
          }
        >
          <div className="card-glass-static border-0 p-4 rounded-4 shadow-sm text-dark mb-4 animate-fade-in">
            <div className="d-flex justify-content-between align-items-center mb-4">
              <h5 className="fw-bold text-dark mb-0">Daftar Penghargaan & Prestasi</h5>
              {isManagerOrLeader && (
                <button className="btn text-white btn-sm px-4 rounded-pill fw-bold hover-lift shadow-sm" style={{ background: orgStyle.gradient, border: 'none' }} onClick={() => setShowAchieveModal(true)}>
                  + Tambah Prestasi
                </button>
              )}
            </div>

            {achievements.length === 0 ? (
              <div className="text-center py-5 d-flex flex-column align-items-center justify-content-center">
                <div className="rounded-circle d-flex align-items-center justify-content-center mb-3 shadow-sm"
                  style={{
                    width: "80px",
                    height: "80px",
                    background: orgStyle.lightBg,
                    border: `2px dashed ${orgStyle.borderSubtle}`
                  }}
                >
                  <i className="bi bi-trophy-fill fs-2" style={{ color: orgStyle.primary }}></i>
                </div>
                <h6 className="fw-bold text-dark mb-1">Belum Ada Prestasi</h6>
                <p className="text-muted small mb-0" style={{ maxWidth: "320px" }}>
                  Daftar penghargaan dan prestasi resmi yang diraih oleh anggota Ormawa ini akan ditampilkan di sini.
                </p>
              </div>
            ) : (
              <div className="row g-4">
                {achievements.map((ach) => (
                  <div key={ach.id} className="col-12 col-md-6">
                    <div className="d-flex gap-3 align-items-center p-3 card-glass-static hover-lift border-0 rounded-4 shadow-sm">
                      <PremiumIcon 
                        icon="bi-trophy-fill"
                        primaryColor={orgStyle.primary}
                        lightBgColor={orgStyle.lightBg}
                        size={40}
                      />
                      <div>
                        <h6 className="fw-bold text-dark mb-1">{ach.title}</h6>
                        <span className="badge bg-warning text-dark small mb-2">{ach.rank} ({ach.year})</span>
                        {ach.description && <p className="text-secondary small mb-0 text-truncate-3">{ach.description}</p>}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </Tab>

        {/* TAB 3: EVENTS */}
        <Tab 
          eventKey="events" 
          title={
            <span className="d-flex align-items-center gap-2">
              <i className="bi bi-calendar2-event-fill transition-all-200" style={{ color: activeTab === "events" ? orgStyle.primary : "#6B7280" }}></i>
              <span>Program Kerja & Event</span>
            </span>
          }
        >
          <div className="card-glass-static border-0 p-4 rounded-4 shadow-sm text-dark mb-4 animate-fade-in">
            <div className="d-flex justify-content-between align-items-center mb-4">
              <h5 className="fw-bold text-dark mb-0">Kegiatan & Program Kerja Ormawa</h5>
              {isManagerOrLeader && (
                <button className="btn text-white btn-sm px-4 rounded-pill fw-bold hover-lift shadow-sm" style={{ background: orgStyle.gradient, border: 'none' }} onClick={() => setShowEventModal(true)}>
                  + Ajukan Proposal Kegiatan
                </button>
              )}
            </div>

            {events.length === 0 ? (
              <div className="text-center py-5 d-flex flex-column align-items-center justify-content-center">
                <div className="rounded-circle d-flex align-items-center justify-content-center mb-3 shadow-sm"
                  style={{
                    width: "80px",
                    height: "80px",
                    background: orgStyle.lightBg,
                    border: `2px dashed ${orgStyle.borderSubtle}`
                  }}
                >
                  <i className="bi bi-calendar2-event-fill fs-2" style={{ color: orgStyle.primary }}></i>
                </div>
                <h6 className="fw-bold text-dark mb-1">Belum Ada Kegiatan</h6>
                <p className="text-muted small mb-0" style={{ maxWidth: "320px" }}>
                  Program kerja dan agenda kegiatan mendatang belum terdaftar. Hubungi pengurus untuk informasi lebih lanjut.
                </p>
              </div>
            ) : (
              <div className="table-responsive">
                <table className="table table-hover align-middle">
                  <thead>
                    <tr className="text-secondary small border-bottom">
                      <th>Nama Kegiatan</th>
                      <th>Kategori</th>
                      <th>Lokasi</th>
                      <th>Tanggal</th>
                      <th>Status Proposal</th>
                      <th>Fase Kegiatan</th>
                      <th className="text-end">Aksi</th>
                    </tr>
                  </thead>
                  <tbody>
                    {events.map((evt) => {
                      const isUpcoming = evt.eventState === "Akan Datang";
                      const isOngoing = evt.eventState === "Sedang Berlangsung";
                      const isCompleted = evt.eventState === "Selesai";

                      return (
                        <tr key={evt.id}>
                          <td>
                            <strong className="text-dark d-block">{evt.name}</strong>
                            {evt.category === "Program Kerja" ? (
                              <span className="text-muted small">Kuota: {evt.registered} / {evt.quota}</span>
                            ) : (
                              <span className="text-muted small">Organizer: {evt.externalOrganizer}</span>
                            )}
                          </td>
                          <td>
                            <span className="badge bg-light text-secondary">{evt.category}</span>
                          </td>
                          <td>
                            <span className="small text-secondary">{evt.location || "-"}</span>
                          </td>
                          <td>
                            <span className="small text-secondary">
                              {new Date(evt.startDate).toLocaleDateString("id-ID")}
                            </span>
                          </td>
                          <td>
                            {evt.status === "open" ? (
                              <span className="badge bg-success bg-opacity-10 text-success border border-success-subtle">Disetujui WD III</span>
                            ) : evt.status === "pending_advisor" ? (
                              <span className="badge bg-warning bg-opacity-10 text-warning border border-warning-subtle">Review Pembina</span>
                            ) : evt.status === "pending_dean" ? (
                              <span className="badge bg-info bg-opacity-10 text-info border border-info-subtle">Review WD III</span>
                            ) : evt.status === "rejected" ? (
                              <span className="badge bg-danger bg-opacity-10 text-danger border border-danger-subtle">Ditolak</span>
                            ) : (
                              <span className="badge bg-secondary bg-opacity-10 text-secondary">{evt.status}</span>
                            )}
                          </td>
                          <td>
                            {isUpcoming && <span className="badge bg-primary-subtle text-primary border border-primary-subtle">Akan Datang</span>}
                            {isOngoing && <span className="badge bg-warning-subtle text-warning border border-warning-subtle">Berlangsung</span>}
                            {isCompleted && <span className="badge bg-success-subtle text-success border border-success-subtle">Selesai</span>}
                          </td>
                          <td className="text-end">
                            <Link href={`/dashboard/activities/${evt.id}`} className="btn btn-sm px-3 rounded-pill fw-semibold hover-lift" style={{ color: orgStyle.primary, borderColor: orgStyle.primary, borderStyle: 'solid', borderWidth: '1px', background: 'transparent' }}>
                              Detail
                            </Link>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </Tab>

        {/* TAB 4: MEMBERS */}
        <Tab 
          eventKey="members" 
          title={
            <span className="d-flex align-items-center gap-2">
              <i className="bi bi-people-fill transition-all-200" style={{ color: activeTab === "members" ? orgStyle.primary : "#6B7280" }}></i>
              <span>Anggota & Pengurus</span>
            </span>
          }
        >
          <div className="card-glass-static border-0 p-4 rounded-4 shadow-sm text-dark mb-4 animate-fade-in">
            <h5 className="fw-bold text-dark mb-4">Daftar Pengurus & Anggota Ormawa</h5>
            
            <div className="row g-4">
              {members.map((mbr) => {
                const isLeaderRole = mbr.role === "leader";
                const isManagerRole = mbr.role === "manager";

                return (
                  <div key={mbr.id} className="col-12 col-md-6 col-lg-4">
                    <div className="d-flex align-items-center gap-3 p-3 card-glass-static hover-lift border-0 rounded-4 shadow-sm">
                      <div className="avatar-placeholder rounded-circle bg-primary bg-opacity-10 text-primary d-flex align-items-center justify-content-center" style={{ width: "45px", height: "45px", background: orgStyle.lightBg, color: orgStyle.primary }}>
                        <span className="fw-bold fs-5" style={{ color: orgStyle.primary }}>{mbr.name.charAt(0).toUpperCase()}</span>
                      </div>
                      <div className="overflow-hidden flex-grow-1">
                        <h6 className="fw-bold text-dark mb-0 text-truncate">{mbr.name}</h6>
                        <span className="text-muted small d-block">{mbr.nim}</span>
                        {isLeaderRole ? (
                          <span className="badge text-white border-0 px-2 py-0.5 mt-1 small fw-bold" style={{ backgroundColor: orgStyle.primary }}>Ketua Umum</span>
                        ) : isManagerRole ? (
                          <span className="badge text-dark border-0 px-2 py-0.5 mt-1 small fw-semibold" style={{ backgroundColor: orgStyle.borderSubtle }}>Pengurus</span>
                        ) : (
                          <span className="badge bg-secondary text-white border-0 px-2 py-0.5 mt-1 small">Anggota</span>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </Tab>

        {/* TAB 5: JOIN REQUESTS (Visible to leaders/managers) */}
        {isManagerOrLeader && (
          <Tab 
            eventKey="requests" 
            title={
              <span className="d-flex align-items-center gap-2">
                <i className="bi bi-person-plus-fill transition-all-200" style={{ color: activeTab === "requests" ? orgStyle.primary : "#6B7280" }}></i>
                <span>
                  Permintaan Gabung
                  <span className={`badge ms-1.5 px-1.5 py-0.5 rounded-pill ${activeTab === "requests" ? "bg-danger text-white" : "bg-secondary bg-opacity-10 text-secondary"}`} style={{ fontSize: '0.68rem', verticalAlign: 'middle' }}>
                    {pendingRequests.length}
                  </span>
                </span>
              </span>
            }
          >
            <div className="card-glass-static border-0 p-4 rounded-4 shadow-sm text-dark mb-4 animate-fade-in">
              <h5 className="fw-bold text-dark mb-4">Permintaan Bergabung Anggota Baru</h5>

              {pendingRequests.length === 0 ? (
                <div className="text-center py-5 d-flex flex-column align-items-center justify-content-center">
                  <div className="rounded-circle d-flex align-items-center justify-content-center mb-3 shadow-sm"
                    style={{
                      width: "80px",
                      height: "80px",
                      background: orgStyle.lightBg,
                      border: `2px dashed ${orgStyle.borderSubtle}`
                    }}
                  >
                    <i className="bi bi-envelope-open-fill fs-2" style={{ color: orgStyle.primary }}></i>
                  </div>
                  <h6 className="fw-bold text-dark mb-1">Tidak Ada Permintaan Gabung</h6>
                  <p className="text-muted small mb-0" style={{ maxWidth: "320px" }}>
                    Saat ini tidak ada permohonan bergabung baru dari mahasiswa untuk ditinjau.
                  </p>
                </div>
              ) : (
                <div className="table-responsive">
                  <table className="table align-middle">
                    <thead>
                      <tr className="text-secondary small border-bottom">
                        <th>Mahasiswa</th>
                        <th>NIM</th>
                        <th>Motivasi Bergabung</th>
                        <th className="text-end">Tindakan</th>
                      </tr>
                    </thead>
                    <tbody>
                      {pendingRequests.map((req) => (
                        <tr key={req.id}>
                          <td>
                            <strong className="text-dark">{req.name}</strong>
                          </td>
                          <td>
                            <span className="text-secondary">{req.nim}</span>
                          </td>
                          <td className="text-secondary small" style={{ maxWidth: "400px" }}>
                            {req.motivation || "Tidak terlampir."}
                          </td>
                          <td className="text-end">
                            <div className="d-flex justify-content-end gap-2">
                              <button className="btn btn-sm btn-success px-3 rounded-pill fw-bold hover-lift shadow-sm" onClick={() => handleApproveMember(req.membershipId)} disabled={loading}>
                                Terima
                              </button>
                              <button className="btn btn-sm btn-outline-danger px-3 rounded-pill fw-bold hover-lift shadow-sm" onClick={() => handleRejectMember(req.membershipId)} disabled={loading}>
                                Tolak
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </Tab>
        )}

      </Tabs>

      {/* ==========================================
          MODALS SECTION
          ========================================== */}

      {/* 1. JOIN MODAL */}
      <Modal show={showJoinModal} onHide={() => setShowJoinModal(false)} centered>
        <Modal.Header closeButton className="border-0 pb-0">
          <Modal.Title className="fw-bold">Pendaftaran Anggota Ormawa</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <Form onSubmit={handleJoinSubmit(onJoin)}>
            <Form.Group className="mb-3">
              <Form.Label className="small fw-semibold text-secondary">Surat Motivasi Singkat</Form.Label>
              <Form.Control
                as="textarea"
                rows={4}
                placeholder="Tuliskan motivasi mengapa Anda ingin bergabung dengan organisasi kemahasiswaan ini..."
                className={joinErrors.motivation ? 'is-invalid' : ''}
                style={{ borderRadius: '12px', padding: '12px' }}
                {...regJoin("motivation")}
              />
              {joinErrors.motivation && <div className="invalid-feedback">{joinErrors.motivation.message}</div>}
            </Form.Group>

            <div className="d-flex justify-content-end gap-2 border-top pt-3">
              <Button variant="outline-secondary" className="rounded-pill px-4 btn-sm fw-bold hover-lift" onClick={() => setShowJoinModal(false)} disabled={loading}>
                Batal
              </Button>
              <Button variant="primary" className="rounded-pill px-4 btn-sm fw-bold hover-lift text-white" type="submit" disabled={loading} style={{ background: orgStyle.gradient, border: 'none' }}>
                {loading ? "Mengirim..." : "Kirim Lamaran"}
              </Button>
            </div>
          </Form>
        </Modal.Body>
      </Modal>

      {/* 2. CREATE ANNOUNCEMENT MODAL */}
      <Modal show={showAnnounceModal} onHide={() => setShowAnnounceModal(false)} centered>
        <Modal.Header closeButton className="border-0 pb-0">
          <Modal.Title className="fw-bold">Buat Pengumuman Baru</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <Form onSubmit={handleAnnounceSubmit(onAddAnnouncement)}>
            <Form.Group className="mb-3">
              <Form.Label className="small fw-semibold text-secondary">Judul Pengumuman</Form.Label>
              <div className="input-group">
                <span className="input-group-text text-secondary bg-light border-end-0" style={{ borderTopLeftRadius: "10px", borderBottomLeftRadius: "10px" }}>
                  <i className="bi bi-chat-left-text"></i>
                </span>
                <Form.Control
                  type="text"
                  placeholder="Masukkan judul pengumuman..."
                  className={`border-start-0 ${announceErrors.title ? 'is-invalid' : ''}`}
                  style={{ borderTopRightRadius: "10px", borderBottomRightRadius: "10px" }}
                  {...regAnnounce("title")}
                />
                {announceErrors.title && <div className="invalid-feedback text-danger small mt-1">{announceErrors.title.message}</div>}
              </div>
            </Form.Group>

            <Form.Group className="mb-3">
              <Form.Label className="small fw-semibold text-secondary">Konten / Isi Pengumuman</Form.Label>
              <Form.Control
                as="textarea"
                rows={4}
                placeholder="Tuliskan detail pengumuman di sini..."
                className={announceErrors.content ? 'is-invalid' : ''}
                style={{ borderRadius: "10px", padding: "12px" }}
                {...regAnnounce("content")}
              />
              {announceErrors.content && <div className="invalid-feedback">{announceErrors.content.message}</div>}
            </Form.Group>

            <Form.Group className="mb-3 d-flex align-items-center gap-2">
              <Form.Check
                type="checkbox"
                id="urgent-check"
                {...regAnnounce("isUrgent")}
              />
              <Form.Label htmlFor="urgent-check" className="small fw-semibold text-danger mb-0">Tandai sebagai Penting / Urgent</Form.Label>
            </Form.Group>

            <Form.Group className="mb-3">
              <Form.Check
                type="switch"
                id="public-switch"
                label="Tersedia untuk Umum (Publik)"
                className="small fw-semibold text-secondary"
                {...regAnnounce("isPublic")}
              />
              <Form.Text className="text-muted small block mt-1">
                Jika dinonaktifkan, pengumuman hanya dapat dilihat oleh anggota resmi organisasi ini.
              </Form.Text>
            </Form.Group>

            <div className="d-flex justify-content-end gap-2 border-top pt-3">
              <Button variant="outline-secondary" className="rounded-pill px-4 btn-sm fw-bold hover-lift" onClick={() => setShowAnnounceModal(false)} disabled={loading}>
                Batal
              </Button>
              <Button variant="primary" className="rounded-pill px-4 btn-sm fw-bold hover-lift text-white" type="submit" disabled={loading} style={{ background: orgStyle.gradient, border: 'none' }}>
                {loading ? "Menerbitkan..." : "Terbitkan Pengumuman"}
              </Button>
            </div>
          </Form>
        </Modal.Body>
      </Modal>

      {/* 3. ADD ACHIEVEMENT MODAL */}
      <Modal show={showAchieveModal} onHide={() => setShowAchieveModal(false)} centered>
        <Modal.Header closeButton className="border-0 pb-0">
          <Modal.Title className="fw-bold">Tambah Prestasi Ormawa</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <Form onSubmit={handleAchieveSubmit(onAddAchievement)}>
            <Form.Group className="mb-3">
              <Form.Label className="small fw-semibold text-secondary">Nama Prestasi / Kompetisi</Form.Label>
              <div className="input-group">
                <span className="input-group-text text-secondary bg-light border-end-0" style={{ borderTopLeftRadius: "10px", borderBottomLeftRadius: "10px" }}>
                  <i className="bi bi-award"></i>
                </span>
                <Form.Control
                  type="text"
                  placeholder="Juara 1 Lomba Web Design..."
                  className={`border-start-0 ${achieveErrors.title ? 'is-invalid' : ''}`}
                  style={{ borderTopRightRadius: "10px", borderBottomRightRadius: "10px" }}
                  {...regAchieve("title")}
                />
                {achieveErrors.title && <div className="invalid-feedback text-danger small mt-1">{achieveErrors.title.message}</div>}
              </div>
            </Form.Group>

            <Form.Group className="mb-3">
              <Form.Label className="small fw-semibold text-secondary">Peringkat / Juara</Form.Label>
              <div className="input-group">
                <span className="input-group-text text-secondary bg-light border-end-0" style={{ borderTopLeftRadius: "10px", borderBottomLeftRadius: "10px" }}>
                  <i className="bi bi-trophy"></i>
                </span>
                <Form.Control
                  type="text"
                  placeholder="Juara 1 Nasional / Juara Harapan 2..."
                  className={`border-start-0 ${achieveErrors.rank ? 'is-invalid' : ''}`}
                  style={{ borderTopRightRadius: "10px", borderBottomRightRadius: "10px" }}
                  {...regAchieve("rank")}
                />
                {achieveErrors.rank && <div className="invalid-feedback text-danger small mt-1">{achieveErrors.rank.message}</div>}
              </div>
            </Form.Group>

            <Form.Group className="mb-3">
              <Form.Label className="small fw-semibold text-secondary">Tahun Penghargaan</Form.Label>
              <div className="input-group">
                <span className="input-group-text text-secondary bg-light border-end-0" style={{ borderTopLeftRadius: "10px", borderBottomLeftRadius: "10px" }}>
                  <i className="bi bi-calendar-event"></i>
                </span>
                <Form.Control
                  type="number"
                  placeholder="Tahun..."
                  className={`border-start-0 ${achieveErrors.year ? 'is-invalid' : ''}`}
                  style={{ borderTopRightRadius: "10px", borderBottomRightRadius: "10px" }}
                  {...regAchieve("year")}
                />
                {achieveErrors.year && <div className="invalid-feedback text-danger small mt-1">{achieveErrors.year.message}</div>}
              </div>
            </Form.Group>

            <Form.Group className="mb-3">
              <Form.Label className="small fw-semibold text-secondary">Deskripsi Singkat</Form.Label>
              <Form.Control
                as="textarea"
                rows={3}
                placeholder="Tuliskan keterangan detail prestasi..."
                className={achieveErrors.description ? 'is-invalid' : ''}
                style={{ borderRadius: "10px", padding: "12px" }}
                {...regAchieve("description")}
              />
              {achieveErrors.description && <div className="invalid-feedback">{achieveErrors.description.message}</div>}
            </Form.Group>

            <div className="d-flex justify-content-end gap-2 border-top pt-3">
              <Button variant="outline-secondary" className="rounded-pill px-4 btn-sm fw-bold hover-lift" onClick={() => setShowAchieveModal(false)} disabled={loading}>
                Batal
              </Button>
              <Button variant="primary" className="rounded-pill px-4 btn-sm fw-bold hover-lift text-white" type="submit" disabled={loading} style={{ background: orgStyle.gradient, border: 'none' }}>
                {loading ? "Menyimpan..." : "Simpan Prestasi"}
              </Button>
            </div>
          </Form>
        </Modal.Body>
      </Modal>

      {/* 4. PROPOSAL EVENT MODAL */}
      <Modal show={showEventModal} onHide={() => setShowEventModal(false)} size="lg" centered>
        <Modal.Header closeButton className="border-0 pb-0">
          <Modal.Title className="fw-bold">Ajukan Proposal Kegiatan Baru</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <Form onSubmit={handleEventSubmit(onAddEvent)}>
            
            <div className="row">
              <div className="col-md-6">
                <Form.Group className="mb-3">
                  <Form.Label className="small fw-semibold text-secondary">Nama Kegiatan</Form.Label>
                  <div className="input-group">
                    <span className="input-group-text text-secondary bg-light border-end-0" style={{ borderTopLeftRadius: "10px", borderBottomLeftRadius: "10px" }}>
                      <i className="bi bi-tag"></i>
                    </span>
                    <Form.Control
                      type="text"
                      placeholder="Masukkan nama kegiatan..."
                      className={`border-start-0 ${eventErrors.name ? 'is-invalid' : ''}`}
                      style={{ borderTopRightRadius: "10px", borderBottomRightRadius: "10px" }}
                      {...regEvent("name")}
                    />
                    {eventErrors.name && <div className="invalid-feedback text-danger small mt-1">{eventErrors.name.message}</div>}
                  </div>
                </Form.Group>
              </div>

              <div className="col-md-6">
                <Form.Group className="mb-3">
                  <Form.Label className="small fw-semibold text-secondary">Kategori Kegiatan</Form.Label>
                  <div className="input-group">
                    <span className="input-group-text text-secondary bg-light border-end-0" style={{ borderTopLeftRadius: "10px", borderBottomLeftRadius: "10px" }}>
                      <i className="bi bi-grid"></i>
                    </span>
                    <Form.Select
                      className={`border-start-0 ${eventErrors.category ? 'is-invalid' : ''}`}
                      style={{ borderTopRightRadius: "10px", borderBottomRightRadius: "10px" }}
                      {...regEvent("category")}
                    >
                      <option value="Program Kerja">Program Kerja (Bisa diikuti/daftar mahasiswa)</option>
                      <option value="Delegasi/Lomba">Delegasi / Lomba Mandiri</option>
                    </Form.Select>
                    {eventErrors.category && <div className="invalid-feedback text-danger small mt-1">{eventErrors.category.message}</div>}
                  </div>
                </Form.Group>
              </div>
            </div>

            <Form.Group className="mb-3">
              <Form.Label className="small fw-semibold text-secondary">Deskripsi & Tujuan Kegiatan</Form.Label>
              <Form.Control
                as="textarea"
                rows={4}
                placeholder="Tuliskan latar belakang, tujuan, dan sasaran kegiatan..."
                className={eventErrors.description ? 'is-invalid' : ''}
                style={{ borderRadius: "10px", padding: "12px" }}
                {...regEvent("description")}
              />
              {eventErrors.description && <div className="invalid-feedback">{eventErrors.description.message}</div>}
            </Form.Group>

            <div className="row">
              <div className="col-md-6">
                <Form.Group className="mb-3">
                  <Form.Label className="small fw-semibold text-secondary">Lokasi Pelaksanaan</Form.Label>
                  <div className="input-group">
                    <span className="input-group-text text-secondary bg-light border-end-0" style={{ borderTopLeftRadius: "10px", borderBottomLeftRadius: "10px" }}>
                      <i className="bi bi-geo-alt"></i>
                    </span>
                    <Form.Control
                      type="text"
                      placeholder="Auditorium, Kampus, atau Kota..."
                      className={`border-start-0 ${eventErrors.location ? 'is-invalid' : ''}`}
                      style={{ borderTopRightRadius: "10px", borderBottomRightRadius: "10px" }}
                      {...regEvent("location")}
                    />
                    {eventErrors.location && <div className="invalid-feedback text-danger small mt-1">{eventErrors.location.message}</div>}
                  </div>
                </Form.Group>
              </div>

              <div className="col-md-6">
                {watchedCategory === "Program Kerja" ? (
                  <Form.Group className="mb-3">
                    <Form.Label className="small fw-semibold text-secondary">Kuota Peserta</Form.Label>
                    <div className="input-group">
                      <span className="input-group-text text-secondary bg-light border-end-0" style={{ borderTopLeftRadius: "10px", borderBottomLeftRadius: "10px" }}>
                        <i className="bi bi-people"></i>
                      </span>
                      <Form.Control
                        type="number"
                        placeholder="Masukkan jumlah kuota..."
                        className={`border-start-0 ${eventErrors.quota ? 'is-invalid' : ''}`}
                        style={{ borderTopRightRadius: "10px", borderBottomRightRadius: "10px" }}
                        {...regEvent("quota")}
                      />
                      {eventErrors.quota && <div className="invalid-feedback text-danger small mt-1">{eventErrors.quota.message}</div>}
                    </div>
                  </Form.Group>
                ) : (
                  <Form.Group className="mb-3">
                    <Form.Label className="small fw-semibold text-secondary">Penyelenggara Eksternal</Form.Label>
                    <div className="input-group">
                      <span className="input-group-text text-secondary bg-light border-end-0" style={{ borderTopLeftRadius: "10px", borderBottomLeftRadius: "10px" }}>
                        <i className="bi bi-building"></i>
                      </span>
                      <Form.Control
                        type="text"
                        placeholder="Kemendikbud, Puspresnas, Universitas..."
                        className={`border-start-0 ${eventErrors.externalOrganizer ? 'is-invalid' : ''}`}
                        style={{ borderTopRightRadius: "10px", borderBottomRightRadius: "10px" }}
                        {...regEvent("externalOrganizer")}
                      />
                      {eventErrors.externalOrganizer && <div className="invalid-feedback text-danger small mt-1">{eventErrors.externalOrganizer.message}</div>}
                    </div>
                  </Form.Group>
                )}
              </div>
            </div>

            <div className="row">
              <div className="col-md-6">
                <Form.Group className="mb-3">
                  <Form.Label className="small fw-semibold text-secondary">Tanggal Mulai</Form.Label>
                  <div className="input-group">
                    <span className="input-group-text text-secondary bg-light border-end-0" style={{ borderTopLeftRadius: "10px", borderBottomLeftRadius: "10px" }}>
                      <i className="bi bi-calendar"></i>
                    </span>
                    <Form.Control
                      type="date"
                      className={`border-start-0 ${eventErrors.startDate ? 'is-invalid' : ''}`}
                      style={{ borderTopRightRadius: "10px", borderBottomRightRadius: "10px" }}
                      {...regEvent("startDate")}
                    />
                    {eventErrors.startDate && <div className="invalid-feedback text-danger small mt-1">{eventErrors.startDate.message}</div>}
                  </div>
                </Form.Group>
              </div>

              <div className="col-md-6">
                <Form.Group className="mb-3">
                  <Form.Label className="small fw-semibold text-secondary">Tanggal Selesai</Form.Label>
                  <div className="input-group">
                    <span className="input-group-text text-secondary bg-light border-end-0" style={{ borderTopLeftRadius: "10px", borderBottomLeftRadius: "10px" }}>
                      <i className="bi bi-calendar-check"></i>
                    </span>
                    <Form.Control
                      type="date"
                      className={`border-start-0 ${eventErrors.endDate ? 'is-invalid' : ''}`}
                      style={{ borderTopRightRadius: "10px", borderBottomRightRadius: "10px" }}
                      {...regEvent("endDate")}
                    />
                    {eventErrors.endDate && <div className="invalid-feedback text-danger small mt-1">{eventErrors.endDate.message}</div>}
                  </div>
                </Form.Group>
              </div>
            </div>

            <div className="d-flex justify-content-end gap-2 border-top pt-3 mt-2">
              <Button variant="outline-secondary" className="rounded-pill px-4 btn-sm fw-bold hover-lift" onClick={() => setShowEventModal(false)} disabled={loading}>
                Batal
              </Button>
              <Button variant="primary" className="rounded-pill px-4 btn-sm fw-bold hover-lift text-white" type="submit" disabled={loading} style={{ background: orgStyle.gradient, border: 'none' }}>
                {loading ? "Mengirim..." : "Kirim Proposal Kegiatan"}
              </Button>
            </div>
          </Form>
        </Modal.Body>
      </Modal>

    </div>
  );
}
