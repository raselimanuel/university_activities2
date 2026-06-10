import Link from "next/link";
import Logo from "@/components/Logo";

export default function Home() {
  return (
    <div className="d-flex flex-column min-vh-100 bg-mesh-light overflow-hidden">
      {/* Header / Navbar - Glassmorphic */}
      <header className="navbar navbar-expand-lg navbar-light sticky-top shadow-sm" style={{ background: 'rgba(255, 255, 255, 0.96)' }}>
        <div className="container py-2">
          <Link href="/" className="navbar-brand d-flex align-items-center text-decoration-none hover-bounce">
            <Logo theme="light" height={42} />
          </Link>
          <div className="d-flex gap-3 align-items-center">
            <Link href="/login" className="text-dark text-decoration-none fw-semibold hover-lift d-none d-sm-block me-2">
              Masuk
            </Link>
            <Link href="/register" className="btn btn-primary px-4 py-2 rounded-pill shadow-sm hover-lift fw-bold">
              Daftar Sekarang
            </Link>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <main className="flex-grow-1 d-flex align-items-center py-5 position-relative" style={{ minHeight: 'calc(100vh - 74px)' }}>
        <div className="container position-relative z-1 py-5">
          <div className="row align-items-center g-5">
            {/* Left Content */}
            <div className="col-lg-6 text-center text-lg-start pe-lg-5">
              <div className="d-inline-flex align-items-center hero-badge px-4 py-2 rounded-pill fw-semibold mb-4 animate-float">
                <i className="bi bi-stars me-2 fs-5"></i> 
                <span className="small tracking-wide text-uppercase fw-bold">Platform Ormawa Terintegrasi</span>
              </div>
              <h1 className="display-4 fw-extrabold tracking-tight mb-4 text-dark" style={{ lineHeight: 1.15 }}>
                Kelola Kegiatan Organisasi Kampus <br className="d-none d-lg-block"/> Lebih <span className="text-gradient-primary">Cepat & Transparan</span>
              </h1>
              <p className="lead text-secondary mb-5 fs-5 pe-lg-4" style={{ lineHeight: 1.6 }}>
                Sistem informasi satu pintu untuk pendaftaran, manajemen kegiatan, pengajuan proposal, dan pencapaian prestasi Ormawa di Universitas Sam Ratulangi.
              </p>
              <div className="d-flex flex-column flex-sm-row gap-3 justify-content-center justify-content-lg-start">
                <Link href="/login" className="btn btn-primary btn-lg px-5 hover-lift py-3 fw-bold rounded-pill shadow">
                  <i className="bi bi-rocket-takeoff me-2"></i> Mulai Sekarang
                </Link>
                <Link href="/dashboard/activities" className="btn btn-white bg-white text-dark btn-lg px-5 hover-lift py-3 fw-bold rounded-pill shadow-sm border">
                  <i className="bi bi-calendar-event me-2 text-primary"></i> Lihat Kegiatan
                </Link>
              </div>
              
              <div className="mt-5 pt-4 d-flex align-items-center justify-content-center justify-content-lg-start gap-4 opacity-75">
                <div className="text-center">
                  <h4 className="fw-bolder text-dark mb-0">150+</h4>
                  <small className="text-muted fw-medium">Organisasi</small>
                </div>
                <div className="border-start h-50" style={{ minHeight: '30px' }}></div>
                <div className="text-center">
                  <h4 className="fw-bolder text-dark mb-0">2.5k+</h4>
                  <small className="text-muted fw-medium">Kegiatan</small>
                </div>
                <div className="border-start h-50" style={{ minHeight: '30px' }}></div>
                <div className="text-center">
                  <h4 className="fw-bolder text-dark mb-0">10k+</h4>
                  <small className="text-muted fw-medium">Mahasiswa</small>
                </div>
              </div>
            </div>
            
            {/* Right Content - Floating Cards */}
            <div className="col-lg-6 position-relative">
              {/* Decorative blob */}
              <div className="position-absolute top-50 start-50 translate-middle rounded-circle opacity-10" style={{ background: 'linear-gradient(135deg, #E31B23, #B90D23)', width: '360px', height: '360px', filter: 'blur(32px)', zIndex: -1 }}></div>
              
              <div className="row g-4">
                <div className="col-sm-6 animate-float pt-sm-5">
                  <div className="card-glass-premium rounded-4 p-4 h-100">
                    <div className="bg-primary bg-opacity-10 text-primary rounded-circle p-3 d-flex align-items-center justify-content-center mb-4" style={{ width: '64px', height: '64px' }}>
                      <i className="bi bi-file-earmark-text-fill fs-3"></i>
                    </div>
                    <h5 className="fw-bolder mb-3 text-dark">Pengajuan Digital</h5>
                    <p className="text-secondary small mb-0" style={{ lineHeight: 1.6 }}>Ajukan proposal kegiatan, surat izin, dan LPJ secara online tanpa kertas sama sekali.</p>
                  </div>
                </div>
                
                <div className="col-sm-6 animate-float-delay-1">
                  <div className="card-glass-premium rounded-4 p-4 h-100">
                    <div className="bg-success bg-opacity-10 text-success rounded-circle p-3 d-flex align-items-center justify-content-center mb-4" style={{ width: '64px', height: '64px' }}>
                      <i className="bi bi-clock-history fs-3"></i>
                    </div>
                    <h5 className="fw-bolder mb-3 text-dark">Realtime Tracking</h5>
                    <p className="text-secondary small mb-0" style={{ lineHeight: 1.6 }}>Pantau status approval proposal Anda secara langsung dari layar perangkat Anda.</p>
                  </div>
                </div>

                <div className="col-sm-6 animate-float-delay-2 pt-sm-4">
                  <div className="card-glass-premium rounded-4 p-4 h-100">
                    <div className="bg-warning bg-opacity-10 text-warning rounded-circle p-3 d-flex align-items-center justify-content-center mb-4" style={{ width: '64px', height: '64px' }}>
                      <i className="bi bi-trophy-fill fs-3"></i>
                    </div>
                    <h5 className="fw-bolder mb-3 text-dark">Papan Prestasi</h5>
                    <p className="text-secondary small mb-0" style={{ lineHeight: 1.6 }}>Publikasikan pencapaian prestasi ormawa Anda untuk dilihat seluruh civitas akademika.</p>
                  </div>
                </div>

                <div className="col-sm-6 animate-float-delay-3">
                  <div className="card-glass-premium rounded-4 p-4 h-100">
                    <div className="bg-info bg-opacity-10 text-info rounded-circle p-3 d-flex align-items-center justify-content-center mb-4" style={{ width: '64px', height: '64px' }}>
                      <i className="bi bi-bell-fill fs-3"></i>
                    </div>
                    <h5 className="fw-bolder mb-3 text-dark">Notifikasi Instan</h5>
                    <p className="text-secondary small mb-0" style={{ lineHeight: 1.6 }}>Dapatkan notifikasi realtime saat admin menyetujui proposal kegiatan Anda.</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="bg-white border-top py-4 mt-auto z-1 position-relative">
        <div className="container text-center text-md-start">
          <div className="row align-items-center justify-content-between g-3">
            <div className="col-md-6">
              <p className="text-muted small mb-0 fw-medium">
                &copy; {new Date().getFullYear()} Universitas Sam Ratulangi - E-Organization. Hak Cipta Dilindungi.
              </p>
            </div>
            <div className="col-md-6 text-md-end">
              <span className="badge bg-light text-secondary border px-3 py-2 rounded-pill small fw-medium">Dibuat dengan Next.js & Bootstrap</span>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
