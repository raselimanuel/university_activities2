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

  // Custom Confirmation Modal State
  const [confirmModal, setConfirmModal] = useState<{
    show: boolean;
    title: string;
    message: string;
    variant: "primary" | "danger" | "warning" | "success";
    onConfirm: () => void;
  }>({
    show: false,
    title: "",
    message: "",
    variant: "primary",
    onConfirm: () => {},
  });

  const triggerConfirm = (
    title: string,
    message: string,
    onConfirm: () => void,
    variant: "primary" | "danger" | "warning" | "success" = "primary"
  ) => {
    setConfirmModal({
      show: true,
      title,
      message,
      variant,
      onConfirm: () => {
        onConfirm();
        setConfirmModal(prev => ({ ...prev, show: false }));
      }
    });
  };

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

  // Toggle Ormawa status (Actual execution)
  const executeToggleStatus = async (id: number) => {
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

  const handleToggleStatus = (id: number, name: string) => {
    const act = activities.find(a => a.id === id);
    const nextStatusText = act?.status === "open" ? "Tutup" : "Buka";
    
    triggerConfirm(
      "Ubah Status Registrasi?",
      `Apakah Anda yakin ingin mengubah status pendaftaran ORMAWA "${name}" menjadi ${nextStatusText.toUpperCase()}?`,
      () => executeToggleStatus(id),
      "warning"
    );
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

  // Submit Add/Edit Form (Actual execution)
  const executeSubmit = async (data: OrmawaInput) => {
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

  // React Hook Form onSubmit handler
  const onSubmit = (data: OrmawaInput) => {
    const isEdit = !!editId;
    const confirmTitle = isEdit ? "Simpan Perubahan?" : "Buat ORMAWA Baru?";
    const confirmMsg = isEdit 
      ? `Apakah Anda yakin ingin menyimpan perubahan pada data ORMAWA "${data.name}"?`
      : `Apakah Anda yakin ingin membuat ORMAWA baru dengan nama "${data.name}"?`;

    triggerConfirm(
      confirmTitle,
      confirmMsg,
      () => executeSubmit(data),
      isEdit ? "primary" : "success"
    );
  };

  // Kingmaker - Assign Leader (Actual execution)
  const executeAssignLeader = async (studentId: string, studentName: string) => {
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

  const handleAssignLeader = (studentId: string, studentName: string) => {
    if (!leaderActivityId) return;

    triggerConfirm(
      "Pelantikan Ketua ORMAWA",
      `Sistem akan melantik "${studentName}" sebagai Ketua. Jika terdapat ketua lama di ORMAWA tersebut, status mereka akan diturunkan menjadi anggota biasa. Lanjutkan?`,
      () => executeAssignLeader(studentId, studentName),
      "warning"
    );
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
            <h3 className="fw-bolder text-dark mb-1">Ruang Kelola <span className="text-primary">Kemahasiswaan</span></h3>
            <p className="text-secondary mb-0 small fw-medium">Kelola data ORMAWA, persetujuan kegiatan, dan laporan kemahasiswaan.</p>
          </div>
          
          {/* Navigation Tabs */}
          <div className="premium-nav-pills shadow-sm">
            <button 
              onClick={() => setActiveMenu("approval")} 
              className={`btn-tab ${activeMenu === "approval" ? "active" : ""}`}
            >
              <i className="bi bi-shield-check"></i> Persetujuan Kegiatan
              {pendingProposals.length > 0 && (
                <span className="badge bg-danger text-white ms-1.5 rounded-pill px-2" style={{ fontSize: "0.75rem" }}>{pendingProposals.length}</span>
              )}
            </button>
            <button 
              onClick={() => setActiveMenu("master")} 
              className={`btn-tab ${activeMenu === "master" ? "active" : ""}`}
            >
              <i className="bi bi-grid-fill"></i> Data ORMAWA
            </button>
            <button 
              onClick={() => setActiveMenu("kingmaker")} 
              className={`btn-tab ${activeMenu === "kingmaker" ? "active" : ""}`}
            >
              <i className="bi bi-person-up"></i> Penunjukan Ketua
            </button>
            <button 
              onClick={() => setActiveMenu("reporting")} 
              className={`btn-tab ${activeMenu === "reporting" ? "active" : ""}`}
            >
              <i className="bi bi-file-earmark-excel-fill"></i> Laporan
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
        <div className="card border-0 rounded-4 shadow-sm bg-white overflow-hidden border border-light-subtle">
          <div className="card-header bg-white border-bottom py-3.5 px-4 d-flex align-items-center gap-3">
            <div className="bg-primary bg-opacity-10 text-primary rounded-circle d-flex align-items-center justify-content-center border" style={{ width: "42px", height: "42px", borderColor: "rgba(227, 27, 32, 0.15)" }}>
              <i className="bi bi-shield-lock-fill fs-5"></i>
            </div>
            <div>
              <h5 className="fw-bold text-dark mb-0">Menunggu Persetujuan Akhir</h5>
              <small className="text-muted">Proposal kegiatan mahasiswa yang menunggu persetujuan administrator.</small>
            </div>
          </div>
          <div className="card-body p-4">
            {pendingProposals.length === 0 ? (
              <div className="text-center py-5 rounded-4 position-relative overflow-hidden my-2"
                style={{
                  background: "linear-gradient(135deg, rgba(16, 185, 129, 0.03) 0%, rgba(255, 255, 255, 1) 100%)",
                  border: "1px dashed rgba(16, 185, 129, 0.25)"
                }}
              >
                {/* Glowing ring animation container */}
                <div className="position-relative mx-auto mb-4 d-flex align-items-center justify-content-center" style={{ width: "70px", height: "70px" }}>
                  <div className="position-absolute pulse-ring-success w-100 h-100" style={{ background: "rgba(16, 185, 129, 0.1)" }}></div>
                  <div className="bg-success text-white rounded-circle d-flex align-items-center justify-content-center position-relative z-1 shadow-sm" style={{ width: "52px", height: "52px" }}>
                    <i className="bi bi-shield-check-fill fs-3"></i>
                  </div>
                </div>
                <h5 className="fw-bold text-dark mb-1">Tidak Ada Proposal Tertunda</h5>
                <p className="text-secondary small mb-0 mx-auto" style={{ maxWidth: "440px" }}>
                  Semua proposal kegiatan sudah ditinjau. Tidak ada pengajuan yang menunggu persetujuan administrator saat ini.
                </p>
              </div>
            ) : (
              <div className="table-responsive">
                <table className="table table-hover align-middle mb-0 no-line-table">
                  <thead>
                    <tr className="text-secondary small fw-bold border-bottom">
                      <th className="py-3 ps-4">NAMA KEGIATAN / PROGRAM KERJA</th>
                      <th className="py-3">ORMAWA PENGAJU</th>
                      <th className="py-3">DIAJUKAN OLEH</th>
                      <th className="py-3">TANGGAL PENGAJUAN</th>
                      <th className="py-3 text-end pe-4">AKSI</th>
                    </tr>
                  </thead>
                  <tbody>
                    {pendingProposals.map((prop) => {
                      const orgStyle = getFacultyStyle(prop.scopeName || prop.orgName);
                      return (
                        <tr key={prop.id} className="hover-lift-subtle" style={{ borderLeft: `3px solid ${orgStyle.primary}` }}>
                          <td className="py-3.5 ps-4">
                            <span className="fw-bold text-dark d-block" style={{ fontSize: "0.95rem" }}>{prop.name}</span>
                            <span className="badge bg-light text-secondary mt-1">{prop.category}</span>
                          </td>
                          <td className="py-3.5">
                            <span className="badge border px-3 py-1.5 fw-bold rounded-pill" style={{ backgroundColor: orgStyle.lightBg, color: orgStyle.primary, borderColor: orgStyle.borderSubtle }}>
                              {prop.orgName}
                            </span>
                          </td>
                          <td className="py-3.5">
                            <span className="fw-semibold text-dark small">{prop.creatorName || "Pengurus ORMAWA"}</span>
                          </td>
                          <td className="py-3.5">
                            <span className="small text-muted d-inline-flex align-items-center gap-1.5">
                              <i className="bi bi-calendar-event text-primary"></i>
                              {new Date(prop.createdAt).toLocaleDateString("id-ID", { day: "2-digit", month: "short", year: "numeric" })}
                            </span>
                          </td>
                          <td className="text-end pe-4 py-3.5">
                            <Link 
                              href={`/dashboard/activities/${prop.id}`} 
                              className="btn btn-sm px-4 py-2 text-white fw-bold rounded-pill shadow-sm hover-lift d-inline-flex align-items-center gap-1" 
                              style={{ background: orgStyle.gradient, border: "none" }}
                            >
                              <span>Tinjau</span> 
                              <i className="bi bi-chevron-right" style={{ fontSize: "0.8rem" }}></i>
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
            {/* Stat 1 */}
            <div className="col-md-3">
              <div className="card border-0 rounded-4 p-4 hover-lift h-100 d-flex flex-row align-items-center gap-3 shadow-sm border border-light-subtle card-glass-premium">
                <PremiumIcon 
                  icon="bi-building" 
                  primaryColor="#d71920" 
                  lightBgColor="#fdebee" 
                  size={56} 
                />
                <div>
                  <h6 className="text-muted fw-bold small mb-1" style={{ fontSize: "0.7rem", letterSpacing: "0.5px" }}>TOTAL ORMAWA TERDAFTAR</h6>
                  <h3 className="mb-0 fw-extrabold text-dark">{totalOrmawa}</h3>
                </div>
              </div>
            </div>
            {/* Stat 2 */}
            <div className="col-md-3">
              <div className="card border-0 rounded-4 p-4 hover-lift h-100 d-flex flex-row align-items-center gap-3 shadow-sm border border-light-subtle card-glass-premium">
                <PremiumIcon 
                  icon="bi-people-fill" 
                  primaryColor="#0ea5e9" 
                  lightBgColor="#e0f2fe" 
                  size={56} 
                />
                <div>
                  <h6 className="text-muted fw-bold small mb-1" style={{ fontSize: "0.7rem", letterSpacing: "0.5px" }}>TOTAL PENGGUNA TERDAFTAR</h6>
                  <h3 className="mb-0 fw-extrabold text-dark">{stats.totalUsers}</h3>
                </div>
              </div>
            </div>
            {/* Stat 3 */}
            <div className="col-md-3">
              <div className="card border-0 rounded-4 p-4 hover-lift h-100 d-flex flex-row align-items-center gap-3 shadow-sm border border-light-subtle card-glass-premium">
                <PremiumIcon 
                  icon="bi-calendar-check" 
                  primaryColor="#d97706" 
                  lightBgColor="#fef3c7" 
                  size={56} 
                />
                <div>
                  <h6 className="text-muted fw-bold small mb-1" style={{ fontSize: "0.7rem", letterSpacing: "0.5px" }}>PENDAFTARAN KEGIATAN AKTIF</h6>
                  <h3 className="mb-0 fw-extrabold text-dark">{stats.openRegistrations}</h3>
                </div>
              </div>
            </div>
            {/* Stat 4 */}
            <div className="col-md-3">
              <div className="card border-0 rounded-4 p-4 hover-lift h-100 d-flex flex-row align-items-center gap-3 shadow-sm border border-light-subtle card-glass-premium">
                <PremiumIcon 
                  icon="bi-trophy-fill" 
                  primaryColor="#10b981" 
                  lightBgColor="#d1fae5" 
                  size={56} 
                />
                <div className="flex-grow-1 overflow-hidden">
                  <h6 className="text-muted fw-bold small mb-1" style={{ fontSize: "0.7rem", letterSpacing: "0.5px" }}>ORMAWA TERPOPULER</h6>
                  <div className="mb-0 fw-bold text-dark text-truncate small" title={trendingOrg ? trendingOrg.name : "-"} style={{ fontSize: "0.9rem" }}>
                    {trendingOrg ? trendingOrg.name : "-"}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Master Table Card */}
          <div className="card border-0 rounded-4 card-glass-static overflow-hidden mb-4 border border-light-subtle shadow-sm">
            <div className="card-header bg-white border-bottom py-4 px-4 d-flex justify-content-between align-items-center flex-column flex-lg-row gap-3">
              <div className="d-flex align-items-center gap-3 w-100 w-lg-auto">
                <div className="bg-dark rounded-circle d-flex align-items-center justify-content-center text-white" style={{ width: "45px", height: "45px" }}>
                  <i className="bi bi-database-fill fs-5"></i>
                </div>
                <div>
                  <h5 className="mb-0 fw-bold text-dark">Data ORMAWA</h5>
                  <p className="mb-0 text-secondary small">Kelola profil, kuota, dan status pendaftaran organisasi mahasiswa.</p>
                </div>
              </div>

              <div className="d-flex flex-column flex-md-row gap-2 w-100 w-lg-auto flex-wrap justify-content-md-end">
                {/* Select filter */}
                <select 
                  value={filterJenis} 
                  onChange={(e) => setFilterJenis(e.target.value)}
                  className="form-select curator-input px-3 py-2.5 rounded-3 text-dark fw-semibold" 
                  style={{ minWidth: "220px", fontSize: "0.9rem" }}
                >
                  <option value="">-- Semua Jenis ORMAWA --</option>
                  <option value="UKM">Unit Kegiatan Mahasiswa (UKM)</option>
                  <option value="BEM Universitas">BEM Universitas</option>
                  <option value="BEM Fakultas">BEM Fakultas</option>
                  <option value="BPM">BPM</option>
                  <option value="Himpunan Mahasiswa">Himpunan Mahasiswa</option>
                </select>
                
                {/* Search input */}
                <div className="position-relative" style={{ minWidth: "250px" }}>
                  <span className="position-absolute start-0 top-50 translate-middle-y ps-3 text-muted" style={{ zIndex: 10 }}>
                    <i className="bi bi-search"></i>
                  </span>
                  <input 
                    type="text" 
                    value={searchActivity}
                    onChange={(e) => setSearchActivity(e.target.value)}
                    className="form-control curator-input py-2.5 fw-semibold" 
                    style={{ fontSize: "0.9rem", paddingLeft: "2.5rem" }}
                    placeholder="Cari nama ORMAWA..."
                  />
                </div>

                {/* Add Button */}
                <Button 
                  variant="primary"
                  onClick={handleCreate}
                  className="text-white rounded-3 fw-bold shadow-sm d-flex align-items-center justify-content-center px-4 py-2.5 hover-lift"
                  style={{ 
                    whiteSpace: "nowrap",
                    background: "linear-gradient(135deg, var(--brand-red) 0%, var(--brand-red-strong) 100%)",
                    border: "none"
                  }}
                >
                  <i className="bi bi-plus-lg me-2"></i> Tambah ORMAWA
                </Button>
              </div>
            </div>

            <div className="card-body p-0">
              <div className="table-responsive">
                <table className="table table-hover align-middle mb-0 no-line-table">
                  <thead className="bg-light bg-opacity-50">
                    <tr className="text-secondary small fw-bold border-bottom">
                      <th className="ps-4 py-3 border-0">LOGO & NAMA ORMAWA</th>
                      <th className="py-3 border-0">KATEGORI</th>
                      <th className="py-3 border-0">PERIODE PENDAFTARAN</th>
                      <th className="py-3 border-0 text-center">KUOTA MAHASISWA</th>
                      <th className="py-3 border-0 text-center">STATUS REGISTRASI</th>
                      <th className="py-3 pe-4 border-0 text-end">AKSI</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredActivities.map((act) => {
                      const orgStyle = getFacultyStyle(act.scopeName || act.name);
                      return (
                        <tr key={act.id} className="hover-lift-subtle">
                          <td className="ps-4 py-3">
                            <div className="d-flex align-items-center gap-3">
                              {act.imageUrl ? (
                                <img 
                                  src={act.imageUrl} 
                                  className="rounded-3 shadow-sm border" 
                                  style={{ width: "48px", height: "48px", objectFit: "cover" }}
                                  alt={act.name}
                                />
                              ) : (
                                <div className="monogram-avatar" style={{ background: orgStyle.gradient }}>
                                  {act.name.substring(0, 2).toUpperCase()}
                                </div>
                              )}
                              <div>
                                <span className="fw-bold text-dark d-block" style={{ fontSize: "0.95rem" }}>{act.name}</span>
                                <span className="small text-muted text-truncate-2 d-block" style={{ maxWidth: "250px", fontSize: "0.8rem" }}>{act.description || "-"}</span>
                              </div>
                            </div>
                          </td>
                          <td className="py-3">
                            <span className="badge bg-secondary bg-opacity-10 text-secondary border px-3 py-1.5 fw-bold rounded-pill">{act.category || "Akademik"}</span>
                          </td>
                          <td className="py-3 text-muted small">
                            <span className="d-inline-flex align-items-center gap-1.5 fw-medium">
                              <i className="bi bi-calendar2-range text-primary"></i> 
                              {act.registrationStart ? new Date(act.registrationStart).toLocaleDateString("id-ID", { day: "2-digit", month: "2-digit" }) : "∞"} 
                              {" - "} 
                              {act.registrationEnd ? new Date(act.registrationEnd).toLocaleDateString("id-ID", { day: "2-digit", month: "2-digit", year: "2-digit" }) : "∞"}
                            </span>
                          </td>
                          <td className="py-3 text-center" style={{ minWidth: "140px" }}>
                            <div className="fw-extrabold text-dark" style={{ fontSize: "0.9rem" }}>{act.registered} <span className="text-secondary fw-normal">/</span> {act.quota}</div>
                            {/* Quota Progress Bar */}
                            <div className="progress-container-premium mx-auto mt-2" style={{ width: "90px" }}>
                              <div 
                                className="progress-bar-premium" 
                                style={{ 
                                  width: `${Math.min(100, (act.registered / act.quota) * 100)}%`,
                                  backgroundColor: (act.registered / act.quota) >= 0.9 ? "#dc3545" : (act.registered / act.quota) >= 0.7 ? "#ffc107" : "#10b981"
                                }}
                              ></div>
                            </div>
                          </td>
                          <td className="py-3 text-center">
                            <div className="d-flex flex-column align-items-center justify-content-center">
                              <label className="premium-switch">
                                <input 
                                  type="checkbox" 
                                  checked={act.status === "open"} 
                                  onChange={() => handleToggleStatus(act.id, act.name)}
                                />
                                <span className="premium-slider"></span>
                              </label>
                              <div className="small mt-1 fw-bold" style={{ fontSize: "0.7rem", color: act.status === "open" ? "#10b981" : "#dc3545" }}>
                                {act.status === "open" ? "BUKA" : "TUTUP"}
                              </div>
                            </div>
                          </td>
                          <td className="pe-4 text-end py-3">
                            <div className="d-inline-flex gap-1">
                              <button 
                                type="button"
                                onClick={(e) => { e.stopPropagation(); handleEdit(act); }} 
                                className="btn btn-sm btn-light border border-light-subtle rounded-3 text-primary fw-semibold px-2.5 py-1.5 hover-lift shadow-sm"
                                title="Edit ORMAWA"
                              >
                                <i className="bi bi-pencil-square"></i> <span className="d-none d-md-inline ms-1">Edit</span>
                              </button>
                              <button 
                                type="button"
                                onClick={(e) => { e.stopPropagation(); handleDeleteActivity(act.id, act.name); }} 
                                className="btn btn-sm btn-light border border-light-subtle rounded-3 text-danger fw-semibold px-2.5 py-1.5 hover-lift shadow-sm"
                                title="Hapus ORMAWA"
                              >
                                <i className="bi bi-trash-fill"></i> <span className="d-none d-md-inline ms-1">Hapus</span>
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                    {filteredActivities.length === 0 && (
                      <tr>
                        <td colSpan={6} className="text-center py-5 bg-white text-muted">
                          <i className="bi bi-inbox fs-1 d-block mb-3 text-secondary opacity-50"></i>
                          <span className="fw-bold d-block text-dark">Data tidak ditemukan</span>
                          <span className="small text-secondary">Basis data kosong atau tidak cocok dengan kriteria filter pencarian Anda.</span>
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
            <div className="card border-0 rounded-4 shadow-sm bg-white hover-lift overflow-hidden position-relative mb-5 border border-light-subtle">
              <div 
                className="position-absolute end-0 top-0 opacity-5" 
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
                <div className="text-center mb-4">
                  <div className="bg-warning bg-opacity-10 text-warning rounded-circle d-flex align-items-center justify-content-center mx-auto mb-3 shadow-sm border border-warning border-opacity-25" style={{ width: "80px", height: "80px" }}>
                    <i className="bi bi-person-up fs-1 text-warning"></i>
                  </div>
                  <h2 className="fw-extrabold text-dark">Penunjukan Ketua ORMAWA</h2>
                  <p className="text-secondary small mx-auto" style={{ maxWidth: "550px" }}>
                    Tetapkan ketua ORMAWA dengan memilih organisasi, mencari mahasiswa berdasarkan nama atau NIM, lalu mengesahkan perannya.
                  </p>
                </div>

                {/* Wizard Steps Indicator */}
                <div className="wizard-steps px-3 mx-auto mb-4" style={{ maxWidth: "500px" }}>
                  <div className={`wizard-step-item ${!leaderActivityId ? 'active' : 'completed'}`}>
                    <div className="wizard-step-circle">1</div>
                    <div className="wizard-step-label">Pilih ORMAWA</div>
                  </div>
                  <div className={`wizard-step-item ${leaderActivityId && (searchStudent.length < 3 || students.length === 0) ? 'active' : leaderActivityId && searchStudent.length >= 3 && students.length > 0 ? 'completed' : ''}`}>
                    <div className="wizard-step-circle">2</div>
                    <div className="wizard-step-label">Cari Ketua</div>
                  </div>
                  <div className={`wizard-step-item ${leaderActivityId && searchStudent.length >= 3 && students.length > 0 ? 'active' : ''}`}>
                    <div className="wizard-step-circle">3</div>
                    <div className="wizard-step-label">Pelantikan</div>
                  </div>
                </div>

                <div className="bg-light bg-opacity-40 p-4 rounded-4 border border-light-subtle">
                  
                  {/* 1. Select Ormawa */}
                  <div className="mb-4">
                    <label className="form-label fw-bold text-dark small text-uppercase mb-2 d-flex align-items-center gap-1.5">
                      <span className="badge bg-dark rounded-circle px-2 py-1.5 small" style={{ fontSize: "0.7rem" }}>1</span>
                      <span>Pilih ORMAWA</span>
                    </label>
                    <Form.Select 
                      value={leaderActivityId}
                      onChange={(e) => {
                        setLeaderActivityId(e.target.value);
                        setSearchStudent("");
                        setStudents([]);
                      }}
                      className="form-select curator-input px-3 py-3 text-dark fw-bold bg-white shadow-sm"
                      style={{ fontSize: "0.95rem" }}
                    >
                      <option value="">-- Pilih ORMAWA --</option>
                      {activities.map((act) => (
                        <option key={act.id} value={act.id}>{act.name} ({act.category || "Akademik"})</option>
                      ))}
                    </Form.Select>
                  </div>
 
                  {/* 2. Live Student Search */}
                  {leaderActivityId && (
                    <div className="mb-4 position-relative">
                      <label className="form-label fw-bold text-dark small text-uppercase mb-2 d-flex align-items-center gap-1.5">
                        <span className="badge bg-primary rounded-circle px-2 py-1.5 small" style={{ fontSize: "0.7rem" }}>2</span>
                        <span>Temukan Mahasiswa Calon Ketua</span>
                      </label>
                      <div className="position-relative">
                        <span className="position-absolute start-0 top-50 translate-middle-y ps-4 text-muted" style={{ zIndex: 10 }}>
                          <i className="bi bi-search fs-5"></i>
                        </span>
                        <input 
                          type="text" 
                          value={searchStudent}
                          onChange={(e) => setSearchStudent(e.target.value)}
                          className="form-control curator-input py-3 fw-semibold shadow-sm" 
                          style={{ fontSize: "1rem", paddingLeft: "3.5rem" }}
                          placeholder="Ketik NIM atau Nama lengkap mahasiswa..."
                        />
                      </div>
                      <div className="form-text mt-2 text-muted small"><i className="bi bi-info-circle-fill me-1 text-primary"></i>Masukkan minimal 3 karakter untuk melakukan pencarian data mahasiswa aktif.</div>
                    </div>
                  )}
 
                  {/* 3. Search Results */}
                  {leaderActivityId && students.length > 0 && searchStudent.length >= 3 && (() => {
                    const selectedAct = activities.find(a => a.id === parseInt(leaderActivityId));
                    const orgStyle = selectedAct ? getFacultyStyle(selectedAct.scopeName || selectedAct.name) : getFacultyStyle(null);
                    return (
                      <div className="mt-4">
                        <label className="form-label fw-bold text-dark small text-uppercase mb-2 d-flex align-items-center gap-1.5">
                          <span className="badge rounded-circle px-2 py-1.5 small text-white" style={{ fontSize: "0.7rem", backgroundColor: orgStyle.primary }}>3</span>
                          <span>Konfirmasi & Pengesahan Ketua</span>
                        </label>
                        <div className="d-flex flex-column gap-2">
                          {students.map((st) => (
                            <div key={st.id} className="p-3 border rounded-4 bg-white d-flex justify-content-between align-items-center flex-column flex-sm-row gap-3 shadow-sm hover-lift border-start border-4" style={{ borderLeftColor: orgStyle.primary }}>
                              <div className="d-flex align-items-center gap-3 w-100 w-sm-auto">
                                <div className="rounded-circle text-white d-flex align-items-center justify-content-center fw-bold shadow-sm border border-2 border-white" 
                                  style={{ 
                                    width: "50px", 
                                    height: "50px", 
                                    background: orgStyle.gradient,
                                    boxShadow: `0 4px 10px rgba(0, 0, 0, 0.08)`
                                  }}
                                >
                                  {st.name.substring(0, 2).toUpperCase()}
                                </div>
                                <div>
                                  <span className="fw-bold text-dark d-block" style={{ fontSize: "1.05rem" }}>{st.name}</span>
                                  <div className="d-flex flex-wrap gap-2 align-items-center mt-1">
                                    <span className="text-secondary small">NIM: <code className="text-dark fw-bold">{st.nim}</code></span>
                                    <span className="badge bg-light text-secondary border rounded-pill px-2.5 py-0.5" style={{ fontSize: "0.72rem" }}>Mahasiswa Aktif</span>
                                  </div>
                                </div>
                              </div>
                              <Button 
                                onClick={() => handleAssignLeader(st.id, st.name)}
                                className="text-white fw-bold rounded-pill shadow-sm px-4 py-2 border-0 hover-lift d-inline-flex align-items-center gap-1.5"
                                style={{ background: orgStyle.gradient }}
                              >
                                <i className="bi bi-award-fill"></i>
                                <span>Lantik Sebagai Ketua</span>
                              </Button>
                            </div>
                          ))}
                        </div>
                      </div>
                    );
                  })()}
                  {leaderActivityId && students.length === 0 && searchStudent.length >= 3 && (
                    <div className="text-center p-4 bg-white rounded-4 border shadow-sm mt-3">
                      <i className="bi bi-person-x fs-1 text-secondary opacity-50 d-block mb-2"></i>
                      <span className="text-muted fw-bold">Mahasiswa tidak ditemukan. Periksa kembali ejaan nama atau NIM.</span>
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
            <div className="card border-0 rounded-4 shadow-lg overflow-hidden mb-4" 
              style={{ 
                background: "linear-gradient(135deg, #0f172a 0%, #1e293b 100%)",
                boxShadow: "0 10px 25px -5px rgba(0, 0, 0, 0.15), 0 8px 10px -6px rgba(0, 0, 0, 0.15)"
              }}
            >
              <div className="card-body p-4 p-md-5 text-center text-white position-relative overflow-hidden">
                {/* Decorative background circle */}
                <div className="position-absolute rounded-circle bg-primary opacity-10" style={{ width: "300px", height: "300px", top: "-150px", right: "-150px" }}></div>
                <div className="position-absolute rounded-circle bg-info opacity-5" style={{ width: "200px", height: "200px", bottom: "-100px", left: "-100px" }}></div>
                
                <div className="bg-primary bg-opacity-20 text-info rounded-circle d-flex align-items-center justify-content-center mx-auto mb-4 shadow border border-info border-opacity-10" style={{ width: "80px", height: "80px", backdropFilter: "blur(4px)" }}>
                  <i className="bi bi-file-earmark-bar-graph-fill fs-1 text-info"></i>
                </div>
                <h2 className="fw-extrabold text-white mb-2">Laporan ORMAWA</h2>
                <p className="text-white-50 mb-0 mx-auto" style={{ maxWidth: "650px", fontSize: "0.95rem" }}>
                  Unduh rekap keanggotaan dan kegiatan mahasiswa untuk kebutuhan administrasi, akreditasi, atau SKPI.
                </p>
              </div>
            </div>

            {/* Report Type Selector */}
            <div className="card border-0 rounded-4 shadow-sm bg-white mb-4 border border-light-subtle">
              <div className="card-body p-4">
                <label className="form-label fw-bold text-dark small text-uppercase mb-3 d-flex align-items-center gap-2">
                  <span className="bg-primary bg-opacity-10 text-primary rounded-circle d-flex align-items-center justify-content-center" style={{ width: "24px", height: "24px" }}>
                    <i className="bi bi-collection-fill" style={{ fontSize: "0.8rem" }}></i>
                  </span>
                  <span>Pilih Tipe Laporan</span>
                </label>
                <div className="row g-3">
                  {/* ALL DATA */}
                  <div className="col-md-4">
                    <button
                      type="button"
                      onClick={() => setReportType("all")}
                      className={`w-100 h-100 rounded-4 p-4 border-2 text-start position-relative d-flex flex-column align-items-start gap-3 btn btn-link text-decoration-none transition-all ${
                        reportType === "all" 
                          ? "bg-white card-selected-glow-dark text-dark" 
                          : "bg-light bg-opacity-50 border-light text-secondary hover-lift"
                      }`}
                      style={{ transition: "all 0.2s" }}
                    >
                      {reportType === "all" && (
                        <div className="position-absolute top-0 end-0 m-3 text-dark animate-bounce">
                          <i className="bi bi-check-circle-fill fs-5"></i>
                        </div>
                      )}
                      <div className={`rounded-circle d-flex align-items-center justify-content-center shadow-sm ${
                        reportType === "all" ? "bg-dark text-white" : "bg-white text-dark"
                      }`} style={{ width: "50px", height: "50px" }}>
                        <i className="bi bi-stack fs-4"></i>
                      </div>
                      <div>
                        <span className="fw-bold d-block text-dark fs-5">Semua Data</span>
                        <small className="text-muted d-block mt-1 lh-sm" style={{ fontSize: "0.8rem" }}>Gabungan data pendaftaran ORMAWA dan riwayat keikutsertaan kegiatan mahasiswa.</small>
                      </div>
                    </button>
                  </div>
 
                  {/* MEMBERSHIP */}
                  <div className="col-md-4">
                    <button
                      type="button"
                      onClick={() => setReportType("membership")}
                      className={`w-100 h-100 rounded-4 p-4 border-2 text-start position-relative d-flex flex-column align-items-start gap-3 btn btn-link text-decoration-none transition-all ${
                        reportType === "membership" 
                          ? "bg-white card-selected-glow-primary text-dark" 
                          : "bg-light bg-opacity-50 border-light text-secondary hover-lift"
                      }`}
                      style={{ transition: "all 0.2s" }}
                    >
                      {reportType === "membership" && (
                        <div className="position-absolute top-0 end-0 m-3 text-primary animate-bounce">
                          <i className="bi bi-check-circle-fill fs-5"></i>
                        </div>
                      )}
                      <div className={`rounded-circle d-flex align-items-center justify-content-center shadow-sm ${
                        reportType === "membership" ? "bg-primary text-white" : "bg-white text-primary"
                      }`} style={{ width: "50px", height: "50px" }}>
                        <i className="bi bi-people-fill fs-4"></i>
                      </div>
                      <div>
                        <span className="fw-bold d-block text-dark fs-5">Keanggotaan ORMAWA</span>
                        <small className="text-muted d-block mt-1 lh-sm" style={{ fontSize: "0.8rem" }}>Daftar mahasiswa terdaftar di organisasi, jabatan, serta tanggal mereka bergabung.</small>
                      </div>
                    </button>
                  </div>
 
                  {/* EVENTS */}
                  <div className="col-md-4">
                    <button
                      type="button"
                      onClick={() => setReportType("events")}
                      className={`w-100 h-100 rounded-4 p-4 border-2 text-start position-relative d-flex flex-column align-items-start gap-3 btn btn-link text-decoration-none transition-all ${
                        reportType === "events" 
                          ? "bg-white card-selected-glow-info text-dark" 
                          : "bg-light bg-opacity-50 border-light text-secondary hover-lift"
                      }`}
                      style={{ transition: "all 0.2s" }}
                    >
                      {reportType === "events" && (
                        <div className="position-absolute top-0 end-0 m-3 text-info animate-bounce">
                          <i className="bi bi-check-circle-fill fs-5"></i>
                        </div>
                      )}
                      <div className={`rounded-circle d-flex align-items-center justify-content-center shadow-sm ${
                        reportType === "events" ? "bg-info text-white" : "bg-white text-info"
                      }`} style={{ width: "50px", height: "50px" }}>
                        <i className="bi bi-calendar-event-fill fs-4"></i>
                      </div>
                      <div>
                        <span className="fw-bold d-block text-dark fs-5">Kegiatan</span>
                        <small className="text-muted d-block mt-1 lh-sm" style={{ fontSize: "0.8rem" }}>Riwayat pendaftaran kegiatan, kategori program kerja, dan status keikutsertaan mahasiswa.</small>
                      </div>
                    </button>
                  </div>
                </div>
              </div>
            </div>

            <div className="row g-4">
              {/* Left Column: Date Range Filter */}
              <div className="col-lg-6">
                <div className="card border-0 rounded-4 shadow-sm bg-white h-100 border border-light-subtle">
                  <div className="card-header bg-white border-bottom py-3 px-4 d-flex align-items-center gap-2">
                    <div className="bg-primary bg-opacity-10 text-primary rounded-circle d-flex align-items-center justify-content-center" style={{ width: "38px", height: "38px" }}>
                      <i className="bi bi-calendar2-range-fill fs-6 text-primary"></i>
                    </div>
                    <div>
                      <h6 className="fw-bold text-dark mb-0">Filter Rentang Tanggal</h6>
                      <small className="text-muted">Batasi periode data yang diekspor</small>
                    </div>
                  </div>
                  <div className="card-body p-4">
                    {/* Quick Preset Buttons */}
                    <label className="form-label fw-bold text-secondary small text-uppercase mb-2">
                      <i className="bi bi-lightning-charge-fill text-warning me-1"></i> Pilihan Cepat (Preset)
                    </label>
                    <div className="d-flex flex-wrap gap-2 mb-4">
                      <button 
                        type="button"
                        onClick={() => applyDatePreset("this_month")} 
                        className={`btn btn-sm rounded-pill px-3 py-1.5 fw-semibold border ${
                          exportStartDate === new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().split("T")[0]
                            ? "btn-dark text-white border-dark" 
                            : "btn-outline-secondary border-opacity-25"
                        }`}
                      >
                        <i className="bi bi-calendar-month me-1"></i> Bulan Ini
                      </button>
                      <button 
                        type="button"
                        onClick={() => applyDatePreset("last_month")} 
                        className="btn btn-sm btn-outline-secondary rounded-pill px-3 py-1.5 fw-semibold border border-opacity-25"
                      >
                        <i className="bi bi-calendar-minus me-1"></i> Bulan Lalu
                      </button>
                      <button 
                        type="button"
                        onClick={() => applyDatePreset("this_semester")} 
                        className="btn btn-sm btn-outline-secondary rounded-pill px-3 py-1.5 fw-semibold border border-opacity-25"
                      >
                        <i className="bi bi-mortarboard me-1"></i> Semester Ini
                      </button>
                      <button 
                        type="button"
                        onClick={() => applyDatePreset("this_year")} 
                        className="btn btn-sm btn-outline-secondary rounded-pill px-3 py-1.5 fw-semibold border border-opacity-25"
                      >
                        <i className="bi bi-calendar-check me-1"></i> Tahun Ini
                      </button>
                      <button 
                        type="button"
                        onClick={() => applyDatePreset("all")} 
                        className={`btn btn-sm rounded-pill px-3 py-1.5 fw-semibold border ${
                          !exportStartDate && !exportEndDate
                            ? "btn-dark text-white border-dark" 
                            : "btn-outline-secondary border-opacity-25"
                        }`}
                      >
                        <i className="bi bi-infinity me-1"></i> Semua Periode
                      </button>
                    </div>
                    
                    {/* Manual Date Range Inputs */}
                    <div className="row g-3">
                      <div className="col-6">
                        <label className="form-label fw-semibold text-secondary small">
                          <i className="bi bi-calendar-event me-1 text-primary"></i> Mulai Tanggal
                        </label>
                        <input 
                          type="date" 
                          value={exportStartDate}
                          onChange={(e) => setExportStartDate(e.target.value)}
                          className="form-control curator-input py-2 fw-semibold px-3 shadow-sm"
                          style={{ fontSize: "0.95rem" }}
                          max={exportEndDate || undefined}
                        />
                      </div>
                      <div className="col-6">
                        <label className="form-label fw-semibold text-secondary small">
                          <i className="bi bi-calendar-x me-1 text-danger"></i> Sampai Tanggal
                        </label>
                        <input 
                          type="date" 
                          value={exportEndDate}
                          onChange={(e) => setExportEndDate(e.target.value)}
                          className="form-control curator-input py-2 fw-semibold px-3 shadow-sm"
                          style={{ fontSize: "0.95rem" }}
                          min={exportStartDate || undefined}
                        />
                      </div>
                    </div>

                    {/* Clear Filter */}
                    {(exportStartDate || exportEndDate) && (
                      <div className="mt-3 text-end">
                        <button 
                          type="button"
                          onClick={() => { setExportStartDate(""); setExportEndDate(""); }}
                          className="btn btn-sm btn-link text-danger text-decoration-none p-0 fw-bold"
                        >
                          <i className="bi bi-x-circle me-1"></i> Reset Filter Tanggal
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Right Column: Export Summary & Action */}
              <div className="col-lg-6">
                <div className="card border-0 rounded-4 shadow-sm bg-white h-100 border border-light-subtle">
                  <div className="card-header bg-white border-bottom py-3 px-4 d-flex align-items-center gap-2">
                    <div className="bg-success bg-opacity-10 text-success rounded-circle d-flex align-items-center justify-content-center" style={{ width: "38px", height: "38px" }}>
                      <i className="bi bi-file-earmark-spreadsheet-fill fs-6 text-success"></i>
                    </div>
                    <div>
                      <h6 className="fw-bold text-dark mb-0">Ringkasan Ekspor</h6>
                      <small className="text-muted">Konfigurasi berkas laporan saat ini</small>
                    </div>
                  </div>
                  <div className="card-body p-4 d-flex flex-column justify-content-between">
                    <div>
                      <div className="bg-light bg-opacity-40 rounded-4 p-4 mb-4 border border-light-subtle">
                        <div className="d-flex align-items-center gap-2 mb-3">
                          <div className="bg-primary bg-opacity-10 text-primary rounded-circle d-flex align-items-center justify-content-center" style={{ width: "24px", height: "24px" }}>
                            <i className="bi bi-info-circle-fill" style={{ fontSize: "0.85rem" }}></i>
                          </div>
                          <span className="fw-bold text-dark small">Konfigurasi Berkas Ekspor</span>
                        </div>
                        
                        <div className="d-flex flex-column gap-3">
                          {/* Item 1: Tipe Laporan */}
                          <div className="d-flex align-items-center justify-content-between pb-2 border-bottom border-light">
                            <span className="text-muted small">Tipe Data</span>
                            <span className={`badge fw-bold px-3 py-1.5 d-inline-flex align-items-center gap-1.5 rounded-pill ${
                              reportType === "all" ? "bg-dark text-white" :
                              reportType === "membership" ? "bg-primary text-white" : "bg-info text-white"
                            }`}>
                              <i className={`bi ${
                                reportType === "all" ? "bi-stack" :
                                reportType === "membership" ? "bi-people-fill" : "bi-calendar-event-fill"
                              }`}></i>
                              {reportType === "all" ? "Semua Data" : 
                               reportType === "membership" ? "Keanggotaan" : "Kegiatan"}
                            </span>
                          </div>

                          {/* Item 2: Format File */}
                          <div className="d-flex align-items-center justify-content-between pb-2 border-bottom border-light">
                            <span className="text-muted small">Format Output</span>
                            <span className="badge bg-success bg-opacity-10 text-success border border-success border-opacity-25 fw-bold px-3 py-1.5 rounded-pill d-inline-flex align-items-center gap-1.5">
                              <i className="bi bi-filetype-csv"></i> CSV (Microsoft Excel)
                            </span>
                          </div>

                          {/* Item 3: Periode Data */}
                          <div className="d-flex align-items-center justify-content-between pb-2 border-bottom border-light">
                            <span className="text-muted small">Rentang Waktu</span>
                            <span className="fw-bold text-dark small d-inline-flex align-items-center gap-1.5">
                              {exportStartDate || exportEndDate ? (
                                <>
                                  <i className="bi bi-calendar2-range text-primary"></i>
                                  <span>
                                    {exportStartDate ? new Date(exportStartDate).toLocaleDateString("id-ID", { day: "2-digit", month: "short", year: "numeric" }) : "Awal"}
                                    {" — "}
                                    {exportEndDate ? new Date(exportEndDate).toLocaleDateString("id-ID", { day: "2-digit", month: "short", year: "numeric" }) : "Sekarang"}
                                  </span>
                                </>
                              ) : (
                                <>
                                  <i className="bi bi-infinity text-muted"></i>
                                  <span>Seluruh Periode</span>
                                </>
                              )}
                            </span>
                          </div>

                          {/* Item 4: Kolom Data */}
                          <div className="d-flex align-items-start justify-content-between">
                            <span className="text-muted small">Kolom Ekspor</span>
                            <span className="fw-semibold text-dark small text-end" style={{ maxWidth: "65%", fontSize: "0.85rem" }}>
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
                    
                    {/* Download Button */}
                    <div className="text-center mt-2">
                      <Button 
                        variant="success"
                        onClick={handleExportCSV}
                        disabled={loading}
                        className={`px-5 py-3 rounded-pill fw-bold shadow fs-5 text-white w-100 hover-lift d-flex align-items-center justify-content-center gap-2 ${loading ? 'shimmer-effect' : ''}`}
                        style={{ 
                          background: loading ? "none" : "linear-gradient(135deg, #10b981 0%, #059669 100%)", 
                          border: "none",
                          boxShadow: "0 4px 14px 0 rgba(16, 185, 129, 0.4)" 
                        }}
                      >
                        {loading ? (
                          <>
                            <span className="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span>
                            <span>Memproses Data Laporan...</span>
                          </>
                        ) : (
                          <>
                            <i className="bi bi-download fs-4"></i>
                            <span>Unduh Laporan</span>
                          </>
                        )}
                      </Button>
                      <div className="text-muted small mt-3 d-flex align-items-center justify-content-center gap-1">
                        <i className="bi bi-shield-fill-check text-success"></i>
                        <span>Data diambil dari sistem ORMAWA.</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Footer Hint */}
            <div className="text-center mt-4 mb-5">
              <div className="bg-white rounded-4 shadow-sm border p-3 d-inline-block border-light-subtle">
                <i className="bi bi-lightbulb-fill text-warning me-2"></i>
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
            {editId ? 'Edit Data ORMAWA' : 'Tambah Data ORMAWA'}
          </Modal.Title>
        </Modal.Header>
        <Modal.Body className="bg-light p-4 rounded-bottom-4">
          <Form onSubmit={handleSubmit(onSubmit)}>
            <div className="d-flex flex-column gap-3">
              
              {/* Seksi 1: Informasi Utama */}
              <div className="bg-white p-3.5 rounded-4 shadow-sm border border-light-subtle">
                <h6 className="fw-bold text-dark border-bottom pb-2 mb-3.5 d-flex align-items-center gap-2">
                  <i className="bi bi-info-circle-fill text-primary"></i> 1. Informasi Utama ORMAWA
                </h6>
                <div className="row g-3">
                  {/* Name */}
                  <div className="col-md-6">
                    <Form.Group>
                      <Form.Label className="small fw-semibold text-secondary">Nama Organisasi/ORMAWA <span className="text-danger">*</span></Form.Label>
                      <Form.Control
                        type="text"
                        placeholder="Contoh: BEM Fakultas Teknik / Himpunan Elektro"
                        className={`curator-input py-2.5 fw-semibold ${errors.name ? 'is-invalid' : ''}`}
                        {...register("name")}
                      />
                      {errors.name && <div className="invalid-feedback">{errors.name.message}</div>}
                    </Form.Group>
                  </div>
                  {/* Category */}
                  <div className="col-md-6">
                    <Form.Group>
                      <Form.Label className="small fw-semibold text-secondary">Kategori Utama <span className="text-danger">*</span></Form.Label>
                      <Form.Control
                        type="text"
                        placeholder="Seni, olahraga, kepemimpinan..."
                        className={`curator-input py-2.5 fw-semibold ${errors.category ? 'is-invalid' : ''}`}
                        {...register("category")}
                      />
                      {errors.category && <div className="invalid-feedback">{errors.category.message}</div>}
                    </Form.Group>
                  </div>
                  {/* Description */}
                  <div className="col-12">
                    <Form.Group>
                      <Form.Label className="small fw-semibold text-secondary">Deskripsi dan Syarat Pendaftaran <span className="text-danger">*</span></Form.Label>
                      <Form.Control
                        as="textarea"
                        rows={3}
                        placeholder="Tuliskan profil singkat, ruang lingkup, dan syarat pendaftaran anggota."
                        className="curator-input py-2.5 fw-semibold"
                        {...register("description")}
                      />
                    </Form.Group>
                  </div>
                </div>
              </div>

              {/* Seksi 2: Struktur & Hierarki */}
              <div className="bg-white p-3.5 rounded-4 shadow-sm border border-light-subtle">
                <h6 className="fw-bold text-dark border-bottom pb-2 mb-3.5 d-flex align-items-center gap-2">
                  <i className="bi bi-diagram-3-fill text-primary"></i> 2. Struktur & Hierarki ORMAWA
                </h6>
                <div className="row g-3">
                  {/* Type */}
                  <div className="col-md-4">
                    <Form.Group>
                      <Form.Label className="small fw-semibold text-secondary">Tipe Organisasi <span className="text-danger">*</span></Form.Label>
                      <Form.Select className="curator-input py-2.5 fw-semibold" {...register("orgType")}>
                        <option value="UKM">Unit Kegiatan Mahasiswa (UKM)</option>
                        <option value="BEM Universitas">BEM Universitas</option>
                        <option value="BEM Fakultas">BEM Fakultas</option>
                        <option value="BPM">BPM</option>
                        <option value="Himpunan Mahasiswa">Himpunan Mahasiswa</option>
                      </Form.Select>
                    </Form.Group>
                  </div>
                  {/* Level */}
                  <div className="col-md-4">
                    <Form.Group>
                      <Form.Label className="small fw-semibold text-secondary">Tingkat Hierarki <span className="text-danger">*</span></Form.Label>
                      <Form.Select 
                        className="curator-input py-2.5 fw-semibold" 
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
                  <div className="col-md-4">
                    <Form.Group>
                      {scopeOptionsMap[watchedLevel] ? (
                        <>
                          <Form.Label className="small fw-semibold text-secondary">Nama Cakupan <span className="text-danger">*</span></Form.Label>
                          <Form.Select className="curator-input py-2.5 fw-semibold" {...register("scopeName")}>
                            <option value="">-- Pilih Spesifik --</option>
                            {scopeOptionsMap[watchedLevel].map(opt => (
                              <option key={opt} value={opt}>{opt}</option>
                            ))}
                          </Form.Select>
                        </>
                      ) : (
                        <>
                          <Form.Label className="small fw-semibold text-secondary text-muted">Nama Cakupan</Form.Label>
                          <Form.Control
                            type="text"
                            placeholder="Tidak butuh cakupan"
                            disabled
                            className="curator-input py-2.5 bg-light fw-semibold"
                            value=""
                          />
                        </>
                      )}
                    </Form.Group>
                  </div>
                </div>
              </div>

              {/* Seksi 3: Pengaturan Pendaftaran & Media */}
              <div className="bg-white p-3.5 rounded-4 shadow-sm border border-light-subtle">
                <h6 className="fw-bold text-dark border-bottom pb-2 mb-3.5 d-flex align-items-center gap-2">
                  <i className="bi bi-gear-fill text-primary"></i> 3. Registrasi & Media Informasi
                </h6>
                <div className="row g-3">
                  {/* Quota */}
                  <div className="col-md-3">
                    <Form.Group>
                      <Form.Label className="small fw-semibold text-secondary">Batas Kuota <span className="text-danger">*</span></Form.Label>
                      <Form.Control
                        type="number"
                        placeholder="Contoh: 30"
                        className={`curator-input py-2.5 fw-semibold ${errors.quota ? 'is-invalid' : ''}`}
                        {...register("quota")}
                      />
                      {errors.quota && <div className="invalid-feedback">{errors.quota.message}</div>}
                    </Form.Group>
                  </div>
                  {/* Start Date */}
                  <div className="col-md-3">
                    <Form.Group>
                      <Form.Label className="small fw-semibold text-secondary">Mulai Pendaftaran</Form.Label>
                      <Form.Control
                        type="date"
                        className="curator-input py-2.5 fw-semibold"
                        {...register("registrationStart")}
                      />
                    </Form.Group>
                  </div>
                  {/* End Date */}
                  <div className="col-md-3">
                    <Form.Group>
                      <Form.Label className="small fw-semibold text-secondary">Batas Akhir</Form.Label>
                      <Form.Control
                        type="date"
                        className="curator-input py-2.5 fw-semibold"
                        {...register("registrationEnd")}
                      />
                    </Form.Group>
                  </div>
                  {/* Status */}
                  <div className="col-md-3">
                    <Form.Group>
                      <Form.Label className="small fw-semibold text-secondary">Status Pendaftaran</Form.Label>
                      <Form.Select className="curator-input py-2.5 fw-semibold" {...register("status")}>
                        <option value="open">Buka Pendaftaran</option>
                        <option value="closed">Paksa Tutup</option>
                      </Form.Select>
                    </Form.Group>
                  </div>
                  {/* WhatsApp Link */}
                  <div className="col-md-6">
                    <Form.Group>
                      <Form.Label className="small fw-semibold text-secondary">WhatsApp Group Link</Form.Label>
                      <Form.Control
                        type="text"
                        placeholder="https://chat.whatsapp.com/..."
                        className="curator-input py-2.5 fw-semibold"
                        {...register("whatsappLink")}
                      />
                    </Form.Group>
                  </div>
                  {/* Image URL */}
                  <div className="col-md-6">
                    <Form.Group>
                      <Form.Label className="small fw-semibold text-secondary">Logo atau Poster ORMAWA</Form.Label>
                      <Form.Control
                        type="text"
                        placeholder="https://domain.com/gambar.png"
                        className="curator-input py-2.5 fw-semibold"
                        {...register("imageUrl")}
                      />
                    </Form.Group>
                  </div>
                </div>
              </div>

            </div>

            <div className="d-flex justify-content-end gap-2 mt-4 pt-3 border-top">
              <Button variant="outline-secondary" className="px-4 rounded-pill fw-bold" onClick={() => setShowModal(false)} disabled={loading}>
                Batal
              </Button>
              <Button variant="primary" type="submit" className="px-5 rounded-pill fw-bold text-white" disabled={loading}>
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
            <strong>Peringatan:</strong> Semua data keanggotaan, kegiatan, pengumuman, dan prestasi yang terkait dengan ORMAWA ini juga akan ikut terhapus secara permanen.
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

      {/* GLOBAL CUSTOM CONFIRMATION MODAL */}
      <Modal show={confirmModal.show} onHide={() => setConfirmModal(prev => ({ ...prev, show: false }))} centered>
        <Modal.Header closeButton className={`border-0 bg-${confirmModal.variant} text-white rounded-top-4 pb-0`}>
          <Modal.Title className="fw-bold fs-5 text-white py-2">
            <i className="bi bi-question-circle-fill me-2"></i>
            {confirmModal.title}
          </Modal.Title>
        </Modal.Header>
        <Modal.Body className="p-4 text-center">
          <div className={`bg-${confirmModal.variant} bg-opacity-10 text-${confirmModal.variant} rounded-circle d-flex align-items-center justify-content-center mx-auto mb-3`} style={{ width: "70px", height: "70px" }}>
            <i className={`bi ${confirmModal.variant === 'danger' ? 'bi-trash3-fill' : confirmModal.variant === 'warning' ? 'bi-exclamation-triangle-fill' : confirmModal.variant === 'success' ? 'bi-patch-check-fill' : 'bi-info-circle-fill'} fs-1`}></i>
          </div>
          <h5 className="fw-bold text-dark mb-2">{confirmModal.title}</h5>
          <p className="text-secondary mb-0">{confirmModal.message}</p>
        </Modal.Body>
        <Modal.Footer className="border-0 d-flex justify-content-center gap-2 pb-4">
          <Button 
            variant="outline-secondary" 
            className="px-4 rounded-pill fw-bold"
            onClick={() => setConfirmModal(prev => ({ ...prev, show: false }))}
          >
            <i className="bi bi-x-lg me-1"></i> Batal
          </Button>
          <Button 
            variant={confirmModal.variant} 
            className="px-4 rounded-pill fw-bold text-white"
            onClick={confirmModal.onConfirm}
          >
            <i className="bi bi-check-lg me-1"></i> Ya, Lanjutkan
          </Button>
        </Modal.Footer>
      </Modal>

    </div>
  );
}
