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
          width: "350px",
          height: "350px",
          background: "rgba(227, 27, 35, 0.12)",
          filter: "blur(90px)",
          top: "15%",
          left: "10%",
          pointerEvents: "none",
        }}
      />
      <div 
        className="position-absolute rounded-circle"
        style={{
          width: "350px",
          height: "350px",
          background: "rgba(13, 110, 253, 0.12)",
          filter: "blur(90px)",
          bottom: "15%",
          right: "10%",
          pointerEvents: "none",
        }}
      />

      {/* Main Glassmorphic Login Card */}
      <div 
        className="card border-0 p-4 p-md-5 shadow-lg text-white"
        style={{
          background: "rgba(255, 255, 255, 0.03)",
          backdropFilter: "blur(18px)",
          WebkitBackdropFilter: "blur(18px)",
          border: "1px solid rgba(255, 255, 255, 0.08)",
          borderRadius: "20px",
          maxWidth: "440px",
          width: "92%",
          zIndex: 10,
        }}
      >
        {/* Centered Logo */}
        <div className="d-flex flex-column align-items-center mb-4 text-center">
          <Logo theme="dark" height={55} />
          <p className="text-secondary small mt-2 mb-0">Sistem Manajemen Ormawa Terintegrasi</p>
        </div>

        <div className="mb-4 text-center">
          <h3 className="fw-bold text-white mb-1">Selamat Datang Kembali</h3>
          <p className="text-white-50 small">Silakan masuk menggunakan email akun Anda</p>
        </div>

        {/* General Alert error display */}
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

        <form onSubmit={handleSubmit(onSubmit)} className="needs-validation">
          {/* Email field */}
          <div className="mb-3">
            <label className="form-label fw-semibold small text-white-50">Email</label>
            <div className="input-group">
              <span 
                className="input-group-text border-0 text-white-50"
                style={{ 
                  background: "rgba(255, 255, 255, 0.04)", 
                  borderTopLeftRadius: "10px", 
                  borderBottomLeftRadius: "10px",
                  border: "1px solid rgba(255, 255, 255, 0.08)",
                  borderRight: "none",
                }}
              >
                <i className="bi bi-envelope"></i>
              </span>
              <input
                type="email"
                className={`form-control border-0 text-white py-2.5 ${errors.email ? 'is-invalid' : ''}`}
                style={{ 
                  background: "rgba(255, 255, 255, 0.04)", 
                  borderTopRightRadius: "10px", 
                  borderBottomRightRadius: "10px",
                  border: "1px solid rgba(255, 255, 255, 0.08)",
                  borderLeft: "none",
                }}
                placeholder="nama@student.unsrat.ac.id"
                {...register("email")}
              />
              {errors.email && (
                <div className="invalid-feedback text-danger small mt-1">{errors.email.message}</div>
              )}
            </div>
          </div>

          {/* Password field */}
          <div className="mb-4">
            <div className="d-flex justify-content-between align-items-center mb-2">
              <label className="form-label fw-semibold small text-white-50 mb-0">Password</label>
            </div>
            <div className="input-group">
              <span 
                className="input-group-text border-0 text-white-50"
                style={{ 
                  background: "rgba(255, 255, 255, 0.04)", 
                  borderTopLeftRadius: "10px", 
                  borderBottomLeftRadius: "10px",
                  border: "1px solid rgba(255, 255, 255, 0.08)",
                  borderRight: "none",
                }}
              >
                <i className="bi bi-lock"></i>
              </span>
              <input
                type="password"
                className={`form-control border-0 text-white py-2.5 ${errors.password ? 'is-invalid' : ''}`}
                style={{ 
                  background: "rgba(255, 255, 255, 0.04)", 
                  borderTopRightRadius: "10px", 
                  borderBottomRightRadius: "10px",
                  border: "1px solid rgba(255, 255, 255, 0.08)",
                  borderLeft: "none",
                }}
                placeholder="••••••••"
                {...register("password")}
              />
              {errors.password && (
                <div className="invalid-feedback text-danger small mt-1">{errors.password.message}</div>
              )}
            </div>
          </div>

          {/* Submit Button with Brand Gradient */}
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
                Menghubungkan...
              </>
            ) : (
              <>
                Masuk <i className="bi bi-arrow-right-short ms-1 fs-5 align-middle"></i>
              </>
            )}
          </button>
        </form>

        <div className="text-center mt-3">
          <p className="text-white-50 small mb-0">
            Belum memiliki akun?{" "}
            <Link href="/register" className="text-primary fw-semibold text-decoration-none" style={{ color: "#E31B23" }}>
              Daftar di sini
            </Link>
          </p>
        </div>

      </div>
    </div>
  );
}
