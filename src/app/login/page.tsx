'use client'

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
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
  const router = useRouter();
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
        setLoading(false);
        return;
      }

      router.replace(response?.redirectTo || "/dashboard");
      router.refresh();
    } catch (err) {
      setGeneralError("Koneksi gagal atau terjadi kesalahan server.");
      setLoading(false);
    }
  };

  return (
    <div className="container-fluid min-vh-100 d-flex align-items-center justify-content-center bg-mesh-light p-3 position-relative overflow-hidden">
      {/* Decorative floating blobs in the background */}
      <div className="position-absolute rounded-circle opacity-10" style={{ background: 'linear-gradient(135deg, #E31B23, #B90D23)', width: '280px', height: '280px', filter: 'blur(28px)', top: '-50px', left: '-50px', pointerEvents: 'none' }}></div>
      <div className="position-absolute rounded-circle opacity-10" style={{ background: 'linear-gradient(135deg, #E31B23, #B90D23)', width: '260px', height: '260px', filter: 'blur(28px)', bottom: '-50px', right: '-50px', pointerEvents: 'none' }}></div>

      {/* Main Glassmorphic Login Card */}
      <div className="card-glass-premium border-0 p-4 p-md-5 shadow text-dark" style={{ maxWidth: "450px", width: "100%", zIndex: 10 }}>
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
          <h3 className="fw-extrabold text-dark mb-1">Selamat Datang Kembali</h3>
          <p className="text-secondary small">Silakan masuk menggunakan akun kampus Anda</p>
        </div>

        {/* General Alert error display */}
        {generalError && (
          <div className="alert alert-danger d-flex align-items-center gap-2 rounded-3 border-0 py-3 mb-4" role="alert" style={{ background: "rgba(220, 53, 69, 0.08)", color: "#dc3545" }}>
            <i className="bi bi-exclamation-triangle-fill fs-5"></i>
            <div className="small fw-semibold">{generalError}</div>
          </div>
        )}

        <form onSubmit={handleSubmit(onSubmit)} className="needs-validation">
          {/* Email field */}
          <div className="mb-3">
            <label className="form-label fw-semibold small text-secondary">Email Kampus</label>
            <input
              type="email"
              className={`form-control curator-input py-2.5 ${errors.email ? 'is-invalid' : ''}`}
              placeholder="nama@student.unsrat.ac.id"
              {...register("email")}
            />
            {errors.email && (
              <div className="invalid-feedback text-danger small mt-1">{errors.email.message}</div>
            )}
          </div>

          {/* Password field */}
          <div className="mb-4">
            <label className="form-label fw-semibold small text-secondary">Password</label>
            <input
              type="password"
              className={`form-control curator-input py-2.5 ${errors.password ? 'is-invalid' : ''}`}
              placeholder="••••••••"
              {...register("password")}
            />
            {errors.password && (
              <div className="invalid-feedback text-danger small mt-1">{errors.password.message}</div>
            )}
          </div>

          {/* Submit Button with Brand Gradient */}
          <button
            type="submit"
            disabled={loading}
            className="btn btn-primary w-100 py-3 fw-bold text-white border-0 hover-lift mb-3 rounded-pill shadow-sm"
            style={{ transition: 'all 0.3s ease' }}
          >
            {loading ? (
              <>
                <span className="spinner-border spinner-border-sm role-status me-2" aria-hidden="true"></span>
                Menghubungkan...
              </>
            ) : (
              <>
                Masuk ke Dashboard <i className="bi bi-arrow-right-short ms-1 fs-5 align-middle"></i>
              </>
            )}
          </button>
        </form>

        <div className="text-center mt-3">
          <p className="text-secondary small mb-0 fw-medium">
            Belum memiliki akun?{" "}
            <Link href="/register" className="text-primary fw-bold text-decoration-none">
              Daftar di sini
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
