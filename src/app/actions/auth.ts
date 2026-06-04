'use server'

import { createClient } from "@/utils/supabase/server";
import { cookies } from "next/headers";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { db } from "@/db";
import { users } from "@/db/schema";

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
  role: z.enum(["student", "lecturer", "admin"]).default("student"),
});

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
  const { error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  if (error) {
    return {
      success: false,
      error: "Login gagal: " + error.message,
    };
  }

  revalidatePath("/", "layout");
  redirect("/dashboard");
}

export async function registerAction(prevState: any, formData: FormData) {
  const email = formData.get("email") as string;
  const password = formData.get("password") as string;
  const name = formData.get("name") as string;
  const nim = formData.get("nim") as string;
  const faculty = formData.get("faculty") as string;
  const major = formData.get("major") as string;
  const role = (formData.get("role") as "student" | "lecturer" | "admin") || "student";

  const result = registerSchema.safeParse({ email, password, name, nim, faculty, major, role });
  if (!result.success) {
    return {
      success: false,
      error: "Pendaftaran gagal. Periksa kembali form input Anda.",
      fieldErrors: result.error.flatten().fieldErrors,
    };
  }

  const cookieStore = await cookies();
  const supabase = createClient(cookieStore);
  
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
      error: "Pendaftaran akun gagal: " + (authError?.message || "User tidak terbentuk"),
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
