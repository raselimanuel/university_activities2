// Idempotent seed data for ORMAWA profiles, activities, achievements, and optional announcements.
const fs = require("fs");
const path = require("path");
const postgres = require("postgres");

const envFilePath = path.join(__dirname, "../.env");
if (!fs.existsSync(envFilePath)) {
  console.error("Kesalahan: Berkas .env tidak ditemukan di jalur:", envFilePath);
  process.exit(1);
}

const env = {};
fs.readFileSync(envFilePath, "utf8")
  .split(/\r?\n/)
  .forEach((line) => {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) return;
    const idx = trimmed.indexOf("=");
    if (idx === -1) return;
    const key = trimmed.slice(0, idx).trim();
    const value = trimmed.slice(idx + 1).trim().replace(/^['"]|['"]$/g, "");
    env[key] = value;
  });

const databaseUrl = env.DATABASE_URL || process.env.DATABASE_URL;
if (!databaseUrl) {
  console.error("Kesalahan: DATABASE_URL tidak ditemukan di .env");
  process.exit(1);
}

const sql = postgres(databaseUrl, { prepare: false });

const date = (value) => new Date(`${value}T00:00:00.000+08:00`);

const commonRegistration = {
  registrationStart: date("2026-08-01"),
  registrationEnd: date("2026-09-15"),
};

const organizations = [
  {
    name: "BEM Universitas Sam Ratulangi",
    description:
      "BEM Universitas Sam Ratulangi adalah organisasi eksekutif mahasiswa tingkat universitas yang menjadi ruang koordinasi aspirasi, advokasi, pengabdian, dan kolaborasi lintas fakultas. Fokus utamanya adalah menghubungkan kebutuhan mahasiswa dengan program kemahasiswaan yang berdampak.",
    category: "Eksekutif Mahasiswa",
    quota: 120,
    status: "open",
    orgType: "BEM Universitas",
    organizationLevel: "Universitas",
    scopeName: "Universitas Sam Ratulangi",
    imageUrl: "/images/orgs/bem.svg",
    ...commonRegistration,
    event: ["Forum Aspirasi Mahasiswa UNSRAT 2026", "Diskusi terbuka untuk menghimpun isu akademik, fasilitas, kesejahteraan, dan ruang kolaborasi mahasiswa lintas fakultas.", "Program Kerja", "Aula Rektorat UNSRAT", 250, "2026-09-20", "2026-09-20"],
    achievement: ["Program Advokasi Kampus Terpadu", "Program Kerja Unggulan", 2026, "Menguatkan kanal aspirasi mahasiswa melalui forum berkala dan dokumentasi isu yang terstruktur."],
    announcement: ["Open Recruitment Pengurus BEM Universitas", "Pendaftaran pengurus BEM Universitas dibuka untuk mahasiswa aktif yang siap berkontribusi dalam advokasi, pengabdian, media, dan program strategis kampus.", true],
  },
  {
    name: "BPM Universitas Sam Ratulangi",
    description:
      "BPM Universitas Sam Ratulangi merupakan lembaga perwakilan mahasiswa yang menjalankan fungsi legislasi, pengawasan, dan penyaluran aspirasi. Organisasi ini membantu memastikan program kemahasiswaan berjalan transparan, akuntabel, dan berpihak pada kepentingan mahasiswa.",
    category: "Legislatif Mahasiswa",
    quota: 80,
    status: "open",
    orgType: "BPM",
    organizationLevel: "Universitas",
    scopeName: "Universitas Sam Ratulangi",
    imageUrl: "/images/orgs/bpm.svg",
    ...commonRegistration,
    event: ["Sidang Aspirasi Mahasiswa 2026", "Forum resmi untuk menyusun rekomendasi kebijakan mahasiswa dan mengevaluasi program organisasi kemahasiswaan.", "Program Kerja", "Ruang Sidang Kemahasiswaan", 180, "2026-10-03", "2026-10-03"],
    achievement: ["Dokumen Rekomendasi Kemahasiswaan", "Dokumen Kelembagaan", 2026, "Penyusunan rekomendasi aspirasi mahasiswa berbasis masukan organisasi tingkat fakultas."],
    announcement: ["Pengumpulan Aspirasi Fakultas", "BPM Universitas membuka kanal aspirasi untuk isu akademik, fasilitas, dan layanan kemahasiswaan sampai 30 September 2026.", false],
  },
  {
    name: "BEM Fakultas Teknik",
    description:
      "BEM Fakultas Teknik menjadi wadah eksekutif mahasiswa teknik untuk mengelola program pengembangan kepemimpinan, advokasi akademik, kolaborasi himpunan, dan kegiatan sosial teknologi. Organisasi ini mendorong mahasiswa teknik aktif, kritis, dan berdaya guna.",
    category: "Eksekutif Fakultas",
    quota: 90,
    status: "open",
    orgType: "BEM Fakultas",
    organizationLevel: "Fakultas",
    scopeName: "Fakultas Teknik",
    imageUrl: "/images/orgs/bem.svg",
    ...commonRegistration,
    event: ["Engineering Leadership Camp", "Kaderisasi kepemimpinan untuk mahasiswa teknik dengan materi organisasi, manajemen program, dan kolaborasi antarhimpunan.", "Program Kerja", "Fakultas Teknik UNSRAT", 160, "2026-09-27", "2026-09-28"],
    achievement: ["Kolaborasi Himpunan Teknik", "Program Kolaboratif", 2026, "Menyatukan beberapa himpunan jurusan dalam program pengabdian dan pelatihan teknologi."],
    announcement: ["Pendaftaran Panitia Engineering Leadership Camp", "BEM Fakultas Teknik membuka pendaftaran panitia untuk divisi acara, logistik, publikasi, konsumsi, dan keamanan.", false],
  },
  {
    name: "BEM Fakultas Ekonomi dan Bisnis",
    description:
      "BEM Fakultas Ekonomi dan Bisnis berfokus pada pengembangan kepemimpinan, literasi ekonomi, kewirausahaan, dan advokasi mahasiswa FEB. Programnya dirancang agar mahasiswa terbiasa berpikir strategis, komunikatif, dan siap menghadapi dunia profesional.",
    category: "Eksekutif Fakultas",
    quota: 90,
    status: "open",
    orgType: "BEM Fakultas",
    organizationLevel: "Fakultas",
    scopeName: "Fakultas Ekonomi dan Bisnis",
    imageUrl: "/images/orgs/bem.svg",
    ...commonRegistration,
    event: ["FEB Business Insight Week", "Rangkaian seminar, kelas mini, dan diskusi karier untuk memperkuat wawasan bisnis mahasiswa.", "Program Kerja", "FEB UNSRAT", 220, "2026-10-10", "2026-10-12"],
    achievement: ["Kelas Literasi Keuangan Mahasiswa", "Program Edukasi", 2026, "Menghadirkan materi pengelolaan keuangan pribadi dan kewirausahaan untuk mahasiswa baru."],
    announcement: ["Call for Volunteer Business Insight Week", "Mahasiswa FEB dapat mendaftar sebagai relawan acara melalui sekretariat BEM FEB sampai 5 Oktober 2026.", false],
  },
  {
    name: "BEM Fakultas Hukum",
    description:
      "BEM Fakultas Hukum menjadi ruang gerak mahasiswa hukum untuk advokasi, kajian kebijakan, pengabdian, dan penguatan budaya akademik. Organisasi ini mendorong mahasiswa peka terhadap isu keadilan, tata kelola, dan pelayanan publik.",
    category: "Eksekutif Fakultas",
    quota: 85,
    status: "open",
    orgType: "BEM Fakultas",
    organizationLevel: "Fakultas",
    scopeName: "Fakultas Hukum",
    imageUrl: "/images/orgs/bem.svg",
    ...commonRegistration,
    event: ["Legal Awareness Class", "Kelas pengantar kesadaran hukum untuk mahasiswa dan komunitas sekitar kampus.", "Program Kerja", "Fakultas Hukum UNSRAT", 150, "2026-10-17", "2026-10-17"],
    achievement: ["Klinik Aspirasi Mahasiswa Hukum", "Program Advokasi", 2026, "Menyediakan ruang konsultasi awal untuk isu akademik dan organisasi mahasiswa."],
    announcement: ["Kajian Terbuka Isu Hukum Kampus", "BEM Fakultas Hukum mengundang mahasiswa untuk mengikuti kajian terbuka pekan ini di ruang seminar fakultas.", true],
  },
  {
    name: "BEM Fakultas Ilmu Sosial dan Ilmu Politik",
    description:
      "BEM FISIP menjadi wadah pengembangan kepemimpinan, komunikasi publik, advokasi sosial, dan kajian isu kemasyarakatan. Organisasi ini menumbuhkan mahasiswa yang responsif terhadap dinamika sosial politik dan aktif berkontribusi bagi lingkungan kampus.",
    category: "Eksekutif Fakultas",
    quota: 85,
    status: "open",
    orgType: "BEM Fakultas",
    organizationLevel: "Fakultas",
    scopeName: "Fakultas Ilmu Sosial dan Ilmu Politik",
    imageUrl: "/images/orgs/bem.svg",
    ...commonRegistration,
    event: ["Public Communication Workshop", "Pelatihan komunikasi publik, manajemen opini, dan penyusunan kampanye sosial untuk mahasiswa FISIP.", "Program Kerja", "FISIP UNSRAT", 140, "2026-10-24", "2026-10-24"],
    achievement: ["Kampanye Sosial Mahasiswa", "Program Sosial", 2026, "Menggerakkan mahasiswa dalam kampanye literasi digital dan etika komunikasi publik."],
    announcement: ["Pendaftaran Tim Media BEM FISIP", "Dibuka kesempatan bergabung untuk mahasiswa yang berminat di bidang desain, penulisan, fotografi, dan media sosial.", false],
  },
  {
    name: "Himpunan Mahasiswa Teknik Informatika",
    description:
      "Himpunan Mahasiswa Teknik Informatika adalah organisasi mahasiswa jurusan yang berfokus pada pengembangan akademik, teknologi, riset, kompetisi, dan jejaring profesional. Kegiatan utamanya mencakup pelatihan pemrograman, forum karier, pengabdian digital, dan kaderisasi.",
    category: "Teknologi",
    quota: 110,
    status: "open",
    orgType: "Himpunan Mahasiswa",
    organizationLevel: "Jurusan",
    scopeName: "Teknik Informatika",
    imageUrl: "/images/orgs/technology.svg",
    ...commonRegistration,
    event: ["Informatics Code Camp", "Pelatihan intensif pemrograman dasar, web development, dan kerja tim proyek untuk mahasiswa informatika.", "Program Kerja", "Laboratorium Informatika", 120, "2026-09-21", "2026-09-22"],
    achievement: ["Delegasi Hackathon Kampus", "Finalis", 2026, "Mengirimkan tim mahasiswa pada kompetisi inovasi digital tingkat regional."],
    announcement: ["Open Class Web Development", "HMTI membuka kelas gratis untuk pengenalan HTML, CSS, JavaScript, dan praktik deploy sederhana.", false],
  },
  {
    name: "Himpunan Mahasiswa Teknik Elektro",
    description:
      "Himpunan Mahasiswa Teknik Elektro mengembangkan kapasitas mahasiswa melalui kegiatan akademik, praktikum, riset terapan, pelatihan kelistrikan, dan kolaborasi teknologi. Organisasi ini menjadi jembatan antara dunia kuliah, laboratorium, dan kebutuhan industri.",
    category: "Teknologi",
    quota: 100,
    status: "open",
    orgType: "Himpunan Mahasiswa",
    organizationLevel: "Jurusan",
    scopeName: "Teknik Elektro",
    imageUrl: "/images/orgs/himpunan.svg",
    ...commonRegistration,
    event: ["Basic Electronics Training", "Pelatihan dasar rangkaian elektronik, keselamatan kerja laboratorium, dan pengenalan alat ukur.", "Program Kerja", "Laboratorium Elektro", 90, "2026-10-04", "2026-10-04"],
    achievement: ["Prototipe Sistem Kendali Sederhana", "Karya Teknologi", 2026, "Mendorong mahasiswa menghasilkan prototipe berbasis mikrokontroler untuk kebutuhan pembelajaran."],
    announcement: ["Jadwal Mentoring Praktikum Elektro", "Mentoring praktikum dibuka setiap Jumat sore untuk mahasiswa yang membutuhkan pendampingan materi dasar.", false],
  },
  {
    name: "Himpunan Mahasiswa Teknik Sipil",
    description:
      "Himpunan Mahasiswa Teknik Sipil menjadi ruang pengembangan mahasiswa sipil melalui diskusi konstruksi, manajemen proyek, pengabdian infrastruktur, dan pelatihan perangkat lunak teknik. Organisasi ini menumbuhkan budaya profesional dan solidaritas akademik.",
    category: "Konstruksi",
    quota: 100,
    status: "open",
    orgType: "Himpunan Mahasiswa",
    organizationLevel: "Jurusan",
    scopeName: "Teknik Sipil",
    imageUrl: "/images/orgs/himpunan.svg",
    ...commonRegistration,
    event: ["Civil Project Management Talk", "Diskusi manajemen proyek, keselamatan konstruksi, dan peran engineer muda dalam pembangunan daerah.", "Program Kerja", "Aula Fakultas Teknik", 130, "2026-10-11", "2026-10-11"],
    achievement: ["Studi Lapangan Infrastruktur", "Program Akademik", 2026, "Menyelenggarakan studi lapangan untuk memperkenalkan praktik konstruksi kepada mahasiswa baru."],
    announcement: ["Kelompok Belajar Mekanika Struktur", "HMTS membuka kelompok belajar mingguan untuk memperkuat pemahaman mekanika struktur dan analisis dasar.", false],
  },
  {
    name: "Himpunan Mahasiswa Arsitektur",
    description:
      "Himpunan Mahasiswa Arsitektur mewadahi kreativitas desain, diskusi ruang kota, pameran karya, dan kolaborasi lintas disiplin. Organisasi ini mendukung mahasiswa mengembangkan portofolio, kepekaan visual, serta tanggung jawab sosial dalam perancangan.",
    category: "Desain dan Kreatif",
    quota: 90,
    status: "open",
    orgType: "Himpunan Mahasiswa",
    organizationLevel: "Jurusan",
    scopeName: "Arsitektur",
    imageUrl: "/images/orgs/himpunan.svg",
    ...commonRegistration,
    event: ["Architecture Studio Sharing", "Sesi berbagi proses studio, manajemen portofolio, dan kritik karya antarangkatan.", "Program Kerja", "Studio Arsitektur", 80, "2026-10-18", "2026-10-18"],
    achievement: ["Pameran Karya Mahasiswa Arsitektur", "Pameran Kreatif", 2026, "Menampilkan karya studio dan maket mahasiswa untuk memperkuat budaya apresiasi desain."],
    announcement: ["Open Submission Pameran Studio", "Mahasiswa arsitektur dapat mengirimkan karya terbaik untuk kurasi pameran studio semester ini.", false],
  },
  {
    name: "Himpunan Mahasiswa Teknik Mesin",
    description:
      "Himpunan Mahasiswa Teknik Mesin berfokus pada penguatan kompetensi manufaktur, energi, desain mekanik, dan kerja tim teknik. Programnya meliputi pelatihan perangkat lunak, kunjungan industri, bengkel kreatif, dan pendampingan akademik.",
    category: "Teknologi",
    quota: 100,
    status: "open",
    orgType: "Himpunan Mahasiswa",
    organizationLevel: "Jurusan",
    scopeName: "Teknik Mesin",
    imageUrl: "/images/orgs/himpunan.svg",
    ...commonRegistration,
    event: ["Mechanical Design Clinic", "Pelatihan dasar desain mekanik, pembacaan gambar teknik, dan pengenalan perangkat lunak CAD.", "Program Kerja", "Laboratorium Mesin", 95, "2026-10-25", "2026-10-25"],
    achievement: ["Kelas CAD Mahasiswa", "Program Kompetensi", 2026, "Menyediakan kelas pengantar desain berbantuan komputer bagi mahasiswa teknik mesin."],
    announcement: ["Mentoring Gambar Teknik", "Sesi mentoring gambar teknik dibuka untuk mahasiswa baru setiap Rabu sore di laboratorium mesin.", false],
  },
  {
    name: "UKM Paduan Suara Mahasiswa",
    description:
      "UKM Paduan Suara Mahasiswa menjadi ruang pengembangan minat vokal, musikalitas, disiplin latihan, dan penampilan seni. Anggota belajar teknik bernyanyi, harmoni, manajemen panggung, serta tampil dalam kegiatan kampus dan kompetisi.",
    category: "Seni",
    quota: 75,
    status: "open",
    orgType: "UKM",
    organizationLevel: "Universitas",
    scopeName: "Universitas Sam Ratulangi",
    imageUrl: "/images/orgs/ukm.svg",
    ...commonRegistration,
    event: ["Voice and Harmony Class", "Kelas teknik vokal, pernapasan, dan latihan harmoni untuk calon anggota paduan suara.", "Program Kerja", "Gedung Kesenian Kampus", 70, "2026-09-26", "2026-09-26"],
    achievement: ["Penampilan Dies Natalis Kampus", "Penampil Resmi", 2026, "Berpartisipasi dalam agenda resmi kampus melalui penampilan paduan suara."],
    announcement: ["Audisi Anggota Paduan Suara", "Audisi dibuka untuk semua mahasiswa aktif yang memiliki minat bernyanyi dan siap mengikuti latihan rutin.", true],
  },
  {
    name: "UKM Pers Mahasiswa",
    description:
      "UKM Pers Mahasiswa adalah wadah jurnalistik kampus yang melatih penulisan berita, fotografi, riset isu, desain editorial, dan etika media. Organisasi ini mendukung budaya literasi, dokumentasi kegiatan, dan ruang kritik yang bertanggung jawab.",
    category: "Media dan Jurnalistik",
    quota: 60,
    status: "open",
    orgType: "UKM",
    organizationLevel: "Universitas",
    scopeName: "Universitas Sam Ratulangi",
    imageUrl: "/images/orgs/ukm.svg",
    ...commonRegistration,
    event: ["Basic Journalism Bootcamp", "Pelatihan dasar liputan, penulisan berita, wawancara, fotografi, dan pengelolaan media kampus.", "Program Kerja", "Ruang Media Mahasiswa", 80, "2026-10-01", "2026-10-02"],
    achievement: ["Liputan Khusus Kegiatan Kampus", "Publikasi Kampus", 2026, "Mendokumentasikan agenda kemahasiswaan melalui artikel dan visual yang terkurasi."],
    announcement: ["Recruitment Reporter Kampus", "Dibuka pendaftaran reporter, fotografer, editor, dan desainer untuk redaksi pers mahasiswa.", false],
  },
  {
    name: "UKM Mahasiswa Pecinta Alam",
    description:
      "UKM Mahasiswa Pecinta Alam membina anggota dalam kepedulian lingkungan, manajemen perjalanan, keselamatan lapangan, konservasi, dan pengabdian alam. Setiap kegiatan menekankan disiplin, tanggung jawab, dan kerja sama tim.",
    category: "Lingkungan dan Petualangan",
    quota: 65,
    status: "open",
    orgType: "UKM",
    organizationLevel: "Universitas",
    scopeName: "Universitas Sam Ratulangi",
    imageUrl: "/images/orgs/ukm.svg",
    ...commonRegistration,
    event: ["Basic Outdoor Safety Training", "Pelatihan keselamatan kegiatan luar ruang, navigasi dasar, pengemasan logistik, dan etika konservasi.", "Program Kerja", "Lapangan Kampus UNSRAT", 70, "2026-10-08", "2026-10-09"],
    achievement: ["Aksi Bersih Lingkungan Kampus", "Pengabdian Lingkungan", 2026, "Menggerakkan anggota dalam aksi kebersihan dan edukasi pengurangan sampah."],
    announcement: ["Orientasi Calon Anggota Mapala", "Calon anggota wajib mengikuti orientasi keselamatan lapangan sebelum mengikuti kegiatan luar ruang.", true],
  },
  {
    name: "UKM Korps Sukarela PMI",
    description:
      "UKM Korps Sukarela PMI mengembangkan kepedulian sosial mahasiswa melalui pelatihan pertolongan pertama, donor darah, kesiapsiagaan bencana, dan kegiatan kemanusiaan. Anggota dibina untuk tanggap, disiplin, dan siap membantu sesama.",
    category: "Kemanusiaan",
    quota: 70,
    status: "open",
    orgType: "UKM",
    organizationLevel: "Universitas",
    scopeName: "Universitas Sam Ratulangi",
    imageUrl: "/images/orgs/ukm.svg",
    ...commonRegistration,
    event: ["First Aid Basic Training", "Pelatihan pertolongan pertama, penanganan luka ringan, evakuasi sederhana, dan kesiapsiagaan kegiatan kampus.", "Program Kerja", "Klinik Kampus UNSRAT", 80, "2026-10-15", "2026-10-16"],
    achievement: ["Donor Darah Mahasiswa", "Kegiatan Kemanusiaan", 2026, "Mengajak mahasiswa berpartisipasi dalam donor darah dan edukasi kesehatan dasar."],
    announcement: ["Relawan Pos Kesehatan Kegiatan Kampus", "KSR PMI membuka pendaftaran relawan pos kesehatan untuk mendukung kegiatan mahasiswa tingkat universitas.", false],
  },
  {
    name: "UKM Pramuka",
    description:
      "UKM Pramuka menjadi ruang pembinaan karakter, kepemimpinan, kedisiplinan, dan pengabdian masyarakat. Kegiatannya mencakup latihan rutin, perkemahan, keterampilan lapangan, dan kerja sosial berbasis nilai kepramukaan.",
    category: "Kepemimpinan dan Pengabdian",
    quota: 80,
    status: "open",
    orgType: "UKM",
    organizationLevel: "Universitas",
    scopeName: "Universitas Sam Ratulangi",
    imageUrl: "/images/orgs/ukm.svg",
    ...commonRegistration,
    event: ["Latihan Dasar Kepramukaan Mahasiswa", "Pelatihan kepemimpinan, kedisiplinan, administrasi satuan, dan keterampilan lapangan bagi mahasiswa.", "Program Kerja", "Lapangan Kampus UNSRAT", 90, "2026-10-22", "2026-10-23"],
    achievement: ["Bakti Sosial Gugus Depan", "Pengabdian", 2026, "Melaksanakan kegiatan bakti sosial dan pendampingan edukatif bersama komunitas sekitar kampus."],
    announcement: ["Latihan Rutin Pramuka Mahasiswa", "Latihan rutin dilaksanakan setiap Sabtu pagi. Mahasiswa baru dipersilakan hadir untuk pengenalan awal.", false],
  },
  {
    name: "UKM Olahraga Mahasiswa",
    description:
      "UKM Olahraga Mahasiswa mewadahi minat dan bakat di bidang futsal, basket, voli, bulu tangkis, dan kebugaran. Organisasi ini menekankan sportivitas, latihan teratur, manajemen tim, dan partisipasi dalam kompetisi kampus.",
    category: "Olahraga",
    quota: 100,
    status: "open",
    orgType: "UKM",
    organizationLevel: "Universitas",
    scopeName: "Universitas Sam Ratulangi",
    imageUrl: "/images/orgs/ukm.svg",
    ...commonRegistration,
    event: ["UNSRAT Student Sport Day", "Agenda olahraga bersama untuk membangun sportivitas dan mempertemukan komunitas olahraga mahasiswa.", "Program Kerja", "GOR Kampus UNSRAT", 200, "2026-11-01", "2026-11-01"],
    achievement: ["Liga Futsal Internal Mahasiswa", "Turnamen Kampus", 2026, "Menyelenggarakan liga futsal internal sebagai ruang kompetisi sehat antarfakultas."],
    announcement: ["Seleksi Tim Olahraga Kampus", "UKM Olahraga membuka seleksi cabang futsal, basket, voli, dan bulu tangkis untuk mahasiswa aktif.", true],
  },
  {
    name: "UKM Teater Mahasiswa",
    description:
      "UKM Teater Mahasiswa mengembangkan kemampuan seni peran, penyutradaraan, penulisan naskah, tata panggung, dan produksi pertunjukan. Organisasi ini menjadi ruang kreatif bagi mahasiswa untuk mengolah gagasan sosial melalui seni.",
    category: "Seni Pertunjukan",
    quota: 60,
    status: "open",
    orgType: "UKM",
    organizationLevel: "Universitas",
    scopeName: "Universitas Sam Ratulangi",
    imageUrl: "/images/orgs/ukm.svg",
    ...commonRegistration,
    event: ["Workshop Dasar Seni Peran", "Pelatihan ekspresi, olah tubuh, olah vokal, improvisasi, dan pengenalan produksi teater kampus.", "Program Kerja", "Gedung Kesenian Kampus", 65, "2026-11-07", "2026-11-07"],
    achievement: ["Produksi Pentas Akhir Tahun", "Pertunjukan Kampus", 2026, "Menyiapkan pertunjukan kolaboratif sebagai ruang apresiasi karya mahasiswa."],
    announcement: ["Audisi Pemeran dan Tim Produksi", "UKM Teater membuka audisi pemeran serta pendaftaran tim artistik, musik, dokumentasi, dan panggung.", false],
  },
  {
    name: "UKM Riset dan Teknologi Mahasiswa",
    description:
      "UKM Riset dan Teknologi Mahasiswa menjadi wadah lintas jurusan untuk eksplorasi riset, inovasi produk, robotika, data, dan publikasi ilmiah populer. Organisasi ini mendukung mahasiswa yang ingin membangun prototipe dan mengikuti kompetisi inovasi.",
    category: "Riset dan Teknologi",
    quota: 75,
    status: "open",
    orgType: "UKM",
    organizationLevel: "Universitas",
    scopeName: "Universitas Sam Ratulangi",
    imageUrl: "/images/orgs/technology.svg",
    ...commonRegistration,
    event: ["Innovation Sprint Mahasiswa", "Sesi ideasi dan prototyping singkat untuk merancang solusi teknologi atas masalah kampus dan masyarakat.", "Program Kerja", "Ruang Inovasi Mahasiswa", 90, "2026-11-14", "2026-11-15"],
    achievement: ["Prototype Showcase Kampus", "Karya Inovasi", 2026, "Menampilkan prototipe mahasiswa lintas disiplin dalam showcase inovasi kampus."],
    announcement: ["Pendaftaran Tim Riset Mini", "Mahasiswa dapat bergabung dalam tim riset mini bidang data, IoT, desain produk, dan publikasi ilmiah populer.", false],
  },
  {
    name: "UKM Kewirausahaan Mahasiswa",
    description:
      "UKM Kewirausahaan Mahasiswa membina minat bisnis melalui kelas ideasi, validasi pasar, pemasaran digital, keuangan usaha, dan pameran produk. Organisasi ini mendorong mahasiswa berani mencoba, mengukur, dan mengembangkan usaha secara bertahap.",
    category: "Kewirausahaan",
    quota: 80,
    status: "open",
    orgType: "UKM",
    organizationLevel: "Universitas",
    scopeName: "Universitas Sam Ratulangi",
    imageUrl: "/images/orgs/ukm.svg",
    ...commonRegistration,
    event: ["Student Entrepreneur Clinic", "Klinik ide bisnis mahasiswa dengan materi validasi masalah, model bisnis, dan strategi pemasaran awal.", "Program Kerja", "Ruang Inkubasi Kampus", 100, "2026-11-21", "2026-11-21"],
    achievement: ["Mini Expo Produk Mahasiswa", "Pameran Produk", 2026, "Memfasilitasi mahasiswa memamerkan produk, jasa, dan prototipe bisnis di lingkungan kampus."],
    announcement: ["Kelas Validasi Ide Bisnis", "UKM Kewirausahaan membuka kelas singkat untuk mahasiswa yang ingin menguji ide usaha sebelum produksi.", false],
  },
];

async function getAnnouncementUserId() {
  const admin = await sql`SELECT id FROM users WHERE role = 'admin' ORDER BY created_at LIMIT 1`;
  if (admin.length > 0) return admin[0].id;

  const anyUser = await sql`SELECT id FROM users ORDER BY created_at LIMIT 1`;
  return anyUser[0]?.id || null;
}

async function ensureOrganization(org) {
  const existing = await sql`
    SELECT id FROM activities
    WHERE lower(name) = lower(${org.name})
    ORDER BY id
    LIMIT 1
  `;

  if (existing.length > 0) {
    const id = existing[0].id;
    await sql`
      UPDATE activities
      SET description = ${org.description},
          category = ${org.category},
          quota = ${org.quota},
          status = ${org.status},
          registration_start = ${org.registrationStart},
          registration_end = ${org.registrationEnd},
          whatsapp_link = ${org.whatsappLink || null},
          image_url = ${org.imageUrl},
          org_type = ${org.orgType},
          organization_level = ${org.organizationLevel},
          scope_name = ${org.scopeName},
          updated_at = NOW()
      WHERE id = ${id}
    `;
    return id;
  }

  const inserted = await sql`
    INSERT INTO activities (
      name, description, category, quota, status, registered,
      registration_start, registration_end, whatsapp_link, image_url,
      org_type, organization_level, scope_name
    )
    VALUES (
      ${org.name}, ${org.description}, ${org.category}, ${org.quota}, ${org.status}, 0,
      ${org.registrationStart}, ${org.registrationEnd}, ${org.whatsappLink || null}, ${org.imageUrl},
      ${org.orgType}, ${org.organizationLevel}, ${org.scopeName}
    )
    RETURNING id
  `;
  return inserted[0].id;
}

async function ensureEvent(activityId, org) {
  const [name, description, category, location, quota, startDate, endDate] = org.event;
  const existing = await sql`
    SELECT id FROM events
    WHERE activity_id = ${activityId} AND lower(name) = lower(${name})
    ORDER BY id
    LIMIT 1
  `;

  const values = {
    name,
    description,
    category,
    location,
    quota: category === "Program Kerja" ? quota : null,
    startDate: date(startDate),
    endDate: date(endDate),
  };

  if (existing.length > 0) {
    await sql`
      UPDATE events
      SET description = ${values.description},
          category = ${values.category},
          location = ${values.location},
          quota = ${values.quota},
          status = 'open',
          event_state = 'Akan Datang',
          start_date = ${values.startDate},
          end_date = ${values.endDate},
          updated_at = NOW()
      WHERE id = ${existing[0].id}
    `;
    return;
  }

  await sql`
    INSERT INTO events (
      activity_id, name, description, category, location, quota,
      registered, start_date, end_date, status, event_state, is_achieved
    )
    VALUES (
      ${activityId}, ${values.name}, ${values.description}, ${values.category}, ${values.location}, ${values.quota},
      0, ${values.startDate}, ${values.endDate}, 'open', 'Akan Datang', false
    )
  `;
}

async function ensureAchievement(activityId, org) {
  const [title, rank, year, description] = org.achievement;
  const existing = await sql`
    SELECT id FROM achievements
    WHERE activity_id = ${activityId} AND lower(title) = lower(${title})
    ORDER BY id
    LIMIT 1
  `;

  if (existing.length > 0) {
    await sql`
      UPDATE achievements
      SET rank = ${rank},
          year = ${year},
          description = ${description},
          achievement_date = ${date(`${year}-12-01`)},
          updated_at = NOW()
      WHERE id = ${existing[0].id}
    `;
    return;
  }

  await sql`
    INSERT INTO achievements (activity_id, title, rank, year, achievement_date, description)
    VALUES (${activityId}, ${title}, ${rank}, ${year}, ${date(`${year}-12-01`)}, ${description})
  `;
}

async function ensureAnnouncement(activityId, org, userId) {
  if (!userId) return;

  const [title, content, isUrgent] = org.announcement;
  const existing = await sql`
    SELECT id FROM announcements
    WHERE activity_id = ${activityId} AND lower(title) = lower(${title})
    ORDER BY id
    LIMIT 1
  `;

  if (existing.length > 0) {
    await sql`
      UPDATE announcements
      SET content = ${content},
          is_urgent = ${isUrgent},
          is_public = true,
          user_id = ${userId},
          updated_at = NOW()
      WHERE id = ${existing[0].id}
    `;
    return;
  }

  await sql`
    INSERT INTO announcements (activity_id, user_id, title, content, is_urgent, is_public)
    VALUES (${activityId}, ${userId}, ${title}, ${content}, ${isUrgent}, true)
  `;
}

function fallbackImageUrl(row) {
  const text = `${row.name || ""} ${row.org_type || ""} ${row.category || ""}`.toLowerCase();
  if (text.includes("bem")) return "/images/orgs/bem.svg";
  if (text.includes("bpm")) return "/images/orgs/bpm.svg";
  if (text.includes("informatika") || text.includes("teknologi") || text.includes("robot")) return "/images/orgs/technology.svg";
  if (text.includes("himpunan") || text.includes("hm")) return "/images/orgs/himpunan.svg";
  return "/images/orgs/ukm.svg";
}

function fallbackCategory(row) {
  if (row.org_type === "BEM Fakultas" || row.org_type === "BEM Universitas") return "Eksekutif Mahasiswa";
  if (row.org_type === "BPM") return "Legislatif Mahasiswa";
  if (row.org_type === "Himpunan Mahasiswa") return "Akademik dan Profesi";
  return row.category && row.category !== "Akademik" ? row.category : "Minat dan Bakat";
}

function fallbackQuota(row) {
  if (row.quota && row.quota > 0) return row.quota;
  if (row.org_type === "BEM Universitas") return 120;
  if (row.org_type === "BEM Fakultas") return 85;
  if (row.org_type === "BPM") return 70;
  if (row.org_type === "Himpunan Mahasiswa") return 95;
  return 70;
}

function fallbackDescription(row) {
  const scope = row.scope_name || "Universitas Sam Ratulangi";
  if (row.org_type === "BEM Universitas") {
    return `${row.name} adalah organisasi eksekutif mahasiswa tingkat universitas yang mengelola aspirasi, advokasi, pengabdian, dan kolaborasi lintas fakultas. Profil ini disiapkan agar mahasiswa dapat mengenal ruang gerak organisasi, program utama, dan peluang berkontribusi secara lebih jelas.`;
  }
  if (row.org_type === "BEM Fakultas") {
    return `${row.name} merupakan organisasi eksekutif mahasiswa di ${scope} yang menjadi wadah koordinasi kegiatan, advokasi akademik, kaderisasi, dan pengembangan kepemimpinan. Organisasi ini membantu mahasiswa terhubung dengan program fakultas, komunitas jurusan, serta agenda kemahasiswaan yang relevan.`;
  }
  if (row.org_type === "BPM") {
    return `${row.name} menjalankan fungsi perwakilan mahasiswa melalui pengawasan, penyaluran aspirasi, dan penyusunan rekomendasi kelembagaan. Organisasi ini menjaga agar kegiatan kemahasiswaan berjalan tertib, transparan, dan selaras dengan kebutuhan mahasiswa di ${scope}.`;
  }
  if (row.org_type === "Himpunan Mahasiswa") {
    return `${row.name} menjadi wadah pengembangan akademik, profesi, kaderisasi, dan solidaritas mahasiswa pada lingkup ${scope}. Melalui program kerja, pelatihan, forum diskusi, dan kegiatan pengabdian, organisasi ini membantu mahasiswa membangun kompetensi sekaligus jejaring antarangkatan.`;
  }
  return `${row.name} adalah unit kegiatan mahasiswa yang mewadahi minat, bakat, kepemimpinan, dan kolaborasi mahasiswa di lingkungan kampus. Profil ini memuat gambaran organisasi, ruang kontribusi anggota, serta kegiatan rutin yang dapat diikuti mahasiswa aktif Universitas Sam Ratulangi.`;
}

async function ensureFallbackEvent(activityId, row) {
  const [{ count }] = await sql`SELECT count(*)::int FROM events WHERE activity_id = ${activityId}`;
  if (count > 0) return false;

  await sql`
    INSERT INTO events (
      activity_id, name, description, category, location, quota,
      registered, start_date, end_date, status, event_state, is_achieved
    )
    VALUES (
      ${activityId},
      ${`Pengenalan ${row.name} 2026`},
      ${`Kegiatan pengenalan organisasi untuk memperkenalkan profil, struktur, program kerja, budaya organisasi, dan peluang kontribusi anggota baru di ${row.name}.`},
      'Program Kerja',
      ${row.scope_name || "Kampus UNSRAT"},
      ${Math.min(fallbackQuota(row), 120)},
      0,
      ${date("2026-09-18")},
      ${date("2026-09-18")},
      'open',
      'Akan Datang',
      false
    )
  `;
  return true;
}

async function ensureFallbackAchievement(activityId, row) {
  const [{ count }] = await sql`SELECT count(*)::int FROM achievements WHERE activity_id = ${activityId}`;
  if (count > 0) return false;

  await sql`
    INSERT INTO achievements (activity_id, title, rank, year, achievement_date, description)
    VALUES (
      ${activityId},
      ${`Penguatan Profil ${row.name}`},
      'Pengembangan Organisasi',
      2026,
      ${date("2026-12-01")},
      ${`${row.name} melengkapi profil organisasi, ruang informasi kegiatan, dan dokumentasi program agar lebih mudah ditemukan oleh mahasiswa.`}
    )
  `;
  return true;
}

async function ensureFallbackAnnouncement(activityId, row, userId) {
  if (!userId) return false;

  const [{ count }] = await sql`SELECT count(*)::int FROM announcements WHERE activity_id = ${activityId}`;
  if (count > 0) return false;

  await sql`
    INSERT INTO announcements (activity_id, user_id, title, content, is_urgent, is_public)
    VALUES (
      ${activityId},
      ${userId},
      'Informasi Pendaftaran dan Pengenalan Organisasi',
      ${`${row.name} sedang melengkapi informasi profil, kegiatan, dan agenda pengenalan anggota. Mahasiswa dapat memantau mading organisasi untuk jadwal dan informasi pendaftaran terbaru.`},
      false,
      true
    )
  `;
  return true;
}

async function completeExistingOrganizations(userId) {
  const rows = await sql`SELECT * FROM activities ORDER BY name`;
  let profileUpdates = 0;
  let eventAdds = 0;
  let achievementAdds = 0;
  let announcementAdds = 0;

  for (const row of rows) {
    const nextDescription =
      row.description && row.description.trim().length > 80
        ? row.description
        : fallbackDescription(row);
    const nextImageUrl = row.image_url || fallbackImageUrl(row);
    const nextCategory = row.category && row.category !== "Akademik" ? row.category : fallbackCategory(row);
    const nextQuota = fallbackQuota(row);
    const nextRegistrationStart = row.registration_start || commonRegistration.registrationStart;
    const nextRegistrationEnd = row.registration_end || commonRegistration.registrationEnd;

    const needsProfileUpdate =
      nextDescription !== row.description ||
      nextImageUrl !== row.image_url ||
      nextCategory !== row.category ||
      nextQuota !== row.quota ||
      !row.registration_start ||
      !row.registration_end;

    if (needsProfileUpdate) {
      await sql`
        UPDATE activities
        SET description = ${nextDescription},
            category = ${nextCategory},
            quota = ${nextQuota},
            image_url = ${nextImageUrl},
            registration_start = ${nextRegistrationStart},
            registration_end = ${nextRegistrationEnd},
            updated_at = NOW()
        WHERE id = ${row.id}
      `;
      profileUpdates += 1;
    }

    if (await ensureFallbackEvent(row.id, { ...row, category: nextCategory, quota: nextQuota })) eventAdds += 1;
    if (await ensureFallbackAchievement(row.id, row)) achievementAdds += 1;
    if (await ensureFallbackAnnouncement(row.id, row, userId)) announcementAdds += 1;
  }

  return { profileUpdates, eventAdds, achievementAdds, announcementAdds };
}

async function runSeed() {
  console.log("Menghubungkan ke database dan menyiapkan data ORMAWA...");
  const announcementUserId = await getAnnouncementUserId();
  if (!announcementUserId) {
    console.log("Tidak ada user di tabel users. Seed pengumuman dilewati.");
  }

  let completed = 0;
  for (const org of organizations) {
    const activityId = await ensureOrganization(org);
    await ensureEvent(activityId, org);
    await ensureAchievement(activityId, org);
    await ensureAnnouncement(activityId, org, announcementUserId);
    completed += 1;
    console.log(`OK ${completed}/${organizations.length}: ${org.name}`);
  }

  const completion = await completeExistingOrganizations(announcementUserId);
  console.log(
    `Profil lama dilengkapi: ${completion.profileUpdates}; kegiatan tambahan: ${completion.eventAdds}; prestasi tambahan: ${completion.achievementAdds}; pengumuman tambahan: ${completion.announcementAdds}.`
  );

  const [summary] = await sql`
    SELECT
      (SELECT count(*)::int FROM activities) AS organizations,
      (SELECT count(*)::int FROM events) AS events,
      (SELECT count(*)::int FROM achievements) AS achievements,
      (SELECT count(*)::int FROM announcements) AS announcements
  `;

  console.log("Seed selesai.");
  console.log(`Total organisasi: ${summary.organizations}`);
  console.log(`Total kegiatan: ${summary.events}`);
  console.log(`Total prestasi: ${summary.achievements}`);
  console.log(`Total pengumuman: ${summary.announcements}`);
}

runSeed()
  .catch((error) => {
    console.error("Seed gagal:", error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await sql.end();
  });
