'use client'

import { useState, useTransition } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { logoutAction } from "@/app/actions/auth";
import Logo from "@/components/Logo";

interface DashboardShellProps {
  user: {
    name: string;
    nim: string;
    role: "student" | "lecturer" | "admin";
    faculty?: string | null;
    memberships?: { role: string; orgName: string }[];
  };
  children: React.ReactNode;
}

export default function DashboardShell({ user, children }: DashboardShellProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [isLoggingOut, startLogoutTransition] = useTransition();
  const pathname = usePathname();

  const handleLogout = () => {
    if (!window.confirm("Apakah Anda yakin ingin keluar?")) return;

    startLogoutTransition(() => {
      void logoutAction();
    });
  };

  const navLinks = [
    { href: "/dashboard", label: "Dashboard", icon: "bi-grid-1x2-fill", roles: ["student", "lecturer", "admin"] },
    { href: "/dashboard/activities", label: "Kegiatan Ormawa", icon: "bi-calendar2-event-fill", roles: ["student", "lecturer", "admin"] },
    { href: "/dashboard/organizations", label: "Daftar Organisasi", icon: "bi-diagram-3-fill", roles: ["student", "lecturer", "admin"] },
    { href: "/dashboard/achievements", label: "Papan Prestasi", icon: "bi-trophy-fill", roles: ["student", "lecturer", "admin"] },
    { href: "/dashboard/announcements", label: "Pengumuman", icon: "bi-megaphone-fill", roles: ["student", "lecturer", "admin"] },
  ];

  const getRoleBadge = (role: string, memberships?: { role: string; orgName: string }[]) => {
    if (role === "admin") {
      return <span className="badge bg-danger bg-opacity-10 text-danger border border-danger-subtle px-2.5 py-1">Admin</span>;
    }
    if (role === "lecturer") {
      return <span className="badge bg-warning bg-opacity-10 text-warning border border-warning-subtle px-2.5 py-1">Admin</span>;
    }
    
    const leaderOrManager = memberships?.find(m => m.role === "leader" || m.role === "manager");
    if (leaderOrManager) {
      const prefix = leaderOrManager.role === "leader" ? "Ketua" : "Pengurus";
      return <span className="badge bg-info bg-opacity-10 text-info border border-info-subtle px-2.5 py-1 text-wrap">{prefix} {leaderOrManager.orgName}</span>;
    }
    
    return <span className="badge bg-success bg-opacity-10 text-success border border-success-subtle px-2.5 py-1">Mahasiswa</span>;
  };

  return (
    <div className="d-flex min-vh-100 bg-light">
      
      {/* Sidebar - Desktop Layout (Visible on lg and above) */}
      <aside className="d-none d-lg-flex flex-column bg-dark text-white border-end border-secondary border-opacity-25" style={{ width: "260px", minWidth: "260px", height: "100vh", position: "sticky", top: 0, overflowY: "auto" }}>
        
        <div className="p-4 border-bottom border-secondary border-opacity-25 d-flex align-items-center">
          <Link href="/dashboard" className="text-decoration-none">
            <Logo theme="dark" height={50} />
          </Link>
        </div>

        {/* User Card inside Sidebar */}
        <div className="p-3 mx-3 my-3 text-center" style={{ background: "linear-gradient(135deg, rgba(255, 255, 255, 0.03) 0%, rgba(255, 255, 255, 0.01) 100%)", border: "1px solid rgba(255, 255, 255, 0.05)", borderRadius: "12px" }}>
          <div className="avatar-placeholder rounded-circle bg-primary text-white d-flex align-items-center justify-content-center mx-auto mb-2" style={{ width: "52px", height: "52px", border: "2px solid var(--gold-accent)", boxShadow: "0 0 10px rgba(212, 175, 55, 0.2)" }}>
            <span className="fw-bold fs-5">{user.name.charAt(0).toUpperCase()}</span>
          </div>
          <h6 className="fw-bold text-white mb-1 text-truncate">{user.name}</h6>
          <p className="text-secondary small mb-2" style={{ fontSize: "0.78rem", opacity: 0.85 }}>{user.nim}</p>
          {getRoleBadge(user.role, user.memberships)}
        </div>

        {/* Navigation links */}
        <nav className="nav flex-column flex-grow-1 px-2 gap-1">
          {navLinks
            .filter((link) => link.roles.includes(user.role))
            .map((link) => {
              const isActive = pathname === link.href;
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  className={`sidebar-nav-link d-flex align-items-center gap-3 px-3 py-2.5 rounded-3 ${
                    isActive ? "active" : ""
                  }`}
                  style={{ textDecoration: "none" }}
                >
                  <i className={`bi ${link.icon} fs-5`}></i>
                  <span>{link.label}</span>
                </Link>
              );
            })}
        </nav>

        {/* Footer actions */}
        <div className="p-3 border-top border-secondary border-opacity-25" style={process.env.NODE_ENV === "development" ? { paddingBottom: "4.25rem" } : undefined}>
          <button
            type="button"
            onClick={handleLogout}
            disabled={isLoggingOut}
            className="btn btn-outline-danger w-100 d-flex align-items-center justify-content-center gap-2 py-2"
          >
            <i className="bi bi-box-arrow-left"></i>
            <span>{isLoggingOut ? "Keluar..." : "Keluar"}</span>
          </button>
        </div>

      </aside>

      {/* Mobile Sidebar Back-drop / Overlay */}
      {sidebarOpen && (
        <div className="position-fixed top-0 start-0 w-100 h-100 bg-black bg-opacity-50 z-3 d-lg-none" onClick={() => setSidebarOpen(false)}></div>
      )}

      {/* Sidebar - Mobile Layout */}
      <aside className={`position-fixed top-0 start-0 h-100 bg-dark text-white z-3 transition-all-200 d-lg-none d-flex flex-column ${sidebarOpen ? "translate-middle-x-none" : "translate-middle-x-hide"}`}
        style={{ width: "260px", overflowY: "auto" }}
      >
        <div className="p-4 border-bottom border-secondary border-opacity-25 d-flex align-items-center justify-content-between">
          <Link href="/dashboard" className="text-decoration-none">
            <Logo theme="dark" height={45} />
          </Link>
          <button className="btn btn-link text-white-50 p-0" onClick={() => setSidebarOpen(false)}>
            <i className="bi bi-x-lg fs-5"></i>
          </button>
        </div>

        <div className="p-3 mx-3 my-3 text-center" style={{ background: "linear-gradient(135deg, rgba(255, 255, 255, 0.03) 0%, rgba(255, 255, 255, 0.01) 100%)", border: "1px solid rgba(255, 255, 255, 0.05)", borderRadius: "12px" }}>
          <div className="avatar-placeholder rounded-circle bg-primary text-white d-flex align-items-center justify-content-center mx-auto mb-2" style={{ width: "52px", height: "52px", border: "2px solid var(--gold-accent)", boxShadow: "0 0 10px rgba(212, 175, 55, 0.2)" }}>
            <span className="fw-bold fs-5">{user.name.charAt(0).toUpperCase()}</span>
          </div>
          <h6 className="fw-bold text-white mb-1 text-truncate">{user.name}</h6>
          <p className="text-secondary small mb-2" style={{ fontSize: "0.78rem", opacity: 0.85 }}>{user.nim}</p>
          {getRoleBadge(user.role, user.memberships)}
        </div>

        <nav className="nav flex-column flex-grow-1 px-2 gap-1">
          {navLinks
            .filter((link) => link.roles.includes(user.role))
            .map((link) => {
              const isActive = pathname === link.href;
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  className={`sidebar-nav-link d-flex align-items-center gap-3 px-3 py-2.5 rounded-3 ${
                    isActive ? "active" : ""
                  }`}
                  onClick={() => setSidebarOpen(false)}
                  style={{ textDecoration: "none" }}
                >
                  <i className={`bi ${link.icon} fs-5`}></i>
                  <span>{link.label}</span>
                </Link>
              );
            })}
        </nav>

        <div className="p-3 border-top border-secondary border-opacity-25" style={process.env.NODE_ENV === "development" ? { paddingBottom: "4.25rem" } : undefined}>
          <button
            type="button"
            onClick={handleLogout}
            disabled={isLoggingOut}
            className="btn btn-outline-danger w-100 d-flex align-items-center justify-content-center gap-2 py-2"
          >
            <i className="bi bi-box-arrow-left"></i>
            <span>{isLoggingOut ? "Keluar..." : "Keluar"}</span>
          </button>
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="d-flex flex-column flex-grow-1 min-vh-100 overflow-hidden bg-mesh-light">
        
        {/* Top Navbar */}
        <header className="navbar navbar-expand navbar-light border-bottom px-4 py-3" style={{ background: 'rgba(255, 255, 255, 0.94)', position: 'sticky', top: 0, zIndex: 100 }}>
          <div className="container-fluid p-0">
            
            {/* Sidebar toggle button for mobile */}
            <button className="btn btn-outline-secondary d-lg-none me-3" onClick={() => setSidebarOpen(true)}>
              <i className="bi bi-list fs-5"></i>
            </button>

            {/* Welcome banner */}
            <div className="d-none d-sm-block">
              <div className="d-flex align-items-center gap-2">
                <span className="badge bg-primary bg-opacity-10 text-primary border border-primary-subtle rounded-pill fw-semibold px-2 py-0.5" style={{ fontSize: '0.72rem' }}>
                  Portal Resmi
                </span>
                <span className="text-secondary small" style={{ fontSize: '0.8rem' }}>Universitas Sam Ratulangi</span>
              </div>
              <h5 className="fw-bold mb-0 text-dark mt-1" style={{ fontSize: '1.05rem', letterSpacing: '-0.3px' }}>E-Organization Portal</h5>
            </div>

            {/* Quick Profile Right */}
            <div className="ms-auto d-flex align-items-center gap-3">
              <span className="text-muted small d-none d-md-block">
                Halo, <strong className="text-dark">{user.name.split(" ")[0]}</strong>
                <span className="badge bg-secondary bg-opacity-10 text-secondary border border-secondary-subtle px-2 py-0.5 ms-2 small">
                  {user.role === "admin" 
                    ? "Admin" 
                    : user.role === "lecturer" 
                      ? "Admin" 
                      : (() => {
                          const leaderOrManager = user.memberships?.find(m => m.role === "leader" || m.role === "manager");
                          if (leaderOrManager) {
                            return `${leaderOrManager.role === "leader" ? "Ketua" : "Pengurus"} ${leaderOrManager.orgName}`;
                          }
                          return "Mahasiswa";
                        })()
                  }
                </span>
              </span>
              <div className="avatar-placeholder rounded-circle bg-primary bg-opacity-10 text-primary d-flex align-items-center justify-content-center" style={{ width: "38px", height: "38px" }}>
                <span className="fw-bold small">{user.name.charAt(0).toUpperCase()}</span>
              </div>
              <button
                type="button"
                onClick={handleLogout}
                disabled={isLoggingOut}
                className="btn btn-sm btn-outline-danger d-flex align-items-center gap-2 px-3 py-1.5 rounded-2"
                title="Keluar"
              >
                <i className="bi bi-box-arrow-left"></i>
                <span className="d-none d-sm-inline fw-semibold small">{isLoggingOut ? "Keluar..." : "Keluar"}</span>
              </button>
            </div>

          </div>
        </header>

        {/* Sub-page Content */}
        <main className="flex-grow-1 p-4 overflow-auto">
          {children}
        </main>

      </div>

      <style jsx global>{`
        .hover-bg-light-dark:hover {
          background-color: rgba(255, 255, 255, 0.05);
          color: white !important;
        }
        .translate-middle-x-hide {
          transform: translateX(-260px);
          transition: transform 0.25s ease-out;
        }
        .translate-middle-x-none {
          transform: translateX(0);
          transition: transform 0.25s ease-out;
        }
      `}</style>
    </div>
  );
}
