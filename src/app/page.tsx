import Link from "next/link";
import Logo from "@/components/Logo";

type LandingOrganization = {
  id: number;
  name: string;
  description: string | null;
  orgType: string;
  organizationLevel: string;
  scopeName: string | null;
  status: "open" | "closed";
  quota: number;
  registered: number;
  imageUrl: string | null;
};

type LiveItem = {
  icon: string;
  tone: "primary" | "success" | "warning" | "info";
  label: string;
  title: string;
  source: string;
  meta: string;
};

const fallbackOrganizations: LandingOrganization[] = [
  {
    id: 0,
    name: "BEM Universitas",
    description: "Ruang koordinasi eksekutif mahasiswa tingkat universitas untuk menggerakkan aspirasi, advokasi, dan program lintas fakultas.",
    orgType: "BEM Universitas",
    organizationLevel: "Universitas",
    scopeName: "Universitas Sam Ratulangi",
    status: "open",
    quota: 180,
    registered: 124,
    imageUrl: "/images/orgs/bem.svg",
  },
  {
    id: 0,
    name: "Badan Perwakilan Mahasiswa",
    description: "Lembaga perwakilan mahasiswa yang menjaga aspirasi, pengawasan organisasi, dan forum musyawarah kemahasiswaan.",
    orgType: "BPM",
    organizationLevel: "Universitas",
    scopeName: "Universitas Sam Ratulangi",
    status: "open",
    quota: 120,
    registered: 82,
    imageUrl: "/images/orgs/bpm.svg",
  },
  {
    id: 0,
    name: "Himpunan Mahasiswa",
    description: "Komunitas program studi yang memperkuat jejaring akademik, kaderisasi, riset, dan kegiatan profesi mahasiswa.",
    orgType: "Himpunan Mahasiswa",
    organizationLevel: "Program Studi",
    scopeName: "Fakultas",
    status: "closed",
    quota: 100,
    registered: 74,
    imageUrl: "/images/orgs/himpunan.svg",
  },
  {
    id: 0,
    name: "Unit Kegiatan Mahasiswa",
    description: "Wadah minat, bakat, kreativitas, pengabdian, olahraga, seni, dan pengembangan diri mahasiswa lintas fakultas.",
    orgType: "UKM",
    organizationLevel: "Universitas",
    scopeName: "Lintas Fakultas",
    status: "open",
    quota: 160,
    registered: 118,
    imageUrl: "/images/orgs/ukm.svg",
  },
];

const fallbackLiveItems: LiveItem[] = [
  {
    icon: "bi-calendar2-event-fill",
    tone: "primary",
    label: "Agenda",
    title: "Forum koordinasi program kerja ORMAWA",
    source: "Kemahasiswaan",
    meta: "Pendaftaran dibuka",
  },
  {
    icon: "bi-people-fill",
    tone: "success",
    label: "Rekrutmen",
    title: "Open recruitment pengurus muda dan relawan kegiatan",
    source: "BEM Fakultas",
    meta: "Aktif",
  },
  {
    icon: "bi-lightbulb-fill",
    tone: "primary",
    label: "Program",
    title: "Kelas kepemimpinan dan manajemen organisasi mahasiswa",
    source: "BEM Universitas",
    meta: "Akan datang",
  },
  {
    icon: "bi-megaphone-fill",
    tone: "info",
    label: "Kabar",
    title: "Informasi seleksi kepanitiaan dan delegasi mahasiswa",
    source: "Mading ORMAWA",
    meta: "Publik",
  },
  {
    icon: "bi-music-note-beamed",
    tone: "info",
    label: "Kreatif",
    title: "Festival seni, olahraga, dan komunitas minat bakat",
    source: "UKM UNSRAT",
    meta: "Lintas fakultas",
  },
  {
    icon: "bi-trophy-fill",
    tone: "warning",
    label: "Prestasi",
    title: "Capaian mahasiswa dan organisasi kampus",
    source: "Arsip Prestasi",
    meta: "Terverifikasi",
  },
  {
    icon: "bi-broadcast-pin",
    tone: "warning",
    label: "Delegasi",
    title: "Pendataan delegasi lomba dan kompetisi mahasiswa",
    source: "Himpunan Mahasiswa",
    meta: "Dikurasi",
  },
];

function formatStat(value: number) {
  if (value >= 1000) {
    return `${(value / 1000).toFixed(value >= 10000 ? 0 : 1)}k+`;
  }

  return `${value}`;
}

function resolveOrgImage(org: Pick<LandingOrganization, "imageUrl" | "orgType" | "name">) {
  if (org.imageUrl) return org.imageUrl;

  const name = `${org.orgType} ${org.name}`.toLowerCase();

  if (name.includes("bem")) return "/images/orgs/bem.svg";
  if (name.includes("bpm")) return "/images/orgs/bpm.svg";
  if (name.includes("himpunan")) return "/images/orgs/himpunan.svg";
  if (name.includes("teknologi") || name.includes("informatika") || name.includes("komputer")) return "/images/orgs/technology.svg";

  return "/images/orgs/ukm.svg";
}

function capacityPercent(org: LandingOrganization) {
  if (!org.quota || org.quota <= 0) return 0;
  return Math.max(0, Math.min(100, Math.round((org.registered / org.quota) * 100)));
}

function getLandingPulse() {
  return {
    stats: {
      organizations: 35,
      openOrganizations: 22,
      events: 38,
      openEvents: 10,
      achievements: 36,
    },
    organizations: fallbackOrganizations,
    liveItems: fallbackLiveItems,
  };
}

export default function Home() {
  const pulse = getLandingPulse();
  const heroStats = [
    { value: formatStat(pulse.stats.organizations), label: "ORMAWA" },
    { value: formatStat(pulse.stats.events), label: "Kegiatan" },
    { value: formatStat(pulse.stats.achievements), label: "Prestasi" },
  ];
  const duplicatedLiveItems = [...pulse.liveItems, ...pulse.liveItems];

  return (
    <div className="d-flex flex-column min-vh-100 bg-mesh-light overflow-hidden">
      <header className="navbar navbar-expand-lg navbar-light sticky-top shadow-sm landing-navbar">
        <div className="container py-2">
          <Link href="/" className="navbar-brand d-flex align-items-center text-decoration-none hover-bounce">
            <Logo theme="light" height={42} />
          </Link>
          <div className="d-flex gap-3 align-items-center">
            <span className="d-none d-md-inline-flex align-items-center gap-2 landing-live-status px-3 py-2 rounded-pill small fw-bold">
              <span className="live-dot"></span>
              {pulse.stats.openOrganizations} pendaftaran aktif
            </span>
            <Link href="/login" className="text-dark text-decoration-none fw-semibold hover-lift d-none d-sm-block me-2">
              Masuk
            </Link>
            <Link href="/register" className="btn btn-primary px-3 px-sm-4 py-2 rounded-pill shadow-sm hover-lift fw-bold">
              Daftar Akun
            </Link>
          </div>
        </div>
      </header>

      <main className="flex-grow-1 position-relative">
        <section className="d-flex align-items-center py-3 position-relative hero-shell">
          <div className="container position-relative z-1 pt-3 pb-2">
            <div className="row align-items-center g-5">
              <div className="col-lg-6 text-center text-lg-start pe-lg-5">
                <div className="d-inline-flex align-items-center hero-badge px-4 py-2 rounded-pill fw-semibold mb-4 animate-float">
                  <i className="bi bi-stars me-2 fs-5"></i>
                  <span className="small tracking-wide text-uppercase fw-bold">Ruang Digital ORMAWA UNSRAT</span>
                </div>
                <h1 className="display-4 fw-extrabold tracking-tight mb-3 text-dark hero-title" style={{ lineHeight: 1.15 }}>
                  Temukan dan Kelola Kegiatan ORMAWA <br className="d-none d-lg-block" /> dengan <span className="text-gradient-primary">Lebih Rapi</span>
                </h1>
                <div className="gold-prestige-line mb-4 mx-auto mx-lg-0"></div>
                <p className="lead text-secondary mb-4 fs-5 pe-lg-4" style={{ lineHeight: 1.6 }}>
                  Satu ruang bersama untuk mahasiswa UNSRAT menemukan organisasi, mendaftar kegiatan, mengajukan program kerja, dan merayakan prestasi ORMAWA.
                </p>
                <div className="d-flex flex-column flex-sm-row gap-3 justify-content-center justify-content-lg-start">
                  <Link href="/login" className="btn btn-primary btn-lg px-5 hover-lift py-3 fw-bold rounded-pill shadow">
                    <i className="bi bi-rocket-takeoff me-2"></i> Masuk ke Sistem
                  </Link>
                  <Link href="/dashboard/activities" className="btn btn-white bg-white text-dark btn-lg px-5 hover-lift py-3 fw-bold rounded-pill shadow-sm border">
                    <i className="bi bi-calendar-event me-2 text-primary"></i> Jelajahi Kegiatan
                  </Link>
                </div>

                <div className="mt-5 pt-4 d-flex align-items-center justify-content-center justify-content-lg-start gap-4 opacity-75 hero-stat-row">
                  {heroStats.map((stat, index) => (
                    <div key={stat.label} className="d-flex align-items-center gap-4">
                      {index > 0 && <div className="border-start h-50 d-none d-sm-block" style={{ minHeight: "30px" }}></div>}
                      <div className="text-center">
                        <h4 className="fw-bolder text-dark mb-0">{stat.value}</h4>
                        <small className="text-muted fw-medium">{stat.label}</small>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="col-lg-6 position-relative d-none d-lg-block">
                <div className="row g-4">
                  <div className="col-sm-6 animate-float pt-sm-5">
                    <div className="card-glass-premium rounded-4 p-4 h-100">
                      <div className="bg-primary bg-opacity-10 text-primary feature-icon p-3 d-flex align-items-center justify-content-center mb-4">
                        <i className="bi bi-file-earmark-text-fill fs-3"></i>
                      </div>
                      <h5 className="fw-bolder mb-3 text-dark">Pengajuan Kegiatan</h5>
                      <p className="text-secondary small mb-0" style={{ lineHeight: 1.6 }}>Ajukan program kerja dan kegiatan ORMAWA secara tertata, dari rencana awal sampai arsip kegiatan.</p>
                    </div>
                  </div>

                  <div className="col-sm-6 animate-float-delay-1">
                    <div className="card-glass-premium rounded-4 p-4 h-100">
                      <div className="bg-success bg-opacity-10 text-success feature-icon p-3 d-flex align-items-center justify-content-center mb-4">
                        <i className="bi bi-clock-history fs-3"></i>
                      </div>
                      <h5 className="fw-bolder mb-3 text-dark">Pantau Status</h5>
                      <p className="text-secondary small mb-0" style={{ lineHeight: 1.6 }}>Cek perkembangan pengajuan tanpa perlu menebak sudah sampai di tahap mana.</p>
                    </div>
                  </div>

                  <div className="col-sm-6 animate-float-delay-2 pt-sm-4">
                    <div className="card-glass-premium rounded-4 p-4 h-100">
                      <div className="bg-warning bg-opacity-10 text-warning feature-icon p-3 d-flex align-items-center justify-content-center mb-4">
                        <i className="bi bi-trophy-fill fs-3"></i>
                      </div>
                      <h5 className="fw-bolder mb-3 text-dark">Arsip Prestasi</h5>
                      <p className="text-secondary small mb-0" style={{ lineHeight: 1.6 }}>Simpan dan tampilkan capaian ORMAWA agar mudah ditemukan oleh mahasiswa dan civitas kampus.</p>
                    </div>
                  </div>

                  <div className="col-sm-6 animate-float-delay-3">
                    <div className="card-glass-premium rounded-4 p-4 h-100">
                      <div className="bg-info bg-opacity-10 text-info feature-icon p-3 d-flex align-items-center justify-content-center mb-4">
                        <i className="bi bi-bell-fill fs-3"></i>
                      </div>
                      <h5 className="fw-bolder mb-3 text-dark">Info untuk Anggota</h5>
                      <p className="text-secondary small mb-0" style={{ lineHeight: 1.6 }}>Pengumuman penting dari pengurus bisa dibaca anggota pada satu tempat yang rapi.</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="landing-section campus-pulse-band py-5">
          <div className="container">
            <div className="row align-items-center g-4">
              <div className="col-lg-4">
                <div className="d-flex align-items-center gap-2 mb-3 text-primary fw-bold small text-uppercase">
                  <span className="live-dot"></span>
                  Denyut Kampus
                </div>
                <h2 className="fw-extrabold text-dark mb-3">Agenda dan kabar ORMAWA terus bergerak.</h2>
                <p className="text-secondary mb-0">
                  Mahasiswa bisa melihat organisasi yang aktif, kegiatan yang sedang dibuka, serta mading terbaru tanpa kehilangan konteks kampus.
                </p>
              </div>

              <div className="col-lg-8">
                <div className="campus-pulse-panel p-3 p-md-4">
                  <div className="row g-3 mb-4">
                    <div className="col-sm-4">
                      <div className="campus-pulse-metric">
                        <span>{formatStat(pulse.stats.openEvents)}</span>
                        <small>Kegiatan dibuka</small>
                      </div>
                    </div>
                    <div className="col-sm-4">
                      <div className="campus-pulse-metric">
                        <span>{formatStat(pulse.stats.openOrganizations)}</span>
                        <small>Rekrutmen anggota</small>
                      </div>
                    </div>
                    <div className="col-sm-4">
                      <div className="campus-pulse-metric">
                        <span>{formatStat(pulse.liveItems.length)}</span>
                        <small>Update terbaru</small>
                      </div>
                    </div>
                  </div>

                  <div className="live-ticker" aria-label="Kabar dan agenda terbaru">
                    <div className="live-ticker-track">
                      {duplicatedLiveItems.map((item, index) => (
                        <div className="live-ticker-item" key={`${item.title}-${index}`}>
                          <span className={`live-ticker-icon tone-${item.tone}`}>
                            <i className={`bi ${item.icon}`}></i>
                          </span>
                          <span className="live-ticker-copy">
                            <strong>{item.label}</strong>
                            <span>{item.title}</span>
                            <small>{item.source} - {item.meta}</small>
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="landing-section bg-white py-5">
          <div className="container py-lg-4">
            <div className="d-flex flex-column flex-lg-row align-items-lg-end justify-content-between gap-3 mb-4">
              <div>
                <h2 className="fw-extrabold text-dark mb-2">Organisasi yang Sedang Aktif</h2>
                <p className="text-secondary mb-0">Profil ORMAWA ditampilkan dengan konteks lingkup, kapasitas, dan status pendaftaran.</p>
              </div>
              <Link href="/dashboard/organizations" className="btn btn-outline-primary rounded-pill px-4 fw-bold align-self-start align-self-lg-auto">
                Lihat Semua Organisasi <i className="bi bi-arrow-right-short align-middle fs-5"></i>
              </Link>
            </div>

            <div className="row g-4">
              {pulse.organizations.map((org) => {
                const percent = capacityPercent(org);
                const href = org.id > 0 ? `/dashboard/organizations/${org.id}` : "/dashboard/organizations";

                return (
                  <div className="col-12 col-md-6 col-xl-3" key={`${org.name}-${org.id}`}>
                    <Link href={href} className="text-decoration-none text-dark d-block h-100">
                      <article className="org-spotlight-card h-100">
                        <div className="org-spotlight-media">
                          <span
                            className="org-spotlight-image"
                            style={{ backgroundImage: `url(${resolveOrgImage(org)})` }}
                            aria-hidden="true"
                          ></span>
                          <span className={`org-status-chip ${org.status === "open" ? "is-open" : "is-closed"}`}>
                            {org.status === "open" ? "Buka Anggota" : "Tutup Anggota"}
                          </span>
                        </div>
                        <div className="p-3 d-flex flex-column flex-grow-1">
                          <div className="d-flex align-items-center justify-content-between gap-2 mb-3">
                            <span className="small fw-bold text-primary text-uppercase">{org.orgType}</span>
                            <span className="small text-muted">{org.organizationLevel}</span>
                          </div>
                          <h3 className="h6 fw-extrabold text-dark mb-2">{org.name}</h3>
                          <p className="text-secondary small mb-3 org-spotlight-description">{org.description || "Profil organisasi sedang dilengkapi pengurus."}</p>
                          <div className="mt-auto">
                            <div className="d-flex justify-content-between small text-muted mb-2">
                              <span>{org.scopeName || "Cakupan Universitas"}</span>
                              <span>{percent}% kapasitas</span>
                            </div>
                            <div className="capacity-line" aria-hidden="true">
                              <span style={{ width: `${percent}%` }}></span>
                            </div>
                          </div>
                        </div>
                      </article>
                    </Link>
                  </div>
                );
              })}
            </div>
          </div>
        </section>

        <section className="landing-section campus-flow-section py-5">
          <div className="container py-lg-4">
            <div className="row align-items-center g-5">
              <div className="col-lg-5">
                <h2 className="fw-extrabold text-dark mb-3">Alur kerja dibuat jelas dari awal sampai arsip.</h2>
                <p className="text-secondary mb-4">
                  Sistem membantu pengurus, administrator, dan mahasiswa melihat posisi kegiatan tanpa percakapan yang tercecer.
                </p>
                <Link href="/login" className="btn btn-primary rounded-pill px-4 py-2 fw-bold hover-lift">
                  Mulai Kelola Kegiatan
                </Link>
              </div>
              <div className="col-lg-7">
                <div className="campus-flow-rail">
                  {[
                    { icon: "bi-pencil-square", title: "Ajukan", text: "Pengurus menyusun program kerja atau delegasi lomba." },
                    { icon: "bi-person-check-fill", title: "Tinjau", text: "Administrator meninjau dan menyetujui proposal kegiatan." },
                    { icon: "bi-broadcast-pin", title: "Publikasi", text: "Kegiatan, kabar, dan prestasi tampil di ruang mahasiswa." },
                  ].map((step, index) => (
                    <div className="campus-flow-step" key={step.title}>
                      <span className="campus-flow-index">{index + 1}</span>
                      <span className="campus-flow-icon">
                        <i className={`bi ${step.icon}`}></i>
                      </span>
                      <div>
                        <h3 className="h6 fw-extrabold text-dark mb-1">{step.title}</h3>
                        <p className="text-secondary small mb-0">{step.text}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </section>
      </main>

      <footer className="bg-white border-top py-4 mt-auto z-1 position-relative">
        <div className="container text-center text-md-start">
          <div className="row align-items-center justify-content-between g-3">
            <div className="col-md-6">
              <p className="text-muted small mb-0 fw-medium">
                &copy; {new Date().getFullYear()} Universitas Sam Ratulangi - E-Organization ORMAWA.
              </p>
            </div>
            <div className="col-md-6 text-md-end">
              <span className="badge bg-light text-secondary border px-3 py-2 rounded-pill small fw-medium">Dikelola untuk kegiatan kemahasiswaan</span>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
