'use server'

import { createClient } from "@/utils/supabase/server";
import { cookies } from "next/headers";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { db } from "@/db";
import { users } from "@/db/schema";
import { eq, sql } from "drizzle-orm";

const loginSchema = z.object({
  email: z.string().email("Format email tidak valid"),
  password: z.string().min(6, "Password minimal 6 karakter"),
});

const registerSchema = z.object({
  email: z.string().email("Format email tidak valid"),
  password: z.string().min(6, "Password minimal 6 karakter"),
  name: z.string().min(3, "Nama minimal 3 karakter"),
  nim: z.string().min(5, "NIM minimal 5 karakter"),
  faculty: z.string().min(2, "Fakultas wajib diisi"),
  major: z.string().min(2, "Jurusan wajib diisi"),
});

async function getLoginErrorMessage(message: string, email: string) {
  const normalized = message.toLowerCase();

  if (normalized.includes("email not confirmed")) {
    return "Email akun belum dikonfirmasi. Silakan cek email verifikasi atau hubungi admin.";
  }

  if (normalized.includes("invalid login credentials")) {
    try {
      const authUsers = await db.execute(sql<{ email_confirmed_at: Date | null }>`
        select email_confirmed_at
        from auth.users
        where lower(email) = ${email.trim().toLowerCase()}
        limit 1
      `);

      if (authUsers.length === 0) {
        return "Akun dengan email ini belum terdaftar di Supabase Auth.";
      }

      if (!authUsers[0].email_confirmed_at) {
        return "Email akun belum dikonfirmasi. Silakan cek email verifikasi atau hubungi admin.";
      }

      return "Password salah. Periksa kembali password akun ini.";
    } catch {
      return "Email atau password salah, atau akun belum terdaftar di Supabase Auth.";
    }
  }

  if (normalized.includes("too many") || normalized.includes("rate limit")) {
    return "Terlalu banyak percobaan login. Tunggu beberapa saat lalu coba lagi.";
  }

  return "Login gagal: " + message;
}

function getRegisterErrorMessage(message: string) {
  const normalized = message.toLowerCase();

  if (normalized.includes("already registered") || normalized.includes("already exists")) {
    return "Email sudah terdaftar. Silakan login atau gunakan email lain.";
  }

  if (normalized.includes("rate limit") || normalized.includes("too many")) {
    return "Terlalu banyak percobaan pendaftaran. Tunggu beberapa saat lalu coba lagi.";
  }

  return "Pendaftaran akun gagal: " + message;
}

export async function loginAction(prevState: any, formData: FormData) {
  const email = formData.get("email") as string;
  const password = formData.get("password") as string;

  const result = loginSchema.safeParse({ email, password });
  if (!result.success) {
    return {
      success: false,
      error: "Input tidak valid. Harap periksa email dan password Anda.",
      fieldErrors: result.error.flatten().fieldErrors,
    };
  }

  const cookieStore = await cookies();
  const supabase = createClient(cookieStore);
  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  if (error) {
    return {
      success: false,
      error: await getLoginErrorMessage(error.message, email),
    };
  }

  if (!data.user) {
    await supabase.auth.signOut();
    return {
      success: false,
      error: "Login gagal. Supabase tidak mengembalikan data pengguna.",
    };
  }

  try {
    const [profile] = await db
      .select({ id: users.id })
      .from(users)
      .where(eq(users.id, data.user.id))
      .limit(1);

    if (!profile) {
      await supabase.auth.signOut();
      return {
        success: false,
        error: "Login berhasil di Supabase, tetapi profil aplikasi belum terdaftar. Hubungi admin kemahasiswaan.",
      };
    }
  } catch {
    await supabase.auth.signOut();
    return {
      success: false,
      error: "Login gagal karena profil aplikasi tidak dapat diverifikasi.",
    };
  }

  revalidatePath("/", "layout");
  return {
    success: true,
    redirectTo: "/dashboard",
  };
}

export async function registerAction(prevState: any, formData: FormData) {
  const email = formData.get("email") as string;
  const password = formData.get("password") as string;
  const name = formData.get("name") as string;
  const nim = formData.get("nim") as string;
  const faculty = formData.get("faculty") as string;
  const major = formData.get("major") as string;
  const role = "student";

  const result = registerSchema.safeParse({ email, password, name, nim, faculty, major });
  if (!result.success) {
    return {
      success: false,
      error: "Pendaftaran gagal. Periksa kembali form input Anda.",
      fieldErrors: result.error.flatten().fieldErrors,
    };
  }

  const cookieStore = await cookies();
  const supabase = createClient(cookieStore);

  const existingProfile = await db
    .select({ id: users.id })
    .from(users)
    .where(eq(users.nim, nim))
    .limit(1);

  if (existingProfile.length > 0) {
    return {
      success: false,
      error: "NIM/NIP sudah terdaftar. Silakan gunakan data lain atau hubungi admin.",
    };
  }
  
  // 1. Sign up the user in Supabase Auth
  const { data: authData, error: authError } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: {
        name,
        role,
      }
    }
  });

  if (authError || !authData.user) {
    return {
      success: false,
      error: authError ? getRegisterErrorMessage(authError.message) : "Pendaftaran akun gagal: User tidak terbentuk",
    };
  }

  // 2. Insert into the public.users database schema
  try {
    await db.insert(users).values({
      id: authData.user.id, // Match Supabase auth.users.id
      name,
      nim,
      faculty,
      major,
      role,
    });
  } catch (dbError: any) {
    // If database insert fails, we should technically clean up Supabase user,
    // but here we just return the error.
    return {
      success: false,
      error: "Pendaftaran profil gagal di database: " + dbError.message,
    };
  }

  revalidatePath("/", "layout");
  redirect("/login?registered=true");
}

export async function logoutAction() {
  const cookieStore = await cookies();
  const supabase = createClient(cookieStore);
  await supabase.auth.signOut();
  revalidatePath("/", "layout");
  redirect("/login");
}
