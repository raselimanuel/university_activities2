'use server'

import { createClient } from "@/utils/supabase/server";
import { cookies } from "next/headers";
import { db } from "@/db";
import { users } from "@/db/schema";
import { eq } from "drizzle-orm";
import { cache } from "react";

export const getCurrentUser = cache(async () => {
  // Development environment bypass for local sandbox testing
  if (process.env.NODE_ENV === "development") {
    const adminId = "767fb746-cdd6-4453-b214-b61851538e86"; // Rasel Manuel (Admin)
    const [profile] = await db
      .select()
      .from(users)
      .where(eq(users.id, adminId))
      .limit(1);
    
    return {
      auth: { id: adminId, email: "rasel@student.unsrat.ac.id" } as any,
      profile: profile || {
        id: adminId,
        name: "Rasel Manuel",
        nim: "21021106004",
        role: "admin",
        faculty: "Fakultas Teknik",
      },
    };
  }

  const cookieStore = await cookies();
  const supabase = createClient(cookieStore);
  const { data: { user }, error } = await supabase.auth.getUser();
  
  if (error || !user) {
    return null;
  }
  
  try {
    const result = await db
      .select()
      .from(users)
      .where(eq(users.id, user.id))
      .limit(1);
      
    if (result.length === 0) {
      return {
        auth: user,
        profile: null,
      };
    }
    
    return {
      auth: user,
      profile: result[0],
    };
  } catch (dbError) {
    return {
      auth: user,
      profile: null,
    };
  }
});
