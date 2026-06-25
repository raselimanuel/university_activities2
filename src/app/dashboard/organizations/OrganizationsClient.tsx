'use client'

import { useState, useMemo } from "react";
import Link from "next/link";
import { getFacultyStyle } from "@/utils/faculty";
import PremiumIcon from "@/components/PremiumIcon";

interface Organization {
  id: number;
  name: string;
  description: string | null;
  orgType: "BEM Universitas" | "BEM Fakultas" | "BPM" | "Himpunan Mahasiswa" | "UKM";
  organizationLevel: string;
  scopeName: string | null;
  status: "open" | "closed";
}

interface OrganizationsClientProps {
  initialOrganizations: Organization[];
}

export default function OrganizationsClient({ initialOrganizations }: OrganizationsClientProps) {
  const [filter, setFilter] = useState<"All" | "Lembaga" | "Himpunan" | "UKM">("All");

  const filteredData = useMemo(() => {
    return initialOrganizations.filter((org) => {
      if (filter === "All") return true;
      if (filter === "Lembaga") {
        return org.orgType === "BEM Universitas" || org.orgType === "BEM Fakultas" || org.orgType === "BPM";
      }
      if (filter === "Himpunan") {
        return org.orgType === "Himpunan Mahasiswa";
      }
      if (filter === "UKM") {
        return org.orgType === "UKM";
      }
      return true;
    });
  }, [filter, initialOrganizations]);

  return (
    <div className="container-fluid p-0">
      
      <div className="d-flex flex-wrap justify-content-between align-items-center mb-4 gap-3">
        <div>
          <h4 className="fw-extrabold text-dark mb-1">Organisasi Mahasiswa</h4>
          <p className="text-secondary small mb-0 fw-medium">Temukan BEM, BPM, himpunan, dan UKM aktif di lingkungan UNSRAT.</p>
        </div>
        
        {/* Filter Buttons - Premium Pill Navigation */}
        <div className="bg-light p-1 rounded-pill shadow-sm d-flex gap-1 border">
          {(["All", "Lembaga", "Himpunan", "UKM"] as const).map((type) => (
            <button
              key={type}
              className={`btn btn-sm rounded-pill px-4 py-2 border-0 fw-bold ${filter === type ? 'btn-primary text-white shadow-sm' : 'text-secondary hover-bg-light'}`}
              onClick={() => setFilter(type)}
              style={{ transition: "all 0.2s" }}
            >
              {type === "All" ? "Semua" : type}
            </button>
          ))}
        </div>
      </div>

      <div className="row g-4">
        {filteredData.map((org) => {
          const orgStyle = getFacultyStyle(org.scopeName || org.name);
          
          // Resolve icon based on organization category / department
          let icon = orgStyle.icon;
          const nameLower = org.name.toLowerCase();
          if (org.orgType === "BEM Universitas") {
            icon = "bi-diagram-3-fill";
          } else if (org.orgType === "BEM Fakultas") {
            icon = "bi-grid-fill";
          } else if (org.orgType === "BPM") {
            icon = "bi-bank2";
          } else if (org.orgType === "Himpunan Mahasiswa") {
            if (nameLower.includes("elektro") || nameLower.includes("hmte") || nameLower.includes("hme")) {
              icon = "bi-cpu-fill";
            } else if (nameLower.includes("sipil") || nameLower.includes("hmts") || nameLower.includes("hms")) {
              icon = "bi-cone-striped";
            } else if (nameLower.includes("mesin") || nameLower.includes("hmtm") || nameLower.includes("hmm")) {
              icon = "bi-gear-wide-connected";
            } else if (nameLower.includes("arsitektur") || nameLower.includes("hmta") || nameLower.includes("hma")) {
              icon = "bi-brush-fill";
            } else if (nameLower.includes("informatika") || nameLower.includes("hmti")) {
              icon = "bi-laptop";
            }
          }

          return (
            <div key={org.id} className="col-12 col-md-6 col-lg-4">
              <Link href={`/dashboard/organizations/${org.id}`} className="text-decoration-none text-dark d-block h-100">
                <div className="card border-0 rounded-4 h-100 overflow-hidden card-glass-premium">
                  
                  {/* Header Gradient based on Faculty */}
                  <div className="p-3 text-white d-flex align-items-center justify-content-between" style={{ background: orgStyle.gradient }}>
                    <span className="badge bg-white bg-opacity-20 text-white border border-white border-opacity-20 px-2.5 py-1 fw-bold text-uppercase small" style={{ fontSize: '0.65rem' }}>
                      Lingkup {org.organizationLevel}
                    </span>
                    <PremiumIcon 
                      icon={icon}
                      primaryColor="#ffffff"
                      lightBgColor="rgba(255, 255, 255, 0.18)"
                      size={36}
                    />
                  </div>

                  <div className="card-body p-4 d-flex flex-column h-100">
                    <div className="mb-3 d-flex justify-content-between align-items-center">
                      <span className="badge bg-light text-secondary border px-2 py-1 small">{org.orgType}</span>
                      {org.status === "open" ? (
                        <span className="badge bg-success bg-opacity-10 text-success border border-success-subtle small px-2 py-1 fw-bold">Buka Anggota</span>
                      ) : (
                        <span className="badge bg-secondary bg-opacity-10 text-secondary border border-secondary-subtle small px-2 py-1 fw-bold">Tutup Anggota</span>
                      )}
                    </div>
                    
                    <h5 className="fw-extrabold text-dark mb-2" style={{ fontSize: '1.1rem' }}>{org.name}</h5>
                    <p className="text-secondary small flex-grow-1 mb-0 text-truncate-3" style={{ lineHeight: 1.5 }}>
                      {org.description || "Profil organisasi belum dilengkapi."}
                    </p>
                    
                    <div className="mt-4 pt-3 border-top border-light d-flex justify-content-between align-items-center">
                      <span className="text-muted small fw-medium">{org.scopeName || "Cakupan Universitas"}</span>
                      <span className="small fw-bold animate-arrow" style={{ color: orgStyle.primary }}>
                        Buka Profil <i className="bi bi-arrow-right-short align-middle fs-5"></i>
                      </span>
                    </div>
                  </div>
                </div>
              </Link>
            </div>
          );
        })}
        {filteredData.length === 0 && (
          <div className="col-12 text-center py-5">
            <i className="bi bi-diagram-3 display-4 text-secondary opacity-50 mb-3"></i>
            <p className="text-secondary">Belum ada organisasi pada kategori ini.</p>
          </div>
        )}
      </div>

    </div>
  );
}
