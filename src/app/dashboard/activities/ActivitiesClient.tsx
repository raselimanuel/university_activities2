'use client'

import { useState } from "react";
import Link from "next/link";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Modal, Button, Form } from "react-bootstrap";
import { submitNewEventProposal } from "@/app/actions/activities";
import { getFacultyStyle } from "@/utils/faculty";

const proposalSchema = z.object({
  activityId: z.coerce.number().int("Wajib memilih organisasi pengaju"),
  name: z.string().min(5, "Nama kegiatan minimal 5 karakter"),
  description: z.string().min(20, "Deskripsi minimal 20 karakter"),
  category: z.enum(["Program Kerja", "Delegasi/Lomba"]),
  location: z.string().min(3, "Lokasi minimal 3 karakter"),
  externalOrganizer: z.string().optional(),
  quota: z.coerce.number().optional(),
  startDate: z.string().min(1, "Tanggal mulai wajib diisi"),
  endDate: z.string().min(1, "Tanggal selesai wajib diisi"),
});

type ProposalInput = z.infer<typeof proposalSchema>;

interface ActivitiesClientProps {
  initialActivities: any[]; // Array of { event: any, organizer: string }
  managedOrganizations: Array<{ id: number; name: string }>;
  user: {
    id: string;
    name: string;
    role: "student" | "lecturer" | "admin";
  };
}

export default function ActivitiesClient({ 
  initialActivities, 
  managedOrganizations, 
  user 
}: ActivitiesClientProps) {
  const [showModal, setShowModal] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const isEligibleToPropose = user.role !== "student" || managedOrganizations.length > 0;

  const {
    register,
    handleSubmit,
    reset,
    watch,
    formState: { errors: anyErrors },
  } = useForm<ProposalInput>({
    resolver: zodResolver(proposalSchema) as any,
    defaultValues: {
      category: "Program Kerja",
    }
  });
  const errors = anyErrors as any;

  const watchedCategory = watch("category");

  const onSubmit = async (data: ProposalInput) => {
    setLoading(true);
    setErrorMessage(null);
    setSuccessMessage(null);

    const formData = new FormData();
    formData.append("activityId", data.activityId.toString());
    formData.append("name", data.name);
    formData.append("description", data.description);
    formData.append("category", data.category);
    formData.append("location", data.location);
    formData.append("externalOrganizer", data.externalOrganizer || "");
    formData.append("quota", data.quota ? data.quota.toString() : "");
    formData.append("startDate", data.startDate);
    formData.append("endDate", data.endDate);

    try {
      const result = await submitNewEventProposal(formData);
      if (result.success) {
        setSuccessMessage("Proposal kegiatan berhasil diajukan untuk tinjauan pembina!");
        reset();
        setTimeout(() => {
          setShowModal(false);
          setSuccessMessage(null);
          window.location.reload(); // Refresh the list
        }, 1500);
      } else {
        setErrorMessage(result.error || "Gagal mengajukan proposal kegiatan.");
      }
    } catch (err) {
      setErrorMessage("Koneksi gagal atau terjadi kesalahan server.");
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "open":
        return <span className="badge bg-success bg-opacity-10 text-success border border-success-subtle px-2.5 py-1 fw-bold">Terbit</span>;
      case "closed":
        return <span className="badge bg-secondary bg-opacity-10 text-secondary border border-secondary-subtle px-2.5 py-1">Selesai</span>;
      case "pending_advisor":
        return <span className="badge bg-warning bg-opacity-10 text-warning border border-warning-subtle px-2.5 py-1">Review Pembina</span>;
      case "pending_dean":
        return <span className="badge bg-info bg-opacity-10 text-info border border-info-subtle px-2.5 py-1">Review Admin</span>;
      case "rejected":
        return <span className="badge bg-danger bg-opacity-10 text-danger border border-danger-subtle px-2.5 py-1">Ditolak</span>;
      default:
        return <span className="badge bg-light text-secondary border px-2.5 py-1">{status}</span>;
    }
  };

  return (
    <div className="container-fluid p-0">
      
      {/* Header and Quick action */}
      <div className="d-flex justify-content-between align-items-center mb-4 flex-wrap gap-3">
        <div>
          <h4 className="fw-extrabold text-dark mb-1">Kegiatan & Proker Kampus</h4>
          <p className="text-secondary small mb-0 fw-medium">Direktori program kerja, delegasi, dan kompetisi resmi ORMAWA UNSRAT</p>
        </div>
        {isEligibleToPropose && (
          <button className="btn btn-primary hover-lift d-flex align-items-center gap-2 py-2.5 px-4 rounded-pill shadow-sm" onClick={() => setShowModal(true)}>
            <i className="bi bi-plus-circle-fill"></i>
            <span className="fw-bold">Ajukan Proposal Event</span>
          </button>
        )}
      </div>

      {/* Grid for Students, Table for Lecturers/Admins */}
      {user.role === "student" ? (
        <div className="row g-4">
          {initialActivities.length === 0 ? (
            <div className="col-12 text-center py-5">
              <i className="bi bi-calendar-x display-3 text-secondary opacity-50 mb-3"></i>
              <h5>Tidak Ada Pendaftaran Aktif</h5>
              <p className="text-secondary small">Belum ada kegiatan kemahasiswaan yang dibuka pendaftarannya saat ini.</p>
            </div>
          ) : (
            initialActivities.map(({ event, organizer }) => {
              const orgStyle = getFacultyStyle(organizer);
              return (
                <div key={event.id} className="col-md-6 col-lg-4">
                  <div className="card border-0 rounded-4 h-100 overflow-hidden card-glass-premium d-flex flex-column justify-content-between border-top border-4" style={{ borderTopColor: orgStyle.primary }}>
                    <div className="card-body p-4 d-flex flex-column justify-content-between">
                      <div>
                        <div className="d-flex justify-content-between align-items-start mb-3">
                          <span className="badge border px-2.5 py-1 text-uppercase small fw-bold" style={{ backgroundColor: orgStyle.lightBg, color: orgStyle.primary, borderColor: orgStyle.borderSubtle }}>
                            {event.category}
                          </span>
                          {getStatusBadge(event.status)}
                        </div>
                        <h5 className="fw-extrabold text-dark mb-1" style={{ fontSize: '1.1rem' }}>{event.name}</h5>
                        <span className="text-muted small d-block mb-3">Penyelenggara: <strong style={{ color: orgStyle.primary }}>{organizer}</strong></span>
                        <p className="text-secondary small text-truncate-3 mb-4" style={{ lineHeight: 1.5 }}>{event.description}</p>
                      </div>

                      <div className="border-top border-light pt-3 mt-auto">
                        <div className="d-flex justify-content-between align-items-center mb-3">
                          {event.category === "Program Kerja" ? (
                            <span className="text-muted small">
                              <i className="bi bi-people me-1"></i> Pendaftar: <strong>{event.registered}/{event.quota}</strong>
                            </span>
                          ) : (
                            <span className="text-muted small">
                              <i className="bi bi-award me-1"></i> Delegasi Lomba
                            </span>
                          )}
                          <span className="text-muted small">
                            <i className="bi bi-geo-alt me-1"></i> <strong>{event.location || "Kampus"}</strong>
                          </span>
                        </div>
                        <Link href={`/dashboard/activities/${event.id}`} className="btn w-100 py-2 fw-bold text-white hover-lift" style={{ background: orgStyle.gradient }}>
                          Lihat Selengkapnya
                        </Link>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>
      ) : (
        /* Lecturer / Admin Table View */
        <div className="card border-0 rounded-4 card-glass-static">
          <div className="card-body p-4">
            {initialActivities.length === 0 ? (
              <p className="text-center text-secondary py-5 small mb-0">Belum ada proposal kegiatan terdaftar.</p>
            ) : (
              <div className="table-responsive">
                <table className="table table-hover align-middle no-line-table">
                  <thead>
                    <tr className="text-secondary small">
                      <th>Nama Kegiatan</th>
                      <th>Penyelenggara</th>
                      <th>Kategori</th>
                      <th>Lokasi</th>
                      <th>Pendaftar</th>
                      <th>Status Proposal</th>
                      <th className="text-end">Aksi</th>
                    </tr>
                  </thead>
                  <tbody>
                    {initialActivities.map(({ event, organizer }) => {
                      const orgStyle = getFacultyStyle(organizer);
                      return (
                        <tr key={event.id}>
                          <td>
                            <span className="fw-bold text-dark d-block">{event.name}</span>
                            <span className="text-muted small">Mulai: {new Date(event.startDate).toLocaleDateString("id-ID")}</span>
                          </td>
                          <td>
                            <span className="badge border px-2.5 py-1 fw-bold" style={{ backgroundColor: orgStyle.lightBg, color: orgStyle.primary, borderColor: orgStyle.borderSubtle }}>
                              {organizer}
                            </span>
                          </td>
                          <td>
                            <span className="badge bg-light text-secondary">{event.category}</span>
                          </td>
                          <td>
                            <span className="small text-secondary">{event.location || "-"}</span>
                          </td>
                          <td>
                            {event.category === "Program Kerja" ? (
                              <span className="small fw-semibold">{event.registered}/{event.quota}</span>
                            ) : (
                              <span className="text-muted small">Delegasi</span>
                            )}
                          </td>
                          <td>
                            {getStatusBadge(event.status)}
                          </td>
                          <td className="text-end">
                            <Link href={`/dashboard/activities/${event.id}`} className="btn btn-sm text-white fw-bold px-3" style={{ background: orgStyle.gradient }}>
                              Tinjau
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
        </div>
      )}

      {/* AJUKAN PROPOSAL EVENT MODAL */}
      <Modal show={showModal} onHide={() => setShowModal(false)} backdrop="static" keyboard={false} size="lg" centered>
        <Modal.Header closeButton className="border-0 pb-0">
          <Modal.Title className="fw-bold">Formulir Pengajuan Proposal Kegiatan</Modal.Title>
        </Modal.Header>
        <Modal.Body className="pt-2">
          
          {errorMessage && (
            <div className="alert alert-danger rounded-3 py-2.5 small mb-3">{errorMessage}</div>
          )}
          {successMessage && (
            <div className="alert alert-success rounded-3 py-2.5 small mb-3">{successMessage}</div>
          )}

          <Form onSubmit={handleSubmit(onSubmit)}>
            <div className="row g-3">
              
              {/* Select Organizing Ormawa */}
              <div className="col-12">
                <Form.Group>
                  <Form.Label className="small fw-semibold text-secondary">Organisasi Pengaju</Form.Label>
                  {user.role === "admin" ? (
                    <Form.Select className={`py-2 curator-input ${errors.activityId ? 'is-invalid' : ''}`} {...register("activityId")}>
                      <option value="">-- Pilih Organisasi --</option>
                      {managedOrganizations.map(org => (
                        <option key={org.id} value={org.id}>{org.name}</option>
                      ))}
                    </Form.Select>
                  ) : (
                    <Form.Select className={`py-2 curator-input ${errors.activityId ? 'is-invalid' : ''}`} {...register("activityId")}>
                      <option value="">-- Pilih Organisasi --</option>
                      {managedOrganizations.map(org => (
                        <option key={org.id} value={org.id}>{org.name}</option>
                      ))}
                    </Form.Select>
                  )}
                  {errors.activityId && <div className="invalid-feedback">{errors.activityId.message}</div>}
                </Form.Group>
              </div>

              {/* Event Name */}
              <div className="col-12">
                <Form.Group>
                  <Form.Label className="small fw-semibold text-secondary">Nama Kegiatan / Event</Form.Label>
                  <Form.Control
                    type="text"
                    placeholder="Contoh: Latihan Kepemimpinan Mahasiswa Informatika"
                    className={`py-2 curator-input ${errors.name ? 'is-invalid' : ''}`}
                    {...register("name")}
                  />
                  {errors.name && <div className="invalid-feedback">{errors.name.message}</div>}
                </Form.Group>
              </div>

              {/* Description */}
              <div className="col-12">
                <Form.Group>
                  <Form.Label className="small fw-semibold text-secondary">Deskripsi & Tujuan Kegiatan</Form.Label>
                  <Form.Control
                    as="textarea"
                    rows={4}
                    placeholder="Jelaskan secara mendalam tentang rincian, tujuan, dan sasaran dari kegiatan yang diajukan ini..."
                    className={`py-2 curator-input ${errors.description ? 'is-invalid' : ''}`}
                    {...register("description")}
                  />
                  {errors.description && <div className="invalid-feedback">{errors.description.message}</div>}
                </Form.Group>
              </div>

              {/* Category */}
              <div className="col-md-6">
                <Form.Group>
                  <Form.Label className="small fw-semibold text-secondary">Kategori Kegiatan</Form.Label>
                  <Form.Select className={`py-2 curator-input ${errors.category ? 'is-invalid' : ''}`} {...register("category")}>
                    <option value="Program Kerja">Program Kerja (Bisa diikuti/daftar mahasiswa)</option>
                    <option value="Delegasi/Lomba">Delegasi / Lomba Mandiri</option>
                  </Form.Select>
                  {errors.category && <div className="invalid-feedback">{errors.category.message}</div>}
                </Form.Group>
              </div>

              {/* Location */}
              <div className="col-md-6">
                <Form.Group>
                  <Form.Label className="small fw-semibold text-secondary">Lokasi Pelaksanaan</Form.Label>
                  <Form.Control
                    type="text"
                    placeholder="Contoh: Auditorium FT, Zoom, dsb."
                    className={`py-2 curator-input ${errors.location ? 'is-invalid' : ''}`}
                    {...register("location")}
                  />
                  {errors.location && <div className="invalid-feedback">{errors.location.message}</div>}
                </Form.Group>
              </div>

              {/* Conditionally show external organizer or quota */}
              {watchedCategory === "Program Kerja" ? (
                <div className="col-md-12">
                  <Form.Group>
                    <Form.Label className="small fw-semibold text-secondary">Kuota Peserta</Form.Label>
                    <Form.Control
                      type="number"
                      placeholder="Contoh: 100"
                      className={`py-2 curator-input ${errors.quota ? 'is-invalid' : ''}`}
                      {...register("quota")}
                    />
                    {errors.quota && <div className="invalid-feedback">{errors.quota.message}</div>}
                  </Form.Group>
                </div>
              ) : (
                <div className="col-md-12">
                  <Form.Group>
                    <Form.Label className="small fw-semibold text-secondary">Penyelenggara Eksternal</Form.Label>
                    <Form.Control
                      type="text"
                      placeholder="Contoh: Pusat Prestasi Nasional Kemdikbud, Universitas Indonesia"
                      className={`py-2 curator-input ${errors.externalOrganizer ? 'is-invalid' : ''}`}
                      {...register("externalOrganizer")}
                    />
                    {errors.externalOrganizer && <div className="invalid-feedback">{errors.externalOrganizer.message}</div>}
                  </Form.Group>
                </div>
              )}

              {/* Start Date */}
              <div className="col-md-6">
                <Form.Group>
                  <Form.Label className="small fw-semibold text-secondary">Tanggal Mulai</Form.Label>
                  <Form.Control
                    type="date"
                    className={`py-2 curator-input ${errors.startDate ? 'is-invalid' : ''}`}
                    {...register("startDate")}
                  />
                  {errors.startDate && <div className="invalid-feedback">{errors.startDate.message}</div>}
                </Form.Group>
              </div>

              {/* End Date */}
              <div className="col-md-6">
                <Form.Group>
                  <Form.Label className="small fw-semibold text-secondary">Tanggal Selesai</Form.Label>
                  <Form.Control
                    type="date"
                    className={`py-2 curator-input ${errors.endDate ? 'is-invalid' : ''}`}
                    {...register("endDate")}
                  />
                  {errors.endDate && <div className="invalid-feedback">{errors.endDate.message}</div>}
                </Form.Group>
              </div>

            </div>

            <div className="d-flex justify-content-end gap-2 mt-4 pt-3 border-top">
              <Button variant="outline-secondary" className="px-4" onClick={() => setShowModal(false)} disabled={loading}>
                Batal
              </Button>
              <Button variant="primary" type="submit" className="px-4" disabled={loading}>
                {loading ? (
                  <>
                    <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                    Mengajukan...
                  </>
                ) : (
                  "Ajukan Proposal"
                )}
              </Button>
            </div>
          </Form>

        </Modal.Body>
      </Modal>

    </div>
  );
}
