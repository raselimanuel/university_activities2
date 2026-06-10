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
    <div className="container-fluid min-vh-100 d-flex align-items-center justify-content-center bg-mesh-light p-3 position-relative overflow-hidden">
      {/* Decorative floating blobs in the background */}
      <div className="position-absolute rounded-circle opacity-10" style={{ background: 'linear-gradient(135deg, #E31B23, #B90D23)', width: '300px', height: '300px', filter: 'blur(30px)', top: '-50px', left: '-50px', pointerEvents: 'none' }}></div>
      <div className="position-absolute rounded-circle opacity-10" style={{ background: 'linear-gradient(135deg, #E31B23, #B90D23)', width: '280px', height: '280px', filter: 'blur(30px)', bottom: '-50px', right: '-50px', pointerEvents: 'none' }}></div>

      {/* Main Glassmorphic Register Card */}
      <div className="card-glass-premium border-0 p-4 p-md-5 shadow text-dark" style={{ maxWidth: "680px", width: "100%", zIndex: 10, marginTop: "20px", marginBottom: "20px" }}>
        {/* Back Button */}
        <Link href="/" className="text-decoration-none text-secondary small mb-4 d-inline-flex align-items-center gap-2 hover-lift btn-back-hover fw-medium">
          <i className="bi bi-arrow-left animate-arrow-left"></i> Kembali ke Beranda
        </Link>

        {/* Centered Logo */}
        <div className="d-flex flex-column align-items-center mb-4 text-center">
          <Logo theme="light" height={50} />
          <p className="text-secondary small mt-2 mb-0 fw-medium">Sistem Manajemen Ormawa Terintegrasi</p>
        </div>

        <div className="mb-4 text-center">
          <h3 className="fw-extrabold text-dark mb-1">Daftar Akun Baru</h3>
          <p className="text-secondary small">Lengkapi data diri Anda di bawah ini untuk bergabung</p>
        </div>

        {/* Error Message */}
        {generalError && (
          <div className="alert alert-danger d-flex align-items-center gap-2 rounded-3 border-0 py-3 mb-4" role="alert" style={{ background: "rgba(220, 53, 69, 0.08)", color: "#dc3545" }}>
            <i className="bi bi-exclamation-triangle-fill fs-5"></i>
            <div className="small fw-semibold">{generalError}</div>
          </div>
        )}

        {/* Success Message */}
        {successMsg && (
          <div className="alert alert-success d-flex align-items-center gap-2 rounded-3 border-0 py-3 mb-4" role="alert" style={{ background: "rgba(25, 135, 84, 0.08)", color: "#198754" }}>
            <i className="bi bi-check-circle-fill fs-5"></i>
            <div className="small fw-semibold">{successMsg}</div>
          </div>
        )}

        <form onSubmit={handleSubmit(onSubmit)} className="needs-validation">
          <div className="row">

            {/* Full Name */}
            <div className="col-md-6 mb-3">
              <label className="form-label fw-semibold small text-secondary">Nama Lengkap</label>
              <input
                type="text"
                className={`form-control curator-input ${errors.name ? 'is-invalid' : ''}`}
                placeholder="Contoh: John Doe"
                {...register("name")}
              />
              {errors.name && <div className="invalid-feedback text-danger small mt-1">{errors.name.message}</div>}
            </div>

            {/* NIM / NIP */}
            <div className="col-md-6 mb-3">
              <label className="form-label fw-semibold small text-secondary">NIM / NIP</label>
              <input
                type="text"
                className={`form-control curator-input ${errors.nim ? 'is-invalid' : ''}`}
                placeholder="Contoh: 210211060001"
                {...register("nim")}
              />
              {errors.nim && <div className="invalid-feedback text-danger small mt-1">{errors.nim.message}</div>}
            </div>

            {/* Email */}
            <div className="col-md-6 mb-3">
              <label className="form-label fw-semibold small text-secondary">Email Kampus</label>
              <input
                type="email"
                className={`form-control curator-input ${errors.email ? 'is-invalid' : ''}`}
                placeholder="name@student.unsrat.ac.id"
                {...register("email")}
              />
              {errors.email && <div className="invalid-feedback text-danger small mt-1">{errors.email.message}</div>}
            </div>

            {/* Password */}
            <div className="col-md-6 mb-3">
              <label className="form-label fw-semibold small text-secondary">Password</label>
              <input
                type="password"
                className={`form-control curator-input ${errors.password ? 'is-invalid' : ''}`}
                placeholder="Minimal 6 karakter"
                {...register("password")}
              />
              {errors.password && <div className="invalid-feedback text-danger small mt-1">{errors.password.message}</div>}
            </div>

            {/* Faculty */}
            <div className="col-md-6 mb-3">
              <label className="form-label fw-semibold small text-secondary">Fakultas</label>
              <select
                className={`form-select curator-input ${errors.faculty ? 'is-invalid' : ''}`}
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
              {errors.faculty && <div className="invalid-feedback text-danger small mt-1">{errors.faculty.message}</div>}
            </div>

            {/* Major */}
            <div className="col-md-6 mb-3">
              <label className="form-label fw-semibold small text-secondary">Program Studi / Jurusan</label>
              <input
                type="text"
                className={`form-control curator-input ${errors.major ? 'is-invalid' : ''}`}
                placeholder="Contoh: Teknik Informatika"
                {...register("major")}
              />
              {errors.major && <div className="invalid-feedback text-danger small mt-1">{errors.major.message}</div>}
            </div>

            {/* Role (for demo and review purpose) */}
            <div className="col-md-12 mb-4">
              <label className="form-label fw-semibold small text-secondary">Daftar Sebagai (Peran Pengguna)</label>
              <div className="d-flex flex-wrap gap-4 mt-1">
                <div className="form-check">
                  <input
                    className="form-check-input"
                    type="radio"
                    id="roleStudent"
                    value="student"
                    {...register("role")}
                  />
                  <label className="form-check-label text-secondary small fw-medium" htmlFor="roleStudent">
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
                  <label className="form-check-label text-secondary small fw-medium" htmlFor="roleLecturer">
                    Admin
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
                  <label className="form-check-label text-secondary small fw-medium" htmlFor="roleAdmin">
                    Admin
                  </label>
                </div>
              </div>
            </div>

          </div>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={loading}
            className="btn btn-primary w-100 py-3 fw-bold text-white border-0 hover-lift mb-3 rounded-pill shadow-sm"
            style={{ transition: 'all 0.3s ease' }}
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
          <p className="text-secondary small mb-0 fw-medium">
            Sudah memiliki akun?{" "}
            <Link href="/login" className="text-primary fw-bold text-decoration-none">
              Masuk di sini
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
