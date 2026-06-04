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
    <div 
      className="container-fluid min-vh-100 d-flex align-items-center justify-content-center position-relative overflow-hidden p-0"
      style={{
        background: "radial-gradient(circle at 50% 50%, #151c2e 0%, #0b0f19 100%)",
      }}
    >
      {/* Glowing background orbs for rich aesthetics */}
      <div 
        className="position-absolute rounded-circle"
        style={{
          width: "400px",
          height: "400px",
          background: "rgba(227, 27, 35, 0.1)",
          filter: "blur(100px)",
          top: "10%",
          left: "5%",
          pointerEvents: "none",
        }}
      />
      <div 
        className="position-absolute rounded-circle"
        style={{
          width: "400px",
          height: "400px",
          background: "rgba(13, 110, 253, 0.1)",
          filter: "blur(100px)",
          bottom: "10%",
          right: "5%",
          pointerEvents: "none",
        }}
      />

      {/* Main Glassmorphic Register Card */}
      <div 
        className="card border-0 p-4 p-md-5 shadow-lg text-white"
        style={{
          background: "rgba(255, 255, 255, 0.03)",
          backdropFilter: "blur(18px)",
          WebkitBackdropFilter: "blur(18px)",
          border: "1px solid rgba(255, 255, 255, 0.08)",
          borderRadius: "20px",
          maxWidth: "680px",
          width: "92%",
          zIndex: 10,
          marginTop: "20px",
          marginBottom: "20px",
        }}
      >
        {/* Centered Logo */}
        <div className="d-flex flex-column align-items-center mb-4 text-center">
          <Logo theme="dark" height={55} />
          <p className="text-secondary small mt-2 mb-0">Sistem Manajemen Ormawa Terintegrasi</p>
        </div>

        <div className="mb-4 text-center">
          <h3 className="fw-bold text-white mb-1">Daftar Akun Baru</h3>
          <p className="text-white-50 small">Lengkapi data diri Anda di bawah ini untuk bergabung</p>
        </div>

        {/* Error Message */}
        {generalError && (
          <div 
            className="alert alert-danger d-flex align-items-center gap-2 rounded-3 border-0 py-3 mb-4 text-white" 
            role="alert"
            style={{ background: "rgba(220, 53, 69, 0.2)" }}
          >
            <i className="bi bi-exclamation-triangle-fill fs-5 text-danger"></i>
            <div className="small fw-medium">{generalError}</div>
          </div>
        )}

        {/* Success Message */}
        {successMsg && (
          <div 
            className="alert alert-success d-flex align-items-center gap-2 rounded-3 border-0 py-3 mb-4 text-white" 
            role="alert"
            style={{ background: "rgba(25, 135, 84, 0.2)" }}
          >
            <i className="bi bi-check-circle-fill fs-5 text-success"></i>
            <div className="small fw-medium">{successMsg}</div>
          </div>
        )}

        <form onSubmit={handleSubmit(onSubmit)} className="needs-validation">
          <div className="row">
            
            {/* Full Name */}
            <div className="col-md-6 mb-3">
              <label className="form-label fw-semibold small text-white-50">Nama Lengkap</label>
              <input
                type="text"
                className={`form-control border-0 text-white py-2 ${errors.name ? 'is-invalid' : ''}`}
                style={{ 
                  background: "rgba(255, 255, 255, 0.04)", 
                  border: "1px solid rgba(255, 255, 255, 0.08)",
                  borderRadius: "10px"
                }}
                placeholder="Contoh: John Doe"
                {...register("name")}
              />
              {errors.name && <div className="invalid-feedback text-danger small mt-1">{errors.name.message}</div>}
            </div>

            {/* NIM / NIP */}
            <div className="col-md-6 mb-3">
              <label className="form-label fw-semibold small text-white-50">NIM / NIP</label>
              <input
                type="text"
                className={`form-control border-0 text-white py-2 ${errors.nim ? 'is-invalid' : ''}`}
                style={{ 
                  background: "rgba(255, 255, 255, 0.04)", 
                  border: "1px solid rgba(255, 255, 255, 0.08)",
                  borderRadius: "10px"
                }}
                placeholder="Contoh: 210211060001"
                {...register("nim")}
              />
              {errors.nim && <div className="invalid-feedback text-danger small mt-1">{errors.nim.message}</div>}
            </div>

            {/* Email */}
            <div className="col-md-6 mb-3">
              <label className="form-label fw-semibold small text-white-50">Email Kampus</label>
              <input
                type="email"
                className={`form-control border-0 text-white py-2 ${errors.email ? 'is-invalid' : ''}`}
                style={{ 
                  background: "rgba(255, 255, 255, 0.04)", 
                  border: "1px solid rgba(255, 255, 255, 0.08)",
                  borderRadius: "10px"
                }}
                placeholder="name@student.unsrat.ac.id"
                {...register("email")}
              />
              {errors.email && <div className="invalid-feedback text-danger small mt-1">{errors.email.message}</div>}
            </div>

            {/* Password */}
            <div className="col-md-6 mb-3">
              <label className="form-label fw-semibold small text-white-50">Password</label>
              <input
                type="password"
                className={`form-control border-0 text-white py-2 ${errors.password ? 'is-invalid' : ''}`}
                style={{ 
                  background: "rgba(255, 255, 255, 0.04)", 
                  border: "1px solid rgba(255, 255, 255, 0.08)",
                  borderRadius: "10px"
                }}
                placeholder="Minimal 6 karakter"
                {...register("password")}
              />
              {errors.password && <div className="invalid-feedback text-danger small mt-1">{errors.password.message}</div>}
            </div>

            {/* Faculty */}
            <div className="col-md-6 mb-3">
              <label className="form-label fw-semibold small text-white-50">Fakultas</label>
              <select
                className={`form-select border-0 text-white py-2 ${errors.faculty ? 'is-invalid' : ''}`}
                style={{ 
                  background: "rgba(255, 255, 255, 0.04)", 
                  border: "1px solid rgba(255, 255, 255, 0.08)",
                  borderRadius: "10px",
                  color: "#ffffff"
                }}
                {...register("faculty")}
              >
                <option value="" className="text-dark">-- Pilih Fakultas --</option>
                <option value="Teknik" className="text-dark">Fakultas Teknik</option>
                <option value="Hukum" className="text-dark">Fakultas Hukum</option>
                <option value="Kedokteran" className="text-dark">Fakultas Kedokteran</option>
                <option value="Ekonomi & Bisnis" className="text-dark">Fakultas Ekonomi & Bisnis</option>
                <option value="ISIP" className="text-dark">Fakultas Ilmu Sosial & Politik</option>
                <option value="Pertanian" className="text-dark">Fakultas Pertanian</option>
              </select>
              {errors.faculty && <div className="invalid-feedback text-danger small mt-1">{errors.faculty.message}</div>}
            </div>

            {/* Major */}
            <div className="col-md-6 mb-3">
              <label className="form-label fw-semibold small text-white-50">Program Studi / Jurusan</label>
              <input
                type="text"
                className={`form-control border-0 text-white py-2 ${errors.major ? 'is-invalid' : ''}`}
                style={{ 
                  background: "rgba(255, 255, 255, 0.04)", 
                  border: "1px solid rgba(255, 255, 255, 0.08)",
                  borderRadius: "10px"
                }}
                placeholder="Contoh: Teknik Informatika"
                {...register("major")}
              />
              {errors.major && <div className="invalid-feedback text-danger small mt-1">{errors.major.message}</div>}
            </div>

            {/* Role (for demo and review purpose) */}
            <div className="col-md-12 mb-4">
              <label className="form-label fw-semibold small text-white-50">Daftar Sebagai (Peran Pengguna)</label>
              <div className="d-flex gap-3 mt-1">
                <div className="form-check">
                  <input
                    className="form-check-input"
                    type="radio"
                    id="roleStudent"
                    value="student"
                    {...register("role")}
                  />
                  <label className="form-check-label text-white-50 small" htmlFor="roleStudent">
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
                  <label className="form-check-label text-white-50 small" htmlFor="roleLecturer">
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
                  <label className="form-check-label text-white-50 small" htmlFor="roleAdmin">
                    Administrator
                  </label>
                </div>
              </div>
            </div>

          </div>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={loading}
            className="btn w-100 py-2.5 fw-bold text-white border-0 hover-lift mb-3"
            style={{
              background: "linear-gradient(135deg, #E31B23 0%, #B90D23 100%)",
              borderRadius: "10px",
              boxShadow: "0 4px 15px rgba(227, 27, 35, 0.35)",
            }}
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
          <p className="text-white-50 small mb-0">
            Sudah memiliki akun?{" "}
            <Link href="/login" className="text-primary fw-semibold text-decoration-none" style={{ color: "#E31B23" }}>
              Masuk di sini
            </Link>
          </p>
        </div>

      </div>
    </div>
  );
}
