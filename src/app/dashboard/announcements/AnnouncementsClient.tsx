'use client'

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Modal, Button, Form, Card } from "react-bootstrap";
import { createAnnouncement } from "@/app/actions/board";
import { getFacultyStyle } from "@/utils/faculty";
import PremiumIcon from "@/components/PremiumIcon";

const announcementSchema = z.object({
  title: z.string().min(5, "Judul minimal 5 karakter"),
  content: z.string().min(10, "Isi pengumuman minimal 10 karakter"),
  isUrgent: z.boolean().default(false),
  isPublic: z.boolean().default(true),
  activityId: z.coerce.number().int("Pilih kegiatan terkait"),
});

type AnnouncementInput = z.infer<typeof announcementSchema>;

interface AnnouncementsClientProps {
  announcements: any[];
  activities: any[];
  userRole: string;
}

export default function AnnouncementsClient({ announcements: list, activities, userRole }: AnnouncementsClientProps) {
  const [showModal, setShowModal] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors: anyErrors },
  } = useForm<any>({
    resolver: zodResolver(announcementSchema),
    defaultValues: {
      isUrgent: false,
      isPublic: true,
    }
  });
  const errors = anyErrors as any;

  const onSubmit = async (data: AnnouncementInput) => {
    setLoading(true);
    setErrorMsg(null);
    setSuccessMsg(null);

    const formData = new FormData();
    formData.append("title", data.title);
    formData.append("content", data.content);
    formData.append("isUrgent", data.isUrgent ? "true" : "false");
    formData.append("isPublic", data.isPublic ? "true" : "false");
    formData.append("activityId", data.activityId.toString());

    try {
      const result = await createAnnouncement(formData);
      if (result.success) {
        setSuccessMsg("Pengumuman berhasil diterbitkan.");
        reset();
        setTimeout(() => {
          setShowModal(false);
          setSuccessMsg(null);
          window.location.reload();
        }, 1500);
      } else {
        setErrorMsg(result.error || "Gagal membuat pengumuman.");
      }
    } catch (err) {
      setErrorMsg("Koneksi gagal atau terjadi kesalahan server.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container-fluid p-0">
      
      <div className="d-flex justify-content-between align-items-center mb-4">
        <div>
          <h4 className="fw-bold text-dark mb-1">Mading ORMAWA</h4>
          <p className="text-secondary small mb-0">Kabar terbaru dari organisasi mahasiswa UNSRAT.</p>
        </div>
        {userRole === "admin" && (
          <button className="btn btn-primary rounded-pill hover-lift d-flex align-items-center gap-2 px-4 py-2.5 shadow-sm fw-bold border-0" onClick={() => setShowModal(true)}>
            <i className="bi bi-megaphone-fill"></i>
            <span>Tulis Pengumuman</span>
          </button>
        )}
      </div>

      <div className="row g-4">
        <div className="col-12">
          {list.length === 0 ? (
            <div className="card-glass-static border-0 shadow-sm rounded-4 p-5 text-center text-dark">
              <i className="bi bi-megaphone display-4 text-secondary opacity-50 mb-3"></i>
              <h5 className="fw-bold">Belum Ada Kabar</h5>
              <p className="text-secondary small mb-0">Belum ada pengumuman yang diterbitkan.</p>
            </div>
          ) : (
            <div className="d-flex flex-column gap-3">
              {list.map((ann) => {
                const orgStyle = getFacultyStyle(ann.activityName);
                return (
                  <div key={ann.id} className="card-glass-static border-0 p-4 rounded-4 shadow-sm hover-lift text-dark d-flex align-items-start gap-3" style={{ borderLeft: `4px solid ${ann.isUrgent ? '#dc3545' : orgStyle.primary}` }}>
                    
                    <PremiumIcon 
                      icon={ann.isUrgent ? 'bi-exclamation-triangle-fill' : orgStyle.icon}
                      primaryColor={ann.isUrgent ? '#dc3545' : orgStyle.primary}
                      lightBgColor={ann.isUrgent ? 'rgba(220, 53, 69, 0.1)' : orgStyle.lightBg}
                      size={50}
                    />

                    <div className="flex-grow-1">
                      <div className="d-flex justify-content-between align-items-center flex-wrap gap-2 mb-2">
                        <h5 className="fw-bold text-dark mb-0">{ann.title}</h5>
                        <div className="d-flex gap-2 align-items-center">
                          {ann.isUrgent && <span className="badge bg-danger">Penting</span>}
                          {ann.isPublic ? (
                            <span className="badge bg-success bg-opacity-10 text-success border border-success-subtle px-2 py-0.5" style={{ fontSize: '0.72rem' }}>Publik</span>
                          ) : (
                            <span className="badge bg-secondary bg-opacity-10 text-secondary border border-secondary-subtle px-2 py-0.5" style={{ fontSize: '0.72rem' }}>Internal Anggota</span>
                          )}
                          <span className="text-muted small">{new Date(ann.createdAt).toLocaleDateString("id-ID")}</span>
                        </div>
                      </div>
                      
                      <p className="text-secondary small mb-3 leading-relaxed" style={{ whiteSpace: "pre-line" }}>{ann.content}</p>
                      
                      <div className="d-flex align-items-center gap-2 border-top pt-2">
                        <i className="bi bi-tag text-muted small"></i>
                        <span className="text-muted small">Dari: <strong style={{ color: orgStyle.primary }}>{ann.activityName}</strong></span>
                      </div>
                    </div>

                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* CREATE ANNOUNCEMENT MODAL */}
      <Modal show={showModal} onHide={() => setShowModal(false)} size="lg" centered>
        <Modal.Header closeButton className="border-0 pb-0">
          <Modal.Title className="fw-bold">Tulis Pengumuman</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {errorMsg && <div className="alert alert-danger rounded-3 py-2 small mb-3">{errorMsg}</div>}
          {successMsg && <div className="alert alert-success rounded-3 py-2 small mb-3">{successMsg}</div>}

          <Form onSubmit={handleSubmit(onSubmit)}>
            <div className="row g-3">
              
              {/* Title */}
              <div className="col-12">
                <Form.Group>
                  <Form.Label className="small fw-semibold text-secondary">Judul</Form.Label>
                  <div className="input-group">
                    <span className="input-group-text text-secondary bg-light border-end-0" style={{ borderTopLeftRadius: "10px", borderBottomLeftRadius: "10px" }}>
                      <i className="bi bi-chat-left-text"></i>
                    </span>
                    <Form.Control
                      type="text"
                      placeholder="Contoh: Jadwal rapat anggota HMTI minggu ini"
                      className={`border-start-0 ${errors.title ? 'is-invalid' : ''}`}
                      style={{ borderTopRightRadius: "10px", borderBottomRightRadius: "10px" }}
                      {...register("title")}
                    />
                    {errors.title && <div className="invalid-feedback text-danger small mt-1">{errors.title.message}</div>}
                  </div>
                </Form.Group>
              </div>

              {/* Content */}
              <div className="col-12">
                <Form.Group>
                  <Form.Label className="small fw-semibold text-secondary">Isi Pengumuman</Form.Label>
                  <Form.Control
                    as="textarea"
                    rows={4}
                    placeholder="Tulis informasi utama, waktu, tempat, dan hal penting yang perlu diketahui anggota."
                    className={errors.content ? 'is-invalid' : ''}
                    style={{ borderRadius: "10px", padding: "12px" }}
                    {...register("content")}
                  />
                  {errors.content && <div className="invalid-feedback">{errors.content.message}</div>}
                </Form.Group>
              </div>

              {/* Activity Link */}
              <div className="col-md-6">
                <Form.Group>
                  <Form.Label className="small fw-semibold text-secondary">Tautkan ke ORMAWA/Kegiatan</Form.Label>
                  <div className="input-group">
                    <span className="input-group-text text-secondary bg-light border-end-0" style={{ borderTopLeftRadius: "10px", borderBottomLeftRadius: "10px" }}>
                      <i className="bi bi-grid"></i>
                    </span>
                    <Form.Select 
                      className={`border-start-0 ${errors.activityId ? 'is-invalid' : ''}`} 
                      style={{ borderTopRightRadius: "10px", borderBottomRightRadius: "10px" }}
                      {...register("activityId")}
                    >
                      <option value="">-- Pilih ORMAWA atau kegiatan --</option>
                      {activities.map((act) => (
                        <option key={act.id} value={act.id}>{act.name}</option>
                      ))}
                    </Form.Select>
                    {errors.activityId && <div className="invalid-feedback text-danger small mt-1">{errors.activityId.message}</div>}
                  </div>
                </Form.Group>
              </div>

              {/* Is Urgent checkbox */}
              <div className="col-md-6 d-flex align-items-center mt-4">
                <Form.Group className="mb-0">
                  <Form.Check
                    type="checkbox"
                    id="isUrgent"
                    label="Tandai sebagai penting"
                    className="fw-semibold text-danger small"
                    {...register("isUrgent")}
                  />
                </Form.Group>
              </div>

              {/* Is Public Switch */}
              <div className="col-md-6 d-flex align-items-center mt-3">
                <Form.Group className="mb-0">
                  <Form.Check
                    type="switch"
                    id="isPublic"
                    label="Tampilkan untuk umum"
                    className="fw-semibold text-secondary small"
                    {...register("isPublic")}
                  />
                </Form.Group>
              </div>

            </div>

            <div className="d-flex justify-content-end gap-2 mt-4 pt-3 border-top">
              <Button variant="outline-secondary" className="rounded-pill px-4 btn-sm fw-bold hover-lift" onClick={() => setShowModal(false)} disabled={loading}>
                Batal
              </Button>
              <Button variant="primary" type="submit" className="rounded-pill px-4 btn-sm fw-bold hover-lift text-white border-0" disabled={loading} style={{ background: "var(--primary-gradient)" }}>
                {loading ? "Menerbitkan..." : "Terbitkan"}
              </Button>
            </div>
          </Form>
        </Modal.Body>
      </Modal>

    </div>
  );
}
