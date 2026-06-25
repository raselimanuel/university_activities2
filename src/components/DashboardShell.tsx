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
    role: "student" | "admin";
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
    { href: "/dashboard", label: "Beranda", icon: "bi-grid-1x2-fill", roles: ["student", "admin"] },
    { href: "/dashboard/activities", label: "Kegiatan", icon: "bi-calendar2-event-fill", roles: ["student", "admin"] },
    { href: "/dashboard/organizations", label: "Organisasi", icon: "bi-diagram-3-fill", roles: ["student", "admin"] },
    { href: "/dashboard/achievements", label: "Prestasi", icon: "bi-trophy-fill", roles: ["student", "admin"] },
    { href: "/dashboard/announcements", label: "Mading", icon: "bi-megaphone-fill", roles: ["student", "admin"] },
  ];

  const getRoleBadge = (role: string, memberships?: { role: string; orgName: string }[]) => {
    if (role === "admin") {
      return <span className="badge bg-danger bg-opacity-10 text-danger border border-danger-subtle px-2.5 py-1">Administrator</span>;
    }
    const leaderOrManager = memberships?.find(m => m.role === "leader" || m.role === "manager");
    if (leaderOrManager) {
      const prefix = leaderOrManager.role === "leader" ? "Ketua" : "Pengurus";
      return <span className="badge bg-info bg-opacity-10 text-info border border-info-subtle px-2.5 py-1 text-wrap">{prefix} {leaderOrManager.orgName}</span>;
    }
    
    return <span className="badge bg-success bg-opacity-10 text-success border border-success-subtle px-2.5 py-1">Mahasiswa</span>;
  };

  return (
    <div className="d-flex min-vh-100 bg-mesh-light-dashboard">
      
      {/* Sidebar - Desktop Layout (Visible on lg and above) */}
      <aside className="d-none d-lg-flex flex-column sidebar-floating text-white" style={{ width: "260px", minWidth: "260px", position: "sticky", top: "1.25rem", overflowY: "auto" }}>
        
        <div className="p-4 border-bottom border-burgundy-subtle d-flex align-items-center">
          <Link href="/dashboard" className="text-decoration-none">
            <Logo theme="dark" height={50} />
          </Link>
        </div>

        {/* User Card inside Sidebar */}
        <div className="sidebar-user-card-float p-3 mx-3 my-3">
          <div className="sidebar-user-avatar-container">
            <div className="avatar-placeholder rounded-circle bg-primary text-white d-flex align-items-center justify-content-center" style={{ width: "42px", height: "42px", border: "2px solid var(--gold-accent)", boxShadow: "0 0 10px rgba(212, 175, 55, 0.2)" }}>
              <span className="fw-bold fs-6">{user.name.charAt(0).toUpperCase()}</span>
            </div>
            <div className="status-indicator"></div>
          </div>
          <div className="overflow-hidden flex-grow-1">
            <h6 className="fw-bold text-white mb-0 text-truncate" style={{ fontSize: "0.85rem" }}>{user.name}</h6>
            <p className="text-secondary small mb-1 text-truncate" style={{ fontSize: "0.72rem", opacity: 0.85 }}>{user.nim}</p>
            {getRoleBadge(user.role, user.memberships)}
          </div>
        </div>

        {/* Navigation links */}
        <div className="sidebar-section-header">Menu Utama</div>
        <nav className="nav flex-column px-2 gap-1 mb-3">
          {navLinks
            .filter((link) => link.roles.includes(user.role))
            .map((link) => {
              const isActive = pathname ? (pathname === link.href || (link.href !== "/dashboard" && pathname.startsWith(link.href))) : false;
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  className={`sidebar-nav-link-floating ${
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
        <div className="sidebar-section-header">Akun</div>
        <div className="px-2 pb-3 mt-auto" style={process.env.NODE_ENV === "development" ? { paddingBottom: "4.25rem" } : undefined}>
          <button
            type="button"
            onClick={handleLogout}
            disabled={isLoggingOut}
            className="sidebar-logout-link"
          >
            <i className="bi bi-box-arrow-left fs-5"></i>
            <span>{isLoggingOut ? "Keluar..." : "Keluar"}</span>
          </button>
        </div>

      </aside>

      {/* Mobile Sidebar Back-drop / Overlay */}
      {sidebarOpen && (
        <div className="position-fixed top-0 start-0 w-100 h-100 bg-black bg-opacity-50 z-3 d-lg-none" onClick={() => setSidebarOpen(false)}></div>
      )}

      {/* Sidebar - Mobile Layout */}
      <aside className={`position-fixed top-0 start-0 sidebar-floating-mobile text-white z-3 d-lg-none d-flex flex-column ${sidebarOpen ? "translate-middle-x-none" : "translate-middle-x-hide"}`}
        style={{ width: "260px" }}
      >
        <div className="p-4 border-bottom border-burgundy-subtle d-flex align-items-center justify-content-between">
          <Link href="/dashboard" className="text-decoration-none">
            <Logo theme="dark" height={45} />
          </Link>
          <button className="btn btn-link text-white-50 p-0" onClick={() => setSidebarOpen(false)}>
            <i className="bi bi-x-lg fs-5"></i>
          </button>
        </div>

        {/* User Card inside Sidebar */}
        <div className="sidebar-user-card-float p-3 mx-3 my-3">
          <div className="sidebar-user-avatar-container">
            <div className="avatar-placeholder rounded-circle bg-primary text-white d-flex align-items-center justify-content-center" style={{ width: "42px", height: "42px", border: "2px solid var(--gold-accent)", boxShadow: "0 0 10px rgba(212, 175, 55, 0.2)" }}>
              <span className="fw-bold fs-6">{user.name.charAt(0).toUpperCase()}</span>
            </div>
            <div className="status-indicator"></div>
          </div>
          <div className="overflow-hidden flex-grow-1">
            <h6 className="fw-bold text-white mb-0 text-truncate" style={{ fontSize: "0.85rem" }}>{user.name}</h6>
            <p className="text-secondary small mb-1 text-truncate" style={{ fontSize: "0.72rem", opacity: 0.85 }}>{user.nim}</p>
            {getRoleBadge(user.role, user.memberships)}
          </div>
        </div>

        {/* Navigation links */}
        <div className="sidebar-section-header">Menu Utama</div>
        <nav className="nav flex-column px-2 gap-1 mb-3">
          {navLinks
            .filter((link) => link.roles.includes(user.role))
            .map((link) => {
              const isActive = pathname ? (pathname === link.href || (link.href !== "/dashboard" && pathname.startsWith(link.href))) : false;
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  className={`sidebar-nav-link-floating ${
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

        {/* Footer actions */}
        <div className="sidebar-section-header">Akun</div>
        <div className="px-2 pb-3 mt-auto" style={process.env.NODE_ENV === "development" ? { paddingBottom: "4.25rem" } : undefined}>
          <button
            type="button"
            onClick={handleLogout}
            disabled={isLoggingOut}
            className="sidebar-logout-link"
          >
            <i className="bi bi-box-arrow-left fs-5"></i>
            <span>{isLoggingOut ? "Keluar..." : "Keluar"}</span>
          </button>
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="content-canvas">
        
        {/* Mobile Header (Visible only on lg and below) */}
        <header className="navbar navbar-expand d-lg-none px-4 py-3 border-bottom border-burgundy-subtle" style={{ background: 'rgba(12, 5, 6, 0.85)', backdropFilter: 'blur(16px)', position: 'sticky', top: 0, zIndex: 100 }}>
          <div className="container-fluid p-0 d-flex align-items-center justify-content-between">
            
            {/* Sidebar toggle button for mobile */}
            <button className="btn btn-outline-secondary border-burgundy-subtle text-white-50" onClick={() => setSidebarOpen(true)}>
              <i className="bi bi-list fs-4"></i>
            </button>

            {/* Logo in the middle */}
            <Link href="/dashboard" className="text-decoration-none">
              <Logo theme="dark" height={32} />
            </Link>

            {/* Quick Profile Right */}
            <div className="avatar-placeholder rounded-circle bg-primary text-white d-flex align-items-center justify-content-center" style={{ width: "36px", height: "36px", border: "1.5px solid var(--gold-accent)" }}>
              <span className="fw-bold small">{user.name.charAt(0).toUpperCase()}</span>
            </div>

          </div>
        </header>

        {/* Sub-page Content */}
        <main className="flex-grow-1 p-4 p-lg-5 overflow-auto">
          {children}
        </main>

      </div>

      <style jsx global>{`
        .hover-bg-light-dark:hover {
          background-color: rgba(255, 255, 255, 0.05);
          color: white !important;
        }
        .translate-middle-x-hide {
          transform: translateX(-110%);
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
