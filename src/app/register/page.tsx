'use client'

import { useState } from "react";
import Link from "next/link";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { registerAction } from "@/app/actions/auth";
import Logo from "@/components/Logo";

const registerSchema = z.object({
  name: z.string().min(3, "Nama minimal harus 3 karakter"),
  email: z.string().email("Format email tidak valid"),
  password: z.string().min(6, "Password minimal 6 karakter"),
  nim: z.string().min(5, "NIM/NIP minimal harus 5 karakter"),
  faculty: z.string().min(2, "Fakultas wajib diisi"),
  major: z.string().min(2, "Jurusan/Program Studi wajib diisi"),
  role: z.enum(["student", "lecturer", "admin"]).default("student"),
});

type RegisterInput = z.infer<typeof registerSchema>;

export default function RegisterPage() {
  const [loading, setLoading] = useState(false);
  const [generalError, setGeneralError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors: anyErrors },
  } = useForm<any>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      role: "student",
    }
  });
  const errors = anyErrors as any;

  const onSubmit = async (data: RegisterInput) => {
    setLoading(true);
    setGeneralError(null);
    setSuccessMsg(null);

    const formData = new FormData();
    formData.append("name", data.name);
    formData.append("email", data.email);
    formData.append("password", data.password);
    formData.append("nim", data.nim);
    formData.append("faculty", data.faculty);
    formData.append("major", data.major);
    formData.append("role", data.role);

    try {
      const response = await registerAction(null, formData);
      if (response && !response.success) {
        setGeneralError(response.error || "Gagal mendaftar. Silakan periksa kembali inputan Anda.");
      } else {
        setSuccessMsg("Akun berhasil dibuat! Silakan masuk.");
      }
    } catch (err) {
      setGeneralError("Koneksi gagal atau terjadi kesalahan server.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container-fluid min-vh-100 d-flex align-items-center justify-content-center bg-light p-0">
      <div className="row g-0 w-100 min-vh-100">
        
        {/* Left Side: Brand Panel */}
        <div className="col-lg-5 d-none d-lg-flex flex-column justify-content-between p-5 bg-dark text-white position-relative overflow-hidden"
          style={{
            backgroundImage: "linear-gradient(135deg, rgba(17,24,39,0.95) 0%, rgba(185,13,35,0.85) 100%)",
            backgroundSize: "cover",
          }}
        >
          <div className="d-flex align-items-center">
            <Logo theme="dark" height={60} />
          </div>
          
          <div className="my-auto max-w-lg">
            <h1 className="display-4 fw-bold mb-4 text-white">Bergabung dengan Jaringan Ormawa</h1>
            <p className="lead text-white-50">
              Daftarkan diri Anda untuk mengajukan kegiatan, mendaftar ke ormawa, dan mendokumentasikan prestasi Anda di Universitas Sam Ratulangi.
            </p>
          </div>

          <div className="text-white-50 small">
            &copy; {new Date().getFullYear()} Universitas Sam Ratulangi. All Rights Reserved.
          </div>
        </div>

        {/* Right Side: Register Form */}
        <div className="col-lg-7 d-flex align-items-center justify-content-center p-4 p-md-5 bg-white">
          <div className="w-100" style={{ maxWidth: "560px" }}>
            
            {/* Header info for mobile users */}
            <div className="d-lg-none text-center mb-4">
              <div className="d-flex justify-content-center mb-2">
                <Logo theme="light" height={55} />
              </div>
              <p className="text-secondary small">Sistem Manajemen Ormawa Terintegrasi</p>
            </div>

            <div className="mb-4">
              <h2 className="fw-bold text-dark mb-1">Daftar Akun Baru</h2>
              <p className="text-secondary">Lengkapi data diri Anda di bawah ini</p>
            </div>

            {/* Error Message */}
            {generalError && (
              <div className="alert alert-danger d-flex align-items-center gap-2 rounded-3 border-0 py-3 mb-4" role="alert">
                <i className="bi bi-exclamation-triangle-fill fs-5"></i>
                <div className="small fw-medium">{generalError}</div>
              </div>
            )}

            {/* Success Message */}
            {successMsg && (
              <div className="alert alert-success d-flex align-items-center gap-2 rounded-3 border-0 py-3 mb-4" role="alert">
                <i className="bi bi-check-circle-fill fs-5"></i>
                <div className="small fw-medium">{successMsg}</div>
              </div>
            )}

            <form onSubmit={handleSubmit(onSubmit)} className="needs-validation">
              <div className="row">
                
                {/* Full Name */}
                <div className="col-md-6 mb-3">
                  <label className="form-label fw-semibold small text-secondary">Nama Lengkap</label>
                  <input
                    type="text"
                    className={`form-control bg-light py-2 ${errors.name ? 'is-invalid' : ''}`}
                    placeholder="Contoh: John Doe"
                    {...register("name")}
                  />
                  {errors.name && <div className="invalid-feedback">{errors.name.message}</div>}
                </div>

                {/* NIM / NIP */}
                <div className="col-md-6 mb-3">
                  <label className="form-label fw-semibold small text-secondary">NIM / NIP</label>
                  <input
                    type="text"
                    className={`form-control bg-light py-2 ${errors.nim ? 'is-invalid' : ''}`}
                    placeholder="Contoh: 210211060001"
                    {...register("nim")}
                  />
                  {errors.nim && <div className="invalid-feedback">{errors.nim.message}</div>}
                </div>

                {/* Email */}
                <div className="col-md-6 mb-3">
                  <label className="form-label fw-semibold small text-secondary">Email Kampus</label>
                  <input
                    type="email"
                    className={`form-control bg-light py-2 ${errors.email ? 'is-invalid' : ''}`}
                    placeholder="name@student.unsrat.ac.id"
                    {...register("email")}
                  />
                  {errors.email && <div className="invalid-feedback">{errors.email.message}</div>}
                </div>

                {/* Password */}
                <div className="col-md-6 mb-3">
                  <label className="form-label fw-semibold small text-secondary">Password</label>
                  <input
                    type="password"
                    className={`form-control bg-light py-2 ${errors.password ? 'is-invalid' : ''}`}
                    placeholder="Minimal 6 karakter"
                    {...register("password")}
                  />
                  {errors.password && <div className="invalid-feedback">{errors.password.message}</div>}
                </div>

                {/* Faculty */}
                <div className="col-md-6 mb-3">
                  <label className="form-label fw-semibold small text-secondary">Fakultas</label>
                  <select
                    className={`form-select bg-light py-2 ${errors.faculty ? 'is-invalid' : ''}`}
                    {...register("faculty")}
                  >
                    <option value="">-- Pilih Fakultas --</option>
                    <option value="Teknik">Fakultas Teknik</option>
                    <option value="Hukum">Fakultas Hukum</option>
                    <option value="Kedokteran">Fakultas Kedokteran</option>
                    <option value="Ekonomi & Bisnis">Fakultas Ekonomi & Bisnis</option>
                    <option value="ISIP">Fakultas Ilmu Sosial & Politik</option>
                    <option value="Pertanian">Fakultas Pertanian</option>
                  </select>
                  {errors.faculty && <div className="invalid-feedback">{errors.faculty.message}</div>}
                </div>

                {/* Major */}
                <div className="col-md-6 mb-3">
                  <label className="form-label fw-semibold small text-secondary">Program Studi / Jurusan</label>
                  <input
                    type="text"
                    className={`form-control bg-light py-2 ${errors.major ? 'is-invalid' : ''}`}
                    placeholder="Contoh: Teknik Informatika"
                    {...register("major")}
                  />
                  {errors.major && <div className="invalid-feedback">{errors.major.message}</div>}
                </div>

                {/* Role (for demo and review purpose) */}
                <div className="col-md-12 mb-4">
                  <label className="form-label fw-semibold small text-secondary">Daftar Sebagai (Peran Pengguna)</label>
                  <div className="d-flex gap-3">
                    <div className="form-check">
                      <input
                        className="form-check-input"
                        type="radio"
                        id="roleStudent"
                        value="student"
                        {...register("role")}
                      />
                      <label className="form-check-label" htmlFor="roleStudent">
                        Mahasiswa
                      </label>
                    </div>
                    <div className="form-check">
                      <input
                        className="form-check-input"
                        type="radio"
                        id="roleLecturer"
                        value="lecturer"
                        {...register("role")}
                      />
                      <label className="form-check-label" htmlFor="roleLecturer">
                        Dosen Pembina
                      </label>
                    </div>
                    <div className="form-check">
                      <input
                        className="form-check-input"
                        type="radio"
                        id="roleAdmin"
                        value="admin"
                        {...register("role")}
                      />
                      <label className="form-check-label" htmlFor="roleAdmin">
                        Administrator
                      </label>
                    </div>
                  </div>
                </div>

              </div>

              <button
                type="submit"
                disabled={loading}
                className="btn btn-primary w-100 py-2.5 fw-bold hover-lift mb-3"
              >
                {loading ? (
                  <>
                    <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                    Mendaftarkan...
                  </>
                ) : (
                  "Buat Akun Baru"
                )}
              </button>
            </form>

            <div className="text-center mt-3">
              <p className="text-secondary small mb-0">
                Sudah memiliki akun?{" "}
                <Link href="/login" className="text-primary fw-semibold text-decoration-none">
                  Masuk di sini
                </Link>
              </p>
            </div>

          </div>
        </div>

      </div>
    </div>
  );
}
