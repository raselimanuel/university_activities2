export interface FacultyStyle {
  name: string;
  primary: string;
  secondary: string;
  lightBg: string;
  borderSubtle: string;
  gradient: string;
  icon: string;
  textColor: string;
}

const fkStyle: FacultyStyle = {
  name: "Fakultas Kedokteran",
  primary: "#1b4d3e", // Dark Green
  secondary: "#2d6a4f",
  lightBg: "#e8f5e9", // Mint light
  borderSubtle: "#c8e6c9",
  gradient: "linear-gradient(135deg, #1b4d3e 0%, #2d6a4f 100%)",
  icon: "bi-heart-pulse-fill",
  textColor: "#ffffff",
};

const ftStyle: FacultyStyle = {
  name: "Fakultas Teknik",
  primary: "#0b3c5d", // Dark Blue
  secondary: "#1d5f8a",
  lightBg: "#e3f2fd", // Ice blue
  borderSubtle: "#bbdefb",
  gradient: "linear-gradient(135deg, #0b3c5d 0%, #1d5f8a 100%)",
  icon: "bi-cpu-fill",
  textColor: "#ffffff",
};

const fapertaStyle: FacultyStyle = {
  name: "Fakultas Pertanian",
  primary: "#2e7d32", // Forest Green
  secondary: "#4caf50",
  lightBg: "#f1f8e9",
  borderSubtle: "#dcedc8",
  gradient: "linear-gradient(135deg, #2e7d32 0%, #4caf50 100%)",
  icon: "bi-tree-fill",
  textColor: "#ffffff",
};

const fapetStyle: FacultyStyle = {
  name: "Fakultas Peternakan",
  primary: "#6d4c41", // Brown
  secondary: "#8d6e63",
  lightBg: "#efebe9",
  borderSubtle: "#d7ccc8",
  gradient: "linear-gradient(135deg, #6d4c41 0%, #8d6e63 100%)",
  icon: "bi-heart-fill",
  textColor: "#ffffff",
};

const fpikStyle: FacultyStyle = {
  name: "Fakultas Perikanan dan Ilmu Kelautan",
  primary: "#0288d1", // Ocean Blue
  secondary: "#03a9f4",
  lightBg: "#e0f7fa",
  borderSubtle: "#b2ebf2",
  gradient: "linear-gradient(135deg, #0288d1 0%, #03a9f4 100%)",
  icon: "bi-water",
  textColor: "#ffffff",
};

const febStyle: FacultyStyle = {
  name: "Fakultas Ekonomi dan Bisnis",
  primary: "#546e7a", // Charcoal/Kelabu
  secondary: "#78909c",
  lightBg: "#eceff1",
  borderSubtle: "#cfd8dc",
  gradient: "linear-gradient(135deg, #546e7a 0%, #78909c 100%)",
  icon: "bi-graph-up-arrow",
  textColor: "#ffffff",
};

const fhStyle: FacultyStyle = {
  name: "Fakultas Hukum",
  primary: "#b71c1c", // Crimson Red
  secondary: "#d32f2f",
  lightBg: "#ffebee",
  borderSubtle: "#ffcdd2",
  gradient: "linear-gradient(135deg, #b71c1c 0%, #d32f2f 100%)",
  icon: "bi-scale",
  textColor: "#ffffff",
};

const fisipStyle: FacultyStyle = {
  name: "Fakultas Ilmu Sosial dan Ilmu Politik",
  primary: "#e65100", // Orange
  secondary: "#f57c00",
  lightBg: "#fff3e0",
  borderSubtle: "#ffe0b2",
  gradient: "linear-gradient(135deg, #e65100 0%, #f57c00 100%)",
  icon: "bi-people-fill",
  textColor: "#ffffff",
};

const fibStyle: FacultyStyle = {
  name: "Fakultas Ilmu Budaya",
  primary: "#6a1b9a", // Lavender/Light Purple
  secondary: "#8e24aa",
  lightBg: "#f3e5f5",
  borderSubtle: "#e1bee7",
  gradient: "linear-gradient(135deg, #6a1b9a 0%, #8e24aa 100%)",
  icon: "bi-palette-fill",
  textColor: "#ffffff",
};

const fmipaStyle: FacultyStyle = {
  name: "Fakultas Matematika dan Ilmu Pengetahuan Alam",
  primary: "#37474f", // Pearl Silver-slate (for high visibility)
  secondary: "#455a64",
  lightBg: "#f8f9fa",
  borderSubtle: "#e9ecef",
  gradient: "linear-gradient(135deg, #455a64 0%, #78909c 100%)",
  icon: "bi-lightbulb-fill",
  textColor: "#ffffff",
};

const fkmStyle: FacultyStyle = {
  name: "Fakultas Kesehatan Masyarakat",
  primary: "#4a148c", // Dark Purple
  secondary: "#6a1b9a",
  lightBg: "#f3e5f5",
  borderSubtle: "#e1bee7",
  gradient: "linear-gradient(135deg, #4a148c 0%, #6a1b9a 100%)",
  icon: "bi-shield-plus",
  textColor: "#ffffff",
};

const defaultStyle: FacultyStyle = {
  name: "Universitas Sam Ratulangi",
  primary: "#d97706", // Amber-Gold
  secondary: "#f59e0b",
  lightBg: "#fef9c3",
  borderSubtle: "#fef08a",
  gradient: "linear-gradient(135deg, #d97706 0%, #f59e0b 100%)",
  icon: "bi-mortarboard-fill",
  textColor: "#ffffff",
};

export function getFacultyStyle(nameOrScope: string | null): FacultyStyle {
  if (!nameOrScope) return defaultStyle;
  const normalized = nameOrScope.toLowerCase();

  if (normalized.includes("kedokteran") || normalized.includes(" fk ") || normalized.includes("pendidikan dokter")) {
    return fkStyle;
  }
  // Matches "teknik", "ft", and all majors/departments under engineering
  if (
    normalized.includes("teknik") || 
    normalized.includes(" ft ") || 
    normalized.includes("informatika") || 
    normalized.includes("elektro") || 
    normalized.includes("mesin") || 
    normalized.includes("sipil") || 
    normalized.includes("arsitektur") || 
    normalized.includes("pwk") ||
    normalized.includes("hmts") ||
    normalized.includes("hmta") ||
    normalized.includes("hmte") ||
    normalized.includes("hmtm") ||
    normalized.includes("hmti") ||
    normalized.includes("hmpwk") ||
    normalized.includes("bpm")
  ) {
    return ftStyle;
  }
  if (normalized.includes("pertanian") || normalized.includes("faperta")) {
    return fapertaStyle;
  }
  if (normalized.includes("peternakan") || normalized.includes("fapet")) {
    return fapetStyle;
  }
  if (
    normalized.includes("perikanan") || 
    normalized.includes("kelautan") || 
    normalized.includes("fpik") || 
    normalized.includes("ilmu kelautan")
  ) {
    return fpikStyle;
  }
  if (normalized.includes("ekonomi") || normalized.includes("bisnis") || normalized.includes("feb")) {
    return febStyle;
  }
  if (normalized.includes("hukum") || normalized.includes("fh")) {
    return fhStyle;
  }
  if (
    normalized.includes("sosial") || 
    normalized.includes("politik") || 
    normalized.includes("fisip") || 
    normalized.includes("sosiologi") || 
    normalized.includes("administrasi")
  ) {
    return fisipStyle;
  }
  if (normalized.includes("budaya") || normalized.includes("sastra") || normalized.includes("fib")) {
    return fibStyle;
  }
  if (
    normalized.includes("matematika") || 
    normalized.includes("mipa") || 
    normalized.includes("fmipa") || 
    normalized.includes("biologi") || 
    normalized.includes("kimia") || 
    normalized.includes("fisika")
  ) {
    return fmipaStyle;
  }
  if (normalized.includes("kesehatan masyarakat") || normalized.includes("fkm")) {
    return fkmStyle;
  }

  return defaultStyle;
}
