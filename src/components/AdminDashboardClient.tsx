'use client'

import { useState, useEffect, useMemo } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Modal, Button, Form } from "react-bootstrap";
import Link from "next/link";
import PremiumIcon from "@/components/PremiumIcon";
import { getFacultyStyle } from "@/utils/faculty";
import { 
  adminGetActivities,
  adminCreateActivity, 
  adminUpdateActivity, 
  adminDeleteActivity, 
  adminToggleActivityStatus, 
  adminSearchStudents, 
  adminAssignLeader, 
  adminGetExportData 
} from "@/app/actions/admin";

// Zod Schema for validation
const ormawaSchema = z.object({
  id: z.coerce.number().optional(),
  name: z.string().min(3, "Nama organisasi minimal 3 karakter"),
  description: z.string().optional(),
  category: z.string().min(2, "Kategori utama wajib diisi"),
  quota: z.coerce.number().int().positive("Kuota harus bernilai positif"),
  status: z.enum(["open", "closed"]).default("open"),
  orgType: z.enum(["BEM Universitas", "BEM Fakultas", "BPM", "Himpunan Mahasiswa", "UKM"]).default("UKM"),
  organizationLevel: z.string().default("Universitas"),
  scopeName: z.string().nullable().optional(),
  whatsappLink: z.string().nullable().optional(),
  imageUrl: z.string().nullable().optional(),
  registrationStart: z.string().nullable().optional(),
  registrationEnd: z.string().nullable().optional(),
});

type OrmawaInput = z.infer<typeof ormawaSchema>;

interface AdminDashboardClientProps {
  profile: any;
  pendingProposals: any[];
  stats: {
    totalUsers: number;
    totalActivities: number;
    openRegistrations: number;
  };
  initialActivities: any[];
}

const scopeOptionsMap: Record<string, string[]> = {
  Fakultas: [
    'Fakultas Kedokteran',
    'Fakultas Teknik',
    'Fakultas Pertanian',
    'Fakultas Peternakan',
    'Fakultas Perikanan dan Ilmu Kelautan',
    'Fakultas Ekonomi dan Bisnis',
    'Fakultas Hukum',
    'Fakultas Ilmu Sosial dan Ilmu Politik',
    'Fakultas Ilmu Budaya',
    'Fakultas Matematika dan Ilmu Pengetahuan Alam',
    'Fakultas Kesehatan Masyarakat'
  ],
  Jurusan: [
    'Teknik Elektro',
    'Teknik Sipil',
    'Arsitektur',
    'Tata Kota',
    'Informatika',
    'Akuntansi',
    'Manajemen',
    'Ilmu Hukum'
  ],
  Prodi: [
    'S1 Teknik Informatika',
    'S1 Sistem Informasi',
    'S1 Kedokteran Umum',
    'S1 Kehutanan',
    'D3 Administrasi'
  ]
};

export default function AdminDashboardClient({ 
  profile, 
  pendingProposals, 
  stats, 
  initialActivities 
}: AdminDashboardClientProps) {
  const [activeMenu, setActiveMenu] = useState<"approval" | "master" | "kingmaker" | "reporting">(
    pendingProposals.length > 0 ? "approval" : "master"
  );
  
  const [activities, setActivities] = useState(initialActivities);
  const [searchActivity, setSearchActivity] = useState("");
  const [filterJenis, setFilterJenis] = useState("");
  
  // Modal State
  const [showModal, setShowModal] = useState(false);
  const [editId, setEditId] = useState<number | null>(null);
  
  // Delete Confirmation Modal State
  const [deleteConfirm, setDeleteConfirm] = useState<{ show: boolean; id: number; name: string }>({ show: false, id: 0, name: "" });

  // Status Messages
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  // Kingmaker Tab State
  const [leaderActivityId, setLeaderActivityId] = useState("");
  const [searchStudent, setSearchStudent] = useState("");
  const [students, setStudents] = useState<any[]>([]);

  // Reporting / Export Date Range State
  const [exportStartDate, setExportStartDate] = useState("");
  const [exportEndDate, setExportEndDate] = useState("");
  const [reportType, setReportType] = useState<"membership" | "events" | "all">("all");

  // Setup React Hook Form
  const {
    register,
    handleSubmit,
    reset,
    watch,
    setValue,
    formState: { errors: anyErrors },
  } = useForm<any>({
    resolver: zodResolver(ormawaSchema),
    defaultValues: {
      status: "open",
      orgType: "UKM",
      organizationLevel: "Universitas",
      category: "Akademik",
      quota: 30
    }
  });
  const errors = anyErrors as any;
  const watchedLevel = watch("organizationLevel");

  // Debounced search for student in Kingmaker tab
  useEffect(() => {
    if (searchStudent.trim().length >= 3) {
      const delayDebounceFn = setTimeout(async () => {
        try {
          const res = await adminSearchStudents(searchStudent);
          if (res.success) {
            setStudents(res.students || []);
          }
        } catch (err) {
          console.error(err);
        }
      }, 400);

      return () => clearTimeout(delayDebounceFn);
    } else {
      setStudents([]);
    }
  }, [searchStudent]);

  // Clean success/error alerts after 4s
  useEffect(() => {
    if (successMsg || errorMsg) {
      const timer = setTimeout(() => {
        setSuccessMsg(null);
        setErrorMsg(null);
      }, 4000);
      return () => clearTimeout(timer);
    }
  }, [successMsg, errorMsg]);

  // Toggle Ormawa status
  const handleToggleStatus = async (id: number, name: string) => {
    const act = activities.find(a => a.id === id);
    const nextStatusText = act?.status === "open" ? "Tutup" : "Buka";
    if (!window.confirm(`Apakah Anda yakin ingin mengubah status pendaftaran ORMAWA "${name}" menjadi ${nextStatusText.toUpperCase()}?`)) {
      return;
    }

    try {
      const res = await adminToggleActivityStatus(id);
      if (res.success) {
        setActivities(prev => 
          prev.map(act => act.id === id ? { ...act, status: res.nextStatus } : act)
        );
        setSuccessMsg("Status pendaftaran ORMAWA berhasil diubah.");
      } else {
        setErrorMsg(res.error || "Gagal mengubah status.");
      }
    } catch (err) {
      setErrorMsg("Koneksi gagal atau terjadi kesalahan server.");
    }
  };

  // Delete Ormawa - Open confirmation modal
  const handleDeleteActivity = (id: number, name: string) => {
    console.log('[Admin] Opening delete confirm for id:', id, 'name:', name);
    setDeleteConfirm({ show: true, id, name });
  };

  // Execute the actual delete after user confirms via modal
  const executeDelete = async () => {
    const { id, name } = deleteConfirm;
    setDeleteConfirm({ show: false, id: 0, name: "" });
    setLoading(true);
    console.log('[Admin] Executing delete for id:', id);

    try {
      const res = await adminDeleteActivity(id);
      console.log('[Admin] Delete response:', res);
      if (res.success) {
        setActivities(prev => prev.filter(act => act.id !== id));
        setSuccessMsg(`Master data ORMAWA "${name}" berhasil dihapus.`);
      } else {
        setErrorMsg(res.error || "Gagal menghapus.");
      }
    } catch (err) {
      console.error('[Admin] Delete error:', err);
      setErrorMsg("Koneksi gagal atau terjadi kesalahan server.");
    } finally {
      setLoading(false);
    }
  };

  // Open modal for Create
  const handleCreate = () => {
    setEditId(null);
    reset({
      name: "",
      description: "",
      category: "Akademik",
      quota: 30,
      status: "open",
      orgType: "UKM",
      organizationLevel: "Universitas",
      scopeName: "",
      whatsappLink: "",
      imageUrl: "",
      registrationStart: "",
      registrationEnd: "",
    });
    setShowModal(true);
  };

  // Open modal for Edit
  const handleEdit = (act: any) => {
    setEditId(act.id);
    reset({
      id: act.id,
      name: act.name,
      description: act.description || "",
      category: act.category || "",
      quota: act.quota,
      status: act.status,
      orgType: act.orgType,
      organizationLevel: act.organizationLevel,
      scopeName: act.scopeName || "",
      whatsappLink: act.whatsappLink || "",
      imageUrl: act.imageUrl || "",
      registrationStart: act.registrationStart ? new Date(act.registrationStart).toISOString().split('T')[0] : "",
      registrationEnd: act.registrationEnd ? new Date(act.registrationEnd).toISOString().split('T')[0] : "",
    });
    setShowModal(true);
  };

  // Submit Add/Edit Form
  const onSubmit = async (data: OrmawaInput) => {
    const isEdit = !!editId;
    const confirmMsg = isEdit 
      ? `Apakah Anda yakin ingin menyimpan perubahan pada data ORMAWA "${data.name}"?`
      : `Apakah Anda yakin ingin membuat ORMAWA baru dengan nama "${data.name}"?`;

    if (!window.confirm(confirmMsg)) {
      return;
    }

    setLoading(true);
    setErrorMsg(null);
    setSuccessMsg(null);

    const formData = new FormData();
    if (editId) formData.append("id", editId.toString());
    formData.append("name", data.name);
    formData.append("description", data.description || "");
    formData.append("category", data.category);
    formData.append("quota", data.quota.toString());
    formData.append("status", data.status);
    formData.append("orgType", data.orgType);
    formData.append("organizationLevel", data.organizationLevel);
    formData.append("scopeName", data.scopeName || "");
    formData.append("whatsappLink", data.whatsappLink || "");
    formData.append("imageUrl", data.imageUrl || "");
    formData.append("registrationStart", data.registrationStart || "");
    formData.append("registrationEnd", data.registrationEnd || "");

    try {
      const res = editId 
        ? await adminUpdateActivity(formData) 
        : await adminCreateActivity(formData);

      if (res.success) {
        setSuccessMsg(editId ? "ORMAWA berhasil diperbarui!" : "ORMAWA berhasil ditambahkan!");
        
        // Refresh local list
        const resList = await adminGetActivities();
        if (resList.success) {
          setActivities(resList.activities || []);
        }

        setTimeout(() => {
          setShowModal(false);
        }, 1000);
      } else {
        setErrorMsg(res.error || "Gagal menyimpan data.");
      }
    } catch (err) {
      setErrorMsg("Koneksi gagal atau terjadi kesalahan server.");
    } finally {
      setLoading(false);
    }
  };

  // Kingmaker - Assign Leader
  const handleAssignLeader = async (studentId: string, studentName: string) => {
    if (!leaderActivityId) return;

    if (!confirm(`Sistem akan melantik "${studentName}" sebagai Ketua. Jika terdapat ketua lama di ORMAWA tersebut, status mereka akan diturunkan menjadi anggota biasa. Lanjutkan?`)) {
      return;
    }

    setLoading(true);
    setErrorMsg(null);
    setSuccessMsg(null);

    try {
      const res = await adminAssignLeader(parseInt(leaderActivityId), studentId);
      if (res.success) {
        setSuccessMsg(`Mahasiswa "${studentName}" berhasil diangkat sebagai Ketua UKM "${res.orgName}"!`);
        
        // Reset inputs
        setSearchStudent("");
        setStudents([]);
        setLeaderActivityId("");
        
        // Refresh active list (quota count changes)
        const resList = await adminGetActivities();
        if (resList.success) {
          setActivities(resList.activities || []);
        }
      } else {
        setErrorMsg(res.error || "Gagal melantik ketua.");
      }
    } catch (err) {
      setErrorMsg("Koneksi gagal atau terjadi kesalahan server.");
    } finally {
      setLoading(false);
    }
  };

  // CSV Export Logic
  const handleExportCSV = async () => {
    setLoading(true);
    setErrorMsg(null);
    setSuccessMsg(null);

    try {
      const res = await adminGetExportData(
        exportStartDate || undefined, 
        exportEndDate || undefined,
        reportType
      );
      if (res.success && res.data) {
        const data = res.data;
        let csvContent = "\uFEFF";
        
        // CSV Headers based on report type
        if (reportType === "membership") {
          csvContent += "NIM,Nama Lengkap,ORMAWA,Jabatan,Tanggal Bergabung\n";
        } else if (reportType === "events") {
          csvContent += "NIM,Nama Lengkap,ORMAWA Penyelenggara,Nama Kegiatan,Kategori Kegiatan,Status Kegiatan,Tanggal Mulai,Tanggal Selesai,Tanggal Daftar\n";
        } else {
          csvContent += "Tipe,NIM,Nama Lengkap,ORMAWA,Nama Kegiatan,Kategori,Jabatan/Status,Tanggal\n";
        }

        data.forEach((row: any) => {
          const formatDate = (d: string | null) => d ? new Date(d).toLocaleDateString("id-ID", { day: "2-digit", month: "2-digit", year: "numeric" }) : "-";
          const esc = (s: string) => s ? `"${s.replace(/"/g, '""')}"` : `"-"`;

          if (reportType === "membership") {
            csvContent += `${esc(row.nim)},${esc(row.name)},${esc(row.orgName)},${esc(row.role)},${esc(formatDate(row.date))}\n`;
          } else if (reportType === "events") {
            csvContent += `${esc(row.nim)},${esc(row.name)},${esc(row.orgName)},${esc(row.eventName)},${esc(row.eventCategory)},${esc(row.eventStatus)},${esc(formatDate(row.startDate))},${esc(formatDate(row.endDate))},${esc(formatDate(row.date))}\n`;
          } else {
            // Combined: "all"
            const label = row.type === "Kegiatan" ? row.eventName : row.orgName;
            const category = row.type === "Kegiatan" ? row.eventCategory : "-";
            const roleOrStatus = row.type === "Kegiatan" ? row.eventStatus : row.role;
            csvContent += `${esc(row.type)},${esc(row.nim)},${esc(row.name)},${esc(row.orgName)},${esc(label)},${esc(category)},${esc(roleOrStatus)},${esc(formatDate(row.date))}\n`;
          }
        });

        // Dynamic filename
        const typeLabel = reportType === "membership" ? "Keanggotaan" : reportType === "events" ? "Kegiatan" : "Lengkap";
        let fileName = `Laporan_${typeLabel}_UNSRAT`;
        if (exportStartDate || exportEndDate) {
          const from = exportStartDate ? exportStartDate.replace(/-/g, "") : "awal";
          const to = exportEndDate ? exportEndDate.replace(/-/g, "") : "akhir";
          fileName += `_${from}_sd_${to}`;
        }
        fileName += ".csv";

        const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
        const url = URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.setAttribute("href", url);
        link.setAttribute("download", fileName);
        link.style.visibility = "hidden";
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        
        const totalRows = data.length;
        setSuccessMsg(`Laporan CSV berhasil diunduh! (${totalRows} baris data)`);
      } else {
        setErrorMsg(res.error || "Gagal menarik data ekspor.");
      }
    } catch (err) {
      setErrorMsg("Koneksi gagal atau terjadi kesalahan server.");
    } finally {
      setLoading(false);
    }
  };

  // Date range preset helper
  const applyDatePreset = (preset: string) => {
    const today = new Date();
    let start = new Date();
    let end = new Date();
    
    switch (preset) {
      case "this_month":
        start = new Date(today.getFullYear(), today.getMonth(), 1);
        end = today;
        break;
      case "last_month": {
        start = new Date(today.getFullYear(), today.getMonth() - 1, 1);
        end = new Date(today.getFullYear(), today.getMonth(), 0);
        break;
      }
      case "this_semester": {
        // Indonesian semester: Ganjil (Aug-Jan), Genap (Feb-Jul)
        const month = today.getMonth();
        if (month >= 7) { // Aug-Dec = Ganjil
          start = new Date(today.getFullYear(), 7, 1);
        } else { // Jan-Jul = Genap (or tail of Ganjil for Jan)
          start = new Date(today.getFullYear(), 1, 1);
        }
        end = today;
        break;
      }
      case "this_year":
        start = new Date(today.getFullYear(), 0, 1);
        end = today;
        break;
      case "all":
        setExportStartDate("");
        setExportEndDate("");
        return;
    }
    
    setExportStartDate(start.toISOString().split("T")[0]);
    setExportEndDate(end.toISOString().split("T")[0]);
  };

  // Filtered master data list (Optimized with useMemo to prevent unnecessary calculations on every render)
  const filteredActivities = useMemo(() => {
    return activities.filter(act => {
      const matchesSearch = act.name.toLowerCase().includes(searchActivity.toLowerCase()) || 
                            (act.category && act.category.toLowerCase().includes(searchActivity.toLowerCase()));
      const matchesType = filterJenis === "" || act.orgType === filterJenis;
      return matchesSearch && matchesType;
    });
  }, [activities, searchActivity, filterJenis]);

  // Calculate dynamic stats
  const totalOrmawa = activities.length;
  // Optimized with useMemo: Sort operation is only calculated when the activities array changes
  const trendingOrg = useMemo(() => {
    return [...activities].sort((a, b) => b.registered - a.registered)[0];
  }, [activities]);

  return (
    <div className="container-fluid p-0">
      
      {/* Header Admin Dashboard */}
      <div className="mb-4 rounded-4 shadow-sm p-4 border-0 position-relative overflow-hidden hover-lift card-glass-static">
        <div className="position-absolute end-0 top-0 w-50 h-100 opacity-10" 
          style={{
            background: "linear-gradient(135deg, #E31B23 0%, #B90D23 100%)", 
            clipPath: "polygon(25% 0%, 100% 0%, 100% 100%, 0% 100%)"
          }}
        ></div>
        
        <div className="position-relative z-1 d-flex flex-column flex-md-row justify-content-between align-items-center gap-3">
          <div>
            <h3 className="fw-bolder text-dark mb-1">Pusat Kendali <span className="text-primary">Admin Kemahasiswaan (WD III)</span></h3>
            <p className="text-secondary mb-0 small fw-medium">Manajemen Master Data, Otorisasi, dan Pelaporan Global Organisasi Mahasiswa.</p>
          </div>
          
          {/* Navigation Tabs */}
          <div className="bg-light p-1 rounded-pill shadow-sm d-flex gap-1 border">
            <button 
              onClick={() => setActiveMenu("approval")} 
              className={`btn btn-sm rounded-pill ${activeMenu === "approval" ? "btn-primary text-white fw-bold shadow-sm" : "text-secondary hover-bg-light"} px-4 py-2 border-0`}
              style={{ transition: "all 0.2s" }}
            >
              <i className="bi bi-shield-check me-1"></i> Pusat Persetujuan
              {pendingProposals.length > 0 && (
                <span className="badge bg-white text-primary ms-1.5 rounded-circle">{pendingProposals.length}</span>
              )}
            </button>
            <button 
              onClick={() => setActiveMenu("master")} 
              className={`btn btn-sm rounded-pill ${activeMenu === "master" ? "btn-primary text-white fw-bold shadow-sm" : "text-secondary hover-bg-light"} px-4 py-2 border-0`}
              style={{ transition: "all 0.2s" }}
            >
              <i className="bi bi-grid-fill me-1"></i> Data Master
            </button>
            <button 
              onClick={() => setActiveMenu("kingmaker")} 
              className={`btn btn-sm rounded-pill ${activeMenu === "kingmaker" ? "btn-primary text-white fw-bold shadow-sm" : "text-secondary hover-bg-light"} px-4 py-2 border-0`}
              style={{ transition: "all 0.2s" }}
            >
              <i className="bi bi-person-up me-1"></i> Penunjukan Ketua
            </button>
            <button 
              onClick={() => setActiveMenu("reporting")} 
              className={`btn btn-sm rounded-pill ${activeMenu === "reporting" ? "btn-primary text-white fw-bold shadow-sm" : "text-secondary hover-bg-light"} px-4 py-2 border-0`}
              style={{ transition: "all 0.2s" }}
            >
              <i className="bi bi-file-earmark-excel-fill me-1"></i> Pelaporan Ekspor
            </button>
          </div>
        </div>
      </div>
 
      {/* Global Alerts */}
      {successMsg && (
        <div className="alert alert-success d-flex align-items-center gap-2 rounded-4 shadow-sm border-0 py-3 mb-4" role="alert">
          <i className="bi bi-check-circle-fill text-success fs-5"></i>
          <div className="small fw-semibold text-dark">{successMsg}</div>
        </div>
      )}
      {errorMsg && (
        <div className="alert alert-danger d-flex align-items-center gap-2 rounded-4 shadow-sm border-0 py-3 mb-4" role="alert">
          <i className="bi bi-exclamation-triangle-fill text-danger fs-5"></i>
          <div className="small fw-semibold text-dark">{errorMsg}</div>
        </div>
      )}
 
      {/* TAB 1: PUSAT PERSETUJUAN */}
      {activeMenu === "approval" && (
        <div className="card border-0 rounded-4 card-glass-static">
          <div className="card-header bg-transparent border-0 pt-4 px-4 pb-0">
            <h5 className="fw-bold text-dark mb-0">Menunggu Persetujuan Admin (Persetujuan Akhir)</h5>
          </div>
          <div className="card-body px-4 pb-4">
            {pendingProposals.length === 0 ? (
              <div className="text-center py-5">
                <i className="bi bi-shield-check display-4 text-primary opacity-50 mb-3"></i>
                <h5 className="fw-bold text-dark">Tidak Ada Tunggakan!</h5>
                <p className="text-secondary small mb-0">Semua pengajuan proposal kegiatan mahasiswa telah ditinjau penuh.</p>
              </div>
            ) : (
              <div className="table-responsive">
                <table className="table table-hover align-middle no-line-table">
                  <thead>
                    <tr className="text-secondary small">
                      <th>Nama Kegiatan</th>
                      <th>Ormawa Pengaju</th>
                      <th>Diajukan Oleh</th>
                      <th>Tanggal Pengajuan</th>
                      <th className="text-end">Aksi</th>
                    </tr>
                  </thead>
                  <tbody>
                    {pendingProposals.map((prop) => {
                      const orgStyle = getFacultyStyle(prop.scopeName || prop.orgName);
                      return (
                        <tr key={prop.id}>
                          <td>
                            <span className="fw-semibold text-dark">{prop.name}</span>
                            <div className="text-muted small">{prop.category}</div>
                          </td>
                          <td>
                            <span className="badge border px-2.5 py-1 fw-bold" style={{ backgroundColor: orgStyle.lightBg, color: orgStyle.primary, borderColor: orgStyle.borderSubtle }}>
                              {prop.orgName}
                            </span>
                          </td>
                          <td>
                            <span className="small">{prop.creatorName || "Pengurus Ormawa"}</span>
                          </td>
                          <td>
                            <span className="small text-muted">{new Date(prop.createdAt).toLocaleDateString("id-ID")}</span>
                          </td>
                          <td className="text-end">
                            <Link href={`/dashboard/activities/${prop.id}`} className="btn btn-sm px-3 text-white fw-bold" style={{ background: orgStyle.gradient }}>
                              Tinjau Akhir
                            </Link>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}
 
      {/* TAB 2: DATA MASTER ORMAWA */}
      {activeMenu === "master" && (
        <>
          {/* Stat Cards */}
          <div className="row g-4 mb-4">
            <div className="col-md-3">
              <div className="card border-0 rounded-4 p-3 hover-lift h-100 d-flex flex-row align-items-center gap-3 card-glass-premium">
                <div className="bg-primary bg-opacity-10 text-primary rounded-circle d-flex align-items-center justify-content-center border border-primary border-opacity-25" style={{ width: "56px", height: "56px" }}>
                  <i className="bi bi-building fs-3"></i>
                </div>
                <div>
                  <h6 className="text-muted fw-bold small mb-1" style={{ fontSize: "0.7rem" }}>TOTAL ORMAWA TERDAFTAR</h6>
                  <h3 className="mb-0 fw-bold text-dark">{totalOrmawa}</h3>
                </div>
              </div>
            </div>
            <div className="col-md-3">
              <div className="card border-0 rounded-4 p-3 hover-lift h-100 d-flex flex-row align-items-center gap-3 card-glass-premium">
                <div className="bg-info bg-opacity-10 text-info rounded-circle d-flex align-items-center justify-content-center border border-info border-opacity-25" style={{ width: "56px", height: "56px" }}>
                  <i className="bi bi-people-fill fs-3"></i>
                </div>
                <div>
                  <h6 className="text-muted fw-bold small mb-1" style={{ fontSize: "0.7rem" }}>TOTAL PENGGUNA TERDAFTAR</h6>
                  <h3 className="mb-0 fw-bold text-dark">{stats.totalUsers}</h3>
                </div>
              </div>
            </div>
            <div className="col-md-3">
              <div className="card border-0 rounded-4 p-3 hover-lift h-100 d-flex flex-row align-items-center gap-3 card-glass-premium">
                <div className="bg-warning bg-opacity-10 text-warning rounded-circle d-flex align-items-center justify-content-center border border-warning border-opacity-25" style={{ width: "56px", height: "56px" }}>
                  <i className="bi bi-calendar-event fs-3"></i>
                </div>
                <div>
                  <h6 className="text-muted fw-bold small mb-1" style={{ fontSize: "0.7rem" }}>PENDAFTARAN KEGIATAN AKTIF</h6>
                  <h3 className="mb-0 fw-bold text-dark">{stats.openRegistrations}</h3>
                </div>
              </div>
            </div>
            <div className="col-md-3">
              <div className="card border-0 rounded-4 p-3 hover-lift h-100 d-flex flex-row align-items-center gap-3 card-glass-premium">
                <div className="bg-success bg-opacity-10 text-success rounded-circle d-flex align-items-center justify-content-center border border-success border-opacity-25" style={{ width: "56px", height: "56px" }}>
                  <i className="bi bi-fire fs-3"></i>
                </div>
                <div className="flex-grow-1 overflow-hidden">
                  <h6 className="text-muted fw-bold small mb-1" style={{ fontSize: "0.7rem" }}>ORMAWA TERPOPULER</h6>
                  <div className="mb-0 fw-bold text-dark text-truncate small" title={trendingOrg ? trendingOrg.name : "-"}>
                    {trendingOrg ? trendingOrg.name : "-"}
                  </div>
                </div>
              </div>
            </div>
          </div>
 
          {/* Master Table */}
          <div className="card border-0 rounded-4 card-glass-static overflow-hidden mb-4">
            <div className="card-header bg-transparent border-bottom py-4 px-4 d-flex justify-content-between align-items-center flex-column flex-md-row gap-3">
              <div className="d-flex align-items-center gap-3 w-100 w-md-auto">
                <div className="bg-dark rounded-circle d-flex align-items-center justify-content-center text-white" style={{ width: "45px", height: "45px" }}>
                  <i className="bi bi-database fs-5"></i>
                </div>
                <div>
                  <h5 className="mb-0 fw-bold text-dark">Master Data ORMAWA</h5>
                  <p className="mb-0 text-secondary small">Kelola basis data seluruh Organisasi Mahasiswa</p>
                </div>
              </div>
 
              <div className="d-flex flex-column flex-lg-row gap-2 w-100 w-md-auto flex-wrap justify-content-md-end">
                <select 
                  value={filterJenis} 
                  onChange={(e) => setFilterJenis(e.target.value)}
                  className="form-select bg-light border-0 px-3 py-2" 
                  style={{ minWidth: "200px" }}
                >
                  <option value="">-- Semua Jenis ORMAWA --</option>
                  <option value="UKM">Unit Kegiatan Mahasiswa (UKM)</option>
                  <option value="BEM Universitas">BEM Universitas</option>
                  <option value="BEM Fakultas">BEM Fakultas</option>
                  <option value="BPM">BPM</option>
                  <option value="Himpunan Mahasiswa">Himpunan Mahasiswa</option>
                </select>
                
                <div className="input-group" style={{ minWidth: "240px" }}>
                  <span className="input-group-text bg-light border-0"><i className="bi bi-search text-muted"></i></span>
                  <input 
                    type="text" 
                    value={searchActivity}
                    onChange={(e) => setSearchActivity(e.target.value)}
                    className="form-control bg-light border-0 px-2" 
                    placeholder="Cari ORMAWA..."
                  />
                </div>
 
                <Button 
                  variant="primary"
                  onClick={handleCreate}
                  className="text-white rounded-3 fw-bold shadow-sm d-flex align-items-center justify-content-center px-4"
                  style={{ whiteSpace: "nowrap" }}
                >
                  <i className="bi bi-plus-lg me-2"></i> Tambah ORMAWA Baru
                </Button>
              </div>
            </div>
 
            <div className="card-body p-0">
              <div className="table-responsive">
                <table className="table table-hover align-middle mb-0 border-0 no-line-table">
                  <thead className="bg-light">
                    <tr className="text-secondary small fw-bold">
                      <th className="ps-4 py-3 border-0">LOGO & NAMA ORMAWA</th>
                      <th className="py-3 border-0">KATEGORI</th>
                      <th className="py-3 border-0">PERIODE DAFTAR</th>
                      <th className="py-3 border-0 text-center">KUOTA</th>
                      <th className="py-3 border-0 text-center">STATUS</th>
                      <th className="py-3 pe-4 border-0 text-end">AKSI</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredActivities.map((act) => {
                      const orgStyle = getFacultyStyle(act.scopeName || act.name);
                      return (
                        <tr key={act.id}>
                          <td className="ps-4 py-3 border-light">
                            <div className="d-flex align-items-center gap-3">
                              <img 
                                src={act.imageUrl || `https://ui-avatars.com/api/?name=${encodeURIComponent(act.name)}&background=random`} 
                                className="rounded shadow-sm" 
                                style={{ width: "45px", height: "45px", objectFit: "cover" }}
                                alt={act.name}
                              />
                              <div>
                                <span className="fw-bold text-dark d-block">{act.name}</span>
                                <span className="small text-muted text-truncate-2 d-block" style={{ maxWidth: "250px" }}>{act.description || "-"}</span>
                              </div>
                            </div>
                          </td>
                          <td className="py-3 border-light">
                            <span className="badge bg-secondary bg-opacity-10 text-secondary border px-3 py-2 fw-semibold">{act.category || "Akademik"}</span>
                          </td>
                          <td className="py-3 border-light text-muted small">
                            <i className="bi bi-calendar-event me-1"></i> 
                            {act.registrationStart ? new Date(act.registrationStart).toLocaleDateString("id-ID", { day: "2-digit", month: "2-digit" }) : "∞"} 
                            {" - "} 
                            {act.registrationEnd ? new Date(act.registrationEnd).toLocaleDateString("id-ID", { day: "2-digit", month: "2-digit", year: "2-digit" }) : "∞"}
                          </td>
                          <td className="py-3 border-light text-center">
                            <div className="fw-bold text-primary">{act.registered} / {act.quota}</div>
                          </td>
                          <td className="py-3 border-light text-center">
                            <button 
                              type="button"
                              onClick={(e) => { e.stopPropagation(); handleToggleStatus(act.id, act.name); }} 
                              className="btn btn-sm btn-link text-decoration-none p-0"
                            >
                              {act.status === "open" ? (
                                <span className="badge bg-success bg-opacity-10 text-success rounded-pill px-3 py-2 fw-semibold border border-success border-opacity-25">
                                  <i className="bi bi-circle-fill me-1" style={{ fontSize: "0.5rem" }}></i> BUKA
                                </span>
                              ) : (
                                <span className="badge bg-danger bg-opacity-10 text-danger rounded-pill px-3 py-2 fw-semibold border border-danger border-opacity-25">
                                  <i className="bi bi-slash-circle me-1" style={{ fontSize: "0.5rem" }}></i> TUTUP
                                </span>
                              )}
                            </button>
                          </td>
                          <td className="pe-4 text-end border-light py-3">
                            <button 
                              type="button"
                              onClick={(e) => { e.stopPropagation(); handleEdit(act); }} 
                              className="btn btn-sm btn-outline-primary rounded-pill fw-bold shadow-sm me-1 px-3"
                            >
                              ✏️ Edit
                            </button>
                            <button 
                              type="button"
                              onClick={(e) => { e.stopPropagation(); handleDeleteActivity(act.id, act.name); }} 
                              className="btn btn-sm btn-outline-danger rounded-pill fw-bold shadow-sm px-3"
                            >
                              🗑️ Hapus
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                    {filteredActivities.length === 0 && (
                      <tr>
                        <td colSpan={6} className="text-center py-5 bg-white text-muted">
                          <i className="bi bi-inbox fs-1 d-block mb-3 text-secondary opacity-50"></i>
                          <span className="fw-bold d-block text-dark">Data tidak ditemukan</span>
                          Basis data kosong atau tidak cocok dengan filter pencarian.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </>
      )}

      {/* TAB 3: PENUNJUKAN KETUA (KINGMAKER) */}
      {activeMenu === "kingmaker" && (
        <div className="row pt-2 justify-content-center">
          <div className="col-lg-8">
            <div className="card border-0 rounded-4 shadow-sm bg-white hover-lift overflow-hidden position-relative mb-5">
              <div 
                className="position-absolute end-0 top-0 opacity-10" 
                style={{
                  fontSize: "15rem", 
                  marginTop: "-50px", 
                  marginRight: "-20px", 
                  color: "#ffc107", 
                  zIndex: 0, 
                  pointerEvents: "none"
                }}
              >
                <i className="bi bi-award-fill"></i>
              </div>
              
              <div className="card-body p-4 p-md-5 position-relative z-1">
                <div className="text-center mb-5">
                  <div className="bg-warning bg-opacity-10 text-warning rounded-circle d-flex align-items-center justify-content-center mx-auto mb-3 shadow-sm border border-warning border-opacity-25" style={{ width: "80px", height: "80px" }}>
                    <i className="bi bi-person-up fs-1"></i>
                  </div>
                  <h2 className="fw-bolder text-dark">Penunjukan Ketua ORMAWA</h2>
                  <p className="text-secondary small">
                    Proses administratif sentral untuk mengangkat mahasiswa menjadi Ketua.<br />
                    Cari mahasiswa, pilih ORMAWA-nya, dan berikan hak istimewa kepemimpinan.
                  </p>
                </div>

                <div className="bg-light p-4 rounded-4 border">
                  
                  {/* 1. Select Ormawa */}
                  <div className="mb-4">
                    <label className="form-label fw-bold text-dark small text-uppercase">1. Pilih Organisasi / ORMAWA</label>
                    <Form.Select 
                      value={leaderActivityId}
                      onChange={(e) => {
                        setLeaderActivityId(e.target.value);
                        setSearchStudent("");
                        setStudents([]);
                      }}
                      className="border-0 shadow-sm rounded-3 px-3 py-3 text-dark fw-bold"
                    >
                      <option value="">-- Silakan Pilih ORMAWA Tujuan Pembinaan --</option>
                      {activities.map((act) => (
                        <option key={act.id} value={act.id}>{act.name} ({act.category || "Akademik"})</option>
                      ))}
                    </Form.Select>
                  </div>

                  {/* 2. Live Student Search */}
                  {leaderActivityId && (
                    <div className="mb-4 position-relative">
                      <label className="form-label fw-bold text-dark small text-uppercase">2. Temukan Mahasiswa Calon Ketua</label>
                      <div className="input-group shadow-sm rounded-3 overflow-hidden">
                        <span className="input-group-text bg-white border-0 px-4"><i className="bi bi-search text-muted fs-5"></i></span>
                        <input 
                          type="text" 
                          value={searchStudent}
                          onChange={(e) => setSearchStudent(e.target.value)}
                          className="form-control border-0 bg-white py-3 fs-5" 
                          placeholder="Ketik NIM atau Nama (min. 3 karakter)..."
                        />
                      </div>
                      <div className="form-text mt-2"><i className="bi bi-info-circle me-1"></i>Live Search mendeteksi data mahasiswa aktif seketika.</div>
                    </div>
                  )}

                  {/* 3. Search Results */}
                  {leaderActivityId && students.length > 0 && searchStudent.length >= 3 && (
                    <div>
                      <label className="form-label fw-bold text-dark small text-uppercase">3. Konfirmasi Pengangkatan</label>
                      <div className="list-group rounded-4 shadow-sm border-0 bg-white">
                        {students.map((st) => (
                          <div key={st.id} className="list-group-item list-group-item-action d-flex justify-content-between align-items-center flex-column flex-sm-row gap-3 py-3 border-light">
                            <div className="d-flex flex-column text-center text-sm-start">
                              <span className="fw-bold text-dark fs-5">{st.name}</span>
                              <span className="text-secondary small">Identitas NIM: <b>{st.nim}</b></span>
                            </div>
                            <Button 
                              variant="warning"
                              onClick={() => handleAssignLeader(st.id, st.name)}
                              className="text-dark fw-bold rounded-pill shadow-sm px-4"
                            >
                              Angkat Sebagai Ketua <i className="bi bi-stars ms-1"></i>
                            </Button>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                  {leaderActivityId && students.length === 0 && searchStudent.length >= 3 && (
                    <div className="text-center p-4 bg-white rounded-4 border shadow-sm mt-3">
                      <i className="bi bi-person-x fs-1 text-secondary opacity-50 d-block mb-2"></i>
                      <span className="text-muted fw-bold">Mahasiswa tidak ditemukan. Periksa kembali ejaan.</span>
                    </div>
                  )}

                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 4: EXPORT REPORTING */}
      {activeMenu === "reporting" && (
        <div className="row pt-2 justify-content-center">
          <div className="col-lg-10">
            {/* Header Card */}
            <div className="card border-0 rounded-4 shadow-sm bg-white overflow-hidden hover-lift mb-4">
              <div className="card-body p-4 p-md-5 text-center">
                <div className="bg-success bg-opacity-10 text-success rounded-circle d-flex align-items-center justify-content-center mx-auto mb-4 shadow-sm border border-success border-opacity-25" style={{ width: "90px", height: "90px" }}>
                  <i className="bi bi-folder-symlink-fill fs-1"></i>
                </div>
                <h2 className="fw-bolder text-dark">Pelaporan & Ekstraksi Eksekutif</h2>
                <p className="text-secondary mb-0 mx-auto" style={{ maxWidth: "650px" }}>
                  Hasilkan berkas CSV rekapitulasi data keanggotaan ORMAWA dan partisipasi kegiatan mahasiswa. Filter berdasarkan tipe laporan, rentang tanggal, untuk laporan yang sesuai kebutuhan.
                </p>
              </div>
            </div>

            {/* Report Type Selector */}
            <div className="card border-0 rounded-4 shadow-sm bg-white mb-4">
              <div className="card-body p-4">
                <label className="form-label fw-bold text-dark small text-uppercase mb-3">
                  <i className="bi bi-collection-fill text-primary me-1"></i> Pilih Tipe Laporan
                </label>
                <div className="d-flex gap-3 flex-wrap">
                  <button
                    type="button"
                    onClick={() => setReportType("all")}
                    className={`btn flex-fill rounded-4 py-3 px-4 border-2 d-flex flex-column align-items-center gap-2 ${
                      reportType === "all" 
                        ? "btn-dark text-white shadow border-dark" 
                        : "btn-outline-secondary"
                    }`}
                    style={{ transition: "all 0.2s", minWidth: "160px" }}
                  >
                    <i className={`bi bi-stack fs-3 ${reportType === "all" ? "text-warning" : ""}`}></i>
                    <span className="fw-bold">Semua Data</span>
                    <small className={reportType === "all" ? "text-white-50" : "text-muted"}>Keanggotaan + Kegiatan</small>
                  </button>
                  <button
                    type="button"
                    onClick={() => setReportType("membership")}
                    className={`btn flex-fill rounded-4 py-3 px-4 border-2 d-flex flex-column align-items-center gap-2 ${
                      reportType === "membership" 
                        ? "btn-primary text-white shadow border-primary" 
                        : "btn-outline-secondary"
                    }`}
                    style={{ transition: "all 0.2s", minWidth: "160px" }}
                  >
                    <i className="bi bi-people-fill fs-3"></i>
                    <span className="fw-bold">Keanggotaan ORMAWA</span>
                    <small className={reportType === "membership" ? "text-white-50" : "text-muted"}>NIM, Jabatan, ORMAWA</small>
                  </button>
                  <button
                    type="button"
                    onClick={() => setReportType("events")}
                    className={`btn flex-fill rounded-4 py-3 px-4 border-2 d-flex flex-column align-items-center gap-2 ${
                      reportType === "events" 
                        ? "btn-info text-white shadow border-info" 
                        : "btn-outline-secondary"
                    }`}
                    style={{ transition: "all 0.2s", minWidth: "160px" }}
                  >
                    <i className="bi bi-calendar-event-fill fs-3"></i>
                    <span className="fw-bold">Kegiatan / Event</span>
                    <small className={reportType === "events" ? "text-white-50" : "text-muted"}>Proker, Delegasi, Lomba</small>
                  </button>
                </div>
              </div>
            </div>

            <div className="row g-4">
              {/* Left Column: Date Range Filter */}
              <div className="col-lg-6">
                <div className="card border-0 rounded-4 shadow-sm bg-white h-100">
                  <div className="card-header bg-white border-bottom py-3 px-4 d-flex align-items-center gap-2">
                    <div className="bg-primary bg-opacity-10 text-primary rounded-circle d-flex align-items-center justify-content-center" style={{ width: "38px", height: "38px" }}>
                      <i className="bi bi-calendar2-range fs-6"></i>
                    </div>
                    <div>
                      <h6 className="fw-bold text-dark mb-0">Filter Rentang Tanggal</h6>
                      <small className="text-muted">Atur periode data yang ingin diekspor</small>
                    </div>
                  </div>
                  <div className="card-body p-4">
                    {/* Quick Preset Buttons */}
                    <label className="form-label fw-bold text-dark small text-uppercase mb-2">
                      <i className="bi bi-lightning-fill text-warning me-1"></i> Preset Cepat
                    </label>
                    <div className="d-flex flex-wrap gap-2 mb-4">
                      <button 
                        type="button"
                        onClick={() => applyDatePreset("this_month")} 
                        className={`btn btn-sm rounded-pill px-3 fw-semibold border ${
                          exportStartDate === new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().split("T")[0]
                            ? "btn-primary text-white" 
                            : "btn-outline-primary"
                        }`}
                      >
                        <i className="bi bi-calendar-month me-1"></i> Bulan Ini
                      </button>
                      <button 
                        type="button"
                        onClick={() => applyDatePreset("last_month")} 
                        className="btn btn-sm btn-outline-primary rounded-pill px-3 fw-semibold border"
                      >
                        <i className="bi bi-calendar-minus me-1"></i> Bulan Lalu
                      </button>
                      <button 
                        type="button"
                        onClick={() => applyDatePreset("this_semester")} 
                        className="btn btn-sm btn-outline-info rounded-pill px-3 fw-semibold border"
                      >
                        <i className="bi bi-mortarboard me-1"></i> Semester Ini
                      </button>
                      <button 
                        type="button"
                        onClick={() => applyDatePreset("this_year")} 
                        className="btn btn-sm btn-outline-secondary rounded-pill px-3 fw-semibold border"
                      >
                        <i className="bi bi-calendar-check me-1"></i> Tahun Ini
                      </button>
                      <button 
                        type="button"
                        onClick={() => applyDatePreset("all")} 
                        className={`btn btn-sm rounded-pill px-3 fw-semibold border ${
                          !exportStartDate && !exportEndDate
                            ? "btn-dark text-white" 
                            : "btn-outline-dark"
                        }`}
                      >
                        <i className="bi bi-infinity me-1"></i> Semua Data
                      </button>
                    </div>
                    
                    {/* Manual Date Range Inputs */}
                    <div className="row g-3">
                      <div className="col-6">
                        <label className="form-label fw-bold text-dark small text-uppercase">
                          <i className="bi bi-calendar-event text-success me-1"></i> Tanggal Mulai
                        </label>
                        <input 
                          type="date" 
                          value={exportStartDate}
                          onChange={(e) => setExportStartDate(e.target.value)}
                          className="form-control border-0 bg-light shadow-sm rounded-3 py-2 fw-semibold"
                          max={exportEndDate || undefined}
                        />
                      </div>
                      <div className="col-6">
                        <label className="form-label fw-bold text-dark small text-uppercase">
                          <i className="bi bi-calendar-x text-danger me-1"></i> Tanggal Akhir
                        </label>
                        <input 
                          type="date" 
                          value={exportEndDate}
                          onChange={(e) => setExportEndDate(e.target.value)}
                          className="form-control border-0 bg-light shadow-sm rounded-3 py-2 fw-semibold"
                          min={exportStartDate || undefined}
                        />
                      </div>
                    </div>

                    {/* Clear Filter */}
                    {(exportStartDate || exportEndDate) && (
                      <button 
                        type="button"
                        onClick={() => { setExportStartDate(""); setExportEndDate(""); }}
                        className="btn btn-sm btn-link text-danger text-decoration-none mt-3 p-0 fw-bold"
                      >
                        <i className="bi bi-x-circle me-1"></i> Hapus Filter Tanggal
                      </button>
                    )}
                  </div>
                </div>
              </div>

              {/* Right Column: Export Summary & Action */}
              <div className="col-lg-6">
                <div className="card border-0 rounded-4 shadow-sm bg-white h-100">
                  <div className="card-header bg-white border-bottom py-3 px-4 d-flex align-items-center gap-2">
                    <div className="bg-success bg-opacity-10 text-success rounded-circle d-flex align-items-center justify-content-center" style={{ width: "38px", height: "38px" }}>
                      <i className="bi bi-file-earmark-spreadsheet fs-6"></i>
                    </div>
                    <div>
                      <h6 className="fw-bold text-dark mb-0">Ringkasan Ekspor</h6>
                      <small className="text-muted">Detail laporan yang akan diunduh</small>
                    </div>
                  </div>
                  <div className="card-body p-4 d-flex flex-column justify-content-between">
                    {/* Export Details Summary */}
                    <div>
                      <div className="bg-light rounded-4 p-4 mb-4 border">
                        <div className="d-flex align-items-center gap-2 mb-3">
                          <i className="bi bi-info-circle-fill text-primary"></i>
                          <span className="fw-bold text-dark small">Detail Konfigurasi Laporan</span>
                        </div>
                        <div className="row g-2">
                          <div className="col-12">
                            <div className="d-flex justify-content-between align-items-center py-2 border-bottom border-light">
                              <span className="text-muted small">Tipe Laporan</span>
                              <span className={`badge fw-bold px-3 py-1 ${
                                reportType === "all" ? "bg-dark" :
                                reportType === "membership" ? "bg-primary" : "bg-info"
                              }`}>
                                {reportType === "all" ? "📋 Semua Data" : 
                                 reportType === "membership" ? "👥 Keanggotaan" : "📅 Kegiatan"}
                              </span>
                            </div>
                          </div>
                          <div className="col-12">
                            <div className="d-flex justify-content-between align-items-center py-2 border-bottom border-light">
                              <span className="text-muted small">Format File</span>
                              <span className="badge bg-success bg-opacity-10 text-success border border-success border-opacity-25 fw-bold px-3 py-1">CSV (Excel-ready)</span>
                            </div>
                          </div>
                          <div className="col-12">
                            <div className="d-flex justify-content-between align-items-center py-2 border-bottom border-light">
                              <span className="text-muted small">Periode Data</span>
                              <span className="fw-bold text-dark small">
                                {exportStartDate || exportEndDate ? (
                                  <>
                                    <i className="bi bi-calendar2-range text-primary me-1"></i>
                                    {exportStartDate ? new Date(exportStartDate).toLocaleDateString("id-ID", { day: "2-digit", month: "short", year: "numeric" }) : "Awal"}
                                    {" — "}
                                    {exportEndDate ? new Date(exportEndDate).toLocaleDateString("id-ID", { day: "2-digit", month: "short", year: "numeric" }) : "Sekarang"}
                                  </>
                                ) : (
                                  <><i className="bi bi-infinity text-dark me-1"></i> Seluruh Periode</>
                                )}
                              </span>
                            </div>
                          </div>
                          <div className="col-12">
                            <div className="d-flex justify-content-between align-items-start py-2">
                              <span className="text-muted small">Kolom Data</span>
                              <span className="fw-bold text-dark small text-end" style={{ maxWidth: "65%" }}>
                                {reportType === "membership" 
                                  ? "NIM, Nama, ORMAWA, Jabatan, Tgl Bergabung"
                                  : reportType === "events"
                                  ? "NIM, Nama, ORMAWA, Kegiatan, Kategori, Status, Tgl Mulai/Selesai"
                                  : "Tipe, NIM, Nama, ORMAWA, Kegiatan, Kategori, Jabatan/Status, Tanggal"}
                              </span>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                    
                    {/* Download Button */}
                    <div className="text-center">
                      <Button 
                        variant="success"
                        onClick={handleExportCSV}
                        disabled={loading}
                        className="px-5 py-3 rounded-pill fw-bold shadow fs-5 text-white w-100"
                        style={{ background: "linear-gradient(135deg, #198754 0%, #157347 100%)", border: "none" }}
                      >
                        {loading ? (
                          <><span className="spinner-border spinner-border-sm me-2" role="status"></span> Memproses Data...</>
                        ) : (
                          <><i className="bi bi-download fs-4 me-2"></i> Download Laporan CSV</>
                        )}
                      </Button>
                      <div className="text-muted small mt-3">
                        <i className="bi bi-shield-check text-success me-1"></i>
                        Data berdasarkan kueri <code>users</code>, <code>activity_user</code> & <code>event_user</code> yang disetujui
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Footer Hint */}
            <div className="text-center mt-4 mb-5">
              <div className="bg-white rounded-4 shadow-sm border p-3 d-inline-block">
                <i className="bi bi-lightbulb text-warning me-2"></i>
                <span className="text-secondary small">
                  <strong>Tips:</strong> Gunakan filter tanggal dan tipe laporan untuk menghasilkan laporan semester, tahunan, atau periode khusus sesuai kebutuhan akreditasi dan SKPI.
                </span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* CRUD MODAL */}
      <Modal show={showModal} onHide={() => setShowModal(false)} size="lg" centered>
        <Modal.Header closeButton className={`border-0 pb-0 ${editId ? 'bg-primary' : 'bg-danger'} text-white rounded-top-4`}>
          <Modal.Title className="fw-bold fs-5 text-white py-2">
            <i className={`bi ${editId ? 'bi-pencil-square' : 'bi-plus-circle'} me-2`}></i>
            {editId ? 'Edit Data ORMAWA' : 'Buat Data ORMAWA Baru'}
          </Modal.Title>
        </Modal.Header>
        <Modal.Body className="bg-light p-4 rounded-bottom-4">
          <Form onSubmit={handleSubmit(onSubmit)}>
            <div className="row g-3">
              
              {/* Name */}
              <div className="col-md-6">
                <Form.Group>
                  <Form.Label className="small fw-semibold text-secondary">Nama Organisasi/ORMAWA <span className="text-danger">*</span></Form.Label>
                  <Form.Control
                    type="text"
                    placeholder="Contoh: BEM Fakultas Teknik / Himpunan Elektro"
                    className={`py-2 ${errors.name ? 'is-invalid' : ''}`}
                    {...register("name")}
                  />
                  {errors.name && <div className="invalid-feedback">{errors.name.message}</div>}
                </Form.Group>
              </div>

              {/* Type */}
              <div className="col-md-6">
                <Form.Group>
                  <Form.Label className="small fw-semibold text-secondary">Tipe Organisasi <span className="text-danger">*</span></Form.Label>
                  <Form.Select className="py-2" {...register("orgType")}>
                    <option value="UKM">Unit Kegiatan Mahasiswa (UKM)</option>
                    <option value="BEM Universitas">BEM Universitas</option>
                    <option value="BEM Fakultas">BEM Fakultas</option>
                    <option value="BPM">BPM</option>
                    <option value="Himpunan Mahasiswa">Himpunan Mahasiswa</option>
                  </Form.Select>
                </Form.Group>
              </div>

              {/* Level */}
              <div className="col-md-6">
                <Form.Group>
                  <Form.Label className="small fw-semibold text-secondary">Tingkat Hierarki <span className="text-danger">*</span></Form.Label>
                  <Form.Select 
                    className="py-2" 
                    {...register("organizationLevel")}
                    onChange={(e) => {
                      setValue("organizationLevel", e.target.value);
                      setValue("scopeName", ""); // Reset scope
                    }}
                  >
                    <option value="Universitas">Tingkat Universitas</option>
                    <option value="Fakultas">Tingkat Fakultas</option>
                    <option value="Jurusan">Tingkat Jurusan</option>
                    <option value="Prodi">Tingkat Program Studi (Prodi)</option>
                  </Form.Select>
                </Form.Group>
              </div>

              {/* Scope Name */}
              <div className="col-md-6">
                <Form.Group>
                  {scopeOptionsMap[watchedLevel] ? (
                    <>
                      <Form.Label className="small fw-semibold text-secondary">Nama Cakupan (Opsi Spesifik) <span className="text-danger">*</span></Form.Label>
                      <Form.Select className="py-2" {...register("scopeName")}>
                        <option value="">-- Pilih Spesifik --</option>
                        {scopeOptionsMap[watchedLevel].map(opt => (
                          <option key={opt} value={opt}>{opt}</option>
                        ))}
                      </Form.Select>
                    </>
                  ) : (
                    <>
                      <Form.Label className="small fw-semibold text-secondary text-muted">Nama Cakupan (Fak. / Jurusan)</Form.Label>
                      <Form.Control
                        type="text"
                        placeholder="Level Universitas tidak butuh cakupan"
                        disabled
                        className="py-2 bg-white"
                        value=""
                      />
                    </>
                  )}
                </Form.Group>
              </div>

              {/* Category */}
              <div className="col-md-6">
                <Form.Group>
                  <Form.Label className="small fw-semibold text-secondary">Kategori Utama <span className="text-danger">*</span></Form.Label>
                  <Form.Control
                    type="text"
                    placeholder="Seni, Olahraga, Eksekutif..."
                    className={`py-2 ${errors.category ? 'is-invalid' : ''}`}
                    {...register("category")}
                  />
                  {errors.category && <div className="invalid-feedback">{errors.category.message}</div>}
                </Form.Group>
              </div>

              {/* Quota */}
              <div className="col-md-6">
                <Form.Group>
                  <Form.Label className="small fw-semibold text-secondary">Batas Kuota Anggota <span className="text-danger">*</span></Form.Label>
                  <Form.Control
                    type="number"
                    placeholder="Contoh: 30"
                    className={`py-2 ${errors.quota ? 'is-invalid' : ''}`}
                    {...register("quota")}
                  />
                  {errors.quota && <div className="invalid-feedback">{errors.quota.message}</div>}
                </Form.Group>
              </div>

              {/* Start Date */}
              <div className="col-md-4">
                <Form.Group>
                  <Form.Label className="small fw-semibold text-secondary">Tanggal Mulai Daftar</Form.Label>
                  <Form.Control
                    type="date"
                    className="py-2"
                    {...register("registrationStart")}
                  />
                </Form.Group>
              </div>

              {/* End Date */}
              <div className="col-md-4">
                <Form.Group>
                  <Form.Label className="small fw-semibold text-secondary">Tanggal Akhir Daftar</Form.Label>
                  <Form.Control
                    type="date"
                    className="py-2"
                    {...register("registrationEnd")}
                  />
                </Form.Group>
              </div>

              {/* Status */}
              <div className="col-md-4">
                <Form.Group>
                  <Form.Label className="small fw-semibold text-secondary">Default Sistem Status</Form.Label>
                  <Form.Select className="py-2" {...register("status")}>
                    <option value="open">Buka Pendaftaran</option>
                    <option value="closed">Paksa Tutup Pendaftaran</option>
                  </Form.Select>
                </Form.Group>
              </div>

              {/* WhatsApp Link */}
              <div className="col-12">
                <Form.Group>
                  <Form.Label className="small fw-semibold text-secondary">Akses Eksternal Grup Chat WA (Link WhatsApp)</Form.Label>
                  <Form.Control
                    type="text"
                    placeholder="https://chat.whatsapp.com/..."
                    className="py-2"
                    {...register("whatsappLink")}
                  />
                </Form.Group>
              </div>

              {/* Poster/Image URL */}
              <div className="col-12">
                <Form.Group>
                  <Form.Label className="small fw-semibold text-secondary">Tautan Logo/Poster ORMAWA (Link Gambar)</Form.Label>
                  <Form.Control
                    type="text"
                    placeholder="https://domain.com/gambar.png"
                    className="py-2"
                    {...register("imageUrl")}
                  />
                </Form.Group>
              </div>

              {/* Description */}
              <div className="col-12">
                <Form.Group>
                  <Form.Label className="small fw-semibold text-secondary">Syarat Pendaftaran / Deskripsi ORMAWA <span className="text-danger">*</span></Form.Label>
                  <Form.Control
                    as="textarea"
                    rows={3}
                    placeholder="Visi misi atau detail pendaftaran organisasi..."
                    className="py-2"
                    {...register("description")}
                  />
                </Form.Group>
              </div>

            </div>

            <div className="d-flex justify-content-end gap-2 mt-4 pt-3 border-top">
              <Button variant="outline-secondary" className="px-4 rounded-pill fw-bold" onClick={() => setShowModal(false)} disabled={loading}>
                Batal
              </Button>
              <Button variant={editId ? "primary" : "danger"} type="submit" className="px-5 rounded-pill fw-bold text-white" disabled={loading}>
                {loading ? "Menyimpan..." : "Terapkan Perubahan"}
              </Button>
            </div>
          </Form>
        </Modal.Body>
      </Modal>

      {/* DELETE CONFIRMATION MODAL */}
      <Modal show={deleteConfirm.show} onHide={() => setDeleteConfirm({ show: false, id: 0, name: "" })} centered>
        <Modal.Header closeButton className="border-0 bg-danger text-white rounded-top-4 pb-0">
          <Modal.Title className="fw-bold fs-5 text-white py-2">
            <i className="bi bi-exclamation-triangle-fill me-2"></i>
            Konfirmasi Hapus
          </Modal.Title>
        </Modal.Header>
        <Modal.Body className="p-4 text-center">
          <div className="bg-danger bg-opacity-10 text-danger rounded-circle d-flex align-items-center justify-content-center mx-auto mb-3" style={{ width: "70px", height: "70px" }}>
            <i className="bi bi-trash3-fill fs-1"></i>
          </div>
          <h5 className="fw-bold text-dark mb-2">Hapus Permanen?</h5>
          <p className="text-secondary mb-1">
            Apakah Anda yakin ingin menghapus ORMAWA:
          </p>
          <p className="fw-bold text-danger fs-5 mb-2">&ldquo;{deleteConfirm.name}&rdquo;</p>
          <div className="alert alert-warning small text-start rounded-3 mb-0">
            <i className="bi bi-info-circle me-1"></i>
            <strong>Peringatan:</strong> Semua data keanggotaan, event, pengumuman, dan prestasi yang terkait dengan ORMAWA ini juga akan ikut terhapus secara permanen.
          </div>
        </Modal.Body>
        <Modal.Footer className="border-0 d-flex justify-content-center gap-2 pb-4">
          <Button 
            variant="outline-secondary" 
            className="px-4 rounded-pill fw-bold"
            onClick={() => setDeleteConfirm({ show: false, id: 0, name: "" })}
          >
            <i className="bi bi-x-lg me-1"></i> Batal
          </Button>
          <Button 
            variant="danger" 
            className="px-4 rounded-pill fw-bold text-white"
            onClick={executeDelete}
          >
            <i className="bi bi-trash3 me-1"></i> Ya, Hapus Sekarang
          </Button>
        </Modal.Footer>
      </Modal>

    </div>
  );
}
