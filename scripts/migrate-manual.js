// Manual Database Migration Script
// This script runs SQL (Structured Query Language) commands to create database indexes on the Supabase PostgreSQL database.
// It bypasses the drizzle-kit bug by establishing a direct connection using the postgres driver.

const postgres = require("postgres");
const fs = require("fs");
const path = require("path");

// Read variables from the environment file (.env)
const envFilePath = path.join(__dirname, "../.env");
if (!fs.existsSync(envFilePath)) {
  console.error("Kesalahan: Berkas .env tidak ditemukan di jalur:", envFilePath);
  process.exit(1);
}

const envContent = fs.readFileSync(envFilePath, "utf8");
let databaseUrl = "";

envContent.split("\n").forEach((line) => {
  const trimmedLine = line.trim();
  if (trimmedLine.startsWith("DATABASE_URL=")) {
    // Strip quotes and get the value
    databaseUrl = trimmedLine
      .substring("DATABASE_URL=".length)
      .replace(/^['"]|['"]$/g, "");
  }
});

if (!databaseUrl) {
  console.error("Kesalahan: Variabel DATABASE_URL tidak ditemukan di berkas .env");
  process.exit(1);
}

console.log("Menghubungkan ke database cloud Supabase...");
const sql = postgres(databaseUrl, { prepare: false });

async function runMigration() {
  try {
    console.log("Mulai menjalankan kueri pembuatan indeks basis data...");

    // 1. Index on users(role)
    console.log("Membuat indeks 'idx_users_role'...");
    await sql`CREATE INDEX IF NOT EXISTS "idx_users_role" ON "users" USING btree ("role");`;

    // 2. Indexes on activities
    console.log("Membuat indeks 'idx_activities_created_by'...");
    await sql`CREATE INDEX IF NOT EXISTS "idx_activities_created_by" ON "activities" USING btree ("created_by");`;

    console.log("Membuat indeks 'idx_activities_status'...");
    await sql`CREATE INDEX IF NOT EXISTS "idx_activities_status" ON "activities" USING btree ("status");`;

    console.log("Membuat indeks 'idx_activities_org_type'...");
    await sql`CREATE INDEX IF NOT EXISTS "idx_activities_org_type" ON "activities" USING btree ("org_type");`;

    // 3. Index on events(created_by)
    console.log("Membuat indeks 'idx_events_created_by'...");
    await sql`CREATE INDEX IF NOT EXISTS "idx_events_created_by" ON "events" USING btree ("created_by");`;

    console.log("Indeks berhasil dibuat di basis data cloud!");
  } catch (error) {
    console.error("Terjadi kesalahan saat membuat indeks:", error.message);
  } finally {
    await sql.end();
    console.log("Koneksi database ditutup.");
  }
}

runMigration();
