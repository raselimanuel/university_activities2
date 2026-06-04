'use client'

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Modal, Button, Form } from "react-bootstrap";
import { createAchievement } from "@/app/actions/board";
import { getFacultyStyle } from "@/utils/faculty";
import PremiumIcon from "@/components/PremiumIcon";

const achievementSchema = z.object({
  title: z.string().min(5, "Judul prestasi minimal 5 karakter"),
  rank: z.string().min(1, "Kategori juara / prestasi wajib diisi"),
  year: z.coerce.number().int().positive("Tahun harus bernilai positif"),
  description: z.string().optional(),
  activityId: z.coerce.number().int("Pilih kegiatan terkait"),
});

type AchievementInput = z.infer<typeof achievementSchema>;

interface AchievementsClientProps {
  achievements: any[];
  activities: any[];
  userRole: string;
}

export default function AchievementsClient({ achievements: list, activities, userRole }: AchievementsClientProps) {
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
    resolver: zodResolver(achievementSchema),
  });
  const errors = anyErrors as any;

  const onSubmit = async (data: AchievementInput) => {
    setLoading(true);
    setErrorMsg(null);
    setSuccessMsg(null);

    const formData = new FormData();
    formData.append("title", data.title);
    formData.append("rank", data.rank);
    formData.append("year", data.year.toString());
    formData.append("description", data.description || "");
    formData.append("activityId", data.activityId.toString());

    try {
      const result = await createAchievement(formData);
      if (result.success) {
        setSuccessMsg("Prestasi ormawa berhasil ditambahkan!");
        reset();
        setTimeout(() => {
          setShowModal(false);
          setSuccessMsg(null);
          window.location.reload();
        }, 1500);
      } else {
        setErrorMsg(result.error || "Gagal menyimpan prestasi.");
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
          <h4 className="fw-bold text-dark mb-1">Papan Prestasi Ormawa</h4>
          <p className="text-secondary small mb-0">Daftar pencapaian dan prestasi gemilang organisasi mahasiswa UNSRAT</p>
        </div>
        {userRole === "admin" && (
          <button className="btn btn-primary hover-lift d-flex align-items-center gap-2 py-2" onClick={() => setShowModal(true)}>
            <i className="bi bi-trophy-fill"></i>
            <span>Tambah Prestasi</span>
          </button>
        )}
      </div>

      <div className="row g-4">
        {list.length === 0 ? (
          <div className="col-12">
            <div className="card border-0 shadow-sm rounded-4 p-5 text-center bg-white">
              <i className="bi bi-trophy display-4 text-secondary opacity-50 mb-3"></i>
              <h5>Belum Ada Catatan Prestasi</h5>
              <p className="text-secondary small mb-0">Saat ini belum ada prestasi ormawa yang diunggah.</p>
            </div>
          </div>
        ) : (
          list.map((ach) => {
            const orgStyle = getFacultyStyle(ach.activityName);
            return (
              <div key={ach.id} className="col-12 col-md-6 col-lg-4">
                <div className="card border-0 shadow-sm rounded-4 h-100 bg-white hover-lift position-relative overflow-hidden border-top border-4" style={{ borderTopColor: orgStyle.primary }}>
                  {/* Dynamic translucent color element */}
                  <div 
                    className="position-absolute" 
                    style={{
                      top: "-15px",
                      right: "-15px",
                      width: "60px",
                      height: "60px",
                      background: orgStyle.lightBg,
                      transform: "rotate(45deg)"
                    }}
                  ></div>
                  
                  <div className="card-body p-4 d-flex flex-column h-100">
                    <div className="d-flex align-items-center gap-3 mb-3">
                      <PremiumIcon 
                        icon={orgStyle.icon}
                        primaryColor={orgStyle.primary}
                        lightBgColor={orgStyle.lightBg}
                        size={45}
                      />
                      <div>
                        <span className="badge px-2.5 py-1 fw-bold" style={{ backgroundColor: orgStyle.lightBg, color: orgStyle.primary, borderColor: orgStyle.borderSubtle, borderWidth: '1px', borderStyle: 'solid' }}>{ach.rank}</span>
                        <span className="text-muted small ms-2">{ach.year}</span>
                      </div>
                    </div>

                    <h5 className="fw-extrabold text-dark mb-2">{ach.title}</h5>
                    
                    {ach.description && (
                      <p className="text-secondary small flex-grow-1 mb-3">{ach.description}</p>
                    )}

                    <div className="mt-auto pt-3 border-top d-flex align-items-center gap-2">
                      <i className="bi bi-bookmark-star text-muted small"></i>
                      <span className="text-muted small text-truncate">Ormawa: <strong style={{ color: orgStyle.primary }}>{ach.activityName}</strong></span>
                    </div>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* ADD ACHIEVEMENT MODAL */}
      <Modal show={showModal} onHide={() => setShowModal(false)} size="lg" centered>
        <Modal.Header closeButton className="border-0 pb-0">
          <Modal.Title className="fw-bold">Tambah Prestasi Ormawa</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {errorMsg && <div className="alert alert-danger rounded-3 py-2 small mb-3">{errorMsg}</div>}
          {successMsg && <div className="alert alert-success rounded-3 py-2 small mb-3">{successMsg}</div>}

          <Form onSubmit={handleSubmit(onSubmit)}>
            <div className="row g-3">
              
              {/* Title */}
              <div className="col-12">
                <Form.Group>
                  <Form.Label className="small fw-semibold text-secondary">Nama Prestasi / Perlombaan</Form.Label>
                  <Form.Control
                    type="text"
                    placeholder="Contoh: Juara 1 Pagelaran Mahasiswa Nasional Bidang Teknologi Informasi (GEMASTIK) XVIII"
                    className={`py-2 ${errors.title ? 'is-invalid' : ''}`}
                    {...register("title")}
                  />
                  {errors.title && <div className="invalid-feedback">{errors.title.message}</div>}
                </Form.Group>
              </div>

              {/* Rank */}
              <div className="col-md-8">
                <Form.Group>
                  <Form.Label className="small fw-semibold text-secondary">Pencapaian / Juara</Form.Label>
                  <Form.Control
                    type="text"
                    placeholder="Contoh: Juara 1 (Medali Emas UX Design)"
                    className={`py-2 ${errors.rank ? 'is-invalid' : ''}`}
                    {...register("rank")}
                  />
                  {errors.rank && <div className="invalid-feedback">{errors.rank.message}</div>}
                </Form.Group>
              </div>

              {/* Year */}
              <div className="col-md-4">
                <Form.Group>
                  <Form.Label className="small fw-semibold text-secondary">Tahun Prestasi</Form.Label>
                  <Form.Control
                    type="number"
                    placeholder="2026"
                    className={`py-2 ${errors.year ? 'is-invalid' : ''}`}
                    {...register("year")}
                  />
                  {errors.year && <div className="invalid-feedback">{errors.year.message}</div>}
                </Form.Group>
              </div>

              {/* Description */}
              <div className="col-12">
                <Form.Group>
                  <Form.Label className="small fw-semibold text-secondary">Deskripsi Singkat Prestasi</Form.Label>
                  <Form.Control
                    as="textarea"
                    rows={3}
                    placeholder="Ceritakan detail prestasi, inovasi yang dibawakan, atau delegasi yang dikirimkan..."
                    className="py-2"
                    {...register("description")}
                  />
                </Form.Group>
              </div>

              {/* Related Activity */}
              <div className="col-12">
                <Form.Group>
                  <Form.Label className="small fw-semibold text-secondary">Diperoleh Oleh Organisasi (Kegiatan)</Form.Label>
                  <Form.Select className={`py-2 ${errors.activityId ? 'is-invalid' : ''}`} {...register("activityId")}>
                    <option value="">-- Pilih Ormawa Terkait --</option>
                    {activities.map((act) => (
                      <option key={act.id} value={act.id}>{act.name}</option>
                    ))}
                  </Form.Select>
                  {errors.activityId && <div className="invalid-feedback">{errors.activityId.message}</div>}
                </Form.Group>
              </div>

            </div>

            <div className="d-flex justify-content-end gap-2 mt-4 pt-3 border-top">
              <Button variant="outline-secondary" className="px-4" onClick={() => setShowModal(false)} disabled={loading}>
                Batal
              </Button>
              <Button variant="primary" type="submit" className="px-4" disabled={loading}>
                {loading ? "Menyimpan..." : "Simpan Prestasi"}
              </Button>
            </div>
          </Form>
        </Modal.Body>
      </Modal>

    </div>
  );
}
