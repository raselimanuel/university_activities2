const postgres = require("postgres");
const fs = require("fs");
const path = require("path");

// Read variables from the environment file (.env)
const envFilePath = path.join(__dirname, "../.env");
if (!fs.existsSync(envFilePath)) {
  console.error("Kesalahan: Berkas .env tidak ditemukan.");
  process.exit(1);
}

const envContent = fs.readFileSync(envFilePath, "utf8");
let databaseUrl = "";

envContent.split("\n").forEach((line) => {
  const trimmedLine = line.trim();
  if (trimmedLine.startsWith("DATABASE_URL=")) {
    databaseUrl = trimmedLine
      .substring("DATABASE_URL=".length)
      .replace(/^['"]|['"]$/g, "");
  }
});

if (!databaseUrl) {
  console.error("Kesalahan: Variabel DATABASE_URL tidak ditemukan.");
  process.exit(1);
}

const sql = postgres(databaseUrl, { prepare: false });

async function run() {
  try {
    console.log("Menghubungkan ke database Supabase...");

    // Query auth.users for emails
    const authUsers = await sql`SELECT id, email FROM auth.users`;
    
    // Query public.users for profiles
    const publicUsers = await sql`SELECT id, name, nim, role FROM public.users`;

    console.log("\n--- DAFTAR AKUN LOGIN DAN ROLE ---");
    
    // Combine they by ID
    const userMap = {};
    authUsers.forEach(u => {
      userMap[u.id] = { email: u.email, name: "-", nim: "-", role: "-" };
    });

    publicUsers.forEach(p => {
      if (userMap[p.id]) {
        userMap[p.id].name = p.name;
        userMap[p.id].nim = p.nim;
        userMap[p.id].role = p.role;
      } else {
        userMap[p.id] = { email: "(Belum Registrasi di Auth)", name: p.name, nim: p.nim, role: p.role };
      }
    });

    console.table(Object.values(userMap));
    
  } catch (err) {
    console.error("Terjadi kesalahan:", err.message);
  } finally {
    await sql.end();
  }
}

run();
