import Link from "next/link";
import Logo from "@/components/Logo";

export default function Home() {
  return (
    <div className="d-flex flex-column min-vh-100 bg-light">
      {/* Header / Navbar */}
      <header className="navbar navbar-expand-lg navbar-dark bg-dark shadow-sm">
        <div className="container">
          <Link href="/" className="navbar-brand d-flex align-items-center text-decoration-none">
            <Logo theme="dark" height={48} />
          </Link>
          <div className="d-flex gap-2">
            <Link href="/login" className="btn btn-outline-light btn-sm px-3 hover-lift">
              <i className="bi bi-box-arrow-in-right me-1"></i> Masuk
            </Link>
            <Link href="/register" className="btn btn-primary btn-sm px-3 hover-lift">
              Daftar
            </Link>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <main className="flex-grow-1 d-flex align-items-center py-5">
        <div className="container">
          <div className="row align-items-center g-5">
            <div className="col-lg-6 text-center text-lg-start">
              <span className="badge bg-primary-subtle text-primary border border-primary-subtle px-3 py-2 rounded-pill fw-semibold mb-3">
                <i className="bi bi-stars me-1"></i> Platform Ormawa Terintegrasi
              </span>
              <h1 className="display-4 fw-extrabold tracking-tight mb-3 text-dark">
                Kelola Kegiatan Organisasi Kampus Lebih <span className="text-primary">Cepat & Transparan</span>
              </h1>
              <p className="lead text-secondary mb-4">
                Sistem informasi satu pintu untuk pendaftaran, manajemen kegiatan, pengajuan proposal, dan pencapaian prestasi Ormawa di Universitas Sam Ratulangi.
              </p>
              <div className="d-flex flex-column flex-sm-row gap-3 justify-content-center justify-content-lg-start">
                <Link href="/login" className="btn btn-primary btn-lg px-4 hover-lift py-3 fw-bold">
                  <i className="bi bi-rocket-takeoff me-2"></i> Mulai Sekarang
                </Link>
                <Link href="/dashboard/activities" className="btn btn-outline-secondary btn-lg px-4 hover-lift py-3">
                  <i className="bi bi-calendar-event me-2"></i> Lihat Kegiatan
                </Link>
              </div>
            </div>
            
            <div className="col-lg-6">
              <div className="row g-4">
                <div className="col-sm-6">
                  <div className="card border-0 shadow-sm rounded-4 p-4 hover-lift h-100 bg-white">
                    <div className="bg-primary bg-opacity-10 text-primary rounded-3 p-3 d-inline-block mb-3" style={{ width: 'fit-content' }}>
                      <i className="bi bi-file-earmark-text-fill fs-3"></i>
                    </div>
                    <h5 className="fw-bold">Pengajuan Digital</h5>
                    <p className="text-muted small mb-0">Ajukan proposal kegiatan, surat izin, dan LPJ secara online tanpa kertas.</p>
                  </div>
                </div>
                
                <div className="col-sm-6">
                  <div className="card border-0 shadow-sm rounded-4 p-4 hover-lift h-100 bg-white">
                    <div className="bg-success bg-opacity-10 text-success rounded-3 p-3 d-inline-block mb-3" style={{ width: 'fit-content' }}>
                      <i className="bi bi-clock-history fs-3"></i>
                    </div>
                    <h5 className="fw-bold">Realtime Tracking</h5>
                    <p className="text-muted small mb-0">Pantau status approval proposal Anda secara langsung di dashboard.</p>
                  </div>
                </div>

                <div className="col-sm-6">
                  <div className="card border-0 shadow-sm rounded-4 p-4 hover-lift h-100 bg-white">
                    <div className="bg-warning bg-opacity-10 text-warning rounded-3 p-3 d-inline-block mb-3" style={{ width: 'fit-content' }}>
                      <i className="bi bi-trophy-fill fs-3"></i>
                    </div>
                    <h5 className="fw-bold">Papan Prestasi</h5>
                    <p className="text-muted small mb-0">Publikasikan pencapaian prestasi ormawa Anda untuk seluruh civitas akademika.</p>
                  </div>
                </div>

                <div className="col-sm-6">
                  <div className="card border-0 shadow-sm rounded-4 p-4 hover-lift h-100 bg-white">
                    <div className="bg-info bg-opacity-10 text-info rounded-3 p-3 d-inline-block mb-3" style={{ width: 'fit-content' }}>
                      <i className="bi bi-bell-fill fs-3"></i>
                    </div>
                    <h5 className="fw-bold">Notifikasi Instan</h5>
                    <p className="text-muted small mb-0">Dapatkan notifikasi realtime saat dosen pembina menyetujui proposal Anda.</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="bg-white border-top py-4">
        <div className="container text-center text-md-start">
          <div className="row align-items-center justify-content-between g-3">
            <div className="col-md-6">
              <p className="text-muted small mb-0">
                &copy; {new Date().getFullYear()} Universitas Sam Ratulangi - E-Organization. Hak Cipta Dilindungi.
              </p>
            </div>
            <div className="col-md-6 text-md-end">
              <span className="text-muted small me-3">Dibuat dengan Next.js & Bootstrap</span>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
