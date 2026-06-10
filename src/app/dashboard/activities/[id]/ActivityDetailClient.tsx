'use client'

import { useState } from "react";
import Link from "next/link";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Form, Button, Card, Modal } from "react-bootstrap";
import { 
  registerForEvent, 
  approveEventProposal, 
  rejectEventProposal,
  markEventAsAchievement
} from "@/app/actions/activities";
import { getFacultyStyle } from "@/utils/faculty";

const rejectFormSchema = z.object({
  comment: z.string().min(5, "Alasan penolakan minimal 5 karakter"),
});

type RejectInput = z.infer<typeof rejectFormSchema>;

interface ActivityDetailClientProps {
  event: any;
  organizer: any;
  creatorName: string | null;
  user: {
    id: string;
    name: string;
    role: "student" | "lecturer" | "admin";
  };
  registrationStatus: "not_registered" | "pending" | "approved" | "rejected";
}

export default function ActivityDetailClient({ 
  event, 
  organizer,
  creatorName, 
  user,
  registrationStatus 
}: ActivityDetailClientProps) {
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [showRejectModal, setShowRejectModal] = useState(false);

  const orgStyle = getFacultyStyle(organizer.scopeName || organizer.name);

  // Rejection comment form hooks
  const {
    register: rejectInputFields,
    handleSubmit: handleRejectSubmit,
    formState: { errors: rejectErrors },
  } = useForm<RejectInput>({
    resolver: zodResolver(rejectFormSchema),
  });

  const onRegister = async () => {
    if (!confirm("Apakah Anda yakin ingin mendaftar ke kegiatan ini?")) return;
    setLoading(true);
    setErrorMsg(null);
    setSuccessMsg(null);

    try {
      const result = await registerForEvent(event.id);
      if (result.success) {
        setSuccessMsg("Pendaftaran Anda berhasil dikirim!");
        setTimeout(() => window.location.reload(), 1500);
      } else {
        setErrorMsg(result.error || "Gagal melakukan pendaftaran.");
      }
    } catch (err) {
      setErrorMsg("Koneksi gagal atau terjadi kesalahan server.");
    } finally {
      setLoading(false);
    }
  };

  const onApprove = async () => {
    if (!confirm("Apakah Anda yakin ingin menyetujui proposal kegiatan ini?")) return;
    setLoading(true);
    setErrorMsg(null);
    setSuccessMsg(null);

    try {
      const result = await approveEventProposal(event.id, user.role as "lecturer" | "admin");
      if (result.success) {
        setSuccessMsg("Proposal disetujui dan status telah diperbarui!");
        setTimeout(() => window.location.reload(), 1500);
      } else {
        setErrorMsg(result.error || "Gagal menyetujui proposal.");
      }
    } catch (err) {
      setErrorMsg("Kesalahan server saat memproses persetujuan.");
    } finally {
      setLoading(false);
    }
  };

  const onReject = async (data: RejectInput) => {
    setLoading(true);
    setErrorMsg(null);
    setSuccessMsg(null);

    try {
      const result = await rejectEventProposal(event.id, data.comment);
      if (result.success) {
        setSuccessMsg("Proposal kegiatan ditolak dan dikembalikan ke pengaju.");
        setShowRejectModal(false);
        setTimeout(() => window.location.reload(), 1500);
      } else {
        setErrorMsg(result.error || "Gagal menolak proposal.");
      }
    } catch (err) {
      setErrorMsg("Kesalahan server saat memproses penolakan.");
    } finally {
      setLoading(false);
    }
  };

  const handleMarkAsCompleted = async () => {
    if (!confirm("Tandai kegiatan ini sebagai SELESAI dan catat sebagai prestasi Ormawa?")) return;
    setLoading(true);
    setErrorMsg(null);
    setSuccessMsg(null);

    try {
      const result = await markEventAsAchievement(event.id);
      if (result.success) {
        setSuccessMsg("Kegiatan sukses diselesaikan dan masuk dalam papan prestasi!");
        setTimeout(() => window.location.reload(), 1500);
      } else {
        setErrorMsg(result.error || "Gagal memperbarui status kegiatan.");
      }
    } catch (err) {
      setErrorMsg("Terjadi kesalahan.");
    } finally {
      setLoading(false);
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case "open": return <span className="badge bg-success px-3 py-2 rounded-pill">Pendaftaran Buka / Terbit</span>;
      case "closed": return <span className="badge bg-secondary px-3 py-2 rounded-pill">Ditutup</span>;
      case "pending_advisor": return <span className="badge bg-warning text-dark px-3 py-2 rounded-pill">Review Admin</span>;
      case "pending_dean": return <span className="badge bg-info text-white px-3 py-2 rounded-pill">Review Admin</span>;
      case "rejected": return <span className="badge bg-danger px-3 py-2 rounded-pill">Proposal Ditolak</span>;
      default: return <span className="badge bg-light text-dark px-3 py-2 rounded-pill">{status}</span>;
    }
  };

  const getFaseLabel = (fase: string) => {
    switch (fase) {
      case "Akan Datang": return <span className="badge bg-primary-subtle text-primary border border-primary px-3 py-1.5 rounded-pill small">Akan Datang</span>;
      case "Sedang Berlangsung": return <span className="badge bg-warning-subtle text-warning border border-warning px-3 py-1.5 rounded-pill small">Sedang Berlangsung</span>;
      case "Selesai": return <span className="badge bg-success-subtle text-success border border-success px-3 py-1.5 rounded-pill small">Selesai / Terlaksana</span>;
      default: return null;
    }
  };

  return (
    <div className="container-fluid p-0">
      
      {/* Navigation link back */}
      <div className="mb-4">
        <Link href="/dashboard/activities" className="text-secondary text-decoration-none small fw-semibold btn-back-hover d-inline-flex align-items-center gap-1">
          <i className="bi bi-arrow-left animate-arrow-left"></i> Kembali ke Daftar Kegiatan
        </Link>
      </div>

      {errorMsg && <div className="alert alert-danger rounded-3 py-3 mb-4">{errorMsg}</div>}
      {successMsg && <div className="alert alert-success rounded-3 py-3 mb-4">{successMsg}</div>}

      <div className="row g-4">
        
        {/* Left Side: Event Content details */}
        <div className="col-lg-8">
          <div className="card-glass-static border-0 p-4 p-md-5 rounded-4 shadow-sm text-dark">
            
            {/* Header metadata */}
            <div className="d-flex flex-wrap justify-content-between align-items-center gap-2 mb-3">
              <div className="d-flex gap-2 align-items-center">
                <span className="badge border px-3 py-2 rounded-pill fw-semibold text-uppercase small" style={{ backgroundColor: orgStyle.lightBg, color: orgStyle.primary, borderColor: orgStyle.borderSubtle }}>
                  {event.category}
                </span>
                {getFaseLabel(event.eventState)}
              </div>
              {getStatusLabel(event.status)}
            </div>

            <h2 className="fw-extrabold text-dark mb-4">{event.name}</h2>
            
            <h5 className="fw-bold mb-3">Deskripsi & Tujuan Kegiatan</h5>
            <p className="text-secondary leading-relaxed mb-4" style={{ whiteSpace: "pre-line" }}>
              {event.description}
            </p>

            <div className="row g-3 border-top pt-4 mt-4">
              <div className="col-sm-6">
                <span className="text-muted small d-block">Penyelenggara (Ormawa Induk)</span>
                <strong className="text-dark">
                  <Link href={`/dashboard/organizations/${organizer.id}`} className="text-decoration-none hover-underline" style={{ color: orgStyle.primary, fontWeight: 'bold' }}>
                    {organizer.name} <i className="bi bi-box-arrow-up-right small ms-1"></i>
                  </Link>
                </strong>
              </div>
              <div className="col-sm-6">
                <span className="text-muted small d-block">Lokasi</span>
                <strong className="text-dark">{event.location || "-"}</strong>
              </div>
              <div className="col-sm-6">
                <span className="text-muted small d-block">Diajukan Oleh</span>
                <strong className="text-dark">{creatorName || "Pengurus Ormawa"}</strong>
              </div>
              <div className="col-sm-6">
                <span className="text-muted small d-block">Tanggal Pelaksanaan</span>
                <strong className="text-dark">
                  {new Date(event.startDate).toLocaleDateString("id-ID")} s/d {new Date(event.endDate).toLocaleDateString("id-ID")}
                </strong>
              </div>
              {event.category === "Delegasi/Lomba" && event.externalOrganizer && (
                <div className="col-sm-6">
                  <span className="text-muted small d-block">Penyelenggara Eksternal</span>
                  <strong className="text-dark">{event.externalOrganizer}</strong>
                </div>
              )}
            </div>

          </div>
        </div>

        {/* Right Side: Sidebar Actions / Controls */}
        <div className="col-lg-4">
          
          {/* Card stats / Kuota (Only for Program Kerja) */}
          {event.category === "Program Kerja" && (
            <div className="card-glass-static border-0 p-4 rounded-4 shadow-sm text-dark mb-4 text-center">
              <h6 className="text-muted small fw-semibold uppercase mb-2">Kuota Terisi</h6>
              <h1 className="display-4 fw-extrabold text-dark mb-2">{event.registered} <span className="fs-3 text-muted">/ {event.quota}</span></h1>
              <div className="progress rounded-pill mb-2" style={{ height: "10px" }}>
                <div 
                  className="progress-bar rounded-pill" 
                  role="progressbar" 
                  style={{ 
                    width: `${Math.min(100, (event.registered / event.quota) * 100)}%`,
                    backgroundColor: orgStyle.primary
                  }}
                  aria-valuenow={event.registered} 
                  aria-valuemin={0} 
                  aria-valuemax={event.quota}
                ></div>
              </div>
              <span className="text-muted small">Mahasiswa terdaftar sebagai peserta</span>
            </div>
          )}

          {/* Dynamic Actions based on Role and Status */}
          
          {/* 1. LECTURER CONTROL AREA */}
          {user.role === "lecturer" && event.status === "pending_advisor" && (
            <div className="card-glass-static border-0 p-4 rounded-4 shadow-sm text-dark mb-4">
              <h5 className="fw-bold text-dark mb-3">Persetujuan Pembina</h5>
              <p className="text-muted small mb-4">Sebagai Admin, Anda dapat menyetujui pengajuan proposal kegiatan ini untuk dilanjutkan ke tahap admin berikutnya.</p>
              
              <div className="d-flex flex-column gap-2">
                <button className="btn btn-success py-2.5 rounded-pill fw-bold hover-lift shadow-sm btn-sm" onClick={onApprove} disabled={loading}>
                  <i className="bi bi-check-lg me-2"></i> Setujui Proposal
                </button>
                <button className="btn btn-outline-danger py-2.5 rounded-pill fw-bold hover-lift shadow-sm btn-sm" onClick={() => setShowRejectModal(true)} disabled={loading}>
                  <i className="bi bi-x-lg me-2"></i> Tolak Proposal
                </button>
              </div>
            </div>
          )}

          {/* 2. ADMIN / VICE DEAN CONTROL AREA */}
          {user.role === "admin" && event.status === "pending_dean" && (
            <div className="card-glass-static border-0 p-4 rounded-4 shadow-sm text-dark mb-4">
              <h5 className="fw-bold text-dark mb-3">Persetujuan Admin</h5>
              <p className="text-muted small mb-4">Sebagai Admin, menyetujui proposal ini akan otomatis membuka status pendaftaran mahasiswa secara publik.</p>
              
              <div className="d-flex flex-column gap-2">
                <button className="btn btn-primary py-2.5 rounded-pill fw-bold hover-lift shadow-sm btn-sm text-white" onClick={onApprove} disabled={loading} style={{ background: 'var(--primary-gradient)', border: 'none' }}>
                  <i className="bi bi-check-lg me-2"></i> Setujui & Buka Kegiatan
                </button>
                <button className="btn btn-outline-danger py-2.5 rounded-pill fw-bold hover-lift shadow-sm btn-sm" onClick={() => setShowRejectModal(true)} disabled={loading}>
                  <i className="bi bi-x-lg me-2"></i> Tolak Proposal
                </button>
              </div>
            </div>
          )}

          {/* 3. STUDENT REGISTRATION FLOW (Only for open Program Kerja events) */}
          {user.role === "student" && event.status === "open" && event.category === "Program Kerja" && (
            <div className="card-glass-static border-0 p-4 rounded-4 shadow-sm text-dark mb-4">
              <h5 className="fw-bold text-dark mb-3">Registrasi Peserta</h5>
              
              {registrationStatus === "approved" ? (
                <div className="alert alert-success border-0 py-3 mb-0 small text-center fw-medium">
                  <i className="bi bi-check-circle-fill me-2"></i> Anda telah resmi terdaftar dalam kegiatan ini!
                </div>
              ) : (
                <>
                  {event.registered >= event.quota ? (
                    <div className="alert alert-danger border-0 py-3 mb-0 small text-center fw-medium">
                      Kuota Pendaftaran Penuh
                    </div>
                  ) : (
                    <button className="btn text-white w-100 py-2.5 rounded-pill fw-bold hover-lift shadow-sm" style={{ background: orgStyle.gradient, border: 'none' }} onClick={onRegister} disabled={loading}>
                      {loading ? "Mendaftarkan..." : "Daftar Kegiatan"}
                    </button>
                  )}
                </>
              )}
            </div>
          )}

          {/* 4. LEADER/MANAGER EVENT FINISH FLOW (For open upcoming/ongoing events) */}
          {(user.role === "admin" || user.id === event.createdBy) && event.status === "open" && event.eventState !== "Selesai" && (
            <div className="card-glass-static border-0 p-4 rounded-4 shadow-sm text-dark mb-4 text-center">
              <h5 className="fw-bold text-dark mb-3">Manajemen Event</h5>
              <p className="text-secondary small mb-4">Tandai kegiatan ini sebagai selesai jika pelaksanaan program kerja atau kompetisi delegasi telah berakhir.</p>
              <button className="btn btn-warning w-100 py-2.5 rounded-pill fw-bold hover-lift shadow-sm text-dark" onClick={handleMarkAsCompleted} disabled={loading}>
                Selesaikan Kegiatan & Log Prestasi
              </button>
            </div>
          )}

          {/* Locked / Closed Info Card */}
          {event.status !== "open" && user.role === "student" && (
            <div className="card-glass-static border-0 p-4 rounded-4 shadow-sm text-dark text-center">
              <i className="bi bi-lock-fill display-5 text-secondary opacity-50 mb-2"></i>
              <h5 className="fw-bold">Pendaftaran Terkunci</h5>
              <p className="text-secondary small mb-0">Status proposal kegiatan ini adalah <strong>{event.status.replace("_", " ")}</strong>.</p>
            </div>
          )}

        </div>
      </div>

      {/* REJECTION COMMENT MODAL */}
      <Modal show={showRejectModal} onHide={() => setShowRejectModal(false)} centered>
        <Modal.Header closeButton className="border-0 pb-0">
          <Modal.Title className="fw-bold">Alasan Penolakan Proposal</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <Form onSubmit={handleRejectSubmit(onReject)}>
            <Form.Group className="mb-3">
              <Form.Label className="small fw-semibold text-secondary">Catatan Evaluasi / Alasan Penolakan</Form.Label>
              <Form.Control
                as="textarea"
                rows={3}
                placeholder="Tulis alasan penolakan secara mendalam untuk panduan perbaikan..."
                className={rejectErrors.comment ? 'is-invalid' : ''}
                style={{ borderRadius: "10px", padding: "12px" }}
                {...rejectInputFields("comment")}
              />
              {rejectErrors.comment && <div className="invalid-feedback">{rejectErrors.comment.message}</div>}
            </Form.Group>

            <div className="d-flex justify-content-end gap-2 pt-2 border-top">
              <Button variant="outline-secondary" className="rounded-pill px-4 btn-sm fw-bold hover-lift" onClick={() => setShowRejectModal(false)} disabled={loading}>
                Batal
              </Button>
              <Button variant="danger" className="rounded-pill px-4 btn-sm fw-bold hover-lift" type="submit" disabled={loading}>
                {loading ? "Menolak..." : "Tolak Proposal"}
              </Button>
            </div>
          </Form>
        </Modal.Body>
      </Modal>

    </div>
  );
}
