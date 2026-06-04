'use client'

import { useState } from "react";
import Link from "next/link";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { loginAction } from "@/app/actions/auth";
import Logo from "@/components/Logo";

const loginSchema = z.object({
  email: z.string().email("Format email tidak valid"),
  password: z.string().min(6, "Password minimal 6 karakter"),
});

type LoginInput = z.infer<typeof loginSchema>;

export default function LoginPage() {
  const [loading, setLoading] = useState(false);
  const [generalError, setGeneralError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginInput>({
    resolver: zodResolver(loginSchema),
  });

  const onSubmit = async (data: LoginInput) => {
    setLoading(true);
    setGeneralError(null);

    const formData = new FormData();
    formData.append("email", data.email);
    formData.append("password", data.password);

    try {
      const response = await loginAction(null, formData);
      if (response && !response.success) {
        setGeneralError(response.error || "Gagal masuk. Silakan coba lagi.");
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
        <div className="col-lg-6 d-none d-lg-flex flex-column justify-content-between p-5 bg-dark text-white position-relative overflow-hidden"
          style={{
            backgroundImage: "linear-gradient(135deg, rgba(17,24,39,0.95) 0%, rgba(185,13,35,0.85) 100%)",
            backgroundSize: "cover",
          }}
        >
          <div className="d-flex align-items-center">
            <Logo theme="dark" height={60} />
          </div>
          
          <div className="my-auto max-w-lg">
            <h1 className="display-4 fw-bold mb-4 text-white">Kelola Ormawa Kampus dalam Satu Genggaman</h1>
            <p className="lead text-white-50">
              Sistem pendaftaran dan persetujuan kegiatan kemahasiswaan Universitas Sam Ratulangi secara digital, realtime, dan akuntabel.
            </p>
          </div>

          <div className="text-white-50 small">
            &copy; {new Date().getFullYear()} Universitas Sam Ratulangi. All Rights Reserved.
          </div>
        </div>

        {/* Right Side: Login Form */}
        <div className="col-lg-6 d-flex align-items-center justify-content-center p-4 p-md-5 bg-white">
          <div className="w-100" style={{ maxWidth: "420px" }}>
            
            {/* Header info for mobile users */}
            <div className="d-lg-none text-center mb-4">
              <div className="d-flex justify-content-center mb-2">
                <Logo theme="light" height={55} />
              </div>
              <p className="text-secondary small">Sistem Manajemen Ormawa Terintegrasi</p>
            </div>

            <div className="mb-4">
              <h2 className="fw-bold text-dark mb-1">Selamat Datang Kembali</h2>
              <p className="text-secondary">Silakan masuk menggunakan email akun Anda</p>
            </div>

            {/* General Alert error display */}
            {generalError && (
              <div className="alert alert-danger d-flex align-items-center gap-2 rounded-3 border-0 py-3" role="alert">
                <i className="bi bi-exclamation-triangle-fill fs-5"></i>
                <div className="small fw-medium">{generalError}</div>
              </div>
            )}

            <form onSubmit={handleSubmit(onSubmit)} className="needs-validation">
              <div className="mb-3">
                <label className="form-label fw-semibold small text-secondary">Email</label>
                <div className="input-group">
                  <span className="input-group-text bg-light border-end-0">
                    <i className="bi bi-envelope text-secondary"></i>
                  </span>
                  <input
                    type="email"
                    className={`form-control bg-light border-start-0 py-2.5 ${errors.email ? 'is-invalid' : ''}`}
                    placeholder="nama@unsrat.ac.id"
                    {...register("email")}
                  />
                  {errors.email && (
                    <div className="invalid-feedback">{errors.email.message}</div>
                  )}
                </div>
              </div>

              <div className="mb-4">
                <div className="d-flex justify-content-between align-items-center mb-2">
                  <label className="form-label fw-semibold small text-secondary mb-0">Password</label>
                </div>
                <div className="input-group">
                  <span className="input-group-text bg-light border-end-0">
                    <i className="bi bi-lock text-secondary"></i>
                  </span>
                  <input
                    type="password"
                    className={`form-control bg-light border-start-0 py-2.5 ${errors.password ? 'is-invalid' : ''}`}
                    placeholder="••••••••"
                    {...register("password")}
                  />
                  {errors.password && (
                    <div className="invalid-feedback">{errors.password.message}</div>
                  )}
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
                    Menghubungkan...
                  </>
                ) : (
                  <>
                    Masuk <i className="bi bi-arrow-right-short ms-1 fs-5 align-middle"></i>
                  </>
                )}
              </button>
            </form>

            <div className="text-center mt-4">
              <p className="text-secondary small mb-0">
                Belum memiliki akun?{" "}
                <Link href="/register" className="text-primary fw-semibold text-decoration-none">
                  Daftar di sini
                </Link>
              </p>
            </div>

          </div>
        </div>

      </div>
    </div>
  );
}
